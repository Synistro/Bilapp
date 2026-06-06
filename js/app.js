/**
 * app.js — Bilapp
 * -------------------------------------------------------
 * Orchestrateur principal de l'application.
 * Point d'entrée unique — chargé par index.html via type="module".
 *
 * Responsabilités :
 *   - Initialiser le formulaire
 *   - Recevoir BilanParams à la soumission
 *   - Appeler le moteur de calcul (engine.js) → BilanData
 *   - Appeler le validateur (validator.js)
 *   - Dispatcher le rendu vers les bons modules
 *
 * État applicatif global (seul fichier autorisé à en avoir) :
 *   _bilanParams  — paramètres saisis dans le formulaire
 *   _bilanData    — données calculées par engine.js
 */

'use strict';

import { initForm } from './modules/form.js';

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
 * @param {Object} bilanParams - Objet BilanParams complet
 */
function onFormSubmit(bilanParams) {
  _bilanParams = bilanParams;

  // TODO — Phase P2 : appeler engine.js pour générer BilanData
  // TODO — Phase P3 : appeler validator.js pour vérifier la cohérence
  // TODO — Phase P4+ : appeler les renderers selon output choisi

  // Placeholder temporaire — affiche le récap JSON pour debug
  _renderDebug(bilanParams);
}

// ============================================================
// DEBUG (temporaire — sera remplacé par les renderers)
// ============================================================

/**
 * Affiche un récapitulatif JSON des paramètres pour debug.
 * Sera supprimé quand engine.js sera implémenté.
 * @param {Object} params
 */
function _renderDebug(params) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="app-header">
      <div class="container">
        <div class="app-header__logo">Bil<span>app</span></div>
        <div class="app-header__subtitle">Générateur de bilans comptables pédagogiques</div>
      </div>
    </header>

    <div class="form-wrapper">
      <div class="form-panel" style="max-width: 680px;">
        <div class="form-panel__body">
          <div class="step-header">
            <div class="step-header__eyebrow">Phase P2 à implémenter</div>
            <h2 class="step-header__title">Paramètres reçus ✓</h2>
            <p class="step-header__desc">Le moteur de calcul (engine.js) sera connecté ici. Paramètres collectés :</p>
          </div>
          <pre style="
            background: #f4f5f7;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            padding: 1.5rem;
            font-size: 0.8rem;
            overflow-x: auto;
            line-height: 1.6;
          ">${JSON.stringify(params, null, 2)}</pre>
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

// Lance l'app quand le DOM est prêt
document.addEventListener('DOMContentLoaded', init);
