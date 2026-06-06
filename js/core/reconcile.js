/**
 * reconcile.js — Bilapp
 * -------------------------------------------------------
 * Moteur de réconciliation post-édition manuelle.
 *
 * Reçoit un BilanData existant + le registre des overrides +
 * les BilanParams d'origine, et retourne un nouveau BilanData
 * cohérent où :
 *   1. Les postes verrouillés conservent leur valeur exacte
 *   2. Les totaux sont recalculés en cascade
 *   3. La trésorerie absorbe le déséquilibre résiduel actif/passif
 *      (sauf si elle-même verrouillée)
 *   4. resultat.resultatNet → passif.capitauxPropres.resultat
 *
 * Si un déséquilibre persiste (tréso verrouillée ou impossible
 * à absorber), il est exposé dans { desequilibre } pour l'UI.
 *
 * RÈGLE : fonctions pures — ne modifie jamais les objets reçus.
 */

'use strict';

import { isLocked, getOverride } from './overrides.js';

// ============================================================
// UTILITAIRES INTERNES
// ============================================================

/**
 * Deep-clone un objet plain (BilanData est du JSON pur).
 * @param {object} obj
 * @returns {object}
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Lit la valeur d'un poste en dot-notation dans un objet.
 * @param {object} obj
 * @param {string} path  ex: 'bilan.actif.immobilise.corporel.constructions.brut'
 * @returns {*}
 */
function getPath(obj, path) {
  return path.split('.').reduce((cur, key) => cur?.[key], obj);
}

/**
 * Écrit une valeur en dot-notation dans un objet (mutation).
 * @param {object} obj
 * @param {string} path
 * @param {*}      value
 */
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((cur, key) => cur[key], obj);
  target[last] = value;
}

/**
 * Applique les overrides sur une copie de BilanData.
 * Pour les postes actif (brut/amort), recalcule le net.
 * @param {object}          data
 * @param {Map<string,number>} overrides
 * @returns {object}  BilanData muté
 */
function appliquerOverrides(data, overrides) {
  for (const [path, valeur] of overrides) {
    setPath(data, path, valeur);

    // Si on a modifié un brut ou amort d'un poste actif,
    // recalcule le net du même poste immédiatement
    if (path.endsWith('.brut') || path.endsWith('.amort')) {
      const base = path.slice(0, path.lastIndexOf('.'));
      const brut  = getPath(data, base + '.brut')  ?? 0;
      const amort = getPath(data, base + '.amort') ?? 0;
      setPath(data, base + '.net', Math.round(brut - amort));
    }
  }
  return data;
}

// ============================================================
// RECALCUL DES TOTAUX — ACTIF
// ============================================================

/**
 * Additionne les nets de plusieurs postes { brut, amort, net }.
 * @param {...object} postes
 * @returns {{ brut, amort, net }}
 */
function sumPostes(...postes) {
  return postes.reduce(
    (acc, p) => ({
      brut:  acc.brut  + (p.brut  ?? 0),
      amort: acc.amort + (p.amort ?? 0),
      net:   acc.net   + (p.net   ?? 0),
    }),
    { brut: 0, amort: 0, net: 0 }
  );
}

/**
 * Recalcule tous les totaux de l'actif en cascade.
 * @param {object} actif  BilanData.bilan.actif (muté)
 */
function recalculerTotauxActif(actif) {
  const i = actif.immobilise;

  // Incorporel
  i.incorporel.total = sumPostes(
    i.incorporel.fraisEtablissement,
    i.incorporel.fraisRD,
    i.incorporel.brevets,
    i.incorporel.fondsCommercial,
    i.incorporel.autresIncorporel,
  );

  // Corporel
  i.corporel.total = sumPostes(
    i.corporel.terrains,
    i.corporel.constructions,
    i.corporel.installations,
    i.corporel.autresCorporel,
  );

  // Financier
  i.financier.total = sumPostes(
    i.financier.participations,
    i.financier.autresFinancier,
  );

  // Total immobilisé
  i.total = sumPostes(i.incorporel.total, i.corporel.total, i.financier.total);

  const c = actif.circulant;

  // Stocks
  c.stocks.total = sumPostes(
    c.stocks.matieresPremières,
    c.stocks.enCours,
    c.stocks.produitsFinis,
    c.stocks.marchandises,
  );

  // Créances
  c.creances.total = sumPostes(c.creances.clients, c.creances.autresCreances);

  // Disponibilités
  c.disponibilites.total = sumPostes(
    c.disponibilites.vmp,
    c.disponibilites.banqueCaisse,
  );

  // Total circulant
  c.total = sumPostes(c.stocks.total, c.creances.total, c.disponibilites.total);

  // Régularisation
  actif.regularisation.total = sumPostes(actif.regularisation.chargesConstatees);

  // Total actif net
  actif.totalNet = Math.round(
    i.total.net + c.total.net + actif.regularisation.total.net
  );
}

// ============================================================
// RECALCUL DES TOTAUX — PASSIF
// ============================================================

/**
 * Recalcule tous les totaux du passif en cascade.
 * @param {object} passif  BilanData.bilan.passif (muté)
 */
function recalculerTotauxPassif(passif) {
  const cp = passif.capitauxPropres;
  cp.total = Math.round(
    cp.capital + cp.primesEmission + cp.reserveLegale +
    cp.autresReserves + cp.reportANouveau + cp.resultat
  );

  passif.provisions.total = Math.round(
    passif.provisions.risques + passif.provisions.charges
  );

  passif.dettes.total = Math.round(
    passif.dettes.emprunts + passif.dettes.fournisseurs +
    passif.dettes.fiscalesSociales + passif.dettes.autresDettes
  );

  passif.regularisation.total = Math.round(passif.regularisation.produitsConstates);

  passif.total = Math.round(
    cp.total +
    passif.provisions.total +
    passif.dettes.total +
    passif.regularisation.total
  );
}

// ============================================================
// RECALCUL DU COMPTE DE RÉSULTAT
// ============================================================

/**
 * Recalcule les totaux et résultats intermédiaires du CR.
 * @param {object} resultat  BilanData.resultat (muté)
 */
function recalculerTotauxResultat(resultat) {
  const pe = resultat.produitsExploitation;
  pe.total = Math.round(pe.ca + pe.productionStockee + pe.subventions + pe.autresProduits);

  const ce = resultat.chargesExploitation;
  ce.total = Math.round(
    ce.achatsMarchandises + ce.variationStocks + ce.achatsMatieres +
    ce.autresAchats + ce.impotsTaxes + ce.chargesPersonnel +
    ce.dotationsAmort + ce.autresCharges
  );

  resultat.resultatExploitation = Math.round(pe.total - ce.total);
  resultat.resultatFinancier    = Math.round(resultat.produitsFinanciers - resultat.chargesFinancieres);
  resultat.resultatCourant      = Math.round(resultat.resultatExploitation + resultat.resultatFinancier);
  resultat.resultatExceptionnel = Math.round(resultat.produitsExceptionnels - resultat.chargesExceptionnelles);
  resultat.resultatNet          = Math.round(
    resultat.resultatCourant +
    resultat.resultatExceptionnel -
    resultat.participation -
    resultat.impots
  );
}

// ============================================================
// ÉQUILIBRAGE ACTIF / PASSIF
// ============================================================

/**
 * Tente d'équilibrer actif et passif via la trésorerie.
 * Si tréso verrouillée, retourne l'écart résiduel.
 *
 * @param {object} data   BilanData muté
 * @returns {number}      Déséquilibre résiduel (0 = équilibré)
 */
function equilibrer(data) {
  const actif  = data.bilan.actif;
  const passif = data.bilan.passif;
  const ecart  = passif.total - actif.totalNet;

  if (ecart === 0) return 0;

  const tresoPath = 'bilan.actif.circulant.disponibilites.banqueCaisse.net';
  const brutPath  = 'bilan.actif.circulant.disponibilites.banqueCaisse.brut';

  if (isLocked(tresoPath)) {
    // Tréso verrouillée → on ne peut pas absorber, on expose l'écart
    return ecart;
  }

  // Absorbe l'écart sur la trésorerie
  const tresoActuelle = actif.circulant.disponibilites.banqueCaisse.net;
  const nouvelleTreso = tresoActuelle + ecart;

  actif.circulant.disponibilites.banqueCaisse.net  = nouvelleTreso;
  actif.circulant.disponibilites.banqueCaisse.brut = nouvelleTreso;

  // Recascade les totaux après ajustement tréso
  recalculerTotauxActif(actif);

  return 0;
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

/**
 * Réconcilie un BilanData avec les overrides manuels.
 *
 * Ordre d'exécution :
 *   1. Clone le BilanData (immuabilité)
 *   2. Applique les overrides
 *   3. Recalcule CR → résultatNet → passif.capitauxPropres.resultat
 *   4. Recalcule totaux passif
 *   5. Recalcule totaux actif
 *   6. Équilibre via trésorerie
 *   7. Retourne { data, desequilibre }
 *
 * @param {object}             bilanData  BilanData original (non muté)
 * @param {Map<string,number>} overrides  Registre des postes verrouillés
 * @returns {{ data: object, desequilibre: number }}
 */
export function reconcile(bilanData, overrides) {
  const data = clone(bilanData);

  // 1. Appliquer les overrides
  appliquerOverrides(data, overrides);

  // 2. Recalcul CR complet
  recalculerTotauxResultat(data.resultat);

  // 3. Propager resultatNet → passif.capitauxPropres.resultat
  //    (sauf si ce poste est lui-même verrouillé)
  if (!isLocked('bilan.passif.capitauxPropres.resultat')) {
    data.bilan.passif.capitauxPropres.resultat = data.resultat.resultatNet;
  }

  // 4. Recalcul totaux passif
  recalculerTotauxPassif(data.bilan.passif);

  // 5. Recalcul totaux actif
  recalculerTotauxActif(data.bilan.actif);

  // 6. Équilibrage
  const desequilibre = equilibrer(data);

  return { data, desequilibre };
}
