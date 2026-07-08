/**
 * teledec.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML de la télédéclaration de la liasse fiscale.
 * Simule le dépôt EDI-TDFC via un partenaire EDI agréé (type Teledec.fr),
 * à des fins pédagogiques uniquement.
 *
 * Contexte métier :
 *   La liasse fiscale (imprimés 2050–2059) ne se dépose pas sur papier :
 *   elle est télétransmise à la DGFiP en mode EDI-TDFC (Échange de Données
 *   Informatisé — Transfert des Données Fiscales et Comptables) via un
 *   partenaire EDI agréé. Cet onglet reconstitue les étapes de ce dépôt :
 *   identification → contrôles de cohérence → transmission → accusé DGFiP.
 *
 * Exports :
 *   buildTeledec(data, params) → string HTML
 *
 * RÈGLES (identiques à liasse.js) :
 * - Lecture seule, zéro édition inline
 * - Mention "DOCUMENT FICTIF" visible
 * - Fonctions pures, zéro DOM direct
 * - Zéro magic number métier → constants.js
 */

'use strict';

import { TAUX, MENTION_FICTIF } from '../core/constants.js';
import { fmtDateFR }            from '../utils/doc-helpers.js';
import { calcFiscal }           from './liasse.js';

// ============================================================
// CONSTANTES TELEDEC
// ============================================================

/** Nom du partenaire EDI simulé (fictif). */
const PARTENAIRE_EDI = 'TELEDEC';

/** Mode de télétransmission des liasses fiscales. */
const MODE_TELEDEC = 'EDI-TDFC';

/** Formulaire de déclaration de résultat IS (régime réel normal). */
const FORMULAIRE_IS = '2065-SD';

// ============================================================
// UTILITAIRES
// ============================================================

/** @param {number} n @returns {string} Montant formaté « 1 234 € » ou « — ». */
function euro(n) {
  if (n == null || n === 0) return '—';
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

/**
 * Génère un numéro de dépôt déterministe à partir du SIRET et de l'année.
 * Déterministe = même société + même exercice → même numéro (pas de Math.random,
 * pour que l'accusé reste stable entre deux affichages de l'onglet).
 *
 * @param {object} meta  BilanData.meta
 * @returns {string}     ex. "TDFC-2024-8F3A21C7"
 */
function _numeroDepot(meta) {
  const base = `${meta.siret ?? ''}${meta.anneeExercice ?? ''}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0');
  return `TDFC-${meta.anneeExercice ?? '----'}-${hex}`;
}

/**
 * Formate un SIRET en blocs lisibles : XXX XXX XXX XXXXX.
 * @param {string} siret 14 chiffres
 * @returns {string}
 */
function _fmtSIRET(siret) {
  if (!siret || siret.length !== 14) return siret ?? '—';
  return `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9)}`;
}

/**
 * Construit la ligne « période / exercice » du dépôt.
 * @param {object} meta BilanData.meta
 * @returns {string}
 */
function _periodeLigne(meta) {
  if (meta.dateDebut && meta.dateFin) {
    return `${fmtDateFR(meta.dateDebut)} → ${fmtDateFR(meta.dateFin)}`;
  }
  return `Exercice clos le 31/12/${meta.anneeExercice ?? ''}`;
}

// ============================================================
// BLOC 1 — BANDEAU PARTENAIRE EDI
// ============================================================

function buildBandeau(meta) {
  return `
    <div class="td-bandeau">
      <div class="td-bandeau__brand">
        <span class="td-bandeau__logo">${PARTENAIRE_EDI}</span>
        <span class="td-bandeau__baseline">Partenaire EDI agréé — télédéclaration de la liasse fiscale</span>
      </div>
      <div class="td-bandeau__mode">
        <span class="td-bandeau__mode-label">Mode</span>
        <span class="td-bandeau__mode-value">${MODE_TELEDEC}</span>
      </div>
    </div>
    <div class="td-intro">
      La liasse fiscale ne se dépose pas au format papier : elle est télétransmise à la
      <strong>DGFiP</strong> en mode <strong>${MODE_TELEDEC}</strong> (Échange de Données Informatisé —
      Transfert des Données Fiscales et Comptables) via un partenaire EDI agréé.
      Cet écran reconstitue le dépôt de la déclaration de résultat de
      <strong>${meta.societe}</strong>.
    </div>
  `;
}

// ============================================================
// BLOC 2 — RÉCAPITULATIF DE LA DÉCLARATION
// ============================================================

function buildRecap(meta) {
  const lignes = [
    ['Déclarant',          meta.societe],
    ['Forme juridique',    meta.formeJuridique],
    ['SIRET',              _fmtSIRET(meta.siret)],
    ['Régime fiscal',      'Réel normal — impôt sur les sociétés (IS)'],
    ['Déclaration',        `${FORMULAIRE_IS} + liasse 2050 à 2059`],
    ['Régime de TVA',      (meta.regimeTVA ?? '—').replace('_', ' ')],
    ['Période déclarée',   _periodeLigne(meta)],
    ['Partenaire EDI',     `${PARTENAIRE_EDI} (agréé DGFiP)`],
  ];

  return `
    <div class="td-card">
      <div class="td-card__title">1 · Récapitulatif de la déclaration</div>
      <table class="td-recap">
        <tbody>
          ${lignes.map(([k, v]) => `
            <tr><td class="td-recap__key">${k}</td><td class="td-recap__val">${v ?? '—'}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// BLOC 3 — CONTRÔLES DE COHÉRENCE (pré-transmission)
// ============================================================

/**
 * Reconstitue les contrôles de cohérence appliqués par le partenaire EDI
 * avant transmission. Chaque contrôle est PASS/FAIL selon les données réelles.
 *
 * @param {object} data BilanData
 * @returns {{ controles: Array<{label,ok,detail}>, toutOk: boolean }}
 */
function _controles(data) {
  const actifNet   = data.bilan.actif.totalNet;
  const passifTot  = data.bilan.passif.total;
  const ecartBilan = Math.abs(actifNet - passifTot);

  const resCR    = data.resultat.resultatNet;
  const resBilan = data.bilan.passif.capitauxPropres.resultat;
  const ecartRes = Math.abs(resCR - resBilan);

  const controles = [
    {
      label:  'Équilibre du bilan (Actif = Passif)',
      ok:     ecartBilan === 0,
      detail: ecartBilan === 0
        ? `${euro(actifNet)} = ${euro(passifTot)}`
        : `écart de ${euro(ecartBilan)}`,
    },
    {
      label:  'Cohérence résultat — compte de résultat / bilan',
      ok:     ecartRes === 0,
      detail: ecartRes === 0
        ? `Résultat net ${euro(resCR)} reporté au passif`
        : `écart de ${euro(ecartRes)}`,
    },
    {
      label:  'Chiffre d\'affaires renseigné',
      ok:     data.resultat.produitsExploitation.ca > 0,
      detail: euro(data.resultat.produitsExploitation.ca),
    },
    {
      label:  'Identifiant SIRET valide (14 chiffres)',
      ok:     !!data.meta.siret && data.meta.siret.length === 14,
      detail: _fmtSIRET(data.meta.siret),
    },
    {
      label:  'Période d\'exercice renseignée',
      ok:     !!data.meta.dateFin,
      detail: _periodeLigne(data.meta),
    },
  ];

  return { controles, toutOk: controles.every(c => c.ok) };
}

function buildControles(data) {
  const { controles, toutOk } = _controles(data);

  return `
    <div class="td-card">
      <div class="td-card__title">2 · Contrôles de cohérence EDI</div>
      <ul class="td-checks">
        ${controles.map(c => `
          <li class="td-check ${c.ok ? 'is-ok' : 'is-ko'}">
            <span class="td-check__icon">${c.ok ? '✓' : '✕'}</span>
            <span class="td-check__label">${c.label}</span>
            <span class="td-check__detail">${c.detail}</span>
          </li>
        `).join('')}
      </ul>
      <div class="td-checks__verdict ${toutOk ? 'is-ok' : 'is-ko'}">
        ${toutOk
          ? '✓ Tous les contrôles sont passés — la déclaration peut être transmise.'
          : '✕ Anomalies détectées — la DGFiP rejetterait ce dépôt. Corrigez le bilan avant transmission.'}
      </div>
    </div>
  `;
}

// ============================================================
// BLOC 4 — DONNÉES FISCALES TRANSMISES
// ============================================================

function buildDonnees(data) {
  const r = data.resultat;
  const { resultatFiscal, isRecalcule } = calcFiscal(data);
  const resComptable = r.resultatCourant + r.resultatExceptionnel;

  const lignes = [
    ['Chiffre d\'affaires net',            euro(r.produitsExploitation.ca)],
    ['Résultat comptable avant impôt',     euro(resComptable)],
    ['Résultat fiscal',                    euro(resultatFiscal)],
    [`Impôt sur les sociétés dû (15 % / 25 %, seuil ${TAUX.SEUIL_IS_REDUIT.toLocaleString('fr-FR')} €)`, euro(isRecalcule)],
    ['Résultat net comptable',             euro(r.resultatNet)],
    ['Total du bilan',                     euro(data.bilan.actif.totalNet)],
  ];

  return `
    <div class="td-card">
      <div class="td-card__title">3 · Données fiscales transmises (télé-données)</div>
      <table class="td-donnees">
        <tbody>
          ${lignes.map(([k, v]) => `
            <tr><td class="td-donnees__key">${k}</td><td class="td-donnees__val">${v}</td></tr>
          `).join('')}
        </tbody>
      </table>
      <div class="td-donnees__note">
        Ces montants sont extraits automatiquement de la liasse fiscale et constituent
        le « message TDFC » transmis à la DGFiP.
      </div>
    </div>
  `;
}

// ============================================================
// BLOC 5 — WORKFLOW DE TRANSMISSION
// ============================================================

function buildWorkflow(toutOk) {
  const etapes = [
    { n: 1, label: 'Saisie de la liasse',      etat: 'done' },
    { n: 2, label: 'Contrôles de cohérence',   etat: toutOk ? 'done' : 'error' },
    { n: 3, label: 'Transmission EDI-TDFC',    etat: toutOk ? 'done' : 'pending' },
    { n: 4, label: 'Accusé DGFiP',             etat: toutOk ? 'done' : 'pending' },
  ];

  return `
    <div class="td-card">
      <div class="td-card__title">4 · Circuit de télétransmission</div>
      <ol class="td-steps">
        ${etapes.map(e => `
          <li class="td-step is-${e.etat}">
            <span class="td-step__bubble">${e.etat === 'error' ? '!' : e.n}</span>
            <span class="td-step__label">${e.label}</span>
          </li>
        `).join('')}
      </ol>
      <div class="td-steps__legend">
        Déclarant → Partenaire EDI (${PARTENAIRE_EDI}) → DGFiP. Le partenaire agréé signe et
        horodate le dépôt, puis relaie l'accusé de réception de l'administration.
      </div>
    </div>
  `;
}

// ============================================================
// BLOC 6 — ACCUSÉ DE DÉPÔT DGFiP
// ============================================================

function buildAccuse(data, toutOk) {
  const meta = data.meta;

  if (!toutOk) {
    return `
      <div class="td-accuse is-rejet">
        <div class="td-accuse__title">✕ Dépôt refusé</div>
        <div class="td-accuse__body">
          Les contrôles de cohérence ont échoué. La DGFiP n'accepte pas la liasse en l'état.
          Corrigez les anomalies signalées à l'étape 2, puis relancez le dépôt.
        </div>
      </div>
    `;
  }

  const numero = _numeroDepot(meta);
  const dateDepot = meta.dateFin ? fmtDateFR(meta.dateFin) : `31/12/${meta.anneeExercice ?? ''}`;

  return `
    <div class="td-accuse is-accepte">
      <div class="td-accuse__title">✓ Accusé de réception — dépôt accepté</div>
      <table class="td-accuse__table">
        <tbody>
          <tr><td>Statut</td><td><strong class="td-accuse__ok">ACCEPTÉ PAR LA DGFiP</strong></td></tr>
          <tr><td>N° de dépôt</td><td><strong>${numero}</strong></td></tr>
          <tr><td>Partenaire EDI</td><td>${PARTENAIRE_EDI} — ${MODE_TELEDEC}</td></tr>
          <tr><td>Déclarant</td><td>${meta.societe} — SIRET ${_fmtSIRET(meta.siret)}</td></tr>
          <tr><td>Exercice déclaré</td><td>${_periodeLigne(meta)}</td></tr>
          <tr><td>Référence horodatée</td><td>Clôture ${dateDepot}</td></tr>
        </tbody>
      </table>
      <div class="td-accuse__foot">
        Accusé simulé — aucune donnée n'a été transmise à une administration réelle.
      </div>
    </div>
  `;
}

// ============================================================
// CSS TELEDEC
// ============================================================

const TELEDEC_CSS = `
  .teledec { max-width: 60rem; margin: 0 auto; }

  .td-bandeau {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--color-primary, #1a5276); color: #fff;
    padding: 1rem 1.25rem; border-radius: 8px 8px 0 0;
  }
  .td-bandeau__logo {
    font-weight: 800; font-size: 1.35rem; letter-spacing: 0.08em; display: block;
  }
  .td-bandeau__baseline { font-size: 0.8rem; opacity: 0.85; }
  .td-bandeau__mode { text-align: right; }
  .td-bandeau__mode-label { display: block; font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; }
  .td-bandeau__mode-value { font-weight: 700; font-size: 1.05rem; font-family: monospace; }

  .td-intro {
    background: var(--color-surface-alt, #f0f4f8);
    border: 1px solid var(--color-border, #d5dde5);
    border-top: none;
    padding: 0.9rem 1.25rem; font-size: 0.85rem; line-height: 1.5;
    border-radius: 0 0 8px 8px; margin-bottom: 1.5rem;
    color: var(--color-text, #333);
  }

  .td-card {
    border: 1px solid var(--color-border, #d5dde5);
    border-radius: 8px; margin-bottom: 1.25rem; overflow: hidden;
    background: var(--color-surface, #fff);
  }
  .td-card__title {
    background: var(--color-surface-alt, #dde4ec);
    font-weight: 700; font-size: 0.9rem;
    padding: 0.6rem 1rem; border-bottom: 1px solid var(--color-border, #d5dde5);
  }

  .td-recap, .td-donnees { width: 100%; border-collapse: collapse; }
  .td-recap td, .td-donnees td {
    padding: 0.5rem 1rem; border-bottom: 1px solid var(--color-border, #eef1f5);
    font-size: 0.85rem;
  }
  .td-recap tr:last-child td, .td-donnees tr:last-child td { border-bottom: none; }
  .td-recap__key, .td-donnees__key { color: var(--color-muted, #666); width: 45%; }
  .td-recap__val { font-weight: 600; }
  .td-donnees__val { font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
  .td-donnees__note {
    padding: 0.6rem 1rem; font-size: 0.75rem; color: var(--color-muted, #777);
    font-style: italic; background: var(--color-surface-alt, #f7f9fb);
  }

  .td-checks { list-style: none; margin: 0; padding: 0.5rem 0; }
  .td-check {
    display: grid; grid-template-columns: 1.5rem 1fr auto; align-items: center; gap: 0.6rem;
    padding: 0.4rem 1rem; font-size: 0.83rem;
  }
  .td-check__icon { font-weight: 800; text-align: center; }
  .td-check.is-ok  .td-check__icon { color: #1e8449; }
  .td-check.is-ko  .td-check__icon { color: #c0392b; }
  .td-check__detail { color: var(--color-muted, #777); font-size: 0.78rem; font-variant-numeric: tabular-nums; }
  .td-checks__verdict {
    padding: 0.6rem 1rem; font-size: 0.83rem; font-weight: 600; border-top: 1px solid var(--color-border, #eef1f5);
  }
  .td-checks__verdict.is-ok { background: #eafaf1; color: #1e8449; }
  .td-checks__verdict.is-ko { background: #fdedec; color: #c0392b; }

  .td-steps {
    list-style: none; margin: 0; padding: 1rem; display: flex; gap: 0.5rem;
    flex-wrap: wrap; justify-content: space-between;
  }
  .td-step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; flex: 1; min-width: 6rem; text-align: center; }
  .td-step__bubble {
    width: 2.2rem; height: 2.2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-weight: 700; border: 2px solid var(--color-border, #ccc); color: var(--color-muted, #999);
  }
  .td-step__label { font-size: 0.75rem; color: var(--color-muted, #777); }
  .td-step.is-done .td-step__bubble { background: #1e8449; border-color: #1e8449; color: #fff; }
  .td-step.is-done .td-step__label { color: var(--color-text, #333); }
  .td-step.is-error .td-step__bubble { background: #c0392b; border-color: #c0392b; color: #fff; }
  .td-step.is-error .td-step__label { color: #c0392b; }
  .td-steps__legend { padding: 0 1rem 0.9rem; font-size: 0.75rem; color: var(--color-muted, #777); font-style: italic; }

  .td-accuse { border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; border: 2px solid; }
  .td-accuse.is-accepte { border-color: #1e8449; background: #eafaf1; }
  .td-accuse.is-rejet   { border-color: #c0392b; background: #fdedec; }
  .td-accuse__title { font-weight: 800; font-size: 1.05rem; margin-bottom: 0.75rem; }
  .td-accuse.is-accepte .td-accuse__title { color: #1e8449; }
  .td-accuse.is-rejet   .td-accuse__title { color: #c0392b; }
  .td-accuse__table { width: 100%; border-collapse: collapse; }
  .td-accuse__table td { padding: 0.4rem 0.5rem; font-size: 0.85rem; border-bottom: 1px solid rgba(0,0,0,0.06); }
  .td-accuse__table td:first-child { color: var(--color-muted, #555); width: 35%; }
  .td-accuse__ok { color: #1e8449; letter-spacing: 0.03em; }
  .td-accuse__body { font-size: 0.88rem; line-height: 1.5; }
  .td-accuse__foot { margin-top: 0.75rem; font-size: 0.75rem; font-style: italic; color: var(--color-muted, #777); }

  .td-mention {
    text-align: center; font-size: 0.75rem; font-weight: 700; color: #c0392b;
    letter-spacing: 0.02em; margin-top: 1rem;
  }

  @media print {
    .td-bandeau { background: var(--color-primary, #1a5276) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .td-card { break-inside: avoid; }
  }
`;

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

/**
 * Génère le HTML complet de l'écran de télédéclaration.
 * @param {object} data    BilanData
 * @param {object} params  BilanParams (réservé, non utilisé)
 * @returns {string}       HTML pur
 */
export function buildTeledec(data, params) {
  const { toutOk } = _controles(data);

  return `
    <style>${TELEDEC_CSS}</style>
    <div class="teledec">
      ${buildBandeau(data.meta)}
      ${buildRecap(data.meta)}
      ${buildControles(data)}
      ${buildDonnees(data)}
      ${buildWorkflow(toutOk)}
      ${buildAccuse(data, toutOk)}
      <div class="td-mention">${MENTION_FICTIF}</div>
    </div>
  `;
}
