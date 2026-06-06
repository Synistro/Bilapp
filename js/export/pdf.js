/**
 * pdf.js — Bilapp
 * -------------------------------------------------------
 * Export PDF via window.print() + print.css.
 *
 * Principe :
 *   1. Copie le contenu HTML du document actif dans #print-target
 *   2. Ajoute un pied de page mention fictif (fallback CSS)
 *   3. Appelle window.print()
 *   4. Nettoie #print-target après impression
 *
 * Exports :
 *   exportDocument(sourceSelector) — exporte le contenu d'un sélecteur CSS
 *   exportAll(selectors)           — exporte plusieurs documents à la suite
 */

'use strict';

import { MENTION_PIED } from '../core/constants.js';

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Crée ou récupère le conteneur #print-target dans le DOM.
 * Ce div est invisible en mode écran, visible uniquement en @media print.
 * @returns {HTMLElement}
 */
function getPrintTarget() {
  let target = document.getElementById('print-target');
  if (!target) {
    target = document.createElement('div');
    target.id = 'print-target';
    // Caché en mode écran — print.css le rend visible
    target.style.display = 'none';
    document.body.appendChild(target);
  }
  return target;
}

/**
 * Construit le pied de page mention fictif (fallback si @page non supporté).
 * @returns {string} HTML
 */
function buildPrintFooter() {
  return `<div class="print-footer">${MENTION_PIED}</div>`;
}

/**
 * Nettoie #print-target après impression.
 */
function clearPrintTarget() {
  const target = document.getElementById('print-target');
  if (target) {
    target.innerHTML = '';
    target.style.display = 'none';
  }
}

// ============================================================
// EXPORT PRINCIPAL
// ============================================================

/**
 * Exporte le document actuellement affiché dans #docContent.
 * Si un sélecteur est fourni, exporte ce sélecteur spécifique.
 *
 * @param {string} [sourceSelector='#docContent'] Sélecteur du contenu à imprimer
 */
export function exportDocument(sourceSelector = '#docContent') {
  const source = document.querySelector(sourceSelector);
  if (!source) {
    console.warn(`[Bilapp PDF] Sélecteur introuvable : ${sourceSelector}`);
    return;
  }

  const target = getPrintTarget();

  // Inclut aussi l'en-tête du document (doc-header) si présent
  const header = document.querySelector('.doc-header');
  const headerHTML = header ? header.outerHTML : '';

  target.innerHTML = headerHTML + source.innerHTML + buildPrintFooter();
  target.style.display = 'block';

  // Léger délai pour que le DOM soit rendu avant print()
  requestAnimationFrame(() => {
    window.print();
    // Nettoie après fermeture de la boîte d'impression
    window.addEventListener('afterprint', clearPrintTarget, { once: true });
  });
}

/**
 * Exporte plusieurs documents à la suite (bilan + CR par ex.)
 * en les séparant par un saut de page.
 *
 * @param {string[]} selectors  Liste de sélecteurs CSS
 */
export function exportAll(selectors) {
  const target = getPrintTarget();

  const header = document.querySelector('.doc-header');
  const headerHTML = header ? header.outerHTML : '';

  const parts = selectors
    .map((sel, i) => {
      const el = document.querySelector(sel);
      if (!el) return '';
      // Saut de page entre chaque document sauf le premier
      const breakClass = i > 0 ? 'print-page-break' : '';
      return `<div class="${breakClass}">${el.innerHTML}</div>`;
    })
    .filter(Boolean)
    .join('');

  if (!parts) {
    console.warn('[Bilapp PDF] Aucun sélecteur valide trouvé.');
    return;
  }

  target.innerHTML = headerHTML + parts + buildPrintFooter();
  target.style.display = 'block';

  requestAnimationFrame(() => {
    window.print();
    window.addEventListener('afterprint', clearPrintTarget, { once: true });
  });
}
