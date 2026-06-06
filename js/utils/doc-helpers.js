/**
 * doc-helpers.js — Bilapp
 * -------------------------------------------------------
 * Utilitaires partagés entre tous les renderers de documents.
 * Formatage des montants, construction de l'en-tête et des onglets.
 *
 * Importé par : bilan.js, resultat.js, annexe.js, liasse.js
 *
 * RÈGLE : zéro logique métier ici — uniquement du formatage et
 * de la construction HTML générique.
 */

'use strict';

// ============================================================
// FORMATAGE DES MONTANTS
// ============================================================

/**
 * Formate un montant en euros, style français.
 * Zéro → tiret (convention comptable).
 * @param {number} n
 * @returns {string}
 */
export function fmt(n) {
  if (n === 0) return '—';
  return n.toLocaleString('fr-FR') + ' €';
}

/**
 * Formate un montant et retourne la classe CSS de couleur associée.
 * Utilisé pour les résultats intermédiaires (positif/négatif).
 * @param {number} n
 * @returns {{ text: string, cls: string }}
 */
export function fmtResultat(n) {
  if (n === 0) return { text: '—', cls: '' };
  return {
    text: n.toLocaleString('fr-FR') + ' €',
    cls:  n > 0 ? 'is-positive' : 'is-negative',
  };
}

/**
 * Retourne 'is-zero' si la valeur est 0, '' sinon.
 * Permet d'atténuer visuellement les postes vides.
 * @param {number} n
 * @returns {string}
 */
export function zeroCls(n) {
  return n === 0 ? 'is-zero' : '';
}

// ============================================================
// EN-TÊTE DOCUMENT
// ============================================================

/**
 * Construit l'en-tête commun à tous les documents (identité + mention).
 * @param {object} meta   BilanData.meta
 * @param {string} titre  Titre du document affiché à droite
 * @returns {string}      HTML
 */
export function buildHeader(meta, titre) {
  return `
    <div class="doc-header">
      <div class="doc-header__left">
        <div class="doc-header__logo">Bilapp</div>
        <div class="doc-header__societe">${meta.societe}</div>
        <div class="doc-header__meta">
          <span class="doc-header__meta-item">
            <strong>${meta.formeJuridique}</strong>
          </span>
          <span class="doc-header__meta-item">
            Secteur : <strong>${meta.secteur}</strong>
          </span>
          <span class="doc-header__meta-item">
            TVA : <strong>${meta.regimeTVA.replace('_', ' ')}</strong>
          </span>
        </div>
      </div>
      <div class="doc-header__right">
        <div class="doc-header__title">${titre}</div>
        <div class="doc-header__exercice">
          Exercice clos le 31/12/${meta.anneeExercice}
        </div>
        <div class="doc-header__mention">${meta.mention}</div>
      </div>
    </div>
  `;
}

// ============================================================
// ONGLETS DE NAVIGATION
// ============================================================

/**
 * Construit les onglets de navigation entre documents.
 * @param {string} active   Onglet actif : 'bilan' | 'resultat' | 'annexe'
 * @param {object} output   BilanParams.output
 * @returns {string}        HTML
 */
export function buildTabs(active, output) {
  const tabs = [];
  if (output.bilan)          tabs.push({ id: 'bilan',    label: 'Bilan' });
  if (output.compteResultat) tabs.push({ id: 'resultat', label: 'Compte de résultat' });
  if (output.annexe)         tabs.push({ id: 'annexe',   label: 'Annexe' });

  return `
    <div class="doc-tabs" role="tablist">
      ${tabs.map(t => `
        <button
          class="doc-tab${active === t.id ? ' is-active' : ''}"
          data-tab="${t.id}"
          role="tab"
          aria-selected="${active === t.id}"
        >${t.label}</button>
      `).join('')}
    </div>
  `;
}
