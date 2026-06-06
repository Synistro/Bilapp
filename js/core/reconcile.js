/**
 * reconcile.js — Bilapp
 * -------------------------------------------------------
 * Moteur de réconciliation post-édition manuelle.
 *
 * Reçoit un BilanData + les overrides + les BilanParams d'origine,
 * et retourne un nouveau BilanData cohérent où :
 *   1. Les postes verrouillés conservent leur valeur exacte
 *   2. Les postes CR liés sont recalibrés si le CA change
 *   3. Les dotations aux amortissements absorbent l'écart
 *      pour maintenir le résultat dans l'orientation d'origine
 *   4. Les stocks bilan sont reflétés dans la variationStocks CR
 *   5. resultatNet → passif.capitauxPropres.resultat → passif.total
 *   6. La trésorerie absorbe le déséquilibre actif/passif résiduel
 *
 * RÈGLE : fonctions pures — ne modifie jamais les objets reçus.
 */

'use strict';

import { isLocked }                              from './overrides.js';
import { ORIENTATIONS, TAUX }                    from './constants.js';

// ============================================================
// UTILITAIRES
// ============================================================

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getPath(obj, path) {
  return path.split('.').reduce((cur, key) => cur?.[key], obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((cur, key) => cur[key], obj);
  target[last] = value;
}

function sumPostes(...postes) {
  return postes.reduce(
    (acc, p) => ({ brut: acc.brut + (p.brut ?? 0), amort: acc.amort + (p.amort ?? 0), net: acc.net + (p.net ?? 0) }),
    { brut: 0, amort: 0, net: 0 }
  );
}

// ============================================================
// ÉTAPE 1 — APPLIQUER LES OVERRIDES
// ============================================================

/**
 * Applique les overrides sur le BilanData cloné.
 * Pour les postes actif (brut/amort), recalcule le net avec clamp amort ≤ brut.
 * @param {object}             data
 * @param {Map<string,number>} overrides
 */
function appliquerOverrides(data, overrides) {
  for (const [path, valeur] of overrides) {
    setPath(data, path, valeur);
    if (path.endsWith('.brut') || path.endsWith('.amort')) {
      const base       = path.slice(0, path.lastIndexOf('.'));
      const brut       = getPath(data, base + '.brut')  ?? 0;
      const amort      = getPath(data, base + '.amort') ?? 0;
      const amortClampe = Math.min(amort, brut);
      setPath(data, base + '.amort', amortClampe);
      setPath(data, base + '.net',   Math.round(brut - amortClampe));
    }
  }
}

// ============================================================
// ÉTAPE 2 — RECALIBRAGE CR APRÈS MODIFICATION CA
// ============================================================

/**
 * @param {Map<string,number>} overrides
 * @returns {boolean}
 */
function caEstModifie(overrides) {
  return overrides.has('resultat.produitsExploitation.ca');
}

/**
 * Quand le CA change, recalibre les charges non verrouillées
 * en conservant les ratios observés dans le BilanData d'origine.
 *
 * @param {object} data     BilanData muté
 * @param {object} original BilanData avant modification
 */
function recalibrerChargesApresCA(data, original) {
  const ca         = data.resultat.produitsExploitation.ca;
  const caOriginal = original.resultat.produitsExploitation.ca;
  if (caOriginal === 0) return;

  const ce = data.resultat.chargesExploitation;
  const oe = original.resultat.chargesExploitation;

  // Charges recalibrées par ratio observé si non verrouillées
  for (const champ of ['achatsMarchandises', 'achatsMatieres', 'autresAchats', 'impotsTaxes', 'chargesPersonnel']) {
    if (!isLocked(`resultat.chargesExploitation.${champ}`)) {
      ce[champ] = Math.round(ca * (oe[champ] / caOriginal));
    }
  }

  if (!isLocked('resultat.chargesExploitation.variationStocks')) {
    ce.variationStocks = Math.round(ca * (oe.variationStocks / caOriginal));
  }

  // Produits annexes recalibrés aussi
  const pe = data.resultat.produitsExploitation;
  const op = original.resultat.produitsExploitation;
  for (const champ of ['productionStockee', 'subventions', 'autresProduits']) {
    if (!isLocked(`resultat.produitsExploitation.${champ}`)) {
      pe[champ] = Math.round(ca * (op[champ] / caOriginal));
    }
  }
}

// ============================================================
// ÉTAPE 3 — SYNCHRONISATION STOCKS BILAN → VARIATION STOCKS CR
// ============================================================

/**
 * Si des postes de stocks bilan ont été modifiés,
 * met à jour la variationStocks du CR.
 *
 * Principe PCG : variation de stocks = stock final - stock initial.
 * Une augmentation de stock réduit les charges (signe négatif en compte 603).
 *
 * @param {object}             data
 * @param {object}             original
 * @param {Map<string,number>} overrides
 */
function synchroniserVariationStocks(data, original, overrides) {
  if (isLocked('resultat.chargesExploitation.variationStocks')) return;

  const postesStocksBrut = [
    'bilan.actif.circulant.stocks.matieresPremières.brut',
    'bilan.actif.circulant.stocks.enCours.brut',
    'bilan.actif.circulant.stocks.produitsFinis.brut',
    'bilan.actif.circulant.stocks.marchandises.brut',
  ];

  if (!postesStocksBrut.some(p => overrides.has(p))) return;

  const stockActuel   = data.bilan.actif.circulant.stocks.total.net;
  const stockOriginal = original.bilan.actif.circulant.stocks.total.net;

  // Stock augmente → variation négative (moins de charges)
  // Stock diminue → variation positive (plus de charges)
  data.resultat.chargesExploitation.variationStocks = Math.round(stockOriginal - stockActuel);
}

// ============================================================
// ÉTAPE 4 — RECALCUL CR + AJUSTEMENT DOTATIONS
// ============================================================

/**
 * Recalcule les totaux CR et ajuste les dotations pour maintenir
 * le résultat net dans la fourchette d'orientation d'origine.
 *
 * Si dotationsAmort est verrouillé, le résultat diverge librement
 * (choix explicite de l'utilisateur).
 *
 * @param {object} resultat BilanData.resultat muté
 * @param {object} params   BilanParams d'origine
 */
function recalculerCRAvecOrientation(resultat, params) {
  const pe = resultat.produitsExploitation;
  const ce = resultat.chargesExploitation;

  pe.total = Math.round(pe.ca + pe.productionStockee + pe.subventions + pe.autresProduits);

  const chargesSansDA = Math.round(
    ce.achatsMarchandises + ce.variationStocks + ce.achatsMatieres +
    ce.autresAchats + ce.impotsTaxes + ce.chargesPersonnel + ce.autresCharges
  );

  resultat.resultatFinancier    = Math.round(resultat.produitsFinanciers - resultat.chargesFinancieres);
  resultat.resultatExceptionnel = Math.round(resultat.produitsExceptionnels - resultat.chargesExceptionnelles);

  // Résultat cible = milieu de la fourchette d'orientation
  const { minRatio, maxRatio } = ORIENTATIONS[params.finance.orientation];
  const resultatCible = Math.round(pe.ca * ((minRatio + maxRatio) / 2));

  // IS recalculé sur la cible si non verrouillé
  if (!isLocked('resultat.impots')) {
    if (resultatCible > 0) {
      resultat.impots = resultatCible <= TAUX.SEUIL_IS_REDUIT
        ? Math.round(resultatCible * TAUX.IS_PME_REDUIT)
        : Math.round(TAUX.SEUIL_IS_REDUIT * TAUX.IS_PME_REDUIT + (resultatCible - TAUX.SEUIL_IS_REDUIT) * TAUX.IS_NORMAL);
    } else {
      resultat.impots = 0;
    }
  }

  // Dotations = variable d'ajustement si non verrouillées
  if (!isLocked('resultat.chargesExploitation.dotationsAmort')) {
    const resultatSansDA = Math.round(
      pe.total - chargesSansDA + resultat.resultatFinancier +
      resultat.resultatExceptionnel - resultat.participation - resultat.impots
    );
    const dotations = Math.max(0, Math.round(resultatSansDA - resultatCible));
    ce.dotationsAmort = dotations;
  }

  ce.total = Math.round(chargesSansDA + ce.dotationsAmort);

  resultat.resultatExploitation = Math.round(pe.total - ce.total);
  resultat.resultatCourant      = Math.round(resultat.resultatExploitation + resultat.resultatFinancier);
  resultat.resultatNet          = Math.round(
    resultat.resultatCourant + resultat.resultatExceptionnel -
    resultat.participation - resultat.impots
  );
}

// ============================================================
// ÉTAPE 5 — RECALCUL TOTAUX ACTIF
// ============================================================

/**
 * @param {object} actif BilanData.bilan.actif muté
 */
function recalculerTotauxActif(actif) {
  const i = actif.immobilise;
  i.incorporel.total = sumPostes(i.incorporel.fraisEtablissement, i.incorporel.fraisRD, i.incorporel.brevets, i.incorporel.fondsCommercial, i.incorporel.autresIncorporel);
  i.corporel.total   = sumPostes(i.corporel.terrains, i.corporel.constructions, i.corporel.installations, i.corporel.autresCorporel);
  i.financier.total  = sumPostes(i.financier.participations, i.financier.autresFinancier);
  i.total            = sumPostes(i.incorporel.total, i.corporel.total, i.financier.total);

  const c = actif.circulant;
  c.stocks.total         = sumPostes(c.stocks.matieresPremières, c.stocks.enCours, c.stocks.produitsFinis, c.stocks.marchandises);
  c.creances.total       = sumPostes(c.creances.clients, c.creances.autresCreances);
  c.disponibilites.total = sumPostes(c.disponibilites.vmp, c.disponibilites.banqueCaisse);
  c.total                = sumPostes(c.stocks.total, c.creances.total, c.disponibilites.total);

  actif.regularisation.total = sumPostes(actif.regularisation.chargesConstatees);
  actif.totalNet = Math.round(i.total.net + c.total.net + actif.regularisation.total.net);
}

// ============================================================
// ÉTAPE 6 — RECALCUL TOTAUX PASSIF
// ============================================================

/**
 * @param {object} passif BilanData.bilan.passif muté
 */
function recalculerTotauxPassif(passif) {
  const cp = passif.capitauxPropres;
  cp.total = Math.round(cp.capital + cp.primesEmission + cp.reserveLegale + cp.autresReserves + cp.reportANouveau + cp.resultat);
  passif.provisions.total     = Math.round(passif.provisions.risques + passif.provisions.charges);
  passif.dettes.total         = Math.round(passif.dettes.emprunts + passif.dettes.fournisseurs + passif.dettes.fiscalesSociales + passif.dettes.autresDettes);
  passif.regularisation.total = Math.round(passif.regularisation.produitsConstates);
  passif.total = Math.round(cp.total + passif.provisions.total + passif.dettes.total + passif.regularisation.total);
}

// ============================================================
// ÉTAPE 7 — ÉQUILIBRAGE ACTIF / PASSIF
// ============================================================

/**
 * Absorbe l'écart via la trésorerie. Retourne l'écart résiduel si tréso verrouillée.
 * @param {object} data
 * @returns {number}
 */
function equilibrer(data) {
  const ecart = data.bilan.passif.total - data.bilan.actif.totalNet;
  if (ecart === 0) return 0;
  if (isLocked('bilan.actif.circulant.disponibilites.banqueCaisse.net')) return ecart;

  const treso = data.bilan.actif.circulant.disponibilites.banqueCaisse;
  treso.net  += ecart;
  treso.brut += ecart;
  recalculerTotauxActif(data.bilan.actif);
  return 0;
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

/**
 * Réconcilie un BilanData avec les overrides manuels.
 *
 * @param {object}             bilanData  BilanData original (non muté)
 * @param {Map<string,number>} overrides  Registre des postes verrouillés
 * @param {object}             params     BilanParams d'origine
 * @returns {{ data: object, desequilibre: number }}
 */
export function reconcile(bilanData, overrides, params) {
  const original = bilanData;
  const data     = clone(bilanData);

  appliquerOverrides(data, overrides);

  if (caEstModifie(overrides)) {
    recalibrerChargesApresCA(data, original);
  }

  synchroniserVariationStocks(data, original, overrides);
  recalculerCRAvecOrientation(data.resultat, params);

  if (!isLocked('bilan.passif.capitauxPropres.resultat')) {
    data.bilan.passif.capitauxPropres.resultat = data.resultat.resultatNet;
  }

  recalculerTotauxPassif(data.bilan.passif);
  recalculerTotauxActif(data.bilan.actif);

  const desequilibre = equilibrer(data);
  return { data, desequilibre };
}
