/**
 * bilan.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML du bilan comptable (actif + passif).
 * Orchestre la navigation par onglets et l'édition inline.
 *
 * Exports :
 *   renderDocuments(data, params) — point d'entrée principal
 */

'use strict';
import { buildLiasse }                                    from './liasse.js';
import { fmt, zeroCls, buildHeader, buildTabs, hintIcon } from '../utils/doc-helpers.js';
import { buildResultat }                                  from './resultat.js';
import { buildAnnexe }                                    from './annexe.js';
import { buildAnalyse }                                   from './ratios.js';
import { buildTeledec }                                   from './teledec.js';
import { setOverride, isLocked, getOverrides, clearOverrides, countOverrides } from '../core/overrides.js';
import { reconcile }                                      from '../core/reconcile.js';
import { exportDocument }                                 from '../export/pdf.js';
import { saveSession, loadSession }                       from '../export/session.js';
import { generate }                                       from '../core/engine.js';
import { TAUX }                                           from '../core/constants.js';
import { initTooltips, destroyTooltips }                  from '../utils/tooltip.js';

// ============================================================
// ÉTAT DU MODULE
// ============================================================

let _currentData   = null;
let _currentParams = null;
let _currentTab    = 'bilan';
let _dataN1Figee   = null;

// ============================================================
// UTILITAIRES ÉDITION
// ============================================================

function parseInput(str) {
  const clean = str.replace(/\s/g, '').replace('€', '').replace(',', '.').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? null : Math.round(n);
}

function activerEdition(td, path, valeur, onCommit) {
  if (td.querySelector('.cell-input')) return;
  const original = td.textContent.trim();
  const input    = document.createElement('input');
  input.type      = 'text';
  input.className = 'cell-input';
  input.value     = valeur === 0 ? '' : String(valeur);
  input.setAttribute('aria-label', `Modifier ${path}`);
  td.textContent = '';
  td.appendChild(input);
  input.focus();
  input.select();
  function commit() {
    const parsed = parseInput(input.value);
    if (parsed !== null && parsed !== valeur) { onCommit(path, parsed); }
    else { td.textContent = original; }
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

function rowActif(libelle, p, basePath, n1Net = null, indent = true, hintKey = '') {
  const brutPath  = basePath + '.brut';
  const amortPath = basePath + '.amort';
  const netPath   = basePath + '.net';
  const lockedBrut  = isLocked(brutPath);
  const lockedAmort = isLocked(amortPath);
  const hasLock     = lockedBrut || lockedAmort || isLocked(netPath);
  const n1Cell = n1Net !== null ? `<td class="col--n1 ${zeroCls(n1Net)}">${fmt(n1Net)}</td>` : '';
  return `
    <tr class="${hasLock ? 'has-lock' : ''}">
      <td style="${indent ? 'padding-left:2rem' : ''}">${libelle}${hintIcon(hintKey)}</td>
      <td class="is-editable ${lockedBrut  ? 'is-locked' : ''} ${zeroCls(p.brut)}"
          data-path="${brutPath}"  data-value="${p.brut}">${fmt(p.brut)}</td>
      <td class="is-editable ${lockedAmort ? 'is-locked' : ''} ${zeroCls(p.amort)}"
          data-path="${amortPath}" data-value="${p.amort}">${fmt(p.amort)}</td>
      <td class="${zeroCls(p.net)}" data-path="${netPath}">${fmt(p.net)}</td>
      ${n1Cell}
    </tr>
  `;
}

function rowActifSubtotal(libelle, p, n1Net = null) {
  const n1Cell = n1Net !== null ? `<td class="col--n1">${fmt(n1Net)}</td>` : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td>${fmt(p.brut)}</td><td>${fmt(p.amort)}</td><td>${fmt(p.net)}</td>
      ${n1Cell}
    </tr>
  `;
}

// ============================================================
// ACTIF — TABLEAU COMPLET
// ============================================================

function buildActif(bilan, n1) {
  const a    = bilan.actif;
  const an1  = n1?.bilan?.actif ?? null;
  const hasN1 = an1 !== null;
  const cols  = hasN1 ? 5 : 4;
  const thN1  = hasN1 ? `<th class="col-width--n1">N-1 Net</th>` : '';
  const n1v   = (fn) => hasN1 ? fn(an1) : null;
  const b     = 'bilan.actif';

  return `
    <div class="doc-section">
      <div class="doc-section__title">Actif</div>
      <table class="doc-table">
        <colgroup>
          <col class="col-width--libelle"/>
          <col class="col-width--brut"/>
          <col class="col-width--amort"/>
          <col class="col-width--net"/>
          ${hasN1 ? '<col class="col-width--n1"/>' : ''}
        </colgroup>
        <thead><tr><th></th><th>Brut</th><th>Amort / Dép.</th><th>Net</th>${thN1}</tr></thead>
        <tbody>
          <tr class="row--section"><td colspan="${cols}">Actif immobilisé</td></tr>
          <tr class="row--subsection"><td colspan="${cols}">Immobilisations incorporelles</td></tr>
          ${rowActif('Frais d\'établissement',     a.immobilise.incorporel.fraisEtablissement, `${b}.immobilise.incorporel.fraisEtablissement`, n1v(x=>x.immobilise.incorporel.fraisEtablissement.net), true, 'fraisEtablissement')}
          ${rowActif('Frais de R&D',               a.immobilise.incorporel.fraisRD,            `${b}.immobilise.incorporel.fraisRD`,            n1v(x=>x.immobilise.incorporel.fraisRD.net),            true, 'fraisRD')}
          ${rowActif('Brevets, licences, marques', a.immobilise.incorporel.brevets,            `${b}.immobilise.incorporel.brevets`,            n1v(x=>x.immobilise.incorporel.brevets.net),            true, 'brevets')}
          ${rowActif('Fonds commercial',           a.immobilise.incorporel.fondsCommercial,    `${b}.immobilise.incorporel.fondsCommercial`,    n1v(x=>x.immobilise.incorporel.fondsCommercial.net),    true, 'fondsCommercial')}
          ${rowActif('Autres immos incorporelles', a.immobilise.incorporel.autresIncorporel,   `${b}.immobilise.incorporel.autresIncorporel`,   n1v(x=>x.immobilise.incorporel.autresIncorporel.net),   true, 'autresIncorporel')}
          ${rowActifSubtotal('Total incorporel',   a.immobilise.incorporel.total,              n1v(x=>x.immobilise.incorporel.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations corporelles</td></tr>
          ${rowActif('Terrains',                 a.immobilise.corporel.terrains,       `${b}.immobilise.corporel.terrains`,       n1v(x=>x.immobilise.corporel.terrains.net),       true, 'terrains')}
          ${rowActif('Constructions',            a.immobilise.corporel.constructions,  `${b}.immobilise.corporel.constructions`,  n1v(x=>x.immobilise.corporel.constructions.net),  true, 'constructions')}
          ${rowActif('Installations techniques', a.immobilise.corporel.installations,  `${b}.immobilise.corporel.installations`,  n1v(x=>x.immobilise.corporel.installations.net),  true, 'installations')}
          ${rowActif('Autres immos corporelles', a.immobilise.corporel.autresCorporel, `${b}.immobilise.corporel.autresCorporel`, n1v(x=>x.immobilise.corporel.autresCorporel.net), true, 'autresCorporel')}
          ${rowActifSubtotal('Total corporel',   a.immobilise.corporel.total,          n1v(x=>x.immobilise.corporel.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations financières</td></tr>
          ${rowActif('Participations',           a.immobilise.financier.participations, `${b}.immobilise.financier.participations`, n1v(x=>x.immobilise.financier.participations.net), true, 'participations')}
          ${rowActif('Autres immos financières', a.immobilise.financier.autresFinancier,`${b}.immobilise.financier.autresFinancier`,n1v(x=>x.immobilise.financier.autresFinancier.net), true, 'autresFinancier')}
          ${rowActifSubtotal('Total financier',  a.immobilise.financier.total,          n1v(x=>x.immobilise.financier.total.net))}
          ${rowActifSubtotal('TOTAL ACTIF IMMOBILISÉ', a.immobilise.total,              n1v(x=>x.immobilise.total.net))}

          <tr class="row--section"><td colspan="${cols}">Actif circulant</td></tr>
          <tr class="row--subsection"><td colspan="${cols}">Stocks et en-cours</td></tr>
          ${rowActif('Matières premières',     a.circulant.stocks.matieresPremières, `${b}.circulant.stocks.matieresPremières`, n1v(x=>x.circulant.stocks.matieresPremières.net), true, 'matieresPremières')}
          ${rowActif('En-cours de production', a.circulant.stocks.enCours,           `${b}.circulant.stocks.enCours`,           n1v(x=>x.circulant.stocks.enCours.net),           true, 'enCours')}
          ${rowActif('Produits finis',         a.circulant.stocks.produitsFinis,     `${b}.circulant.stocks.produitsFinis`,     n1v(x=>x.circulant.stocks.produitsFinis.net),     true, 'produitsFinis')}
          ${rowActif('Marchandises',           a.circulant.stocks.marchandises,      `${b}.circulant.stocks.marchandises`,      n1v(x=>x.circulant.stocks.marchandises.net),      true, 'marchandises')}
          ${rowActifSubtotal('Total stocks',   a.circulant.stocks.total,             n1v(x=>x.circulant.stocks.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Créances</td></tr>
          ${rowActif('Clients et comptes rattachés', a.circulant.creances.clients,        `${b}.circulant.creances.clients`,        n1v(x=>x.circulant.creances.clients.net),        true, 'clients')}
          ${rowActif('Autres créances',              a.circulant.creances.autresCreances, `${b}.circulant.creances.autresCreances`, n1v(x=>x.circulant.creances.autresCreances.net), true, 'autresCreances')}
          ${rowActifSubtotal('Total créances',       a.circulant.creances.total,          n1v(x=>x.circulant.creances.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Disponibilités</td></tr>
          ${rowActif('Valeurs mobilières de placement', a.circulant.disponibilites.vmp,          `${b}.circulant.disponibilites.vmp`,          n1v(x=>x.circulant.disponibilites.vmp.net),          true, 'vmp')}
          ${rowActif('Banques, caisses',                a.circulant.disponibilites.banqueCaisse, `${b}.circulant.disponibilites.banqueCaisse`, n1v(x=>x.circulant.disponibilites.banqueCaisse.net), true, 'banqueCaisse')}
          ${rowActifSubtotal('Total disponibilités',    a.circulant.disponibilites.total,        n1v(x=>x.circulant.disponibilites.total.net))}
          ${rowActifSubtotal('TOTAL ACTIF CIRCULANT',   a.circulant.total,                       n1v(x=>x.circulant.total.net))}

          <tr class="row--section"><td colspan="${cols}">Comptes de régularisation</td></tr>
          ${rowActif('Charges constatées d\'avance', a.regularisation.chargesConstatees, `${b}.regularisation.chargesConstatees`, n1v(x=>x.regularisation.chargesConstatees.net), false, 'chargesConstatees')}

          <tr class="row--total">
            <td>TOTAL ACTIF</td><td></td><td></td>
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

function rowPassif(libelle, montant, path, n1 = null, indent = true, hintKey = '') {
  const locked = isLocked(path);
  const n1Cell = n1 !== null ? `<td class="col--n1 ${zeroCls(n1)}">${fmt(n1)}</td>` : '';
  return `
    <tr class="${locked ? 'has-lock' : ''}">
      <td style="${indent ? 'padding-left:2rem' : ''}">${libelle}${hintIcon(hintKey)}</td>
      <td class="is-editable ${locked ? 'is-locked' : ''} ${zeroCls(montant)}"
          data-path="${path}" data-value="${montant}">${fmt(montant)}</td>
      ${n1Cell}
    </tr>
  `;
}

function rowPassifSubtotal(libelle, montant, n1 = null) {
  const n1Cell = n1 !== null ? `<td class="col--n1">${fmt(n1)}</td>` : '';
  return `<tr class="row--subtotal"><td>${libelle}</td><td>${fmt(montant)}</td>${n1Cell}</tr>`;
}

// ============================================================
// PASSIF — TABLEAU COMPLET
// ============================================================

function buildPassif(bilan, n1) {
  const p    = bilan.passif;
  const pn1  = n1?.bilan?.passif ?? null;
  const hasN1 = pn1 !== null;
  const cols  = hasN1 ? 3 : 2;
  const thN1  = hasN1 ? `<th class="col-width--n1">N-1</th>` : '';
  const n1v   = (fn) => hasN1 ? fn(pn1) : null;
  const b     = 'bilan.passif';

  return `
    <div class="doc-section">
      <div class="doc-section__title">Passif</div>
      <table class="doc-table">
        <colgroup>
          <col style="width:60%"/>
          <col style="width:${hasN1 ? '20%' : '40%'}"/>
          ${hasN1 ? '<col style="width:20%"/>' : ''}
        </colgroup>
        <thead><tr><th></th><th>Montant</th>${thN1}</tr></thead>
        <tbody>
          <tr class="row--section"><td colspan="${cols}">Capitaux propres</td></tr>
          ${rowPassif('Capital social',          p.capitauxPropres.capital,        `${b}.capitauxPropres.capital`,        n1v(x=>x.capitauxPropres.capital),        true, 'capital')}
          ${rowPassif('Primes d\'émission',      p.capitauxPropres.primesEmission, `${b}.capitauxPropres.primesEmission`, n1v(x=>x.capitauxPropres.primesEmission), true, 'primesEmission')}
          ${rowPassif('Réserve légale',          p.capitauxPropres.reserveLegale,  `${b}.capitauxPropres.reserveLegale`,  n1v(x=>x.capitauxPropres.reserveLegale),  true, 'reserveLegale')}
          ${rowPassif('Autres réserves',         p.capitauxPropres.autresReserves, `${b}.capitauxPropres.autresReserves`, n1v(x=>x.capitauxPropres.autresReserves), true, 'autresReserves')}
          ${rowPassif('Report à nouveau',        p.capitauxPropres.reportANouveau, `${b}.capitauxPropres.reportANouveau`, n1v(x=>x.capitauxPropres.reportANouveau), true, 'reportANouveau')}
          ${rowPassif('Résultat de l\'exercice', p.capitauxPropres.resultat,       `${b}.capitauxPropres.resultat`,       n1v(x=>x.capitauxPropres.resultat),       true, 'resultatExercice')}
          ${rowPassifSubtotal('TOTAL CAPITAUX PROPRES', p.capitauxPropres.total,   n1v(x=>x.capitauxPropres.total))}

          <tr class="row--section"><td colspan="${cols}">Provisions</td></tr>
          ${rowPassif('Provisions pour risques', p.provisions.risques, `${b}.provisions.risques`, n1v(x=>x.provisions.risques), true, 'provisionsRisques')}
          ${rowPassif('Provisions pour charges', p.provisions.charges, `${b}.provisions.charges`, n1v(x=>x.provisions.charges), true, 'provisionsCharges')}
          ${rowPassifSubtotal('TOTAL PROVISIONS', p.provisions.total,  n1v(x=>x.provisions.total))}

          <tr class="row--section"><td colspan="${cols}">Dettes</td></tr>
          ${rowPassif('Emprunts et dettes financières',    p.dettes.emprunts,         `${b}.dettes.emprunts`,         n1v(x=>x.dettes.emprunts),         true, 'emprunts')}
          ${rowPassif('Fournisseurs et comptes rattachés', p.dettes.fournisseurs,     `${b}.dettes.fournisseurs`,     n1v(x=>x.dettes.fournisseurs),     true, 'fournisseurs')}
          ${rowPassif('Dettes fiscales et sociales',       p.dettes.fiscalesSociales, `${b}.dettes.fiscalesSociales`, n1v(x=>x.dettes.fiscalesSociales), true, 'fiscalesSociales')}
          ${rowPassif('Autres dettes',                     p.dettes.autresDettes,     `${b}.dettes.autresDettes`,     n1v(x=>x.dettes.autresDettes),     true, 'autresDettes')}
          ${rowPassifSubtotal('TOTAL DETTES', p.dettes.total, n1v(x=>x.dettes.total))}

          <tr class="row--section"><td colspan="${cols}">Comptes de régularisation</td></tr>
          ${rowPassif('Produits constatés d\'avance', p.regularisation.produitsConstates, `${b}.regularisation.produitsConstates`, n1v(x=>x.regularisation.produitsConstates), false, 'produitsConstates')}

          <tr class="row--total">
            <td>TOTAL PASSIF</td><td>${fmt(p.total)}</td>
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

function bindEdition() {
  document.querySelectorAll('#docContent td.is-editable').forEach(td => {
    td.addEventListener('click', () => {
      const path   = td.dataset.path;
      const valeur = parseInt(td.dataset.value, 10) || 0;
      activerEdition(td, path, valeur, (p, newVal) => {
        setOverride(p, newVal);
        const { data, desequilibre } = reconcile(_currentData, getOverrides(), _currentParams);
        _currentData = data;
        renderTab(_currentTab, desequilibre);
      });
    });
  });
}

function updateLockCount() {
  const el = document.getElementById('lockCount');
  if (!el) return;
  const n = countOverrides();
  el.style.display = n > 0 ? '' : 'none';
  const badge = el.querySelector('.lock-count__badge');
  if (badge) badge.textContent = String(n);
}

// ============================================================
// BINDING BOUTONS SESSION
// ============================================================

function bindSessionButtons() {
  const btnSave   = document.getElementById('btnSaveSession');
  const btnLoad   = document.getElementById('btnLoadSession');
  const inputFile = document.getElementById('inputLoadSession');

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      saveSession(_currentData, _currentParams, getOverrides(), _dataN1Figee);
    });
  }

  if (btnLoad && inputFile) {
    btnLoad.addEventListener('click', () => inputFile.click());
    inputFile.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      inputFile.value = '';
      try {
        const payload = await loadSession(file);
        clearOverrides();
        for (const [path, val] of payload.overrides) setOverride(path, val);
        _currentData   = payload.data;
        _currentParams = payload.params;
        _dataN1Figee   = payload.dataN1Figee ?? null;
        const defaultTab = payload.params.output?.bilan ? 'bilan'
          : payload.params.output?.compteResultat ? 'resultat' : 'annexe';
        renderTab(defaultTab, 0);
      } catch (err) {
        console.error(err.message);
        alert(`Impossible de charger la session :\n${err.message}`);
      }
    });
  }
}

/**
 * Régénère les données N uniquement.
 * Préserve le N-1 figé si présent — generate() ne doit jamais le toucher.
 */
function bindRegenerer() {
  const btn = document.getElementById('btnRegenerer');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const freshData = generate(_currentParams);

    // Réinjecter le N-1 figé — generate() l'aurait écrasé si compareN1=true
    if (_dataN1Figee) {
      freshData.n1 = {
        meta:    { anneeExercice: _dataN1Figee.meta.anneeExercice, dateDebut: _dataN1Figee.meta.dateDebut, dateFin: _dataN1Figee.meta.dateFin, dureeExerciceMois: _dataN1Figee.meta.dureeExerciceMois },
        bilan:   _dataN1Figee.bilan,
        resultat: _dataN1Figee.resultat,
      };
    }

    const { data, desequilibre } = reconcile(freshData, getOverrides(), _currentParams);
    _currentData = data;
    renderTab(_currentTab, desequilibre);
  });
}

// ============================================================
// UTILITAIRE — CALCUL DATES ANNÉE SUIVANTE
// ============================================================

/**
 * Calcule les dates de l'exercice N+1.
 *
 * FIX timezone : new Date('YYYY-MM-DD') parse en UTC → décalage en heure locale.
 * On parse manuellement pour rester 100% local.
 *
 * FIX robustesse : fallback sur params.societe.dateFin si meta.dateFin absent.
 *
 * @param {object} meta     BilanData.meta
 * @param {object} [params] BilanParams — fallback dateFin
 * @returns {{ dateDebut, dateFin, dureeExerciceMois, anneeExercice }}
 */
function _calcDatesAnneeSuivante(meta, params = null) {
  const rawFin = meta.dateFin ?? params?.societe?.dateFin;

  // Parse 'YYYY-MM-DD' en date locale (évite le bug UTC)
  function parseLocal(iso) {
    if (!iso || typeof iso !== 'string') return null;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Formater une Date locale en 'YYYY-MM-DD' (évite toISOString qui repasse en UTC)
  function fmtISO(dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const finN = parseLocal(rawFin);
  if (!finN) {
    const annee = meta.anneeExercice ?? new Date().getFullYear();
    console.warn(`[Bilapp] _calcDatesAnneeSuivante : dateFin invalide (${rawFin}), fallback anneeExercice=${annee}`);
    return { dateDebut: `${annee + 1}-01-01`, dateFin: `${annee + 1}-12-31`, dureeExerciceMois: 12, anneeExercice: annee + 1 };
  }

  // Lendemain de la clôture N, tout en local
  const debutN1 = new Date(finN.getFullYear(), finN.getMonth(), finN.getDate() + 1);
  const anneeN1 = debutN1.getFullYear();
  const finN1   = new Date(anneeN1, 11, 31); // 31/12 local

  const msParMois     = 1000 * 60 * 60 * 24 * (365.25 / 12);
  const dureeExercice = Math.round(((finN1 - debutN1) / msParMois) * 100) / 100;

  return {
    dateDebut:         fmtISO(debutN1),
    dateFin:           fmtISO(finN1),
    dureeExerciceMois: dureeExercice,
    anneeExercice:     anneeN1,
  };
}

// ============================================================
// UTILITAIRE — AJUSTEMENT REPORT À NOUVEAU
// ============================================================

function _ajusterReportANouveau(dataN1, dataN2) {
  const resultatN = dataN1.resultat.resultatNet;
  const cp        = dataN2.bilan.passif.capitauxPropres;

  if (resultatN < 0) {
    cp.reportANouveau = Math.round(cp.reportANouveau + resultatN);
  } else if (resultatN > 0) {
    const plafond        = Math.round(dataN2.bilan.passif.capitauxPropres.capital * TAUX.RESERVE_LEGALE_PLAFOND);
    const dotation       = Math.min(Math.round(resultatN * TAUX.RESERVE_LEGALE_TAUX), Math.max(0, plafond - cp.reserveLegale));
    cp.reserveLegale     = Math.round(cp.reserveLegale + dotation);
    cp.reportANouveau    = Math.round(cp.reportANouveau + (resultatN - dotation));
  }

  cp.total = Math.round(cp.capital + cp.primesEmission + cp.reserveLegale + cp.autresReserves + cp.reportANouveau + cp.resultat);
  dataN2.bilan.passif.total = Math.round(cp.total + dataN2.bilan.passif.provisions.total + dataN2.bilan.passif.dettes.total + dataN2.bilan.passif.regularisation.total);
}

// ============================================================
// DIALOGUE ORIENTATION ANNÉE SUIVANTE
// ============================================================

function _showDialogueOrientation(dataN1Snap, onChoix) {
  document.getElementById('dialogueOrientation')?.remove();

  const resultatN   = dataN1Snap.resultat.resultatNet;
  const resultatFmt = Math.abs(resultatN).toLocaleString('fr-FR') + ' €';
  const resultatLabel = resultatN < 0
    ? `Déficit N : <strong class="is-negative">−${resultatFmt}</strong>`
    : resultatN > 0
      ? `Bénéfice N : <strong class="is-positive">${resultatFmt}</strong>`
      : `Résultat N : <strong>0 €</strong>`;

  const anneeN1Dates = _calcDatesAnneeSuivante(dataN1Snap.meta, _currentParams);
  const anneeLabel   = anneeN1Dates.dureeExerciceMois >= 11.5
    ? `Exercice ${anneeN1Dates.anneeExercice} (01/01 → 31/12)`
    : `Exercice ${anneeN1Dates.dateDebut} → ${anneeN1Dates.dateFin}`;

  const overlay = document.createElement('div');
  overlay.id        = 'dialogueOrientation';
  overlay.className = 'annee-dialog-overlay';
  overlay.innerHTML = `
    <div class="annee-dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitre">
      <div class="annee-dialog__header">
        <h2 class="annee-dialog__title" id="dialogTitre">📅 Générer l'année suivante</h2>
        <button class="annee-dialog__close" id="dialogClose" aria-label="Annuler">✕</button>
      </div>
      <div class="annee-dialog__body">
        <div class="annee-dialog__info">
          <div class="annee-dialog__info-row">${resultatLabel}</div>
          <div class="annee-dialog__info-row"><span>Prochain exercice :</span><strong>${anneeLabel}</strong></div>
          ${resultatN < 0 ? `<div class="annee-dialog__note">ℹ️ Le déficit sera reporté en <strong>report à nouveau débiteur</strong>.</div>`
            : resultatN > 0 ? `<div class="annee-dialog__note">ℹ️ Le bénéfice sera affecté : 5% réserve légale, solde en <strong>report à nouveau créditeur</strong>.</div>` : ''}
        </div>
        <p class="annee-dialog__question">Quel résultat pour l'exercice suivant ?</p>
        <div class="annee-dialog__orientations">
          <button class="annee-dialog__btn annee-dialog__btn--positif" data-orientation="positif">
            <span class="annee-dialog__btn-icon">📈</span>
            <span class="annee-dialog__btn-label">Bénéficiaire</span>
            <span class="annee-dialog__btn-hint">+3% à +12% du CA</span>
          </button>
          <button class="annee-dialog__btn annee-dialog__btn--neutre" data-orientation="neutre">
            <span class="annee-dialog__btn-icon">⚖️</span>
            <span class="annee-dialog__btn-label">À l'équilibre</span>
            <span class="annee-dialog__btn-hint">±0,5% du CA</span>
          </button>
          <button class="annee-dialog__btn annee-dialog__btn--negatif" data-orientation="negatif">
            <span class="annee-dialog__btn-icon">📉</span>
            <span class="annee-dialog__btn-label">Déficitaire</span>
            <span class="annee-dialog__btn-hint">−1% à −15% du CA</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#dialogClose').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelectorAll('.annee-dialog__btn').forEach(btn => {
    btn.addEventListener('click', () => { overlay.remove(); onChoix(btn.dataset.orientation); });
  });
  overlay.querySelector('.annee-dialog__btn--positif').focus();
}

// ============================================================
// BINDING BOUTON ANNÉE SUIVANTE
// ============================================================

function bindAnneeSuivante() {
  const btn = document.getElementById('btnAnneeSuivante');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const snapshot = JSON.parse(JSON.stringify(_currentData));

    _showDialogueOrientation(snapshot, (orientation) => {
      _dataN1Figee = snapshot;

      const datesN1 = _calcDatesAnneeSuivante(_dataN1Figee.meta, _currentParams);

      const newParams = JSON.parse(JSON.stringify(_currentParams));
      newParams.societe.dateDebut         = datesN1.dateDebut;
      newParams.societe.dateFin           = datesN1.dateFin;
      newParams.societe.dureeExerciceMois = datesN1.dureeExerciceMois;
      newParams.societe.anneeExercice     = datesN1.anneeExercice;
      newParams.finance.orientation       = orientation;
      newParams.output.compareN1          = true;

      // Ancre CA : le moteur utilisera le CA réel N comme base (±15%)
      // au lieu de tirer aléatoirement dans la fourchette de tranche
      newParams.societe.caBaseN = _dataN1Figee.resultat.produitsExploitation.ca;

      _currentParams = newParams;

      const freshData = generate(newParams);

      // Injecter le snapshot N-1 figé
      freshData.n1 = {
        meta:    { anneeExercice: _dataN1Figee.meta.anneeExercice, dateDebut: _dataN1Figee.meta.dateDebut, dateFin: _dataN1Figee.meta.dateFin, dureeExerciceMois: _dataN1Figee.meta.dureeExerciceMois },
        bilan:   _dataN1Figee.bilan,
        resultat: _dataN1Figee.resultat,
      };

      _ajusterReportANouveau(_dataN1Figee, freshData);

      clearOverrides();
      const { data, desequilibre } = reconcile(freshData, getOverrides(), newParams);
      _currentData = data;
      renderTab('bilan', desequilibre);
    });
  });
}

// ============================================================
// RENDER TAB
// ============================================================

function renderTab(tab, desequilibre = 0) {
  _currentTab = tab;
  const app   = document.getElementById('app');

  const titres = { bilan: 'Bilan comptable', resultat: 'Compte de résultat', annexe: 'Annexe comptable', liasse: 'Liasse fiscale', analyse: 'Analyse financière', teledec: 'Télédéclaration EDI-TDFC' };

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
  } else if (tab === 'annexe') {
    content = buildAnnexe(_currentData, _currentParams);
  } else if (tab === 'liasse') {
    content = buildLiasse(_currentData, _currentParams);
  } else if (tab === 'analyse') {
    content = buildAnalyse(_currentData, _currentParams);
  } else if (tab === 'teledec') {
    content = buildTeledec(_currentData, _currentParams);
  }

  const btnAnneeSuivanteHtml = !_dataN1Figee
    ? `<button class="btn btn--secondary btn--sm" id="btnAnneeSuivante" title="Générer l'exercice suivant avec ce bilan comme N-1">📅 Année suivante</button>`
    : `<span class="annee-suivante-badge" title="N-1 figé : exercice ${_dataN1Figee.meta.anneeExercice}">📅 N-1 figé : ${_dataN1Figee.meta.anneeExercice}</span>`;

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
          <button class="btn btn--secondary btn--sm" id="btnRegenerer">🔄 Régénérer</button>
          ${btnAnneeSuivanteHtml}
        </div>
        <div class="doc-actions__right">
          <span class="lock-count" id="lockCount" style="display:none">🔒 <span class="lock-count__badge">0</span> verrouillé(s)</span>
          <button class="btn btn--ghost btn--sm" id="btnSaveSession" title="Sauvegarder la session">💾 Sauvegarder</button>
          <button class="btn btn--ghost btn--sm" id="btnLoadSession" title="Charger une session">📂 Charger</button>
          <input type="file" id="inputLoadSession" accept=".json" style="display:none" aria-hidden="true">
          <button class="btn btn--ghost btn--sm" id="btnPrint">⎙ Imprimer</button>
        </div>
      </div>
      ${buildTabs(tab, _currentParams.output)}
      <div id="docContent">${content}</div>
    </div>
  `;

  updateLockCount();
  bindEdition();
  bindSessionButtons();
  bindRegenerer();
  bindAnneeSuivante();
  destroyTooltips();
  initTooltips();

  app.querySelectorAll('.doc-tab').forEach(btn => {
    btn.addEventListener('click', () => renderTab(btn.dataset.tab, desequilibre));
  });
  app.querySelector('#btnRetour')?.addEventListener('click', () => {
    clearOverrides(); _dataN1Figee = null; destroyTooltips(); window.location.reload();
  });
  app.querySelector('#btnPrint')?.addEventListener('click', () => exportDocument('#docContent'));
}

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

export function renderDocuments(data, params) {
  clearOverrides();
  _currentData   = data;
  _currentParams = params;
  _dataN1Figee   = null;
  renderTab(
    params.output.bilan          ? 'bilan'    :
    params.output.compteResultat ? 'resultat' :
    params.output.annexe         ? 'annexe'   :
    params.output.analyse        ? 'analyse'  :
    params.output.liasseFiscale  ? 'liasse'   : 'teledec',
    0
  );
}
