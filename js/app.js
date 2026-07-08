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
import { renderDocuments, renderLoadedSession } from './modules/bilan.js';
import { loadSession }     from './export/session.js';

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
  _bindLoadSessionHome();
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
/**
 * Ajoute un bouton "Charger une session" sur l'écran d'accueil.
 * Injecté dans le header app après initForm.
 */
function _bindLoadSessionHome() {
  const header = document.querySelector('.app-header .container');
  if (!header) return;

  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  input.id = 'inputLoadHome';

  const btn = document.createElement('button');
  btn.className   = 'btn btn--ghost btn--sm';
  btn.textContent = '📂 Charger une session';
  btn.addEventListener('click', () => input.click());

  input.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    input.value = '';
    try {
      const payload = await loadSession(file);
      // Chemin de chargement unique — restaure les postes verrouillés et le
      // N-1 figé. NE PAS utiliser renderDocuments() ici (elle purge les verrous).
      renderLoadedSession(payload);
    } catch (err) {
      alert(`Impossible de charger la session :\n${err.message}`);
    }
  });

  header.appendChild(btn);
  header.appendChild(input);
}

document.addEventListener('DOMContentLoaded', init);
