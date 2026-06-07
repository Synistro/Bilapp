/**
 * form.js — Bilapp
 * -------------------------------------------------------
 * Gestion du formulaire multi-étapes.
 * Collecte les réponses utilisateur et produit un objet BilanParams.
 *
 * Étapes :
 *   1 — Identité société     (Q01-Q05)
 *   2 — Taille & structure   (Q06-Q08)
 *   3 — Paramètres financiers(Q09-Q14)
 *   4 — Documents à générer  (Q15-Q20)
 *
 * Exports :
 *   initForm(onSubmit)  — monte le formulaire dans #app, appelle onSubmit(BilanParams)
 *   getBilanParams()    — retourne l'objet BilanParams courant (lecture seule)
 */

'use strict';

import {
  FORMES_JURIDIQUES,
  SECTEURS,
  TRANCHES_CA,
  TRANCHES_EMPLOYES,
  TRANCHES_CLIENTS,
  ORIENTATIONS,
  REGIMES_TVA,
  TVA_DEFAUT_PAR_TRANCHE,
} from '../core/constants.js';

import { genererIdentite } from '../utils/identite.js';

// ============================================================
// CONSTANTES
// ============================================================

/** Durée maximale légale d'un exercice en France (24 mois) */
const DUREE_EXERCICE_MAX_MOIS = 24;

/** Seuil en-dessous duquel on affiche le badge "exercice court" */
const SEUIL_EXERCICE_COURT_MOIS = 11.5;

// ============================================================
// ÉTAT INTERNE DU FORMULAIRE
// ============================================================

/** Étape courante (1-indexed) */
let _currentStep = 1;

/** Nombre total d'étapes */
const TOTAL_STEPS = 4;

/** Objet BilanParams en cours de construction */
let _params = _defaultParams();

/** Callback appelé à la soumission finale */
let _onSubmit = null;

/**
 * Retourne un objet BilanParams vide avec les valeurs par défaut.
 * L'identité (SIRET + adresse) est générée une seule fois à la création.
 * @returns {Object} BilanParams initialisé
 */
function _defaultParams() {
  const { siret, adresse } = genererIdentite();
  const anneeDefaut = new Date().getFullYear() - 1;
  return {
    societe: {
      nom:               '',
      formeJuridique:    '',
      secteur:           '',
      activiteDetail:    '',
      // F54 — dates d'exercice
      dateDebut:         `${anneeDefaut}-01-01`,
      dateFin:           `${anneeDefaut}-12-31`,
      dureeExerciceMois: 12,
      // Alias rétrocompat — toujours = année de dateFin
      anneeExercice:     anneeDefaut,
      siret,
      adresse,
    },
    taille: {
      ca:         '',
      nbEmployes: '',
      nbClients:  '',
    },
    finance: {
      orientation:        '',
      hasImmobilisations: false,
      hasDettesBancaires: false,
      hasStocks:          false,
      hasInternational:   false,
      regimeTVA:          '',
    },
    output: {
      bilan:          true,
      compteResultat: true,
      annexe:         false,
      liasseFiscale:  false,
      compareN1:      false,
      analyse:        false,
    },
  };
}

// ============================================================
// UTILITAIRE — CALCUL DURÉE EXERCICE
// ============================================================

/**
 * Calcule la durée en mois décimaux entre deux dates ISO 'YYYY-MM-DD'.
 * Ex. : '2024-03-15' → '2024-12-31' ≈ 9.53 mois
 * @param {string} dateDebut
 * @param {string} dateFin
 * @returns {number} durée en mois décimaux (arrondie à 2 décimales)
 */
function _calcDureeExerciceMois(dateDebut, dateFin) {
  const d = new Date(dateDebut);
  const f = new Date(dateFin);
  const msParMois = 1000 * 60 * 60 * 24 * (365.25 / 12);
  const mois = (f - d) / msParMois;
  return Math.round(mois * 100) / 100;
}

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
// API PUBLIQUE
// ============================================================

/**
 * Initialise et monte le formulaire multi-étapes dans le conteneur #app.
 * @param {Function} onSubmit - Callback(BilanParams) appelé à la génération
 */
export function initForm(onSubmit) {
  _onSubmit    = onSubmit;
  _currentStep = 1;
  _params      = _defaultParams();

  const app = document.getElementById('app');
  app.innerHTML = _buildAppShell();

  _renderStep(_currentStep);
  _bindProgressClicks();
}

/**
 * Retourne une copie de l'objet BilanParams courant.
 * @returns {Object} BilanParams (copie profonde)
 */
export function getBilanParams() {
  return JSON.parse(JSON.stringify(_params));
}

// ============================================================
// CONSTRUCTION DU SHELL HTML
// ============================================================

/**
 * Construit le squelette HTML de l'app (header + progress + form wrapper).
 * @returns {string} HTML string
 */
function _buildAppShell() {
  return `
    <header class="app-header">
      <div class="container">
        <div class="app-header__logo">Bil<span>app</span></div>
        <div class="app-header__subtitle">Générateur de bilans comptables pédagogiques</div>
      </div>
    </header>

    <nav class="progress-bar" aria-label="Progression du formulaire">
      <div class="progress-bar__inner" id="progressSteps">
        ${_buildProgressSteps()}
      </div>
    </nav>

    <div class="form-wrapper">
      <div class="form-panel" id="formPanel">
        <div class="form-panel__body" id="formBody">
          <!-- Étape injectée dynamiquement -->
        </div>
        <div class="form-nav" id="formNav">
          <!-- Navigation injectée dynamiquement -->
        </div>
      </div>
    </div>
  `;
}

/**
 * Construit le HTML des bulles de progression.
 * @returns {string} HTML string
 */
function _buildProgressSteps() {
  const labels = ['Identité', 'Taille', 'Finances', 'Documents'];

  return labels.map((label, i) => {
    const step = i + 1;
    const isActive    = step === _currentStep;
    const isCompleted = step < _currentStep;
    const className   = [
      'progress-step',
      isActive    ? 'is-active'    : '',
      isCompleted ? 'is-completed' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="${className}" data-step="${step}" role="tab" aria-selected="${isActive}">
        <div class="progress-step__bubble">
          <span class="progress-step__number">${step}</span>
        </div>
        <span class="progress-step__label">${label}</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// RENDU DES ÉTAPES
// ============================================================

/**
 * Affiche l'étape demandée dans le panneau formulaire.
 * @param {number} step - Numéro d'étape (1-4)
 */
function _renderStep(step) {
  // Met à jour la barre de progression
  document.getElementById('progressSteps').innerHTML = _buildProgressSteps();

  // Injecte le contenu de l'étape
  const body = document.getElementById('formBody');
  body.innerHTML = '';

  const stepEl = document.createElement('div');
  stepEl.className = 'form-step';

  switch (step) {
    case 1: stepEl.innerHTML = _buildStep1(); break;
    case 2: stepEl.innerHTML = _buildStep2(); break;
    case 3: stepEl.innerHTML = _buildStep3(); break;
    case 4: stepEl.innerHTML = _buildStep4(); break;
  }

  body.appendChild(stepEl);
  _fillFormFromParams(step);
  _bindStepEvents(step);
  _renderNav(step);
}

/**
 * Remplit les champs de l'étape avec les valeurs déjà saisies (retour arrière).
 * @param {number} step
 */
function _fillFormFromParams(step) {
  if (step === 1) {
    _setVal('nom',            _params.societe.nom);
    _setVal('formeJuridique', _params.societe.formeJuridique);
    _setVal('secteur',        _params.societe.secteur);
    _setVal('activiteDetail', _params.societe.activiteDetail);
    _setVal('dateDebut',      _params.societe.dateDebut);
    _setVal('dateFin',        _params.societe.dateFin);
    if (_params.societe.formeJuridique) _selectRadio('formeJuridique', _params.societe.formeJuridique);
    if (_params.societe.secteur)        _selectRadio('secteur', _params.societe.secteur);
    _updateDureeDisplay();
  }
  if (step === 2) {
    if (_params.taille.ca)         _selectRadio('ca', _params.taille.ca);
    if (_params.taille.nbEmployes) _selectRadio('nbEmployes', _params.taille.nbEmployes);
    if (_params.taille.nbClients)  _selectRadio('nbClients', _params.taille.nbClients);
  }
  if (step === 3) {
    if (_params.finance.orientation) _selectRadio('orientation', _params.finance.orientation);
    _setToggle('hasImmobilisations', _params.finance.hasImmobilisations);
    _setToggle('hasDettesBancaires', _params.finance.hasDettesBancaires);
    _setToggle('hasStocks',          _params.finance.hasStocks);
    _setToggle('hasInternational',   _params.finance.hasInternational);
    if (_params.finance.regimeTVA) _selectRadio('regimeTVA', _params.finance.regimeTVA);
    _updateStocksVisibility();
  }
  if (step === 4) {
    _setToggle('bilan',          _params.output.bilan);
    _setToggle('compteResultat', _params.output.compteResultat);
    _setToggle('annexe',         _params.output.annexe);
    _setToggle('liasseFiscale',  _params.output.liasseFiscale);
    _setToggle('compareN1',      _params.output.compareN1);
    _setToggle('analyse',        _params.output.analyse);
  }
}

// ============================================================
// CONSTRUCTION HTML DES ÉTAPES
// ============================================================

/**
 * Étape 1 — Identité de la société.
 * @returns {string} HTML
 */
function _buildStep1() {
  const formeOptions = Object.entries(FORMES_JURIDIQUES).map(([key, label]) => `
    <label>
      <input type="radio" name="formeJuridique" value="${key}" />
      <div class="choice-card">
        <span class="choice-card__label">${key}</span>
        <span class="choice-card__desc">${label}</span>
      </div>
    </label>
  `).join('');

  const secteurOptions = Object.entries(SECTEURS).map(([key, label]) => `
    <label>
      <input type="radio" name="secteur" value="${key}" />
      <div class="choice-card">
        <span class="choice-card__label">${label}</span>
      </div>
    </label>
  `).join('');

  const anneeActuelle = new Date().getFullYear();

  return `
    <div class="step-header">
      <div class="step-header__eyebrow">Étape 1 sur ${TOTAL_STEPS}</div>
      <h2 class="step-header__title">Identité de la société</h2>
      <p class="step-header__desc">Ces informations apparaîtront en en-tête de tous les documents générés.</p>
    </div>

    <!-- Q01 — Nom -->
    <div class="form-group">
      <label class="form-label" for="nom">
        Nom de la société
        <span class="form-label__hint">tel qu'il apparaîtra sur les documents</span>
      </label>
      <input
        class="form-input"
        type="text"
        id="nom"
        name="nom"
        placeholder="ex : Dupont & Associés"
        maxlength="100"
        autocomplete="off"
      />
    </div>

    <!-- Q02 — Forme juridique -->
    <div class="form-group">
      <label class="form-label">Forme juridique</label>
      <div class="choice-group choice-group--3col" role="radiogroup" aria-label="Forme juridique">
        ${formeOptions}
      </div>
    </div>

    <!-- Q03 — Secteur -->
    <div class="form-group">
      <label class="form-label">Secteur d'activité</label>
      <div class="choice-group choice-group--3col" role="radiogroup" aria-label="Secteur d'activité">
        ${secteurOptions}
      </div>
    </div>

    <!-- Q04 — Description -->
    <div class="form-group">
      <label class="form-label" for="activiteDetail">
        Description de l'activité
        <span class="form-label__hint">optionnel</span>
      </label>
      <input
        class="form-input"
        type="text"
        id="activiteDetail"
        name="activiteDetail"
        placeholder="ex : vente de matériel informatique en ligne"
        maxlength="200"
        autocomplete="off"
      />
    </div>

    <!-- Q05 — Exercice comptable (F54) -->
    <div class="form-group">
      <label class="form-label">Période de l'exercice comptable</label>
      <div class="date-range-group">
        <div class="date-range-group__field">
          <label class="form-label form-label--sub" for="dateDebut">Début</label>
          <input
            class="form-input"
            type="date"
            id="dateDebut"
            name="dateDebut"
            max="${anneeActuelle}-12-31"
          />
        </div>
        <div class="date-range-group__sep">→</div>
        <div class="date-range-group__field">
          <label class="form-label form-label--sub" for="dateFin">Fin</label>
          <input
            class="form-input"
            type="date"
            id="dateFin"
            name="dateFin"
            max="${anneeActuelle}-12-31"
          />
        </div>
      </div>
      <!-- Badge durée — mis à jour dynamiquement -->
      <div class="exercice-duree" id="exerciceDuree"></div>
    </div>
  `;
}

/**
 * Étape 2 — Taille et structure.
 * @returns {string} HTML
 */
function _buildStep2() {
  const caOptions = Object.entries(TRANCHES_CA).map(([key, { label }]) => `
    <label>
      <input type="radio" name="ca" value="${key}" />
      <div class="choice-card">
        <span class="choice-card__label">${label}</span>
      </div>
    </label>
  `).join('');

  const employesOptions = Object.entries(TRANCHES_EMPLOYES).map(([key, label]) => `
    <label>
      <input type="radio" name="nbEmployes" value="${key}" />
      <div class="choice-card">
        <span class="choice-card__label">${label}</span>
      </div>
    </label>
  `).join('');

  const clientsOptions = Object.entries(TRANCHES_CLIENTS).map(([key, label]) => `
    <label>
      <input type="radio" name="nbClients" value="${key}" />
      <div class="choice-card">
        <span class="choice-card__label">${label}</span>
      </div>
    </label>
  `).join('');

  return `
    <div class="step-header">
      <div class="step-header__eyebrow">Étape 2 sur ${TOTAL_STEPS}</div>
      <h2 class="step-header__title">Taille & structure</h2>
      <p class="step-header__desc">Ces paramètres déterminent les ordres de grandeur des montants générés.</p>
    </div>

    <!-- Q06 — CA -->
    <div class="form-group">
      <label class="form-label">Chiffre d'affaires approximatif</label>
      <div class="choice-group choice-group--2col" role="radiogroup" aria-label="Chiffre d'affaires">
        ${caOptions}
      </div>
    </div>

    <!-- Q07 — Employés -->
    <div class="form-group">
      <label class="form-label">Nombre de salariés</label>
      <div class="choice-group choice-group--3col" role="radiogroup" aria-label="Nombre de salariés">
        ${employesOptions}
      </div>
    </div>

    <!-- Q08 — Clients -->
    <div class="form-group">
      <label class="form-label">Nombre de clients</label>
      <div class="choice-group choice-group--2col" role="radiogroup" aria-label="Nombre de clients">
        ${clientsOptions}
      </div>
    </div>
  `;
}

/**
 * Étape 3 — Paramètres financiers.
 * @returns {string} HTML
 */
function _buildStep3() {
  const orientationOptions = Object.entries(ORIENTATIONS).map(([key, { label }]) => `
    <label>
      <input type="radio" name="orientation" value="${key}" />
      <div class="choice-card">
        <span class="choice-card__label">${label}</span>
      </div>
    </label>
  `).join('');

  const tvaOptions = Object.entries(REGIMES_TVA).map(([key, label]) => `
    <label>
      <input type="radio" name="regimeTVA" value="${key}" />
      <div class="choice-card">
        <span class="choice-card__label">${label}</span>
      </div>
    </label>
  `).join('');

  return `
    <div class="step-header">
      <div class="step-header__eyebrow">Étape 3 sur ${TOTAL_STEPS}</div>
      <h2 class="step-header__title">Structure financière</h2>
      <p class="step-header__desc">Ces choix pilotent la logique comptable des documents générés.</p>
    </div>

    <!-- Q09 — Orientation résultat -->
    <div class="form-group">
      <label class="form-label">Résultat de l'exercice</label>
      <div class="choice-group choice-group--3col" role="radiogroup" aria-label="Résultat">
        ${orientationOptions}
      </div>
    </div>

    <!-- Q10-Q13 — Toggles -->
    <div class="form-group">
      <label class="form-label">Caractéristiques de l'entreprise</label>
      <div class="toggle-group">

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Immobilisations</span>
            <span class="toggle-item__hint">Bureaux, machines, véhicules, matériel…</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="hasImmobilisations" name="hasImmobilisations" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Dettes bancaires</span>
            <span class="toggle-item__hint">Emprunts auprès d'établissements de crédit</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="hasDettesBancaires" name="hasDettesBancaires" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <!-- Q12 — Stocks : masqué si secteur = services -->
        <div class="toggle-item" id="toggleStocks">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Stocks</span>
            <span class="toggle-item__hint">Marchandises, matières premières, produits finis</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="hasStocks" name="hasStocks" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Activité internationale</span>
            <span class="toggle-item__hint">Clients ou fournisseurs hors France, TVA intra-UE</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="hasInternational" name="hasInternational" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

      </div>
    </div>

    <!-- Q14 — Régime TVA -->
    <div class="form-group">
      <label class="form-label">Régime TVA</label>
      <div class="choice-group choice-group--3col" role="radiogroup" aria-label="Régime TVA">
        ${tvaOptions}
      </div>
    </div>
  `;
}

/**
 * Étape 4 — Documents à générer.
 * @returns {string} HTML
 */
function _buildStep4() {
  return `
    <div class="step-header">
      <div class="step-header__eyebrow">Étape 4 sur ${TOTAL_STEPS}</div>
      <h2 class="step-header__title">Documents à générer</h2>
      <p class="step-header__desc">Sélectionnez les documents souhaités. Le bilan et le compte de résultat sont inclus par défaut.</p>
    </div>

    <!-- Q15-Q20 — Documents -->
    <div class="form-group">
      <div class="toggle-group">

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Bilan comptable</span>
            <span class="toggle-item__hint">Actif / Passif — format PCG 2024</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="bilan" name="bilan" checked />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Compte de résultat</span>
            <span class="toggle-item__hint">Charges / Produits — format PCG 2024</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="compteResultat" name="compteResultat" checked />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Annexe comptable</span>
            <span class="toggle-item__hint">Tableau des immobilisations, amortissements, capitaux propres</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="annexe" name="annexe" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Liasse fiscale complète</span>
            <span class="toggle-item__hint">Cerfa 2050 à 2058 — pour formateurs fiscalité</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="liasseFiscale" name="liasseFiscale" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Comparatif N-1</span>
            <span class="toggle-item__hint">Inclure la colonne de l'exercice précédent</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="compareN1" name="compareN1" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

        <div class="toggle-item">
          <div class="toggle-item__text">
            <span class="toggle-item__label">Analyse financière</span>
            <span class="toggle-item__hint">FR, BFR, TN, SIG, CAF, ratios ROE/ROA</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="analyse" name="analyse" />
            <span class="toggle-switch__track"></span>
          </label>
        </div>

      </div>
    </div>

    <!-- Récapitulatif final -->
    <div class="recap" id="recap">
      <div class="recap__title">Récapitulatif</div>
      <div class="recap__grid" id="recapGrid">
        <!-- Injecté par _buildRecap() -->
      </div>
    </div>
  `;
}

// ============================================================
// NAVIGATION
// ============================================================

/**
 * Rend les boutons de navigation selon l'étape courante.
 * @param {number} step
 */
function _renderNav(step) {
  const nav = document.getElementById('formNav');

  const prevBtn = step > 1
    ? `<button class="btn btn--secondary" id="btnPrev">← Précédent</button>`
    : `<div></div>`;

  const nextBtn = step < TOTAL_STEPS
    ? `<button class="btn btn--primary" id="btnNext">Suivant →</button>`
    : `<button class="btn btn--primary btn--lg" id="btnGenerate">
         Générer les documents
       </button>`;

  const info = `<span class="form-nav__info">${step} / ${TOTAL_STEPS}</span>`;

  nav.innerHTML = `
    <div class="form-nav__actions">${prevBtn}</div>
    ${info}
    <div class="form-nav__actions">${nextBtn}</div>
  `;

  // Bindings navigation
  document.getElementById('btnPrev')?.addEventListener('click', _handlePrev);
  document.getElementById('btnNext')?.addEventListener('click', _handleNext);
  document.getElementById('btnGenerate')?.addEventListener('click', _handleGenerate);
}

/**
 * Retour à l'étape précédente.
 */
function _handlePrev() {
  if (_currentStep > 1) {
    _currentStep--;
    _renderStep(_currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Passage à l'étape suivante après validation.
 */
function _handleNext() {
  const errors = _validateStep(_currentStep);
  if (errors.length > 0) {
    _showErrors(errors);
    return;
  }
  _collectStep(_currentStep);
  _currentStep++;
  _renderStep(_currentStep);

  // Étape 4 : applique TVA par défaut selon CA, puis affiche le récap
  if (_currentStep === 4) {
    _applySmartDefaults();
    _buildRecap();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Soumission finale — valide, collecte, appelle onSubmit.
 */
function _handleGenerate() {
  _collectStep(4);

  const btn = document.getElementById('btnGenerate');
  btn.classList.add('btn--loading');
  btn.disabled = true;

  // Micro-délai pour laisser le navigateur afficher le loading state
  setTimeout(() => {
    if (typeof _onSubmit === 'function') {
      _onSubmit(getBilanParams());
    }
  }, 50);
}

// ============================================================
// COLLECTE DES VALEURS
// ============================================================

/**
 * Lit les champs de l'étape courante et met à jour _params.
 * @param {number} step
 */
function _collectStep(step) {
  if (step === 1) {
    _params.societe.nom            = _getVal('nom');
    _params.societe.formeJuridique = _getRadio('formeJuridique');
    _params.societe.secteur        = _getRadio('secteur');
    _params.societe.activiteDetail = _getVal('activiteDetail');

    // F54 — dates d'exercice
    const dateDebut = _getVal('dateDebut');
    const dateFin   = _getVal('dateFin');
    _params.societe.dateDebut         = dateDebut;
    _params.societe.dateFin           = dateFin;
    _params.societe.dureeExerciceMois = _calcDureeExerciceMois(dateDebut, dateFin);
    // Alias rétrocompat — année de clôture
    _params.societe.anneeExercice     = new Date(dateFin).getFullYear();
  }
  if (step === 2) {
    _params.taille.ca         = _getRadio('ca');
    _params.taille.nbEmployes = _getRadio('nbEmployes');
    _params.taille.nbClients  = _getRadio('nbClients');
  }
  if (step === 3) {
    _params.finance.orientation        = _getRadio('orientation');
    _params.finance.hasImmobilisations = _getToggle('hasImmobilisations');
    _params.finance.hasDettesBancaires = _getToggle('hasDettesBancaires');
    _params.finance.hasStocks          = _getToggle('hasStocks');
    _params.finance.hasInternational   = _getToggle('hasInternational');
    _params.finance.regimeTVA          = _getRadio('regimeTVA');

    // Forcer hasStocks à false si secteur = services
    if (_params.societe.secteur === 'services') {
      _params.finance.hasStocks = false;
    }
  }
  if (step === 4) {
    _params.output.bilan          = _getToggle('bilan');
    _params.output.compteResultat = _getToggle('compteResultat');
    _params.output.annexe         = _getToggle('annexe');
    _params.output.liasseFiscale  = _getToggle('liasseFiscale');
    _params.output.compareN1      = _getToggle('compareN1');
    _params.output.analyse        = _getToggle('analyse');
  }
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Valide les champs obligatoires d'une étape.
 * @param {number} step
 * @returns {Array<{field: string, message: string}>} Liste d'erreurs
 */
function _validateStep(step) {
  const errors = [];

  if (step === 1) {
    if (!_getVal('nom').trim())       errors.push({ field: 'nom',            message: 'Le nom de la société est obligatoire.' });
    if (!_getRadio('formeJuridique')) errors.push({ field: 'formeJuridique', message: 'Sélectionnez une forme juridique.' });
    if (!_getRadio('secteur'))        errors.push({ field: 'secteur',        message: "Sélectionnez un secteur d'activité." });

    // F54 — validation dates
    const dateDebut = _getVal('dateDebut');
    const dateFin   = _getVal('dateFin');

    if (!dateDebut) {
      errors.push({ field: 'dateDebut', message: "La date de début d'exercice est obligatoire." });
    }
    if (!dateFin) {
      errors.push({ field: 'dateFin', message: "La date de fin d'exercice est obligatoire." });
    }
    if (dateDebut && dateFin) {
      if (dateFin <= dateDebut) {
        errors.push({ field: 'dateFin', message: 'La date de fin doit être postérieure à la date de début.' });
      } else {
        const duree = _calcDureeExerciceMois(dateDebut, dateFin);
        if (duree > DUREE_EXERCICE_MAX_MOIS) {
          errors.push({ field: 'dateFin', message: `La durée de l'exercice ne peut excéder ${DUREE_EXERCICE_MAX_MOIS} mois (durée calculée : ${Math.round(duree)} mois).` });
        }
      }
    }
  }

  if (step === 2) {
    if (!_getRadio('ca'))         errors.push({ field: 'ca',         message: "Sélectionnez une tranche de chiffre d'affaires." });
    if (!_getRadio('nbEmployes')) errors.push({ field: 'nbEmployes', message: 'Sélectionnez le nombre de salariés.' });
    if (!_getRadio('nbClients'))  errors.push({ field: 'nbClients',  message: 'Sélectionnez le nombre de clients.' });
  }

  if (step === 3) {
    if (!_getRadio('orientation')) errors.push({ field: 'orientation', message: "Sélectionnez l'orientation du résultat." });
    if (!_getRadio('regimeTVA'))   errors.push({ field: 'regimeTVA',   message: 'Sélectionnez le régime TVA.' });
  }

  return errors;
}

/**
 * Affiche les erreurs de validation dans le formulaire.
 * @param {Array<{field: string, message: string}>} errors
 */
function _showErrors(errors) {
  // Nettoie les erreurs précédentes
  document.querySelectorAll('.form-error').forEach(el => el.remove());
  document.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));

  errors.forEach(({ field, message }) => {
    // Marque le champ en erreur
    const input = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
    if (input) input.classList.add('is-error');

    // Trouve le form-group parent et ajoute le message
    const group = input?.closest('.form-group');
    if (group) {
      const errEl = document.createElement('div');
      errEl.className = 'form-error';
      errEl.setAttribute('role', 'alert');
      errEl.textContent = message;
      group.appendChild(errEl);
    }
  });

  // Scroll vers la première erreur
  document.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================================================
// LOGIQUE MÉTIER UI
// ============================================================

/**
 * Met à jour le badge de durée d'exercice sous les date pickers.
 * Appelé à chaque changement de dateDebut ou dateFin.
 */
function _updateDureeDisplay() {
  const el = document.getElementById('exerciceDuree');
  if (!el) return;

  const dateDebut = _getVal('dateDebut');
  const dateFin   = _getVal('dateFin');

  if (!dateDebut || !dateFin || dateFin <= dateDebut) {
    el.textContent = '';
    el.className = 'exercice-duree';
    return;
  }

  const duree = _calcDureeExerciceMois(dateDebut, dateFin);
  if (duree > DUREE_EXERCICE_MAX_MOIS) {
    el.textContent = `⚠ Durée maximale dépassée (${Math.round(duree)} mois — max ${DUREE_EXERCICE_MAX_MOIS} mois)`;
    el.className = 'exercice-duree exercice-duree--error';
    return;
  }

  const debutD  = new Date(dateDebut);
  const estDecale = debutD.getMonth() !== 0 || debutD.getDate() !== 1; // pas 01/01
  const estCourt  = duree < SEUIL_EXERCICE_COURT_MOIS;

  const moisAff = Number.isInteger(duree) ? duree : duree.toFixed(1);

  if (estCourt) {
    el.textContent = `Exercice court — ${moisAff} mois`;
    el.className = 'exercice-duree exercice-duree--court';
  } else if (estDecale) {
    el.textContent = `Exercice décalé — ${moisAff} mois`;
    el.className = 'exercice-duree exercice-duree--decale';
  } else {
    el.textContent = `Exercice standard — ${moisAff} mois`;
    el.className = 'exercice-duree exercice-duree--normal';
  }
}

/**
 * Masque/affiche le toggle Stocks selon le secteur.
 * Appelé à l'init de l'étape 3 et au changement de valeur.
 */
function _updateStocksVisibility() {
  const toggleStocks = document.getElementById('toggleStocks');
  if (!toggleStocks) return;

  // Le secteur a été collecté à l'étape 1
  if (_params.societe.secteur === 'services') {
    toggleStocks.style.display = 'none';
  } else {
    toggleStocks.style.display = '';
  }
}

/**
 * Applique les valeurs par défaut intelligentes avant l'étape 4.
 * - Régime TVA selon tranche CA si non renseigné
 */
function _applySmartDefaults() {
  if (!_params.finance.regimeTVA && _params.taille.ca) {
    _params.finance.regimeTVA = TVA_DEFAUT_PAR_TRANCHE[_params.taille.ca] || 'reel_normal';
  }
}

/**
 * Construit et injecte le récapitulatif dans l'étape 4.
 * Affiche la plage de dates si exercice décalé ou court.
 */
function _buildRecap() {
  const grid = document.getElementById('recapGrid');
  if (!grid) return;

  // Affichage exercice : plage si décalé/court, année seule sinon
  const debutD   = new Date(_params.societe.dateDebut);
  const estDecale = debutD.getMonth() !== 0 || debutD.getDate() !== 1;
  const estCourt  = _params.societe.dureeExerciceMois < SEUIL_EXERCICE_COURT_MOIS;
  const exerciceAff = (estDecale || estCourt)
    ? `${fmtDateFR(_params.societe.dateDebut)} → ${fmtDateFR(_params.societe.dateFin)}`
    : String(_params.societe.anneeExercice);

  const items = [
    { key: 'Société',    value: _params.societe.nom || '—' },
    { key: 'Forme',      value: _params.societe.formeJuridique || '—' },
    { key: 'Secteur',    value: SECTEURS[_params.societe.secteur] || '—' },
    { key: 'Exercice',   value: exerciceAff },
    { key: 'CA',         value: TRANCHES_CA[_params.taille.ca]?.label || '—' },
    { key: 'Salariés',   value: TRANCHES_EMPLOYES[_params.taille.nbEmployes] || '—' },
    { key: 'Résultat',   value: ORIENTATIONS[_params.finance.orientation]?.label || '—' },
    { key: 'Régime TVA', value: REGIMES_TVA[_params.finance.regimeTVA] || '—' },
  ];

  grid.innerHTML = items.map(({ key, value }) => `
    <div class="recap__item">
      <span class="recap__key">${key}</span>
      <span class="recap__value">${value}</span>
    </div>
  `).join('');
}

// ============================================================
// BINDINGS ÉVÉNEMENTS
// ============================================================

/**
 * Attache les événements spécifiques à chaque étape.
 * @param {number} step
 */
function _bindStepEvents(step) {
  if (step === 1) {
    // Mise à jour du badge durée en temps réel
    document.getElementById('dateDebut')?.addEventListener('change', _updateDureeDisplay);
    document.getElementById('dateFin')?.addEventListener('change', _updateDureeDisplay);
  }
  if (step === 3) {
    _updateStocksVisibility();
  }
}

/**
 * Rend les bulles de progression cliquables pour les étapes déjà complétées.
 */
function _bindProgressClicks() {
  document.getElementById('progressSteps')?.addEventListener('click', (e) => {
    const stepEl = e.target.closest('.progress-step');
    if (!stepEl) return;
    const targetStep = parseInt(stepEl.dataset.step, 10);
    // Navigation libre uniquement vers les étapes déjà complétées
    if (targetStep < _currentStep) {
      _collectStep(_currentStep);
      _currentStep = targetStep;
      _renderStep(_currentStep);
    }
  });
}

// ============================================================
// HELPERS DOM
// ============================================================

/** Lit la valeur d'un input text/number/date */
function _getVal(name) {
  return document.getElementById(name)?.value ?? '';
}

/** Définit la valeur d'un input text/number/date */
function _setVal(name, value) {
  const el = document.getElementById(name);
  if (el) el.value = value ?? '';
}

/** Lit la valeur du radio sélectionné dans un groupe */
function _getRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
}

/** Coche le radio correspondant à la valeur */
function _selectRadio(name, value) {
  const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (el) el.checked = true;
}

/** Lit l'état d'un toggle checkbox */
function _getToggle(name) {
  return document.getElementById(name)?.checked ?? false;
}

/** Définit l'état d'un toggle checkbox */
function _setToggle(name, value) {
  const el = document.getElementById(name);
  if (el) el.checked = !!value;
}
