/**
 * liasse.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML de la liasse fiscale (imprimés Cerfa 2050–2059-A).
 * Pédagogique uniquement — codes lignes Cerfa exacts, rendu "à la Cerfa".
 *
 * Exports :
 *   buildLiasse(data, params) → string HTML
 *
 * RÈGLES :
 * - Lecture seule, zéro édition inline
 * - Mention "DOCUMENT FICTIF" sur chaque imprimé
 * - Zéro magic numbers → constantes locales ou constants.js
 * - Fonctions pures, zéro DOM direct
 */

'use strict';

import { TAUX, MENTION_FICTIF } from '../core/constants.js';
import { fmtDateFR }            from '../utils/doc-helpers.js';

// ============================================================
// CONSTANTES LIASSE
// ============================================================

/** Taux de réintégration simulée (% de autresAchats) */
const TAUX_REINTEGRATION_MIN = 0.005;
const TAUX_REINTEGRATION_MAX = 0.020;
/** Taux de déduction simulée (% du CA) si hasInternational */
const TAUX_DEDUCTION_MIN = 0.000;
const TAUX_DEDUCTION_MAX = 0.010;

// ============================================================
// UTILITAIRES
// ============================================================

/** @param {number} n @returns {string} */
function c(n) {
  if (n == null || n === 0) return '';
  return Math.round(n).toLocaleString('fr-FR');
}

/** Valeur absolue formatée (certaines lignes Cerfa ne portent pas le signe) */
function ca(n) {
  if (n == null || n === 0) return '';
  return Math.round(Math.abs(n)).toLocaleString('fr-FR');
}

/**
 * Ligne Cerfa générique : code | libellé | brut | amort/dép | net
 * Ou : code | libellé | montant (passif/CR)
 */
function lr(code, libelle, v1, v2 = null, v3 = null) {
  if (v2 === null) {
    return `<tr><td class="lf-code">${code}</td><td class="lf-lib">${libelle}</td><td class="lf-val">${c(v1)}</td></tr>`;
  }
  if (v3 === null) {
    return `<tr><td class="lf-code">${code}</td><td class="lf-lib">${libelle}</td><td class="lf-val">${c(v1)}</td><td class="lf-val">${c(v2)}</td></tr>`;
  }
  return `<tr><td class="lf-code">${code}</td><td class="lf-lib">${libelle}</td><td class="lf-val">${c(v1)}</td><td class="lf-val">${c(v2)}</td><td class="lf-val">${c(v3)}</td></tr>`;
}

/** Ligne sous-total / total Cerfa */
function lt(code, libelle, v1, v2 = null, v3 = null, cls = 'lf-subtotal') {
  if (v2 === null) {
    return `<tr class="${cls}"><td class="lf-code">${code}</td><td class="lf-lib">${libelle}</td><td class="lf-val">${c(v1)}</td></tr>`;
  }
  if (v3 === null) {
    return `<tr class="${cls}"><td class="lf-code">${code}</td><td class="lf-lib">${libelle}</td><td class="lf-val">${c(v1)}</td><td class="lf-val">${c(v2)}</td></tr>`;
  }
  return `<tr class="${cls}"><td class="lf-code">${code}</td><td class="lf-lib">${libelle}</td><td class="lf-val">${c(v1)}</td><td class="lf-val">${c(v2)}</td><td class="lf-val">${c(v3)}</td></tr>`;
}

/**
 * Construit la ligne "Exercice" de l'en-tête Cerfa.
 * F54 : affiche la plage si exercice décalé ou court.
 * @param {object} meta  BilanData.meta
 * @returns {string}
 */
function _exerciceLigne(meta) {
  const debutD    = meta.dateDebut ? new Date(meta.dateDebut) : null;
  const estDecale = debutD && (debutD.getMonth() !== 0 || debutD.getDate() !== 1);
  const estCourt  = (meta.dureeExerciceMois ?? 12) < 11.5;

  if ((estDecale || estCourt) && meta.dateDebut && meta.dateFin) {
    return `Du ${fmtDateFR(meta.dateDebut)} au ${fmtDateFR(meta.dateFin)}`;
  }
  return `Exercice clos le ${fmtDateFR(meta.dateFin) || `31/12/${meta.anneeExercice}`}`;
}

/**
 * En-tête d'un imprimé Cerfa.
 * @param {string} cerfa    ex: "2050"
 * @param {string} titre    ex: "Bilan — Actif"
 * @param {object} meta     BilanData.meta
 */
function impriméHeader(cerfa, titre, meta) {
  return `
    <div class="lf-imprime-header">
      <div class="lf-imprime-header__left">
        <span class="lf-cerfa-num">Cerfa n° ${cerfa}</span>
        <span class="lf-cerfa-titre">${titre}</span>
      </div>
      <div class="lf-imprime-header__right">
        <div class="lf-societe">${meta.societe} — ${meta.formeJuridique}</div>
        <div class="lf-exercice">${_exerciceLigne(meta)}</div>
        <div class="lf-mention">${MENTION_FICTIF}</div>
      </div>
    </div>
  `;
}

// ============================================================
// 2050 — BILAN ACTIF
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2050
 */
function build2050(data) {
  const a  = data.bilan.actif;
  const ii = a.immobilise.incorporel;
  const ic = a.immobilise.corporel;
  const ifin = a.immobilise.financier;
  const st = a.circulant.stocks;
  const cr = a.circulant.creances;
  const di = a.circulant.disponibilites;
  const rg = a.regularisation;

  // Totaux brut / amort / net actif immobilisé
  const immoB = a.immobilise.total.brut;
  const immoA = a.immobilise.total.amort;
  const immoN = a.immobilise.total.net;
  // Actif circulant : pas d'amort sur circulant (sauf provisions, non simulées)
  const circB = a.circulant.total.brut;
  const circN = a.circulant.total.net;
  const rgN   = rg.total.net;
  const totalB = immoB + circB + rg.total.brut;
  const totalA = immoA;
  const totalN = immoN + circN + rgN;

  return `
    <div class="lf-imprime" id="lf-2050">
      ${impriméHeader('2050', 'Bilan — Actif', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation des postes</th>
            <th class="lf-val">Brut</th>
            <th class="lf-val">Amort./Dép.</th>
            <th class="lf-val">Net N</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="5">ACTIF IMMOBILISÉ</td></tr>
          <tr class="lf-subsection"><td colspan="5">Immobilisations incorporelles</td></tr>
          ${lr('AA', 'Frais d\'établissement',                     ii.fraisEtablissement.brut, ii.fraisEtablissement.amort, ii.fraisEtablissement.net)}
          ${lr('AB', 'Frais de recherche et développement',        ii.fraisRD.brut,            ii.fraisRD.amort,            ii.fraisRD.net)}
          ${lr('AC', 'Concessions, brevets, droits similaires',    ii.brevets.brut,            ii.brevets.amort,            ii.brevets.net)}
          ${lr('AD', 'Fonds commercial',                           ii.fondsCommercial.brut,    ii.fondsCommercial.amort,    ii.fondsCommercial.net)}
          ${lr('AE', 'Autres immobilisations incorporelles',       ii.autresIncorporel.brut,   ii.autresIncorporel.amort,   ii.autresIncorporel.net)}
          ${lt('AF', 'Avances et acomptes',                        0,                          0,                           0)}
          <tr class="lf-subsection"><td colspan="5">Immobilisations corporelles</td></tr>
          ${lr('AG', 'Terrains',                                   ic.terrains.brut,           ic.terrains.amort,           ic.terrains.net)}
          ${lr('AH', 'Constructions',                              ic.constructions.brut,      ic.constructions.amort,      ic.constructions.net)}
          ${lr('AI', 'Installations techniques, matériel, outillage', ic.installations.brut,   ic.installations.amort,      ic.installations.net)}
          ${lr('AJ', 'Autres immobilisations corporelles',         ic.autresCorporel.brut,     ic.autresCorporel.amort,     ic.autresCorporel.net)}
          ${lt('AK', 'Immobilisations en cours',                   0,                          0,                           0)}
          ${lt('AL', 'Avances et acomptes',                        0,                          0,                           0)}
          <tr class="lf-subsection"><td colspan="5">Immobilisations financières</td></tr>
          ${lr('AM', 'Participations évaluées par équivalence',    0,                          0,                           0)}
          ${lr('AN', 'Autres participations',                      ifin.participations.brut,   ifin.participations.amort,   ifin.participations.net)}
          ${lr('AO', 'Créances rattachées à des participations',   0,                          0,                           0)}
          ${lr('AP', 'Autres titres immobilisés',                  0,                          0,                           0)}
          ${lr('AQ', 'Prêts',                                      0,                          0,                           0)}
          ${lr('AR', 'Autres immobilisations financières',         ifin.autresFinancier.brut,  ifin.autresFinancier.amort,  ifin.autresFinancier.net)}
          ${lt('AS', 'TOTAL ACTIF IMMOBILISÉ (I)',                 immoB,                      immoA,                       immoN, 'lf-total')}

          <tr class="lf-section"><td colspan="5">ACTIF CIRCULANT</td></tr>
          <tr class="lf-subsection"><td colspan="5">Stocks et en-cours</td></tr>
          ${lr('BA', 'Matières premières, approv.',                st.matieresPremières.brut,  st.matieresPremières.amort,  st.matieresPremières.net)}
          ${lr('BB', 'En-cours de production (biens)',             st.enCours.brut,            st.enCours.amort,            st.enCours.net)}
          ${lr('BC', 'En-cours de production (services)',          0,                          0,                           0)}
          ${lr('BD', 'Produits intermédiaires et finis',           st.produitsFinis.brut,      st.produitsFinis.amort,      st.produitsFinis.net)}
          ${lr('BE', 'Marchandises',                               st.marchandises.brut,       st.marchandises.amort,       st.marchandises.net)}
          ${lt('BF', 'Avances et acomptes versés / commandes',     0,                          0,                           0)}
          <tr class="lf-subsection"><td colspan="5">Créances</td></tr>
          ${lr('BG', 'Clients et comptes rattachés',               cr.clients.brut,            cr.clients.amort,            cr.clients.net)}
          ${lr('BH', 'Autres créances',                            cr.autresCreances.brut,     cr.autresCreances.amort,     cr.autresCreances.net)}
          <tr class="lf-subsection"><td colspan="5">Divers</td></tr>
          ${lr('BI', 'Capital souscrit, appelé, non versé',        0,                          0,                           0)}
          ${lr('BJ', 'Valeurs mobilières de placement',            di.vmp.brut,                di.vmp.amort,                di.vmp.net)}
          ${lr('BK', 'Disponibilités',                             di.banqueCaisse.brut,       di.banqueCaisse.amort,       di.banqueCaisse.net)}
          ${lr('BL', 'Charges constatées d\'avance',               rg.chargesConstatees.brut,  rg.chargesConstatees.amort,  rg.chargesConstatees.net)}
          ${lt('BN', 'TOTAL ACTIF CIRCULANT (II)',                  circB,                      0,                           circN + rgN, 'lf-total')}
          ${lt('CD', 'TOTAL GÉNÉRAL (I + II)',                     totalB,                     totalA,                      totalN, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2051 — BILAN PASSIF
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2051
 */
function build2051(data) {
  const p  = data.bilan.passif;
  const cp = p.capitauxPropres;
  const pv = p.provisions;
  const dt = p.dettes;
  const rg = p.regularisation;

  return `
    <div class="lf-imprime" id="lf-2051">
      ${impriméHeader('2051', 'Bilan — Passif', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation des postes</th>
            <th class="lf-val">Montant N</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="3">CAPITAUX PROPRES</td></tr>
          ${lr('CA', 'Capital social ou individuel',               cp.capital)}
          ${lr('CB', 'Primes d\'émission, de fusion…',             cp.primesEmission)}
          ${lr('CC', 'Écarts de réévaluation',                     0)}
          ${lr('CD', 'Réserve légale',                             cp.reserveLegale)}
          ${lr('CE', 'Réserves statutaires ou contractuelles',     0)}
          ${lr('CF', 'Réserves réglementées',                      0)}
          ${lr('CG', 'Autres réserves',                            cp.autresReserves)}
          ${lr('CH', 'Report à nouveau',                           cp.reportANouveau)}
          ${lr('DI', cp.resultat >= 0 ? 'Résultat de l\'exercice (bénéfice)' : 'Résultat de l\'exercice (perte)', cp.resultat)}
          ${lr('DJ', 'Subventions d\'investissement',              0)}
          ${lr('DK', 'Provisions réglementées',                    0)}
          ${lt('DL', 'TOTAL CAPITAUX PROPRES (I)',                 cp.total, null, null, 'lf-total')}

          <tr class="lf-section"><td colspan="3">PROVISIONS</td></tr>
          ${lr('DM', 'Provisions pour risques',                    pv.risques)}
          ${lr('DN', 'Provisions pour charges',                    pv.charges)}
          ${lt('DO', 'TOTAL PROVISIONS (II)',                      pv.total, null, null, 'lf-total')}

          <tr class="lf-section"><td colspan="3">DETTES</td></tr>
          ${lr('DP', 'Emprunts obligataires convertibles',         0)}
          ${lr('DQ', 'Autres emprunts obligataires',               0)}
          ${lr('DR', 'Emprunts et dettes auprès des établissements de crédit', dt.emprunts)}
          ${lr('DS', 'Emprunts et dettes financières divers',      0)}
          ${lr('DT', 'Avances et acomptes reçus sur commandes',    0)}
          ${lr('DU', 'Dettes fournisseurs et comptes rattachés',   dt.fournisseurs)}
          ${lr('DV', 'Dettes fiscales et sociales',                dt.fiscalesSociales)}
          ${lr('DW', 'Dettes sur immobilisations et comptes rat.', 0)}
          ${lr('DX', 'Autres dettes',                              dt.autresDettes)}
          ${lr('DY', 'Produits constatés d\'avance',               rg.produitsConstates)}
          ${lt('DZ', 'TOTAL DETTES (III)',                         dt.total, null, null, 'lf-total')}
          ${lt('EE', 'TOTAL GÉNÉRAL (I + II + III)',               p.total, null, null, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2052 — COMPTE DE RÉSULTAT (PRODUITS)
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2052
 */
function build2052(data) {
  const r  = data.resultat;
  const pe = r.produitsExploitation;

  return `
    <div class="lf-imprime" id="lf-2052">
      ${impriméHeader('2052', 'Compte de résultat — Produits', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation des postes</th>
            <th class="lf-val">Exercice N</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="3">PRODUITS D'EXPLOITATION</td></tr>
          ${lr('FA', 'Ventes de marchandises',                     data.meta.secteur === 'commerce'   ? pe.ca : 0)}
          ${lr('FB', 'Production vendue (biens)',                  data.meta.secteur === 'industrie'  ? pe.ca : 0)}
          ${lr('FC', 'Production vendue (services)',               data.meta.secteur === 'services'   ? pe.ca : 0)}
          ${lt('FD', 'Chiffre d\'affaires net',                    pe.ca, null, null, 'lf-subtotal')}
          ${lr('FE', 'Production stockée',                         pe.productionStockee)}
          ${lr('FF', 'Production immobilisée',                     0)}
          ${lr('FG', 'Subventions d\'exploitation',                pe.subventions)}
          ${lr('FH', 'Reprises sur amortissements, dépréciations', 0)}
          ${lr('FI', 'Autres produits',                            pe.autresProduits)}
          ${lt('FJ', 'TOTAL PRODUITS D\'EXPLOITATION (I)',         pe.total, null, null, 'lf-total')}

          <tr class="lf-section"><td colspan="3">PRODUITS FINANCIERS</td></tr>
          ${lr('GF', 'Produits financiers de participations',       0)}
          ${lr('GG', 'Produits des autres valeurs mob. et créances', r.produitsFinanciers)}
          ${lr('GH', 'Autres intérêts et produits assimilés',       0)}
          ${lr('GI', 'Reprises sur dépréciations, prov. financières', 0)}
          ${lr('GJ', 'Différences positives de change',             0)}
          ${lr('GK', 'Produits nets sur cessions de valeurs mob.',  0)}
          ${lt('GL', 'TOTAL PRODUITS FINANCIERS (II)',              r.produitsFinanciers, null, null, 'lf-total')}

          <tr class="lf-section"><td colspan="3">PRODUITS EXCEPTIONNELS</td></tr>
          ${lr('HA', 'Produits exceptionnels sur opérations de gestion', r.produitsExceptionnels)}
          ${lr('HB', 'Produits exceptionnels sur opérations en capital', 0)}
          ${lr('HC', 'Reprises sur dépréciations, prov. exception.',     0)}
          ${lt('HD', 'TOTAL PRODUITS EXCEPTIONNELS (III)',          r.produitsExceptionnels, null, null, 'lf-total')}
          ${lt('HJ', 'TOTAL GÉNÉRAL DES PRODUITS (I + II + III)',
                      pe.total + r.produitsFinanciers + r.produitsExceptionnels, null, null, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2053 — COMPTE DE RÉSULTAT (CHARGES)
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2053
 */
function build2053(data) {
  const r  = data.resultat;
  const ce = r.chargesExploitation;

  return `
    <div class="lf-imprime" id="lf-2053">
      ${impriméHeader('2053', 'Compte de résultat — Charges', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation des postes</th>
            <th class="lf-val">Exercice N</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="3">CHARGES D'EXPLOITATION</td></tr>
          ${lr('GA', 'Achats de marchandises',                     ce.achatsMarchandises)}
          ${lr('GB', 'Variation de stocks (marchandises)',         ce.variationStocks)}
          ${lr('GC', 'Achats de matières premières et approv.',    ce.achatsMatieres)}
          ${lr('GD', 'Variation de stocks (MP et approv.)',        0)}
          ${lr('GE', 'Autres achats et charges externes',          ce.autresAchats)}
          ${lr('GF', 'Impôts, taxes et versements assimilés',      ce.impotsTaxes)}
          ${lr('GG', 'Salaires et traitements',                    Math.round(ce.chargesPersonnel / 1.42))}
          ${lr('GH', 'Charges sociales',                           ce.chargesPersonnel - Math.round(ce.chargesPersonnel / 1.42))}
          ${lr('GI', 'Dotations aux amortissements — immos',       ce.dotationsAmort)}
          ${lr('GJ', 'Dotations aux dépréciations — actif circ.',  0)}
          ${lr('GK', 'Dotations aux provisions',                   0)}
          ${lr('GL', 'Autres charges',                             ce.autresCharges)}
          ${lt('GN', 'TOTAL CHARGES D\'EXPLOITATION (I)',          ce.total, null, null, 'lf-total')}
          ${lt('GP', 'RÉSULTAT D\'EXPLOITATION (I-II)',            r.resultatExploitation, null, null, 'lf-resultat')}

          <tr class="lf-section"><td colspan="3">CHARGES FINANCIÈRES</td></tr>
          ${lr('GQ', 'Dotations aux amortissements, dépréciations', 0)}
          ${lr('GR', 'Intérêts et charges assimilées',              r.chargesFinancieres)}
          ${lr('GS', 'Différences négatives de change',             0)}
          ${lr('GT', 'Charges nettes sur cessions de valeurs mob.', 0)}
          ${lt('GU', 'TOTAL CHARGES FINANCIÈRES (III)',             r.chargesFinancieres, null, null, 'lf-total')}
          ${lt('GV', 'RÉSULTAT FINANCIER (II-III)',                 r.resultatFinancier, null, null, 'lf-resultat')}
          ${lt('GW', 'RÉSULTAT COURANT AVANT IMPÔTS (I-II+III-IV)', r.resultatCourant, null, null, 'lf-resultat')}

          <tr class="lf-section"><td colspan="3">CHARGES EXCEPTIONNELLES</td></tr>
          ${lr('HE', 'Charges exceptionnelles sur opérations de gestion', r.chargesExceptionnelles)}
          ${lr('HF', 'Charges exceptionnelles sur opérations en capital',  0)}
          ${lr('HG', 'Dotations aux amortissements, dépréciations, prov.', 0)}
          ${lt('HH', 'TOTAL CHARGES EXCEPTIONNELLES (V)',           r.chargesExceptionnelles, null, null, 'lf-total')}
          ${lt('HI', 'RÉSULTAT EXCEPTIONNEL (IV-V)',                r.resultatExceptionnel, null, null, 'lf-resultat')}

          ${lr('HK', 'Participation des salariés aux résultats',    r.participation)}
          ${lr('HL', 'Impôts sur les bénéfices',                   r.impots)}
          ${lt('HM', 'TOTAL GÉNÉRAL DES CHARGES',
                      ce.total + r.chargesFinancieres + r.chargesExceptionnelles + r.participation + r.impots, null, null, 'lf-grandtotal')}
          ${lt('HN', r.resultatNet >= 0 ? 'BÉNÉFICE' : 'PERTE',   Math.abs(r.resultatNet), null, null, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2054 — IMMOBILISATIONS
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2054
 */
function build2054(data) {
  const ii   = data.bilan.actif.immobilise.incorporel;
  const ic   = data.bilan.actif.immobilise.corporel;
  const ifin = data.bilan.actif.immobilise.financier;
  const immo = data.bilan.actif.immobilise;

  // Valeur début d'exercice = brut fin − acquisitions simulées (~10–30% des immos)
  function debutExo(brut) {
    return Math.round(brut * 0.85);
  }

  return `
    <div class="lf-imprime" id="lf-2054">
      ${impriméHeader('2054', 'Tableau des immobilisations', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation</th>
            <th class="lf-val">Début exercice</th>
            <th class="lf-val">Acquisitions</th>
            <th class="lf-val">Diminutions</th>
            <th class="lf-val">Fin d'exercice</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="6">IMMOBILISATIONS INCORPORELLES</td></tr>
          ${buildLigneImmo('AA', 'Frais d\'établissement',          ii.fraisEtablissement.brut)}
          ${buildLigneImmo('AB', 'Frais de R&D',                    ii.fraisRD.brut)}
          ${buildLigneImmo('AC', 'Concessions, brevets, licences',  ii.brevets.brut)}
          ${buildLigneImmo('AD', 'Fonds commercial',                ii.fondsCommercial.brut)}
          ${buildLigneImmo('AE', 'Autres immos incorporelles',      ii.autresIncorporel.brut)}
          ${lt('AF', 'TOTAL INCORPOREL',                            debutExo(immo.incorporel.total.brut),
                      immo.incorporel.total.brut - debutExo(immo.incorporel.total.brut),
                      0, 'lf-subtotal')}

          <tr class="lf-section"><td colspan="6">IMMOBILISATIONS CORPORELLES</td></tr>
          ${buildLigneImmo('AG', 'Terrains',                        ic.terrains.brut)}
          ${buildLigneImmo('AH', 'Constructions',                   ic.constructions.brut)}
          ${buildLigneImmo('AI', 'Installations techn., mat., out.',ic.installations.brut)}
          ${buildLigneImmo('AJ', 'Autres immos corporelles',        ic.autresCorporel.brut)}
          ${lt('AK', 'TOTAL CORPOREL',                              debutExo(immo.corporel.total.brut),
                      immo.corporel.total.brut - debutExo(immo.corporel.total.brut),
                      0, 'lf-subtotal')}

          <tr class="lf-section"><td colspan="6">IMMOBILISATIONS FINANCIÈRES</td></tr>
          ${buildLigneImmo('AM', 'Participations',                  ifin.participations.brut)}
          ${buildLigneImmo('AR', 'Autres immos financières',        ifin.autresFinancier.brut)}
          ${lt('AS', 'TOTAL GÉNÉRAL',                               debutExo(immo.total.brut),
                      immo.total.brut - debutExo(immo.total.brut),
                      0, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

/** Ligne immobilisation avec calcul début/acq/dim/fin */
function buildLigneImmo(code, libelle, brut) {
  if (brut === 0) return lr(code, libelle, 0, 0, 0);
  const debut = Math.round(brut * 0.85);
  const acq   = brut - debut;
  return `<tr>
    <td class="lf-code">${code}</td>
    <td class="lf-lib">${libelle}</td>
    <td class="lf-val">${c(debut)}</td>
    <td class="lf-val">${c(acq)}</td>
    <td class="lf-val"></td>
    <td class="lf-val">${c(brut)}</td>
  </tr>`;
}

// ============================================================
// 2055 — AMORTISSEMENTS
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2055
 */
function build2055(data) {
  const ii   = data.bilan.actif.immobilise.incorporel;
  const ic   = data.bilan.actif.immobilise.corporel;
  const immo = data.bilan.actif.immobilise;

  function buildLigneAmort(code, libelle, amort) {
    if (amort === 0) return lr(code, libelle, 0, 0, 0);
    const debut = Math.round(amort * 0.7);
    const dot   = amort - debut;
    return `<tr>
      <td class="lf-code">${code}</td>
      <td class="lf-lib">${libelle}</td>
      <td class="lf-val">${c(debut)}</td>
      <td class="lf-val">${c(dot)}</td>
      <td class="lf-val"></td>
      <td class="lf-val">${c(amort)}</td>
    </tr>`;
  }

  return `
    <div class="lf-imprime" id="lf-2055">
      ${impriméHeader('2055', 'Tableau des amortissements', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation</th>
            <th class="lf-val">Début exercice</th>
            <th class="lf-val">Dotations</th>
            <th class="lf-val">Diminutions</th>
            <th class="lf-val">Fin d'exercice</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="6">AMORTISSEMENTS INCORPORELS</td></tr>
          ${buildLigneAmort('AA', 'Frais d\'établissement',          ii.fraisEtablissement.amort)}
          ${buildLigneAmort('AB', 'Frais de R&D',                    ii.fraisRD.amort)}
          ${buildLigneAmort('AC', 'Concessions, brevets, licences',  ii.brevets.amort)}
          ${buildLigneAmort('AD', 'Fonds commercial',                ii.fondsCommercial.amort)}
          ${buildLigneAmort('AE', 'Autres immos incorporelles',      ii.autresIncorporel.amort)}
          ${lt('AF', 'TOTAL INCORPOREL',
                      Math.round(immo.incorporel.total.amort * 0.7),
                      immo.incorporel.total.amort - Math.round(immo.incorporel.total.amort * 0.7),
                      0, 'lf-subtotal')}

          <tr class="lf-section"><td colspan="6">AMORTISSEMENTS CORPORELS</td></tr>
          ${buildLigneAmort('AH', 'Constructions',                   ic.constructions.amort)}
          ${buildLigneAmort('AI', 'Installations techn., mat., out.',ic.installations.amort)}
          ${buildLigneAmort('AJ', 'Autres immos corporelles',        ic.autresCorporel.amort)}
          ${lt('AK', 'TOTAL CORPOREL',
                      Math.round(immo.corporel.total.amort * 0.7),
                      immo.corporel.total.amort - Math.round(immo.corporel.total.amort * 0.7),
                      0, 'lf-subtotal')}
          ${lt('AS', 'TOTAL GÉNÉRAL',
                      Math.round(immo.total.amort * 0.7),
                      immo.total.amort - Math.round(immo.total.amort * 0.7),
                      0, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2056 — PROVISIONS
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2056
 */
function build2056(data) {
  const pv = data.bilan.passif.provisions;
  const total = pv.total;

  function buildLigneProv(code, libelle, montant) {
    if (montant === 0) return lr(code, libelle, 0, 0, 0);
    const debut = Math.round(montant * 0.6);
    const dot   = montant - debut;
    return `<tr>
      <td class="lf-code">${code}</td>
      <td class="lf-lib">${libelle}</td>
      <td class="lf-val">${c(debut)}</td>
      <td class="lf-val">${c(dot)}</td>
      <td class="lf-val"></td>
      <td class="lf-val">${c(montant)}</td>
    </tr>`;
  }

  return `
    <div class="lf-imprime" id="lf-2056">
      ${impriméHeader('2056', 'Tableau des provisions', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Nature des provisions</th>
            <th class="lf-val">Début exercice</th>
            <th class="lf-val">Dotations</th>
            <th class="lf-val">Reprises</th>
            <th class="lf-val">Fin d'exercice</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="6">PROVISIONS RÉGLEMENTÉES</td></tr>
          ${lr('AA', 'Provisions réglementées sur immos', 0, 0, 0, 0)}
          ${lr('AB', 'Provisions réglementées sur stocks', 0, 0, 0, 0)}
          ${lr('AC', 'Autres provisions réglementées',    0, 0, 0, 0)}
          <tr class="lf-section"><td colspan="6">PROVISIONS POUR RISQUES ET CHARGES</td></tr>
          ${buildLigneProv('AD', 'Provisions pour risques',          pv.risques)}
          ${buildLigneProv('AE', 'Provisions pour charges',          pv.charges)}
          ${lt('AF', 'TOTAL PROVISIONS POUR RISQUES ET CHARGES',
                      Math.round(total * 0.6),
                      total - Math.round(total * 0.6),
                      0, 'lf-total')}
          ${lt('AG', 'TOTAL GÉNÉRAL',
                      Math.round(total * 0.6),
                      total - Math.round(total * 0.6),
                      0, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2057 — CRÉANCES ET DETTES
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2057
 */
function build2057(data) {
  const cr = data.bilan.actif.circulant.creances;
  const dt = data.bilan.passif.dettes;

  // Ventilation échéances simulées : ~60% à moins d'un an, ~40% à plus d'un an
  function v1an(n) { return Math.round(n * 0.6); }
  function v2an(n) { return n - v1an(n); }

  return `
    <div class="lf-imprime" id="lf-2057">
      ${impriméHeader('2057', 'État des créances et dettes', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation</th>
            <th class="lf-val">Montant brut</th>
            <th class="lf-val">≤ 1 an</th>
            <th class="lf-val">&gt; 1 an</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="5">CRÉANCES</td></tr>
          ${buildLigneEch('AA', 'Clients et comptes rattachés',    cr.clients.net)}
          ${buildLigneEch('AB', 'Autres créances',                 cr.autresCreances.net)}
          ${lt('AC', 'TOTAL CRÉANCES',
                      cr.clients.net + cr.autresCreances.net,
                      v1an(cr.clients.net + cr.autresCreances.net),
                      v2an(cr.clients.net + cr.autresCreances.net), 'lf-total')}

          <tr class="lf-section"><td colspan="5">DETTES</td></tr>
          ${buildLigneEch('BA', 'Emprunts et dettes financières',  dt.emprunts)}
          ${buildLigneEch('BB', 'Dettes fournisseurs',             dt.fournisseurs)}
          ${buildLigneEch('BC', 'Dettes fiscales et sociales',     dt.fiscalesSociales)}
          ${buildLigneEch('BD', 'Autres dettes',                   dt.autresDettes)}
          ${lt('BE', 'TOTAL DETTES',
                      dt.total,
                      v1an(dt.total),
                      v2an(dt.total), 'lf-total')}
        </tbody>
      </table>
    </div>
  `;
}

function buildLigneEch(code, libelle, montant) {
  const v1 = Math.round(montant * 0.6);
  const v2 = montant - v1;
  return `<tr>
    <td class="lf-code">${code}</td>
    <td class="lf-lib">${libelle}</td>
    <td class="lf-val">${c(montant)}</td>
    <td class="lf-val">${c(v1)}</td>
    <td class="lf-val">${c(v2)}</td>
  </tr>`;
}

// ============================================================
// 2058-A — DÉTERMINATION DU RÉSULTAT FISCAL
// ============================================================

/**
 * Calcule les réintégrations et déductions simulées.
 * @param {object} data   BilanData
 * @returns {{ reintegrations: number, deductions: number, resultatFiscal: number, isRecalcule: number }}
 */
function calcFiscal(data) {
  const r  = data.resultat;
  const ce = r.chargesExploitation;

  // Réintégrations simulées sur autresAchats (charges non déductibles typiques)
  const tReinteg = TAUX_REINTEGRATION_MIN + Math.random() * (TAUX_REINTEGRATION_MAX - TAUX_REINTEGRATION_MIN);
  const reintegrations = Math.round(ce.autresAchats * tReinteg);

  // Déductions (régimes de faveur export) si hasInternational
  let deductions = 0;
  if (data.meta.hasInternational) {
    const tDed = TAUX_DEDUCTION_MIN + Math.random() * (TAUX_DEDUCTION_MAX - TAUX_DEDUCTION_MIN);
    deductions = Math.round(r.produitsExploitation.ca * tDed);
  }

  const resultatFiscal = r.resultatNet + reintegrations - deductions;

  let isRecalcule = 0;
  if (resultatFiscal > 0) {
    isRecalcule = resultatFiscal <= TAUX.SEUIL_IS_REDUIT
      ? Math.round(resultatFiscal * TAUX.IS_PME_REDUIT)
      : Math.round(TAUX.SEUIL_IS_REDUIT * TAUX.IS_PME_REDUIT + (resultatFiscal - TAUX.SEUIL_IS_REDUIT) * TAUX.IS_NORMAL);
  }

  return { reintegrations, deductions, resultatFiscal, isRecalcule };
}

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2058-A
 */
function build2058A(data) {
  const r  = data.resultat;
  const { reintegrations, deductions, resultatFiscal, isRecalcule } = calcFiscal(data);

  return `
    <div class="lf-imprime" id="lf-2058A">
      ${impriméHeader('2058-A', 'Détermination du résultat fiscal', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation</th>
            <th class="lf-val">Montant</th>
          </tr>
        </thead>
        <tbody>
          ${lr('XA', 'Résultat comptable avant impôt',                     r.resultatCourant + r.resultatExceptionnel)}
          <tr class="lf-section"><td colspan="3">RÉINTÉGRATIONS</td></tr>
          ${lr('XB', 'Charges non déductibles fiscalement (dont amendes)', reintegrations)}
          ${lr('XC', 'Autres réintégrations',                              0)}
          ${lt('XD', 'Total réintégrations',                               reintegrations, null, null, 'lf-subtotal')}
          <tr class="lf-section"><td colspan="3">DÉDUCTIONS</td></tr>
          ${lr('XE', 'Produits non imposables / régimes de faveur',        deductions)}
          ${lr('XF', 'Autres déductions',                                  0)}
          ${lt('XG', 'Total déductions',                                   deductions, null, null, 'lf-subtotal')}
          ${lt('XH', resultatFiscal >= 0 ? 'BÉNÉFICE FISCAL (I)' : 'DÉFICIT FISCAL (II)',
                      Math.abs(resultatFiscal), null, null, 'lf-resultat')}
          ${lr('XI', 'Déficits antérieurs imputés',                        0)}
          ${lt('XJ', resultatFiscal >= 0 ? 'BASE IMPOSABLE' : 'DÉFICIT REPORTABLE',
                      Math.abs(resultatFiscal), null, null, 'lf-resultat')}
          ${lt('XK', 'IS dû (15% / 25%, seuil 42 500 €)',                 isRecalcule, null, null, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2058-B — DÉFICITS REPORTABLES
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2058-B
 */
function build2058B(data) {
  const { resultatFiscal } = calcFiscal(data);

  // Seulement pertinent si déficitaire — on l'affiche toujours mais les lignes sont vides si bénéfice
  const deficit = resultatFiscal < 0 ? Math.abs(resultatFiscal) : 0;

  return `
    <div class="lf-imprime" id="lf-2058B">
      ${impriméHeader('2058-B', 'Tableau des déficits reportables', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Exercice d'origine</th>
            <th class="lf-val">Montant initial</th>
            <th class="lf-val">Imputations antérieures</th>
            <th class="lf-val">Imputable N</th>
          </tr>
        </thead>
        <tbody>
          ${deficit > 0
            ? `<tr>
                <td class="lf-code">XA</td>
                <td class="lf-lib">N (exercice courant)</td>
                <td class="lf-val">${c(deficit)}</td>
                <td class="lf-val"></td>
                <td class="lf-val">${c(deficit)}</td>
               </tr>`
            : `<tr><td colspan="5" class="lf-empty">Aucun déficit à reporter sur cet exercice</td></tr>`
          }
          ${lt('XZ', 'TOTAL', deficit, 0, deficit, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2058-C — AFFECTATION DU RÉSULTAT
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2058-C
 */
function build2058C(data) {
  const cp = data.bilan.passif.capitauxPropres;
  const rn = cp.resultat;

  // Affectation simulée
  const reserveLegale  = cp.reserveLegale;
  const autresReserves = rn > 0 ? Math.round(rn * 0.10) : 0;
  const reportANouveau = rn > 0
    ? Math.max(0, rn - reserveLegale - autresReserves)
    : rn; // perte → report à nouveau débiteur

  return `
    <div class="lf-imprime" id="lf-2058C">
      ${impriméHeader('2058-C', 'Affectation du résultat', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation</th>
            <th class="lf-val">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr class="lf-section"><td colspan="3">ORIGINE</td></tr>
          ${lr('AA', 'Résultat de l\'exercice',     rn)}
          ${lr('AB', 'Report à nouveau antérieur',  cp.reportANouveau)}
          ${lt('AC', 'Total à affecter',            rn + Math.max(0, cp.reportANouveau), null, null, 'lf-subtotal')}

          <tr class="lf-section"><td colspan="3">AFFECTATION</td></tr>
          ${lr('BA', 'Réserve légale',              reserveLegale)}
          ${lr('BB', 'Réserves statutaires',        0)}
          ${lr('BC', 'Autres réserves',             autresReserves)}
          ${lr('BD', 'Dividendes',                  0)}
          ${lr('BE', 'Report à nouveau',            reportANouveau)}
          ${lt('BF', 'Total affecté',               reserveLegale + autresReserves + Math.max(0, reportANouveau), null, null, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// 2059-A — VALEURS MOBILIÈRES DE PLACEMENT
// ============================================================

/**
 * @param {object} data  BilanData
 * @returns {string}     HTML imprimé 2059-A
 */
function build2059A(data) {
  const vmp = data.bilan.actif.circulant.disponibilites.vmp;

  // VMP simulée : valeur d'acquisition et valeur marché ≈ brut ± 5%
  const valAcq    = vmp.brut;
  const valMarche = Math.round(vmp.brut * (0.95 + Math.random() * 0.10));
  const pv        = Math.max(0, valMarche - valAcq);
  const mv        = Math.max(0, valAcq - valMarche);

  return `
    <div class="lf-imprime" id="lf-2059A">
      ${impriméHeader('2059-A', 'Valeurs mobilières de placement', data.meta)}
      <table class="lf-table">
        <thead>
          <tr>
            <th class="lf-code">Code</th>
            <th class="lf-lib">Désignation</th>
            <th class="lf-val">Val. acquisition</th>
            <th class="lf-val">Val. marché</th>
            <th class="lf-val">Plus-value latente</th>
            <th class="lf-val">Moins-value latente</th>
          </tr>
        </thead>
        <tbody>
          ${vmp.brut > 0
            ? `<tr>
                <td class="lf-code">AA</td>
                <td class="lf-lib">Valeurs mobilières de placement</td>
                <td class="lf-val">${c(valAcq)}</td>
                <td class="lf-val">${c(valMarche)}</td>
                <td class="lf-val">${c(pv)}</td>
                <td class="lf-val">${c(mv)}</td>
               </tr>`
            : `<tr><td colspan="6" class="lf-empty">Aucune valeur mobilière de placement</td></tr>`
          }
          ${lt('AZ', 'TOTAL',
                      valAcq, valMarche, null, 'lf-grandtotal')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// CSS LIASSE
// ============================================================

const LIASSE_CSS = `
  .lf-imprime { margin-bottom: 3rem; page-break-after: always; }
  .lf-imprime:last-child { page-break-after: auto; }

  .lf-imprime-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border: 2px solid var(--color-border, #333);
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    background: var(--color-surface-alt, #f8f8f8);
  }
  .lf-cerfa-num  { font-weight: 700; font-size: 0.85rem; display: block; }
  .lf-cerfa-titre{ font-size: 1rem; font-weight: 600; display: block; margin-top: 0.2rem; }
  .lf-imprime-header__right { text-align: right; font-size: 0.78rem; }
  .lf-societe    { font-weight: 600; }
  .lf-exercice   { color: var(--color-muted, #555); margin-top: 0.2rem; }
  .lf-mention    {
    font-size: 0.7rem;
    font-weight: 700;
    color: #c0392b;
    margin-top: 0.3rem;
    letter-spacing: 0.02em;
  }

  .lf-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
  }
  .lf-table th, .lf-table td {
    border: 1px solid var(--color-border, #ccc);
    padding: 0.22rem 0.5rem;
    vertical-align: middle;
  }
  .lf-table thead th {
    background: var(--color-surface-alt, #eee);
    font-weight: 700;
    text-align: center;
    font-size: 0.78rem;
  }

  .lf-code { width: 3.5rem; font-weight: 700; text-align: center; color: var(--color-primary, #1a5276); font-family: monospace; }
  .lf-lib  { width: auto; }
  .lf-val  { width: 8rem; text-align: right; font-variant-numeric: tabular-nums; }

  .lf-section td  { background: var(--color-primary, #1a5276); color: #fff; font-weight: 700; padding: 0.3rem 0.5rem; }
  .lf-section .lf-code { color: #fff; }
  .lf-subsection td { background: var(--color-surface-alt, #dde4ec); font-weight: 600; font-style: italic; padding: 0.2rem 0.5rem; }

  .lf-subtotal td  { background: var(--color-surface-alt, #f0f4f8); font-weight: 600; border-top: 1.5px solid var(--color-border, #999); }
  .lf-total td     { background: var(--color-surface-alt, #dde4ec); font-weight: 700; border-top: 2px solid var(--color-border, #666); }
  .lf-grandtotal td{ background: var(--color-primary-light, #d6eaf8); font-weight: 700; border-top: 2.5px double var(--color-primary, #1a5276); }
  .lf-resultat td  { background: #fef9e7; font-weight: 700; border-top: 2px solid #f39c12; }

  .lf-empty { text-align: center; color: var(--color-muted, #888); font-style: italic; padding: 0.8rem; }

  @media print {
    .lf-imprime { margin-bottom: 0; }
    .lf-table { font-size: 0.72rem; }
    .lf-mention { color: #c0392b !important; }
  }
`;

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

/**
 * Génère le HTML complet de la liasse fiscale.
 * @param {object} data    BilanData
 * @param {object} params  BilanParams (non utilisé actuellement, réservé)
 * @returns {string}       HTML pur
 */
export function buildLiasse(data, params) {
  return `
    <style>${LIASSE_CSS}</style>
    <div class="liasse-fiscale">
      ${build2050(data)}
      ${build2051(data)}
      ${build2052(data)}
      ${build2053(data)}
      ${build2054(data)}
      ${build2055(data)}
      ${build2056(data)}
      ${build2057(data)}
      ${build2058A(data)}
      ${build2058B(data)}
      ${build2058C(data)}
      ${build2059A(data)}
    </div>
  `;
}
