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

import { HINTS } from '../core/hints.js';

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
// HINTS / TOOLTIPS
// ============================================================

/**
 * Retourne un bouton icône hint si la clé existe dans HINTS, '' sinon.
 * Le texte du hint est porté par data-hint (lu par tooltip.js).
 *
 * Rendu exemple :
 *   <button class="hint-icon" data-hint="Ce que les clients doivent." aria-label="Aide : Clients" tabindex="-1">ⓘ</button>
 *
 * @param {string} key  Clé dans HINTS (ex. 'clients', 'ca')
 * @returns {string}    HTML ou ''
 */
export function hintIcon(key) {
  const text = HINTS[key];
  if (!text) return '';
  // Échappement minimal des guillemets pour l'attribut HTML
  const safe = text.replace(/"/g, '&quot;');
  return `<button class="hint-icon" data-hint="${safe}" aria-label="Aide" tabindex="-1">ⓘ</button>`;
}

// ============================================================
// FORMATAGE DES DATES
// ============================================================

/**
 * Formate une date ISO 'YYYY-MM-DD' en 'DD/MM/YYYY' pour l'affichage.
 * @param {string} iso
 * @returns {string}
 */
export function fmtDateFR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ============================================================
// EN-TÊTE DOCUMENT
// ============================================================

/**
 * Formate un SIRET en blocs lisibles : XXX XXX XXX XXXXX
 * @param {string} siret — 14 chiffres
 * @returns {string}
 */
function fmtSIRET(siret) {
  if (!siret || siret.length !== 14) return siret ?? '';
  return `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9)}`;
}

/**
 * Construit la ligne "Exercice" de l'en-tête selon le type d'exercice.
 *
 * Logique F54 :
 *   - Exercice standard (01/01 → 31/12)  : "Exercice clos le 31/12/YYYY"
 *   - Exercice décalé ou court            : "Exercice du JJ/MM/YYYY au JJ/MM/YYYY"
 *   - Court (< 11.5 mois)                 : badge "(exercice court — X mois)" ajouté
 *
 * @param {object} meta  BilanData.meta
 * @returns {string}     HTML de la ligne exercice
 */
function _buildExerciceLine(meta) {
  const dateDebut = meta.dateDebut;
  const dateFin   = meta.dateFin;
  const duree     = meta.dureeExerciceMois ?? 12;

  // Exercice standard : commence le 01/01
  const debutD    = dateDebut ? new Date(dateDebut) : null;
  const estDecale = debutD && (debutD.getMonth() !== 0 || debutD.getDate() !== 1);
  const estCourt  = duree < 11.5;

  if (!estDecale && !estCourt && dateFin) {
    // Cas nominal — affichage classique
    return `<div class="doc-header__exercice">Exercice clos le ${fmtDateFR(dateFin)}</div>`;
  }

  // Exercice décalé ou court — plage complète
  const badge = estCourt
    ? ` <span class="doc-header__exercice-badge">(exercice court — ${Number.isInteger(duree) ? duree : duree.toFixed(1)} mois)</span>`
    : '';

  return `
    <div class="doc-header__exercice">
      Exercice du ${fmtDateFR(dateDebut)} au ${fmtDateFR(dateFin)}${badge}
    </div>
  `;
}

/**
 * Construit l'en-tête commun à tous les documents (identité + mention).
 * Affiche le SIRET et l'adresse si présents dans meta (P9c).
 * @param {object} meta   BilanData.meta
 * @param {string} titre  Titre du document affiché à droite
 * @returns {string}      HTML
 */
export function buildHeader(meta, titre) {
  // Ligne SIRET — affichée seulement si renseignée
  const siretLine = meta.siret
    ? `<span class="doc-header__meta-item">SIRET : <strong>${fmtSIRET(meta.siret)}</strong></span>`
    : '';

  // Ligne adresse — affichée seulement si renseignée
  const adresseLine = meta.adresse
    ? `<span class="doc-header__meta-item">${meta.adresse.numero} ${meta.adresse.voie}, ${meta.adresse.cp} ${meta.adresse.ville}</span>`
    : '';

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
          ${siretLine}
          ${adresseLine}
        </div>
      </div>
      <div class="doc-header__right">
        <div class="doc-header__title">${titre}</div>
        ${_buildExerciceLine(meta)}
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
 * @param {string} active   Onglet actif : 'bilan' | 'resultat' | 'annexe' | 'liasse' | 'analyse'
 * @param {object} output   BilanParams.output
 * @returns {string}        HTML
 */
export function buildTabs(active, output) {
  const tabs = [];
  if (output.bilan)          tabs.push({ id: 'bilan',    label: 'Bilan' });
  if (output.compteResultat) tabs.push({ id: 'resultat', label: 'Compte de résultat' });
  if (output.annexe)         tabs.push({ id: 'annexe',   label: 'Annexe' });
  if (output.liasseFiscale)  tabs.push({ id: 'liasse',   label: 'Liasse fiscale' });
  if (output.analyse)        tabs.push({ id: 'analyse',  label: 'Analyse' });

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
