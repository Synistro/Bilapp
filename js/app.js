/**
 * app.js — Bilapp
 * -------------------------------------------------------
 * Orchestrateur principal de l'application.
 * Point d'entrée unique — chargé par index.html via type="module".
 *
 * Responsabilités :
 *   - Initialiser le formulaire
 *   - Recevoir BilanParams à la soumission
 *   - Appeler engine.js → BilanData
 *   - Appeler validator.js → vérification cohérence
 *   - Dispatcher le rendu vers les bons modules (P4+)
 *
 * État applicatif global (seul fichier autorisé à en avoir) :
 *   _bilanParams  — paramètres saisis dans le formulaire
 *   _bilanData    — données calculées par engine.js
 */

'use strict';

import { initForm } from './modules/form.js';
import { generate } from './core/engine.js';
import { validate } from './core/validator.js';

// ============================================================
// ÉTAT APPLICATIF
// ============================================================

let _bilanParams = null;
let _bilanData   = null;

// ============================================================
// INIT
// ============================================================

/**
 * Point d'entrée de l'application.
 * Appelé au chargement du DOM.
 */
function init() {
  initForm(onFormSubmit);
}

// ============================================================
// HANDLERS
// ============================================================

/**
 * Appelé par form.js quand l'utilisateur clique sur "Générer".
 * @param {object} bilanParams  Objet BilanParams complet
 */
function onFormSubmit(bilanParams) {
  _bilanParams = bilanParams;

  // Génération
  _bilanData = generate(bilanParams);

  // Validation — erreurs non bloquantes, visibles en console dev
  const { success, errors } = validate(_bilanData);
  if (!success) {
    console.warn('[Bilapp] Violations de validation :', errors);
  }

  // TODO — P4 : appeler les renderers selon output choisi
  _renderDebug(_bilanData);
}

// ============================================================
// DEBUG (temporaire — sera remplacé par les renderers P4+)
// ============================================================

/**
 * Affiche un récapitulatif JSON du BilanData généré pour debug.
 * @param {object} data  BilanData
 */
function _renderDebug(data) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="app-header">
      <div class="container">
        <div class="app-header__logo">Bil<span>app</span></div>
        <div class="app-header__subtitle">Générateur de bilans comptables pédagogiques</div>
      </div>
    </header>

    <div class="form-wrapper">
      <div class="form-panel" style="max-width: 780px;">
        <div class="form-panel__body">
          <div class="step-header">
            <div class="step-header__eyebrow">Phase P2 — engine.js ✓</div>
            <h2 class="step-header__title">BilanData généré</h2>
            <p class="step-header__desc">
              Actif net : <strong>${data.bilan.actif.totalNet.toLocaleString('fr-FR')} €</strong>
              &nbsp;|&nbsp;
              Passif total : <strong>${data.bilan.passif.total.toLocaleString('fr-FR')} €</strong>
              &nbsp;|&nbsp;
              Résultat net : <strong>${data.resultat.resultatNet.toLocaleString('fr-FR')} €</strong>
            </p>
          </div>
          <pre style="
            background: #f4f5f7;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            padding: 1.5rem;
            font-size: 0.75rem;
            overflow-x: auto;
            line-height: 1.6;
            max-height: 60vh;
          ">${JSON.stringify(data, null, 2)}</pre>
          <div style="margin-top: 1.5rem;">
            <button class="btn btn--secondary" id="btnBack">← Modifier les paramètres</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    init();
  });
}

// ============================================================
// DÉMARRAGE
// ============================================================

document.addEventListener('DOMContentLoaded', init);
