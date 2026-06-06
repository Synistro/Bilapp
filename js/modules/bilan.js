/**
 * bilan.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML du bilan comptable (actif + passif).
 * Orchestre la navigation par onglets et l'édition inline.
 *
 * Exports :
 *   renderDocuments(data, params) — point d'entrée principal
 *
 * RÈGLE : zéro calcul métier ici. Ce module transforme
 * BilanData en HTML et délègue la réconciliation à reconcile.js.
 */

'use strict';

import { fmt, zeroCls, buildHeader, buildTabs } from '../utils/doc-helpers.js';
import { buildResultat }                         from './resultat.js';
import { setOverride, removeOverride, isLocked, getOverrides, clearOverrides, countOverrides } from '../core/overrides.js';
import { reconcile }                             from '../core/reconcile.js';

// ============================================================
// ÉTAT DU MODULE
// ============================================================

/** Référence au BilanData courant (post-réconciliation) */
let _currentData   = null;
/** Référence aux BilanParams d'origine */
let _currentParams = null;
/** Onglet actif */
let _currentTab    = 'bilan';

// ============================================================
// UTILITAIRES ÉDITION
// ============================================================

/**
 * Parse une saisie utilisateur en entier €.
 * Accepte "1 234 €", "1234", "1234,56" → 1235
 * @param {string} str
 * @returns {number|null}  null si invalide
 */
function parseInput(str) {
  const clean = str.replace(/\s/g, '').replace('€', '').replace(',', '.').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? null : Math.round(n);
}

/**
 * Active l'édition inline sur une cellule.
 * Remplace le texte par un <input>, confirme sur Enter/blur.
 *
 * @param {HTMLElement} td       Cellule cible
 * @param {string}      path     Chemin dot-notation du poste
 * @param {number}      valeur   Valeur actuelle
 * @param {Function}    onCommit Callback(path, newValeur) appelé à la confirmation
 */
function activerEdition(td, path, valeur, onCommit) {
  if (td.querySelector('.cell-input')) return; // déjà en cours

  const original = td.textContent.trim();
  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'cell-input';
  // Pré-remplir avec le nombre brut (sans formatage) pour faciliter la saisie
  input.value     = valeur === 0 ? '' : String(valeur);
  input.setAttribute('aria-label', `Modifier ${path}`);

  td.textContent = '';
  td.appendChild(input);
  input.focus();
  input.select();

  function commit() {
    const parsed = parseInput(input.value);
    if (parsed !== null && parsed !== valeur) {
      onCommit(path, parsed);
    } else {
      // Annulation : restaure l'affichage sans modifier
      td.textContent = original;
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { td.textContent = original; }
  });

  input.addEventListener('blur', commit);
}

// ============================================================
// BANDEAU DÉSÉQUILIBRE
// ============================================================

/**
 * Construit le HTML du bandeau déséquilibre.
 * @param {number} ecart  Écart résiduel actif - passif
 * @returns {string}
 */
function buildDesequilibreBanner(ecart) {
  if (ecart === 0) return '';
  const signe  = ecart > 0 ? '+' : '';
  const absStr = Math.abs(ecart).toLocaleString('fr-FR') + ' €';
  return `
    <div class="desequilibre-banner" role="alert">
      <span class="desequilibre-banner__icon">⚠️</span>
      <span class="desequilibre-banner__text">
        <strong>Bilan déséquilibré</strong> — La trésorerie est verrouillée et ne peut pas absorber l'écart.
        Déverrouillez un poste ou ajustez manuellement pour rétablir l'équilibre.
      </span>
      <span class="desequilibre-banner__ecart">${signe}${absStr}</span>
    </div>
  `;
}

// ============================================================
// ACTIF — CONSTRUCTEURS DE LIGNES
// ============================================================

/**
 * Ligne de poste actif avec support édition inline.
 * Les colonnes brut et amort sont éditables ; net est calculé.
 *
 * @param {string}      libelle
 * @param {object}      p           { brut, amort, net }
 * @param {string}      basePath    Chemin dot-notation du poste (sans .brut/.amort/.net)
 * @param {number|null} n1Net
 * @param {boolean}     indent
 * @returns {string}
 */
function rowActif(libelle, p, basePath, n1Net = null, indent = true) {
  const brutPath  = basePath + '.brut';
  const amortPath = basePath + '.amort';
  const netPath   = basePath + '.net';

  const lockedBrut  = isLocked(brutPath);
  const lockedAmort = isLocked(amortPath);
  const lockedNet   = isLocked(netPath);
  const hasLock     = lockedBrut || lockedAmort || lockedNet;

  const n1Cell = n1Net !== null
    ? `<td class="col--n1 ${zeroCls(n1Net)}">${fmt(n1Net)}</td>`
    : '';

  return `
    <tr class="${hasLock ? 'has-lock' : ''}">
      <td style="${indent ? 'padding-left:2rem' : ''}">${libelle}</td>
      <td class="is-editable ${lockedBrut ? 'is-locked' : ''} ${zeroCls(p.brut)}"
          data-path="${brutPath}" data-value="${p.brut}">${fmt(p.brut)}</td>
      <td class="is-editable ${lockedAmort ? 'is-locked' : ''} ${zeroCls(p.amort)}"
          data-path="${amortPath}" data-value="${p.amort}">${fmt(p.amort)}</td>
      <td class="${zeroCls(p.net)}"
          data-path="${netPath}">${fmt(p.net)}</td>
      ${n1Cell}
    </tr>
  `;
}

/**
 * Ligne de sous-total actif (non éditable, recalculée).
 */
function rowActifSubtotal(libelle, p, n1Net = null) {
  const n1Cell = n1Net !== null
    ? `<td class="col--n1">${fmt(n1Net)}</td>`
    : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td>${fmt(p.brut)}</td>
      <td>${fmt(p.amort)}</td>
      <td>${fmt(p.net)}</td>
      ${n1Cell}
    </tr>
  `;
}

// ============================================================
// ACTIF — TABLEAU COMPLET
// ============================================================

function buildActif(bilan, n1) {
  const a     = bilan.actif;
  const an1   = n1?.bilan?.actif ?? null;
  const hasN1 = an1 !== null;
  const cols  = hasN1 ? 5 : 4;

  const thN1 = hasN1 ? `<th class="col-width--n1">N-1 Net</th>` : '';
  const n1v  = (fn) => hasN1 ? fn(an1) : null;

  // Chemin de base pour chaque poste
  const b = 'bilan.actif';

  return `
    <div class="doc-section">
      <div class="doc-section__title">Actif</div>
      <table class="doc-table">
        <colgroup>
          <col class="col-width--libelle" />
          <col class="col-width--brut" />
          <col class="col-width--amort" />
          <col class="col-width--net" />
          ${hasN1 ? '<col class="col-width--n1" />' : ''}
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Brut</th>
            <th>Amort / Dép.</th>
            <th>Net</th>
            ${thN1}
          </tr>
        </thead>
        <tbody>

          <tr class="row--section"><td colspan="${cols}">Actif immobilisé</td></tr>

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations incorporelles</td></tr>
          ${rowActif('Frais d\'établissement',     a.immobilise.incorporel.fraisEtablissement, `${b}.immobilise.incorporel.fraisEtablissement`, n1v(x => x.immobilise.incorporel.fraisEtablissement.net))}
          ${rowActif('Frais de R&D',               a.immobilise.incorporel.fraisRD,            `${b}.immobilise.incorporel.fraisRD`,            n1v(x => x.immobilise.incorporel.fraisRD.net))}
          ${rowActif('Brevets, licences, marques', a.immobilise.incorporel.brevets,            `${b}.immobilise.incorporel.brevets`,            n1v(x => x.immobilise.incorporel.brevets.net))}
          ${rowActif('Fonds commercial',           a.immobilise.incorporel.fondsCommercial,    `${b}.immobilise.incorporel.fondsCommercial`,    n1v(x => x.immobilise.incorporel.fondsCommercial.net))}
          ${rowActif('Autres immos incorporelles', a.immobilise.incorporel.autresIncorporel,   `${b}.immobilise.incorporel.autresIncorporel`,   n1v(x => x.immobilise.incorporel.autresIncorporel.net))}
          ${rowActifSubtotal('Total incorporel',   a.immobilise.incorporel.total,              n1v(x => x.immobilise.incorporel.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations corporelles</td></tr>
          ${rowActif('Terrains',                 a.immobilise.corporel.terrains,       `${b}.immobilise.corporel.terrains`,       n1v(x => x.immobilise.corporel.terrains.net))}
          ${rowActif('Constructions',            a.immobilise.corporel.constructions,  `${b}.immobilise.corporel.constructions`,  n1v(x => x.immobilise.corporel.constructions.net))}
          ${rowActif('Installations techniques', a.immobilise.corporel.installations,  `${b}.immobilise.corporel.installations`,  n1v(x => x.immobilise.corporel.installations.net))}
          ${rowActif('Autres immos corporelles', a.immobilise.corporel.autresCorporel, `${b}.immobilise.corporel.autresCorporel`, n1v(x => x.immobilise.corporel.autresCorporel.net))}
          ${rowActifSubtotal('Total corporel',   a.immobilise.corporel.total,          n1v(x => x.immobilise.corporel.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations financières</td></tr>
          ${rowActif('Participations',           a.immobilise.financier.participations, `${b}.immobilise.financier.participations`, n1v(x => x.immobilise.financier.participations.net))}
          ${rowActif('Autres immos financières', a.immobilise.financier.autresFinancier,`${b}.immobilise.financier.autresFinancier`,n1v(x => x.immobilise.financier.autresFinancier.net))}
          ${rowActifSubtotal('Total financier',  a.immobilise.financier.total,          n1v(x => x.immobilise.financier.total.net))}

          ${rowActifSubtotal('TOTAL ACTIF IMMOBILISÉ', a.immobilise.total, n1v(x => x.immobilise.total.net))}

          <tr class="row--section"><td colspan="${cols}">Actif circulant</td></tr>

          <tr class="row--subsection"><td colspan="${cols}">Stocks et en-cours</td></tr>
          ${rowActif('Matières premières',     a.circulant.stocks.matieresPremières, `${b}.circulant.stocks.matieresPremières`, n1v(x => x.circulant.stocks.matieresPremières.net))}
          ${rowActif('En-cours de production', a.circulant.stocks.enCours,           `${b}.circulant.stocks.enCours`,           n1v(x => x.circulant.stocks.enCours.net))}
          ${rowActif('Produits finis',         a.circulant.stocks.produitsFinis,     `${b}.circulant.stocks.produitsFinis`,     n1v(x => x.circulant.stocks.produitsFinis.net))}
          ${rowActif('Marchandises',           a.circulant.stocks.marchandises,      `${b}.circulant.stocks.marchandises`,      n1v(x => x.circulant.stocks.marchandises.net))}
          ${rowActifSubtotal('Total stocks',   a.circulant.stocks.total,             n1v(x => x.circulant.stocks.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Créances</td></tr>
          ${rowActif('Clients et comptes rattachés', a.circulant.creances.clients,        `${b}.circulant.creances.clients`,        n1v(x => x.circulant.creances.clients.net))}
          ${rowActif('Autres créances',              a.circulant.creances.autresCreances, `${b}.circulant.creances.autresCreances`, n1v(x => x.circulant.creances.autresCreances.net))}
          ${rowActifSubtotal('Total créances',       a.circulant.creances.total,          n1v(x => x.circulant.creances.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Disponibilités</td></tr>
          ${rowActif('Valeurs mobilières de placement', a.circulant.disponibilites.vmp,          `${b}.circulant.disponibilites.vmp`,          n1v(x => x.circulant.disponibilites.vmp.net))}
          ${rowActif('Banques, caisses',                a.circulant.disponibilites.banqueCaisse, `${b}.circulant.disponibilites.banqueCaisse`, n1v(x => x.circulant.disponibilites.banqueCaisse.net))}
          ${rowActifSubtotal('Total disponibilités',    a.circulant.disponibilites.total,        n1v(x => x.circulant.disponibilites.total.net))}

          ${rowActifSubtotal('TOTAL ACTIF CIRCULANT', a.circulant.total, n1v(x => x.circulant.total.net))}

          <tr class="row--section"><td colspan="${cols}">Comptes de régularisation</td></tr>
          ${rowActif('Charges constatées d\'avance', a.regularisation.chargesConstatees, `${b}.regularisation.chargesConstatees`, n1v(x => x.regularisation.chargesConstatees.net), false)}

          <tr class="row--total">
            <td>TOTAL ACTIF</td>
            <td></td>
            <td></td>
            <td>${fmt(a.totalNet)}</td>
            ${hasN1 ? `<td class="col--n1">${fmt(an1.totalNet)}</td>` : ''}
          </tr>

        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// PASSIF — CONSTRUCTEURS DE LIGNES
// ============================================================

/**
 * Ligne de poste passif avec support édition inline.
 * @param {string}      libelle
 * @param {number}      montant
 * @param {string}      path     Chemin dot-notation complet du poste
 * @param {number|null} n1
 * @param {boolean}     indent
 * @returns {string}
 */
function rowPassif(libelle, montant, path, n1 = null, indent = true) {
  const locked = isLocked(path);
  const n1Cell = n1 !== null
    ? `<td class="col--n1 ${zeroCls(n1)}">${fmt(n1)}</td>`
    : '';
  return `
    <tr class="${locked ? 'has-lock' : ''}">
      <td style="${indent ? 'padding-left:2rem' : ''}">${libelle}</td>
      <td class="is-editable ${locked ? 'is-locked' : ''} ${zeroCls(montant)}"
          data-path="${path}" data-value="${montant}">${fmt(montant)}</td>
      ${n1Cell}
    </tr>
  `;
}

function rowPassifSubtotal(libelle, montant, n1 = null) {
  const n1Cell = n1 !== null ? `<td class="col--n1">${fmt(n1)}</td>` : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td>${fmt(montant)}</td>
      ${n1Cell}
    </tr>
  `;
}

// ============================================================
// PASSIF — TABLEAU COMPLET
// ============================================================

function buildPassif(bilan, n1) {
  const p     = bilan.passif;
  const pn1   = n1?.bilan?.passif ?? null;
  const hasN1 = pn1 !== null;
  const cols  = hasN1 ? 3 : 2;

  const thN1 = hasN1 ? `<th class="col-width--n1">N-1</th>` : '';
  const n1v  = (fn) => hasN1 ? fn(pn1) : null;

  const b = 'bilan.passif';

  return `
    <div class="doc-section">
      <div class="doc-section__title">Passif</div>
      <table class="doc-table">
        <colgroup>
          <col style="width:60%" />
          <col style="width:${hasN1 ? '20%' : '40%'}" />
          ${hasN1 ? '<col style="width:20%" />' : ''}
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Montant</th>
            ${thN1}
          </tr>
        </thead>
        <tbody>

          <tr class="row--section"><td colspan="${cols}">Capitaux propres</td></tr>
          ${rowPassif('Capital social',          p.capitauxPropres.capital,        `${b}.capitauxPropres.capital`,        n1v(x => x.capitauxPropres.capital))}
          ${rowPassif('Primes d\'émission',      p.capitauxPropres.primesEmission, `${b}.capitauxPropres.primesEmission`, n1v(x => x.capitauxPropres.primesEmission))}
          ${rowPassif('Réserve légale',          p.capitauxPropres.reserveLegale,  `${b}.capitauxPropres.reserveLegale`,  n1v(x => x.capitauxPropres.reserveLegale))}
          ${rowPassif('Autres réserves',         p.capitauxPropres.autresReserves, `${b}.capitauxPropres.autresReserves`, n1v(x => x.capitauxPropres.autresReserves))}
          ${rowPassif('Report à nouveau',        p.capitauxPropres.reportANouveau, `${b}.capitauxPropres.reportANouveau`, n1v(x => x.capitauxPropres.reportANouveau))}
          ${rowPassif('Résultat de l\'exercice', p.capitauxPropres.resultat,       `${b}.capitauxPropres.resultat`,       n1v(x => x.capitauxPropres.resultat))}
          ${rowPassifSubtotal('TOTAL CAPITAUX PROPRES', p.capitauxPropres.total,   n1v(x => x.capitauxPropres.total))}

          <tr class="row--section"><td colspan="${cols}">Provisions</td></tr>
          ${rowPassif('Provisions pour risques', p.provisions.risques, `${b}.provisions.risques`, n1v(x => x.provisions.risques))}
          ${rowPassif('Provisions pour charges', p.provisions.charges, `${b}.provisions.charges`, n1v(x => x.provisions.charges))}
          ${rowPassifSubtotal('TOTAL PROVISIONS', p.provisions.total,  n1v(x => x.provisions.total))}

          <tr class="row--section"><td colspan="${cols}">Dettes</td></tr>
          ${rowPassif('Emprunts et dettes financières',    p.dettes.emprunts,         `${b}.dettes.emprunts`,         n1v(x => x.dettes.emprunts))}
          ${rowPassif('Fournisseurs et comptes rattachés', p.dettes.fournisseurs,     `${b}.dettes.fournisseurs`,     n1v(x => x.dettes.fournisseurs))}
          ${rowPassif('Dettes fiscales et sociales',       p.dettes.fiscalesSociales, `${b}.dettes.fiscalesSociales`, n1v(x => x.dettes.fiscalesSociales))}
          ${rowPassif('Autres dettes',                     p.dettes.autresDettes,     `${b}.dettes.autresDettes`,     n1v(x => x.dettes.autresDettes))}
          ${rowPassifSubtotal('TOTAL DETTES', p.dettes.total, n1v(x => x.dettes.total))}

          <tr class="row--section"><td colspan="${cols}">Comptes de régularisation</td></tr>
          ${rowPassif('Produits constatés d\'avance', p.regularisation.produitsConstates, `${b}.regularisation.produitsConstates`, n1v(x => x.regularisation.produitsConstates), false)}

          <tr class="row--total">
            <td>TOTAL PASSIF</td>
            <td>${fmt(p.total)}</td>
            ${hasN1 ? `<td class="col--n1">${fmt(pn1.total)}</td>` : ''}
          </tr>

        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// BINDING ÉDITION INLINE
// ============================================================

/**
 * Attache les listeners de clic sur toutes les cellules éditables
 * du conteneur #docContent.
 * Au commit d'une valeur : enregistre l'override et re-render.
 */
function bindEdition() {
  document.querySelectorAll('#docContent td.is-editable').forEach(td => {
    td.addEventListener('click', () => {
      const path   = td.dataset.path;
      const valeur = parseInt(td.dataset.value, 10) || 0;

      activerEdition(td, path, valeur, (p, newVal) => {
        setOverride(p, newVal);
        const { data, desequilibre } = reconcile(_currentData, getOverrides());
        _currentData = data;
        renderTab(_currentTab, desequilibre);
      });
    });
  });
}

// ============================================================
// BARRE D'ACTIONS — COMPTEUR VERROUS
// ============================================================

/**
 * Met à jour le compteur de postes verrouillés dans la barre d'actions.
 */
function updateLockCount() {
  const el = document.getElementById('lockCount');
  if (!el) return;
  const n = countOverrides();
  el.style.display = n > 0 ? '' : 'none';
  const badge = el.querySelector('.lock-count__badge');
  if (badge) badge.textContent = String(n);
}

// ============================================================
// RENDER TAB
// ============================================================

/**
 * Render un onglet dans #app.
 * @param {string} tab          'bilan' | 'resultat'
 * @param {number} desequilibre Écart résiduel actif/passif (0 = OK)
 */
function renderTab(tab, desequilibre = 0) {
  _currentTab = tab;
  const app = document.getElementById('app');

  const titres = {
    bilan:    'Bilan comptable',
    resultat: 'Compte de résultat',
    annexe:   'Annexe comptable',
  };

  let content = '';
  if (tab === 'bilan') {
    content = `
      ${buildDesequilibreBanner(desequilibre)}
      <div class="bilan-layout">
        ${buildActif(_currentData.bilan, _currentData.n1)}
        ${buildPassif(_currentData.bilan, _currentData.n1)}
      </div>
    `;
  } else if (tab === 'resultat') {
    content = buildResultat(_currentData.resultat, _currentData.n1);
  }

  app.innerHTML = `
    <header class="app-header">
      <div class="container">
        <div class="app-header__logo">Bil<span>app</span></div>
        <div class="app-header__subtitle">Générateur de bilans comptables pédagogiques</div>
      </div>
    </header>
    <div class="doc-page">
      ${buildHeader(_currentData.meta, titres[tab] ?? tab)}
      <div class="doc-actions">
        <div class="doc-actions__left">
          <button class="btn btn--secondary btn--sm" id="btnRetour">← Nouveau bilan</button>
        </div>
        <div class="doc-actions__right">
          <span class="lock-count" id="lockCount" style="display:none">
            🔒 <span class="lock-count__badge">0</span> verrouillé(s)
          </span>
          <button class="btn btn--ghost btn--sm" id="btnPrint">⎙ Imprimer</button>
        </div>
      </div>
      ${buildTabs(tab, _currentParams.output)}
      <div id="docContent">${content}</div>
    </div>
  `;

  updateLockCount();
  bindEdition();

  app.querySelectorAll('.doc-tab').forEach(btn => {
    btn.addEventListener('click', () => renderTab(btn.dataset.tab, desequilibre));
  });

  app.querySelector('#btnRetour')?.addEventListener('click', () => {
    clearOverrides();
    window.location.reload();
  });

  app.querySelector('#btnPrint')?.addEventListener('click', () => {
    window.print();
  });
}

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

/**
 * Initialise et affiche les documents.
 * Réinitialise les overrides pour un nouveau bilan.
 *
 * @param {object} data    BilanData complet
 * @param {object} params  BilanParams
 */
export function renderDocuments(data, params) {
  clearOverrides();
  _currentData   = data;
  _currentParams = params;
  renderTab(params.output.bilan ? 'bilan' : 'resultat', 0);
}
