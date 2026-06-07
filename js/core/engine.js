/**
 * engine.js — Bilapp
 * -------------------------------------------------------
 * Moteur de calcul comptable. Reçoit un objet BilanParams
 * (produit par form.js) et retourne un objet BilanData complet.
 *
 * RÈGLES :
 * - Fonctions pures : zéro DOM, zéro état global, zéro effet de bord
 * - Zéro magic numbers : toutes les constantes viennent de constants.js
 * - Tous les montants arrondis à l'euro (Math.round)
 * - Équilibre bilan garanti : actif.totalNet === passif.total (±1€)
 */

'use strict';

import {
  TRANCHES_CA,
  CAPITAL_TYPIQUE,
  RATIOS_SECTORIELS,
  ORIENTATIONS,
  TAUX,
  MENTION_FICTIF,
  VARIATION_MONTANTS,
  PLANCHER_RESULTAT_NEUTRE,
} from './constants.js';

// ============================================================
// UTILITAIRES
// ============================================================

function randInt(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

function varier(base) {
  return Math.round(base * (1 + randFloat(-VARIATION_MONTANTS, VARIATION_MONTANTS)));
}

/**
 * Construit un poste d'actif brut/amort/net.
 * L'amort est clampé à brut — un amort > brut est comptablement impossible.
 * @param {number} brut
 * @param {number} amort
 * @returns {{ brut: number, amort: number, net: number }}
 */
function poste(brut, amort = 0) {
  const b = Math.round(brut);
  const a = Math.min(Math.round(amort), b);
  return { brut: b, amort: a, net: b - a };
}

function totalPostes(...postes) {
  return postes.reduce(
    (acc, p) => ({ brut: acc.brut + p.brut, amort: acc.amort + p.amort, net: acc.net + p.net }),
    { brut: 0, amort: 0, net: 0 }
  );
}

// ============================================================
// COMPTE DE RÉSULTAT
// ============================================================

function calculerResultat(params, ca) {
  const { secteur }     = params.societe;
  const { orientation } = params.finance;
  const ratios          = RATIOS_SECTORIELS[secteur];

  const productionStockee = params.finance.hasStocks ? varier(ca * randFloat(0.01, 0.04)) : 0;
  const subventions       = varier(ca * randFloat(0.00, 0.01));
  const autresProduits    = varier(ca * randFloat(0.005, 0.02));
  const totalProduitsExpl = Math.round(ca + productionStockee + subventions + autresProduits);

  const achatsMarchandises = varier(ca * randFloat(ratios.achats_marchandises.min, ratios.achats_marchandises.max));
  const variationStocks    = params.finance.hasStocks ? -productionStockee : 0;
  const achatsMatieres     = secteur === 'industrie' ? varier(ca * randFloat(0.05, 0.15)) : 0;
  const autresAchats       = varier(ca * randFloat(ratios.charges_externes.min, ratios.charges_externes.max));
  const impotsTaxes        = varier(ca * randFloat(0.005, 0.015));
  const chargesPersonnel   = params.taille.nbEmployes !== 'aucun'
    ? varier(ca * randFloat(ratios.charges_personnel.min, ratios.charges_personnel.max)) : 0;

  const ratioNet         = randFloat(ORIENTATIONS[orientation].minRatio, ORIENTATIONS[orientation].maxRatio);
  const resultatNetCible = Math.round(ca * ratioNet);

  let impots = 0;
  let participation = 0;
  if (resultatNetCible > 0) {
    impots = resultatNetCible <= TAUX.SEUIL_IS_REDUIT
      ? Math.round(resultatNetCible * TAUX.IS_PME_REDUIT)
      : Math.round(TAUX.SEUIL_IS_REDUIT * TAUX.IS_PME_REDUIT + (resultatNetCible - TAUX.SEUIL_IS_REDUIT) * TAUX.IS_NORMAL);
  }

  const produitsFinanciers  = params.finance.hasInternational
    ? varier(ca * randFloat(0.002, 0.008)) : varier(ca * randFloat(0.000, 0.003));
  const chargesFinancieres  = params.finance.hasDettesBancaires
    ? varier(ca * randFloat(0.005, 0.025)) : varier(ca * randFloat(0.000, 0.003));
  const resultatFinancier   = Math.round(produitsFinanciers - chargesFinancieres);

  const produitsExceptionnels  = varier(ca * randFloat(0.000, 0.005));
  const chargesExceptionnelles = varier(ca * randFloat(0.000, 0.005));
  const resultatExceptionnel   = Math.round(produitsExceptionnels - chargesExceptionnelles);

  const chargesSansDA  = Math.round(achatsMarchandises + variationStocks + achatsMatieres + autresAchats + impotsTaxes + chargesPersonnel);
  const resultatSansDA = Math.round(totalProduitsExpl - chargesSansDA + resultatFinancier + resultatExceptionnel - participation - impots);
  let dotationsAmort   = Math.round(resultatSansDA - resultatNetCible);
  if (dotationsAmort < 0) dotationsAmort = 0;

  const totalChargesExpl     = Math.round(chargesSansDA + dotationsAmort);
  const resultatExploitation = Math.round(totalProduitsExpl - totalChargesExpl);
  const resultatCourant      = Math.round(resultatExploitation + resultatFinancier);
  let resultatNet            = Math.round(resultatCourant + resultatExceptionnel - participation - impots);

  // Un résultat neutre à 0 exact n'est pas réaliste — plancher ±PLANCHER_RESULTAT_NEUTRE
  if (orientation === 'neutre' && Math.abs(resultatNet) < PLANCHER_RESULTAT_NEUTRE) {
    const signe = resultatNet >= 0 ? 1 : -1;
    resultatNet = signe * randInt(1, PLANCHER_RESULTAT_NEUTRE - 1);
  }

  return {
    produitsExploitation: { ca, productionStockee, subventions, autresProduits, total: totalProduitsExpl },
    chargesExploitation:  { achatsMarchandises, variationStocks, achatsMatieres, autresAchats, impotsTaxes, chargesPersonnel, dotationsAmort, autresCharges: 0, total: totalChargesExpl },
    resultatExploitation, produitsFinanciers, chargesFinancieres, resultatFinancier,
    resultatCourant, produitsExceptionnels, chargesExceptionnelles, resultatExceptionnel,
    participation, impots, resultatNet,
  };
}

// ============================================================
// ACTIF IMMOBILISÉ
// ============================================================

function calculerActifImmobilise(params, ca) {
  if (!params.finance.hasImmobilisations) {
    const zero = poste(0, 0);
    return {
      incorporel: { fraisEtablissement: zero, fraisRD: zero, brevets: zero, fondsCommercial: zero, autresIncorporel: zero, total: zero },
      corporel:   { terrains: zero, constructions: zero, installations: zero, autresCorporel: zero, total: zero },
      financier:  { participations: zero, autresFinancier: zero, total: zero },
      total: zero,
    };
  }

  const { secteur } = params.societe;

  const fraisEtablissement = poste(varier(ca * randFloat(0.00, 0.01)), varier(ca * randFloat(0.00, 0.005)));
  const fraisRD            = secteur !== 'commerce'
    ? poste(varier(ca * randFloat(0.00, 0.03)), varier(ca * randFloat(0.00, 0.02))) : poste(0);
  const brevets            = poste(varier(ca * randFloat(0.00, 0.02)), varier(ca * randFloat(0.00, 0.01)));
  const fondsCommercial    = poste(varier(ca * randFloat(0.00, 0.05)));
  const autresIncorporel   = poste(varier(ca * randFloat(0.00, 0.01)));
  const totalIncorporel    = totalPostes(fraisEtablissement, fraisRD, brevets, fondsCommercial, autresIncorporel);

  const facteurCorporel = secteur === 'industrie' ? 0.6 : 0.3;
  const terrains        = secteur === 'industrie' ? poste(varier(ca * randFloat(0.05, 0.15))) : poste(0);
  const constructions   = poste(varier(ca * facteurCorporel * randFloat(0.10, 0.30)), varier(ca * facteurCorporel * randFloat(0.05, 0.15)));
  const installations   = poste(varier(ca * randFloat(0.05, 0.20)), varier(ca * randFloat(0.02, 0.12)));
  const autresCorporel  = poste(varier(ca * randFloat(0.02, 0.08)), varier(ca * randFloat(0.01, 0.05)));
  const totalCorporel   = totalPostes(terrains, constructions, installations, autresCorporel);

  const participations  = params.finance.hasInternational ? poste(varier(ca * randFloat(0.02, 0.10))) : poste(0);
  const autresFinancier = poste(varier(ca * randFloat(0.00, 0.02)));
  const totalFinancier  = totalPostes(participations, autresFinancier);
  const total           = totalPostes(totalIncorporel, totalCorporel, totalFinancier);

  return {
    incorporel: { fraisEtablissement, fraisRD, brevets, fondsCommercial, autresIncorporel, total: totalIncorporel },
    corporel:   { terrains, constructions, installations, autresCorporel, total: totalCorporel },
    financier:  { participations, autresFinancier, total: totalFinancier },
    total,
  };
}

// ============================================================
// ACTIF CIRCULANT
// ============================================================

function calculerActifCirculant(params, ca, passifTotal, actifImmoNet) {
  const ratios = RATIOS_SECTORIELS[params.societe.secteur];
  const zero   = poste(0);

  let stocks;
  if (!params.finance.hasStocks || ratios.stocks.max === 0) {
    stocks = { matieresPremières: zero, enCours: zero, produitsFinis: zero, marchandises: zero, total: zero };
  } else {
    const { secteur } = params.societe;
    const matieresPremières = secteur === 'industrie' ? poste(varier(ca * randFloat(ratios.stocks.min * 0.4, ratios.stocks.max * 0.4))) : zero;
    const enCours           = secteur === 'industrie' ? poste(varier(ca * randFloat(0.01, 0.05))) : zero;
    const produitsFinis     = secteur !== 'commerce'  ? poste(varier(ca * randFloat(0.02, 0.08))) : zero;
    const marchandises      = secteur === 'commerce'  ? poste(varier(ca * randFloat(ratios.stocks.min, ratios.stocks.max))) : zero;
    stocks = { matieresPremières, enCours, produitsFinis, marchandises, total: totalPostes(matieresPremières, enCours, produitsFinis, marchandises) };
  }

  const clients        = poste(varier(ca * randFloat(ratios.creances_clients.min, ratios.creances_clients.max)));
  const autresCreances = poste(varier(ca * randFloat(0.005, 0.02)));
  const totalCreances  = totalPostes(clients, autresCreances);

  const chargesConstatees   = poste(varier(ca * randFloat(0.002, 0.01)));
  const totalRegularisation = totalPostes(chargesConstatees);

  const vmp = poste(varier(ca * randFloat(0.00, 0.02)));

  const actifHorsTreso = actifImmoNet + stocks.total.net + totalCreances.net + totalRegularisation.net + vmp.net;
  const tresoMinimale  = Math.round(ca * 0.01);
  let banqueCaisseNet  = Math.round(passifTotal - actifHorsTreso);
  if (banqueCaisseNet < tresoMinimale) banqueCaisseNet = tresoMinimale;
  const banqueCaisse   = poste(banqueCaisseNet);
  const totalDispo     = totalPostes(vmp, banqueCaisse);

  return {
    circulant: {
      stocks,
      creances:       { clients, autresCreances, total: totalCreances },
      disponibilites: { vmp, banqueCaisse, total: totalDispo },
      total: totalPostes(stocks.total, totalCreances, totalDispo),
    },
    regularisation: { chargesConstatees, total: totalRegularisation },
  };
}

// ============================================================
// PASSIF
// ============================================================

function calculerPassif(params, ca, resultatNet) {
  const { formeJuridique } = params.societe;
  const { ca: tranche }    = params.taille;
  const ratios             = RATIOS_SECTORIELS[params.societe.secteur];

  const capital          = CAPITAL_TYPIQUE[tranche][formeJuridique];
  const primesEmission   = varier(capital * randFloat(0.00, 0.50));
  const reserveLegaleMax = Math.round(capital * TAUX.RESERVE_LEGALE_PLAFOND);
  const reserveLegale    = resultatNet > 0
    ? Math.min(Math.round(resultatNet * TAUX.RESERVE_LEGALE_TAUX), reserveLegaleMax) : 0;
  const autresReserves   = varier(capital * randFloat(0.00, 1.00));
  const reportANouveau   = varier(capital * randFloat(-0.20, 0.30));
  const totalCP          = Math.round(capital + primesEmission + reserveLegale + autresReserves + reportANouveau + resultatNet);

  const risques   = varier(ca * randFloat(0.005, 0.02));
  const charges   = varier(ca * randFloat(0.002, 0.01));
  const totalProv = Math.round(risques + charges);

  const emprunts         = params.finance.hasDettesBancaires ? varier(ca * randFloat(0.10, 0.40)) : 0;
  const fournisseurs     = varier(ca * randFloat(ratios.dettes_fournisseurs.min, ratios.dettes_fournisseurs.max));
  const fiscalesSociales = varier(ca * randFloat(0.02, 0.06));
  const autresDettes     = varier(ca * randFloat(0.01, 0.04));
  const totalDettes      = Math.round(emprunts + fournisseurs + fiscalesSociales + autresDettes);

  const produitsConstates = varier(ca * randFloat(0.002, 0.01));
  const totalRegul        = Math.round(produitsConstates);
  const total             = Math.round(totalCP + totalProv + totalDettes + totalRegul);

  return {
    capitauxPropres: { capital, primesEmission, reserveLegale, autresReserves, reportANouveau, resultat: resultatNet, total: totalCP },
    provisions:      { risques, charges, total: totalProv },
    dettes:          { emprunts, fournisseurs, fiscalesSociales, autresDettes, total: totalDettes },
    regularisation:  { produitsConstates, total: totalRegul },
    total,
  };
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

/**
 * Génère un objet BilanData complet à partir de BilanParams.
 *
 * F54 — Exercice décalé :
 *   Si dureeExerciceMois < 12, le CA est proraté avant toute génération.
 *   Un exercice de 9 mois ne peut pas afficher le même CA qu'un exercice plein.
 *
 * @param {object} params  BilanParams produit par form.js
 * @returns {object}       BilanData complet
 */
export function generate(params) {
  const tranche = TRANCHES_CA[params.taille.ca];
  let ca        = varier(randInt(tranche.min, tranche.max));

  // F54 — prorata CA si exercice court (< 12 mois)
  const duree = params.societe.dureeExerciceMois ?? 12;
  if (duree < 12) {
    ca = Math.round(ca * (duree / 12));
  }

  const resultat        = calculerResultat(params, ca);
  const passif          = calculerPassif(params, ca, resultat.resultatNet);
  const actifImmobilise = calculerActifImmobilise(params, ca);
  const { circulant, regularisation } = calculerActifCirculant(params, ca, passif.total, actifImmobilise.total.net);

  let totalNet = Math.round(actifImmobilise.total.net + circulant.total.net + regularisation.total.net);
  const ecart  = passif.total - totalNet;
  if (Math.abs(ecart) <= 1 && ecart !== 0) {
    circulant.disponibilites.banqueCaisse.net  += ecart;
    circulant.disponibilites.banqueCaisse.brut += ecart;
    circulant.disponibilites.total.net         += ecart;
    circulant.disponibilites.total.brut        += ecart;
    circulant.total.net                        += ecart;
    circulant.total.brut                       += ecart;
    totalNet += ecart;
  }

  const bilan = {
    actif: { immobilise: actifImmobilise, circulant, regularisation, totalNet },
    passif,
  };

  let n1 = null;
  if (params.output.compareN1) {
    const caN1       = Math.round(ca * randFloat(0.85, 1.10));
    const resultatN1 = calculerResultat(params, caN1);
    const passifN1   = calculerPassif(params, caN1, resultatN1.resultatNet);
    const immoN1     = calculerActifImmobilise(params, caN1);
    const { circulant: circN1, regularisation: regulN1 } = calculerActifCirculant(params, caN1, passifN1.total, immoN1.total.net);
    let totalNetN1 = Math.round(immoN1.total.net + circN1.total.net + regulN1.total.net);
    const ecartN1  = passifN1.total - totalNetN1;
    if (Math.abs(ecartN1) <= 1 && ecartN1 !== 0) {
      circN1.disponibilites.banqueCaisse.net  += ecartN1;
      circN1.disponibilites.banqueCaisse.brut += ecartN1;
      circN1.disponibilites.total.net         += ecartN1;
      circN1.disponibilites.total.brut        += ecartN1;
      circN1.total.net                        += ecartN1;
      circN1.total.brut                       += ecartN1;
      totalNetN1 += ecartN1;
    }
    n1 = {
      meta: {
        anneeExercice:     params.societe.anneeExercice - 1,
        // N-1 : exercice plein supposé (01/01 → 31/12 de l'année précédente)
        dateDebut:         `${params.societe.anneeExercice - 1}-01-01`,
        dateFin:           `${params.societe.anneeExercice - 1}-12-31`,
        dureeExerciceMois: 12,
      },
      bilan: {
        actif: { immobilise: immoN1, circulant: circN1, regularisation: regulN1, totalNet: totalNetN1 },
        passif: passifN1,
      },
      resultat: resultatN1,
    };
  }

  return {
    meta: {
      societe:            params.societe.nom,
      formeJuridique:     params.societe.formeJuridique,
      secteur:            params.societe.secteur,
      // F54 — dates complètes dans meta
      dateDebut:          params.societe.dateDebut,
      dateFin:            params.societe.dateFin,
      dureeExerciceMois:  duree,
      anneeExercice:      params.societe.anneeExercice,
      anneeN1:            params.societe.anneeExercice - 1,
      regimeTVA:          params.finance.regimeTVA,
      hasInternational:   params.finance.hasInternational,
      hasStocks:          params.finance.hasStocks,
      hasImmobilisations: params.finance.hasImmobilisations,
      orientation:        params.finance.orientation,
      mention:            MENTION_FICTIF,
      siret:              params.societe.siret   ?? null,
      adresse:            params.societe.adresse ?? null,
    },
    bilan,
    resultat,
    n1,
  };
}
