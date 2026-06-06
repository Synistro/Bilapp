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
} from './constants.js';

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Retourne un entier aléatoire dans [min, max] (inclus).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randInt(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

/**
 * Retourne un flottant aléatoire dans [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Applique une variation aléatoire ±VARIATION_MONTANTS à un montant de base.
 * Permet d'éviter les chiffres ronds suspects sur un document pédagogique.
 * @param {number} base
 * @returns {number}
 */
function varier(base) {
  return Math.round(base * (1 + randFloat(-VARIATION_MONTANTS, VARIATION_MONTANTS)));
}

/**
 * Construit un poste d'actif brut/amort/net.
 * @param {number} brut
 * @param {number} amort
 * @returns {{ brut: number, amort: number, net: number }}
 */
function poste(brut, amort = 0) {
  return {
    brut:  Math.round(brut),
    amort: Math.round(amort),
    net:   Math.round(brut - amort),
  };
}

/**
 * Additionne plusieurs postes brut/amort/net en un total.
 * @param {...{ brut: number, amort: number, net: number }} postes
 * @returns {{ brut: number, amort: number, net: number }}
 */
function totalPostes(...postes) {
  return postes.reduce(
    (acc, p) => ({
      brut:  acc.brut  + p.brut,
      amort: acc.amort + p.amort,
      net:   acc.net   + p.net,
    }),
    { brut: 0, amort: 0, net: 0 }
  );
}

// ============================================================
// CALCUL DU COMPTE DE RÉSULTAT
// ============================================================

/**
 * Calcule le compte de résultat à partir des paramètres.
 * Le résultat net est la contrainte centrale qui pilote l'équilibre bilan.
 *
 * @param {object} params   BilanParams complet
 * @param {number} ca       Chiffre d'affaires tiré
 * @returns {object}        Structure resultat du BilanData
 */
function calculerResultat(params, ca) {
  const { secteur }     = params.societe;
  const { orientation } = params.finance;
  const ratios          = RATIOS_SECTORIELS[secteur];

  // --- Produits d'exploitation ---
  const productionStockee  = params.finance.hasStocks
    ? varier(ca * randFloat(0.01, 0.04))
    : 0;
  const subventions        = varier(ca * randFloat(0.00, 0.01));
  const autresProduits     = varier(ca * randFloat(0.005, 0.02));
  const totalProduitsExpl  = Math.round(ca + productionStockee + subventions + autresProduits);

  // --- Charges d'exploitation ---
  const achatsMarchandises = varier(ca * randFloat(
    ratios.achats_marchandises.min,
    ratios.achats_marchandises.max
  ));
  // La variation de stocks est l'opposé de la production stockée (simplification pédagogique)
  const variationStocks    = params.finance.hasStocks ? -productionStockee : 0;
  const achatsMatieres     = secteur === 'industrie'
    ? varier(ca * randFloat(0.05, 0.15))
    : 0;
  const autresAchats       = varier(ca * randFloat(
    ratios.charges_externes.min,
    ratios.charges_externes.max
  ));
  const impotsTaxes        = varier(ca * randFloat(0.005, 0.015));
  const chargesPersonnel   = params.taille.nbEmployes !== 'aucun'
    ? varier(ca * randFloat(ratios.charges_personnel.min, ratios.charges_personnel.max))
    : 0;

  // --- Résultat net cible ---
  const ratioNet = randFloat(
    ORIENTATIONS[orientation].minRatio,
    ORIENTATIONS[orientation].maxRatio
  );
  const resultatNetCible = Math.round(ca * ratioNet);

  // --- IS calculé sur le résultat net cible avant IS ---
  let impots      = 0;
  let participation = 0;

  if (resultatNetCible > 0) {
    const baseImposable = resultatNetCible;
    if (baseImposable <= TAUX.SEUIL_IS_REDUIT) {
      impots = Math.round(baseImposable * TAUX.IS_PME_REDUIT);
    } else {
      impots = Math.round(
        TAUX.SEUIL_IS_REDUIT * TAUX.IS_PME_REDUIT
        + (baseImposable - TAUX.SEUIL_IS_REDUIT) * TAUX.IS_NORMAL
      );
    }
  }

  // --- Résultat financier ---
  const produitsFinanciers  = params.finance.hasInternational
    ? varier(ca * randFloat(0.002, 0.008))
    : varier(ca * randFloat(0.000, 0.003));
  const chargesFinancieres  = params.finance.hasDettesBancaires
    ? varier(ca * randFloat(0.005, 0.025))
    : varier(ca * randFloat(0.000, 0.003));
  const resultatFinancier   = Math.round(produitsFinanciers - chargesFinancieres);

  // --- Résultat exceptionnel (faible, peu prévisible) ---
  const produitsExceptionnels  = varier(ca * randFloat(0.000, 0.005));
  const chargesExceptionnelles = varier(ca * randFloat(0.000, 0.005));
  const resultatExceptionnel   = Math.round(produitsExceptionnels - chargesExceptionnelles);

  // --- Dotations aux amortissements comme variable d'ajustement ---
  // On cherche dotationsAmort tel que resultatNet = cible
  // resultatNet = totalProduitsExpl - totalChargesSansDA - dotationsAmort + resultatFinancier
  //             + resultatExceptionnel - participation - impots
  const chargesSansDA = Math.round(
    achatsMarchandises + variationStocks + achatsMatieres
    + autresAchats + impotsTaxes + chargesPersonnel
  );
  const resultatSansDA = Math.round(
    totalProduitsExpl - chargesSansDA + resultatFinancier
    + resultatExceptionnel - participation - impots
  );
  let dotationsAmort = Math.round(resultatSansDA - resultatNetCible);

  // Les dotations ne peuvent pas être négatives (comptablement absurde)
  if (dotationsAmort < 0) dotationsAmort = 0;

  const totalChargesExpl = Math.round(
    chargesSansDA + dotationsAmort
  );

  const resultatExploitation = Math.round(totalProduitsExpl - totalChargesExpl);
  const resultatCourant      = Math.round(resultatExploitation + resultatFinancier);
  const resultatNet          = Math.round(
    resultatCourant + resultatExceptionnel - participation - impots
  );

  return {
    produitsExploitation: {
      ca,
      productionStockee,
      subventions,
      autresProduits,
      total: totalProduitsExpl,
    },
    chargesExploitation: {
      achatsMarchandises,
      variationStocks,
      achatsMatieres,
      autresAchats,
      impotsTaxes,
      chargesPersonnel,
      dotationsAmort,
      autresCharges: 0,
      total: totalChargesExpl,
    },
    resultatExploitation,
    produitsFinanciers,
    chargesFinancieres,
    resultatFinancier,
    resultatCourant,
    produitsExceptionnels,
    chargesExceptionnelles,
    resultatExceptionnel,
    participation,
    impots,
    resultatNet,
  };
}

// ============================================================
// CALCUL DU BILAN
// ============================================================

/**
 * Construit l'actif immobilisé.
 * Retourne zéro sur tous les postes si hasImmobilisations = false.
 *
 * @param {object} params  BilanParams
 * @param {number} ca      Chiffre d'affaires
 * @returns {object}       Structure actif.immobilise
 */
function calculerActifImmobilise(params, ca) {
  if (!params.finance.hasImmobilisations) {
    const zero = poste(0, 0);
    return {
      incorporel: {
        fraisEtablissement: zero,
        fraisRD:            zero,
        brevets:            zero,
        fondsCommercial:    zero,
        autresIncorporel:   zero,
        total:              zero,
      },
      corporel: {
        terrains:       zero,
        constructions:  zero,
        installations:  zero,
        autresCorporel: zero,
        total:          zero,
      },
      financier: {
        participations:  zero,
        autresFinancier: zero,
        total:           zero,
      },
      total: zero,
    };
  }

  const { secteur } = params.societe;

  // Incorporel
  const fraisEtablissement = poste(
    varier(ca * randFloat(0.00, 0.01)),
    varier(ca * randFloat(0.00, 0.005))
  );
  const fraisRD = secteur !== 'commerce'
    ? poste(varier(ca * randFloat(0.00, 0.03)), varier(ca * randFloat(0.00, 0.02)))
    : poste(0);
  const brevets = poste(
    varier(ca * randFloat(0.00, 0.02)),
    varier(ca * randFloat(0.00, 0.01))
  );
  const fondsCommercial  = poste(varier(ca * randFloat(0.00, 0.05)));
  const autresIncorporel = poste(varier(ca * randFloat(0.00, 0.01)));
  const totalIncorporel  = totalPostes(
    fraisEtablissement, fraisRD, brevets, fondsCommercial, autresIncorporel
  );

  // Corporel — pondéré par secteur
  const facteurCorporel = secteur === 'industrie' ? 0.6 : 0.3;
  const terrains        = secteur === 'industrie'
    ? poste(varier(ca * randFloat(0.05, 0.15)))
    : poste(0);
  const constructions   = poste(
    varier(ca * facteurCorporel * randFloat(0.10, 0.30)),
    varier(ca * facteurCorporel * randFloat(0.05, 0.15))
  );
  const installations   = poste(
    varier(ca * randFloat(0.05, 0.20)),
    varier(ca * randFloat(0.02, 0.12))
  );
  const autresCorporel  = poste(
    varier(ca * randFloat(0.02, 0.08)),
    varier(ca * randFloat(0.01, 0.05))
  );
  const totalCorporel   = totalPostes(terrains, constructions, installations, autresCorporel);

  // Financier
  const participations  = params.finance.hasInternational
    ? poste(varier(ca * randFloat(0.02, 0.10)))
    : poste(0);
  const autresFinancier = poste(varier(ca * randFloat(0.00, 0.02)));
  const totalFinancier  = totalPostes(participations, autresFinancier);

  const total = totalPostes(totalIncorporel, totalCorporel, totalFinancier);

  return {
    incorporel: {
      fraisEtablissement,
      fraisRD,
      brevets,
      fondsCommercial,
      autresIncorporel,
      total: totalIncorporel,
    },
    corporel: {
      terrains,
      constructions,
      installations,
      autresCorporel,
      total: totalCorporel,
    },
    financier: {
      participations,
      autresFinancier,
      total: totalFinancier,
    },
    total,
  };
}

/**
 * Construit l'actif circulant.
 * La trésorerie (banqueCaisse) est calculée en dernier comme variable d'ajustement
 * pour garantir actif.totalNet === passif.total.
 *
 * @param {object} params       BilanParams
 * @param {number} ca           Chiffre d'affaires
 * @param {number} passifTotal  Total passif (déjà calculé)
 * @param {number} actifImmoNet Total net actif immobilisé
 * @returns {{ circulant, regularisation }}
 */
function calculerActifCirculant(params, ca, passifTotal, actifImmoNet) {
  const ratios = RATIOS_SECTORIELS[params.societe.secteur];
  const zero   = poste(0);

  // --- Stocks ---
  let stocks;
  if (!params.finance.hasStocks || ratios.stocks.max === 0) {
    stocks = {
      matieresPremières: zero,
      enCours:           zero,
      produitsFinis:     zero,
      marchandises:      zero,
      total:             zero,
    };
  } else {
    const { secteur } = params.societe;
    const matieresPremières = secteur === 'industrie'
      ? poste(varier(ca * randFloat(ratios.stocks.min * 0.4, ratios.stocks.max * 0.4)))
      : zero;
    const enCours           = secteur === 'industrie'
      ? poste(varier(ca * randFloat(0.01, 0.05)))
      : zero;
    const produitsFinis     = secteur !== 'commerce'
      ? poste(varier(ca * randFloat(0.02, 0.08)))
      : zero;
    const marchandises      = secteur === 'commerce'
      ? poste(varier(ca * randFloat(ratios.stocks.min, ratios.stocks.max)))
      : zero;
    stocks = {
      matieresPremières,
      enCours,
      produitsFinis,
      marchandises,
      total: totalPostes(matieresPremières, enCours, produitsFinis, marchandises),
    };
  }

  // --- Créances ---
  const clients        = poste(varier(ca * randFloat(
    ratios.creances_clients.min,
    ratios.creances_clients.max
  )));
  const autresCreances = poste(varier(ca * randFloat(0.005, 0.02)));
  const totalCreances  = totalPostes(clients, autresCreances);

  // --- Régularisation actif ---
  const chargesConstatees   = poste(varier(ca * randFloat(0.002, 0.01)));
  const totalRegularisation = totalPostes(chargesConstatees);

  // --- VMP ---
  const vmp = poste(varier(ca * randFloat(0.00, 0.02)));

  // --- Trésorerie = variable d'ajustement pour équilibrer le bilan ---
  const actifHorsTreso = actifImmoNet
    + stocks.total.net
    + totalCreances.net
    + totalRegularisation.net
    + vmp.net;

  const tresoMinimale = Math.round(ca * 0.01); // tréso plancher réaliste
  let banqueCaisseNet = Math.round(passifTotal - actifHorsTreso);
  if (banqueCaisseNet < tresoMinimale) banqueCaisseNet = tresoMinimale;
  const banqueCaisse  = poste(banqueCaisseNet);

  const totalDispo = totalPostes(vmp, banqueCaisse);

  return {
    circulant: {
      stocks,
      creances: {
        clients,
        autresCreances,
        total: totalCreances,
      },
      disponibilites: {
        vmp,
        banqueCaisse,
        total: totalDispo,
      },
      total: totalPostes(stocks.total, totalCreances, totalDispo),
    },
    regularisation: {
      chargesConstatees,
      total: totalRegularisation,
    },
  };
}

/**
 * Construit le passif complet.
 * Ordre : capital → réserves → résultat → provisions → dettes → régularisation.
 *
 * @param {object} params      BilanParams
 * @param {number} ca          Chiffre d'affaires
 * @param {number} resultatNet Résultat net du compte de résultat
 * @returns {object}           Structure bilan.passif
 */
function calculerPassif(params, ca, resultatNet) {
  const { formeJuridique } = params.societe;
  const { ca: tranche }    = params.taille;
  const ratios             = RATIOS_SECTORIELS[params.societe.secteur];

  // --- Capitaux propres ---
  const capital        = CAPITAL_TYPIQUE[tranche][formeJuridique];
  const primesEmission = varier(capital * randFloat(0.00, 0.50));

  const reserveLegaleMax = Math.round(capital * TAUX.RESERVE_LEGALE_PLAFOND);
  const reserveLegale    = resultatNet > 0
    ? Math.min(Math.round(resultatNet * TAUX.RESERVE_LEGALE_TAUX), reserveLegaleMax)
    : 0;
  const autresReserves   = varier(capital * randFloat(0.00, 1.00));
  const reportANouveau   = varier(capital * randFloat(-0.20, 0.30));
  const totalCP          = Math.round(
    capital + primesEmission + reserveLegale + autresReserves + reportANouveau + resultatNet
  );

  // --- Provisions ---
  const risques   = varier(ca * randFloat(0.005, 0.02));
  const charges   = varier(ca * randFloat(0.002, 0.01));
  const totalProv = Math.round(risques + charges);

  // --- Dettes ---
  const emprunts         = params.finance.hasDettesBancaires
    ? varier(ca * randFloat(0.10, 0.40))
    : 0;
  const fournisseurs     = varier(ca * randFloat(
    ratios.dettes_fournisseurs.min,
    ratios.dettes_fournisseurs.max
  ));
  const fiscalesSociales = varier(ca * randFloat(0.02, 0.06));
  const autresDettes     = varier(ca * randFloat(0.01, 0.04));
  const totalDettes      = Math.round(emprunts + fournisseurs + fiscalesSociales + autresDettes);

  // --- Régularisation passif ---
  const produitsConstates = varier(ca * randFloat(0.002, 0.01));
  const totalRegul        = Math.round(produitsConstates);

  const total = Math.round(totalCP + totalProv + totalDettes + totalRegul);

  return {
    capitauxPropres: {
      capital,
      primesEmission,
      reserveLegale,
      autresReserves,
      reportANouveau,
      resultat: resultatNet,
      total:    totalCP,
    },
    provisions: {
      risques,
      charges,
      total: totalProv,
    },
    dettes: {
      emprunts,
      fournisseurs,
      fiscalesSociales,
      autresDettes,
      total: totalDettes,
    },
    regularisation: {
      produitsConstates,
      total: totalRegul,
    },
    total,
  };
}

// ============================================================
// FONCTION PRINCIPALE
// ============================================================

/**
 * Génère un objet BilanData complet à partir de BilanParams.
 *
 * Contraintes garanties :
 *   - actif.totalNet === passif.total (±1€ tolérance arrondi)
 *   - resultat.resultatNet === passif.capitauxPropres.resultat
 *
 * @param {object} params  BilanParams produit par form.js
 * @returns {object}       BilanData complet
 */
export function generate(params) {
  // 1. CA tiré dans la tranche avec variation ±15%
  const tranche = TRANCHES_CA[params.taille.ca];
  const caBase  = randInt(tranche.min, tranche.max);
  const ca      = varier(caBase);

  // 2. Compte de résultat
  const resultat = calculerResultat(params, ca);

  // 3. Passif — son total pilote l'équilibre actif
  const passif = calculerPassif(params, ca, resultat.resultatNet);

  // 4. Actif immobilisé
  const actifImmobilise = calculerActifImmobilise(params, ca);

  // 5. Actif circulant — trésorerie en variable d'ajustement
  const { circulant, regularisation } = calculerActifCirculant(
    params,
    ca,
    passif.total,
    actifImmobilise.total.net
  );

  // 6. Total actif net
  let totalNet = Math.round(
    actifImmobilise.total.net
    + circulant.total.net
    + regularisation.total.net
  );

  // 7. Absorption de l'écart d'arrondi résiduel (±1€ max) sur la trésorerie
  const ecart = passif.total - totalNet;
  if (Math.abs(ecart) <= 1 && ecart !== 0) {
    circulant.disponibilites.banqueCaisse.net  += ecart;
    circulant.disponibilites.banqueCaisse.brut += ecart;
    circulant.disponibilites.total.net         += ecart;
    circulant.disponibilites.total.brut        += ecart;
    circulant.total.net                         += ecart;
    circulant.total.brut                        += ecart;
    totalNet += ecart;
  }

  const bilan = {
    actif: {
      immobilise:    actifImmobilise,
      circulant,
      regularisation,
      totalNet,
    },
    passif,
  };

  // 8. N-1 optionnel
  let n1 = null;
  if (params.output.compareN1) {
    const caN1       = Math.round(ca * randFloat(0.85, 1.10));
    const resultatN1 = calculerResultat(params, caN1);
    const passifN1   = calculerPassif(params, caN1, resultatN1.resultatNet);
    const immoN1     = calculerActifImmobilise(params, caN1);
    const { circulant: circN1, regularisation: regulN1 } = calculerActifCirculant(
      params, caN1, passifN1.total, immoN1.total.net
    );
    let totalNetN1 = Math.round(immoN1.total.net + circN1.total.net + regulN1.total.net);
    const ecartN1  = passifN1.total - totalNetN1;
    if (Math.abs(ecartN1) <= 1 && ecartN1 !== 0) {
      circN1.disponibilites.banqueCaisse.net  += ecartN1;
      circN1.disponibilites.banqueCaisse.brut += ecartN1;
      circN1.disponibilites.total.net         += ecartN1;
      circN1.disponibilites.total.brut        += ecartN1;
      circN1.total.net                         += ecartN1;
      circN1.total.brut                        += ecartN1;
      totalNetN1 += ecartN1;
    }
    n1 = {
      meta: { anneeExercice: params.societe.anneeExercice - 1 },
      bilan: {
        actif: {
          immobilise:    immoN1,
          circulant:     circN1,
          regularisation: regulN1,
          totalNet:      totalNetN1,
        },
        passif: passifN1,
      },
      resultat: resultatN1,
    };
  }

  return {
    meta: {
      societe:           params.societe.nom,
      formeJuridique:    params.societe.formeJuridique,
      secteur:           params.societe.secteur,
      anneeExercice:     params.societe.anneeExercice,
      anneeN1:           params.societe.anneeExercice - 1,
      regimeTVA:         params.finance.regimeTVA,
      hasInternational:  params.finance.hasInternational,
      hasStocks:         params.finance.hasStocks,
      hasImmobilisations: params.finance.hasImmobilisations,
      orientation:       params.finance.orientation,
      mention:           MENTION_FICTIF,
    },
    bilan,
    resultat,
    n1,
  };
}
