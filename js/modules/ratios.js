/**
 * ratios.js — Bilapp
 * -------------------------------------------------------
 * Calcul et rendu de l'analyse financière :
 *   - Fonds de Roulement (FR), BFR, Trésorerie Nette (TN)
 *   - Soldes Intermédiaires de Gestion (SIG) : VA, EBE, EBIT, RCAI
 *   - Capacité d'Autofinancement (CAF)
 *   - Ratios : ROE, ROA, marge nette, autonomie financière
 *
 * Exports :
 *   buildAnalyse(data, params)  — retourne le HTML de l'onglet Analyse
 *
 * RÈGLE : lecture seule — pas d'édition inline. Zéro calcul dans le HTML.
 */

'use strict';

import { fmt, fmtResultat } from '../utils/doc-helpers.js';

// ============================================================
// CALCULS
// ============================================================

/**
 * Calcule l'ensemble des indicateurs financiers à partir de BilanData.
 * @param {object} data   BilanData complet
 * @returns {object}      Indicateurs calculés
 */
function calculerIndicateurs(data) {
  const { bilan, resultat } = data;
  const { actif, passif }   = bilan;

  // ── Capitaux permanents = Capitaux propres + Provisions + Dettes LT (emprunts
  //    + comptes courants d'associés, assimilés à des ressources stables).
  const capitauxPermanents = passif.capitauxPropres.total
                           + passif.provisions.total
                           + passif.dettes.emprunts
                           + (passif.dettes.comptesCourantsAssocies || 0);

  const actifImmobiliseNet = actif.immobilise.total.net;

  // ── Fonds de Roulement
  const FR = capitauxPermanents - actifImmobiliseNet;

  // ── BFR = (Stocks + Créances d'exploitation) − Dettes d'exploitation
  const stocks             = actif.circulant.stocks.total.net;
  const creances           = actif.circulant.creances.total.net;
  const dettesExploitation = passif.dettes.fournisseurs
                           + passif.dettes.fiscalesSociales
                           + passif.dettes.autresDettes;
  const BFR = stocks + creances - dettesExploitation;

  // ── Trésorerie Nette
  const TN = FR - BFR;

  // ── SIG
  const ca                  = resultat.produitsExploitation.ca;
  const achatsMarchandises  = resultat.chargesExploitation.achatsMarchandises;
  const variationStocks     = resultat.chargesExploitation.variationStocks;
  const achatsMatieres      = resultat.chargesExploitation.achatsMatieres;
  const autresAchats        = resultat.chargesExploitation.autresAchats;
  const chargesPersonnel    = resultat.chargesExploitation.chargesPersonnel;
  const dotationsAmort      = resultat.chargesExploitation.dotationsAmort;
  const impotsTaxes         = resultat.chargesExploitation.impotsTaxes;

  // Marge commerciale (commerce) ou production (industrie/services)
  const margeCommerciale = ca - achatsMarchandises - variationStocks;

  // Valeur Ajoutée = Marge commerciale − Consommations intermédiaires
  const consommationsInterm = achatsMatieres + autresAchats;
  const VA = margeCommerciale - consommationsInterm;

  // EBE = VA − Charges de personnel − Impôts et taxes
  const EBE = VA - chargesPersonnel - impotsTaxes;

  // EBIT (résultat d'exploitation) = EBE − Dotations aux amortissements
  const EBIT = EBE - dotationsAmort;

  // RCAI = EBIT + Résultat financier
  const RCAI = EBIT + resultat.resultatFinancier;

  // ── CAF = Résultat net + Dotations − Reprises (on suppose reprises = 0)
  const CAF = resultat.resultatNet + dotationsAmort;

  // ── Ratios
  const totalActif     = actif.totalNet;
  const capitauxPropres = passif.capitauxPropres.total;
  const totalDettes    = passif.dettes.total + passif.provisions.total;

  // ROE = Résultat net / Capitaux propres (si CP > 0)
  const ROE = capitauxPropres > 0
    ? resultat.resultatNet / capitauxPropres
    : null;

  // ROA = Résultat net / Total actif
  const ROA = totalActif > 0
    ? resultat.resultatNet / totalActif
    : null;

  // Marge nette = Résultat net / CA
  const margeNette = ca > 0
    ? resultat.resultatNet / ca
    : null;

  // Autonomie financière = Capitaux propres / Total passif
  const autonomie = (capitauxPropres + totalDettes) > 0
    ? capitauxPropres / (capitauxPropres + totalDettes)
    : null;

  return {
    FR, BFR, TN,
    VA, EBE, EBIT, RCAI,
    CAF,
    ca,
    ROE, ROA, margeNette, autonomie,
    capitauxPermanents, actifImmobiliseNet,
    stocks, creances, dettesExploitation,
    chargesPersonnel, dotationsAmort,
    resultatNet: resultat.resultatNet,
  };
}

// ============================================================
// HELPERS DE RENDU
// ============================================================

/**
 * Formate un ratio en pourcentage avec 1 décimale.
 * null → '—'
 * @param {number|null} r
 * @returns {string}
 */
function fmtPct(r) {
  if (r === null || !isFinite(r)) return '—';
  return (r * 100).toFixed(1) + ' %';
}

/**
 * Retourne la classe CSS de couleur pour un indicateur (positif/négatif).
 * @param {number} n
 * @returns {string}
 */
function signCls(n) {
  if (n > 0) return 'is-positive';
  if (n < 0) return 'is-negative';
  return '';
}

/**
 * Construit une ligne de tableau indicateur simple (libellé + valeur €).
 * @param {string} libelle
 * @param {number} valeur
 * @param {boolean} isTotal
 * @returns {string}
 */
function rowIndicateur(libelle, valeur, isTotal = false) {
  const { text, cls } = fmtResultat(valeur);
  const trClass = isTotal ? 'row--subtotal' : '';
  return `
    <tr class="${trClass}">
      <td>${libelle}</td>
      <td class="${cls}">${text}</td>
    </tr>
  `;
}

/**
 * Construit une ligne de tableau ratio (libellé + % + interprétation).
 * @param {string}      libelle
 * @param {number|null} valeur
 * @param {string}      hint
 * @returns {string}
 */
function rowRatio(libelle, valeur, hint = '') {
  const pct = fmtPct(valeur);
  const cls = valeur !== null ? signCls(valeur) : '';
  return `
    <tr>
      <td>${libelle}</td>
      <td class="${cls}">${pct}</td>
      <td class="col--hint">${hint}</td>
    </tr>
  `;
}

// ============================================================
// RENDERER PRINCIPAL
// ============================================================

/**
 * Construit le HTML complet de l'onglet Analyse.
 * @param {object} data    BilanData complet
 * @param {object} params  BilanParams
 * @returns {string}       HTML
 */
export function buildAnalyse(data, params) {
  const ind = calculerIndicateurs(data);

  // ── Interprétations contextuelles
  const frHint  = ind.FR >= 0
    ? 'Les ressources stables financent intégralement l\'actif immobilisé.'
    : 'L\'actif immobilisé n\'est pas entièrement financé par des ressources stables.';
  const bfrHint = ind.BFR >= 0
    ? 'L\'entreprise a des besoins de financement du cycle d\'exploitation.'
    : 'Le cycle d\'exploitation génère des ressources nettes (BFR négatif favorable).';
  const tnHint  = ind.TN >= 0
    ? 'La trésorerie est positive : l\'entreprise dispose de liquidités.'
    : 'La trésorerie est négative : recours aux concours bancaires.';

  return `
    <div class="analyse-layout">

      <!-- BLOC 1 : FR / BFR / TN -->
      <div class="doc-section">
        <div class="doc-section__title">Équilibre financier</div>
        <table class="doc-table">
          <colgroup>
            <col style="width:55%"/>
            <col style="width:25%"/>
            <col style="width:20%"/>
          </colgroup>
          <thead><tr><th>Indicateur</th><th>Montant</th><th>Calcul</th></tr></thead>
          <tbody>
            <tr>
              <td>Capitaux permanents</td>
              <td>${fmt(ind.capitauxPermanents)}</td>
              <td class="col--hint">CP + Prov. + Emprunts + CC associés</td>
            </tr>
            <tr>
              <td>Actif immobilisé net</td>
              <td>${fmt(ind.actifImmobiliseNet)}</td>
              <td class="col--hint"></td>
            </tr>
            <tr class="row--subtotal">
              <td><strong>Fonds de Roulement (FR)</strong></td>
              <td class="${signCls(ind.FR)}">${fmt(ind.FR)}</td>
              <td class="col--hint">Cap. perm. − Actif immo.</td>
            </tr>
            <tr><td colspan="3" class="col--hint analyse-hint">${frHint}</td></tr>

            <tr>
              <td>Stocks + Créances d'exploitation</td>
              <td>${fmt(ind.stocks + ind.creances)}</td>
              <td class="col--hint"></td>
            </tr>
            <tr>
              <td>Dettes d'exploitation</td>
              <td>${fmt(ind.dettesExploitation)}</td>
              <td class="col--hint">Fourn. + Fisc./Soc. + Autres</td>
            </tr>
            <tr class="row--subtotal">
              <td><strong>Besoin en Fonds de Roulement (BFR)</strong></td>
              <td class="${signCls(ind.BFR)}">${fmt(ind.BFR)}</td>
              <td class="col--hint">Stocks + Créances − Dettes expl.</td>
            </tr>
            <tr><td colspan="3" class="col--hint analyse-hint">${bfrHint}</td></tr>

            <tr class="row--total">
              <td><strong>Trésorerie Nette (TN)</strong></td>
              <td class="${signCls(ind.TN)}">${fmt(ind.TN)}</td>
              <td class="col--hint">FR − BFR</td>
            </tr>
            <tr><td colspan="3" class="col--hint analyse-hint">${tnHint}</td></tr>
          </tbody>
        </table>
      </div>

      <!-- BLOC 2 : SIG -->
      <div class="doc-section">
        <div class="doc-section__title">Soldes Intermédiaires de Gestion (SIG)</div>
        <table class="doc-table">
          <colgroup>
            <col style="width:60%"/>
            <col style="width:40%"/>
          </colgroup>
          <thead><tr><th>Solde</th><th>Montant</th></tr></thead>
          <tbody>
            ${rowIndicateur('Chiffre d\'affaires (CA)',           ind.ca,             false)}
            ${rowIndicateur('Valeur Ajoutée (VA)',                ind.VA,             true)}
            ${rowIndicateur('Excédent Brut d\'Exploitation (EBE)',ind.EBE,            true)}
            ${rowIndicateur('Résultat d\'exploitation (EBIT)',    ind.EBIT,           true)}
            ${rowIndicateur('Résultat Courant Avant IS (RCAI)',   ind.RCAI,           true)}
            ${rowIndicateur('Résultat net',                       ind.resultatNet,    true)}
          </tbody>
        </table>
        <p class="analyse-note">
          VA = Marge commerciale − Consommations intermédiaires &nbsp;|&nbsp;
          EBE = VA − Charges de personnel − Impôts &nbsp;|&nbsp;
          EBIT = EBE − Dotations &nbsp;|&nbsp;
          RCAI = EBIT + Résultat financier
        </p>
      </div>

      <!-- BLOC 3 : CAF -->
      <div class="doc-section">
        <div class="doc-section__title">Capacité d'Autofinancement (CAF)</div>
        <table class="doc-table">
          <colgroup>
            <col style="width:60%"/>
            <col style="width:40%"/>
          </colgroup>
          <thead><tr><th>Élément</th><th>Montant</th></tr></thead>
          <tbody>
            ${rowIndicateur('Résultat net',          ind.resultatNet)}
            ${rowIndicateur('+ Dotations aux amort.', ind.dotationsAmort)}
            <tr class="row--total">
              <td><strong>CAF (méthode additive)</strong></td>
              <td class="${signCls(ind.CAF)}">${fmt(ind.CAF)}</td>
            </tr>
          </tbody>
        </table>
        <p class="analyse-note">
          Méthode additive simplifiée : CAF = Résultat net + Dotations aux amortissements.
          Les reprises sur provisions sont supposées nulles.
        </p>
      </div>

      <!-- BLOC 4 : Ratios -->
      <div class="doc-section">
        <div class="doc-section__title">Ratios de performance</div>
        <table class="doc-table">
          <colgroup>
            <col style="width:40%"/>
            <col style="width:20%"/>
            <col style="width:40%"/>
          </colgroup>
          <thead><tr><th>Ratio</th><th>Valeur</th><th>Interprétation</th></tr></thead>
          <tbody>
            ${rowRatio('ROE — Rentabilité des capitaux propres',
                ind.ROE,
                ind.ROE === null ? '—' : ind.ROE > 0.10 ? 'Bonne rentabilité actionnaires' : ind.ROE > 0 ? 'Rentabilité modeste' : 'Perte sur capitaux propres')}
            ${rowRatio('ROA — Rentabilité économique',
                ind.ROA,
                ind.ROA === null ? '—' : ind.ROA > 0.05 ? 'Bonne valorisation des actifs' : ind.ROA > 0 ? 'Valorisation limitée' : 'Actifs non rentables')}
            ${rowRatio('Marge nette',
                ind.margeNette,
                ind.margeNette === null ? '—' : ind.margeNette > 0.05 ? 'Marge satisfaisante' : ind.margeNette > 0 ? 'Marge étroite' : 'Marge négative')}
            ${rowRatio('Autonomie financière',
                ind.autonomie,
                ind.autonomie === null ? '—' : ind.autonomie > 0.50 ? 'Structure financière solide' : ind.autonomie > 0.33 ? 'Dépendance modérée' : 'Forte dépendance aux tiers')}
          </tbody>
        </table>
        <p class="analyse-note">
          ROE = Résultat net / Capitaux propres &nbsp;|&nbsp;
          ROA = Résultat net / Total actif &nbsp;|&nbsp;
          Autonomie = Capitaux propres / (CP + Dettes totales)
        </p>
      </div>

    </div>
  `;
}
