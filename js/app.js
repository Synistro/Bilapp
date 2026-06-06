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
 *   - Dispatcher le rendu vers les bons modules
 *
 * État applicatif global (seul fichier autorisé à en avoir) :
 *   _bilanParams  — paramètres saisis dans le formulaire
 *   _bilanData    — données calculées par engine.js
 */

'use strict';

import { initForm }        from './modules/form.js';
import { generate }        from './core/engine.js';
import { validate }        from './core/validator.js';
import { renderDocuments } from './modules/bilan.js';

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

  // Rendu des documents
  renderDocuments(_bilanData, _bilanParams);
}

// ============================================================
// DÉMARRAGE
// ============================================================

document.addEventListener('DOMContentLoaded', init);
