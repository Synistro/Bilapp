/**
 * session.js — Bilapp
 * -------------------------------------------------------
 * Save/Load d'une session Bilapp au format JSON.
 *
 * Format de fichier :
 *   {
 *     version:   string,           // semver du format, ex. "1.0"
 *     timestamp: string,           // ISO 8601
 *     params:    BilanParams,      // paramètres du formulaire
 *     data:      BilanData,        // données calculées (snapshot)
 *     overrides: [string, number][]  // paires [path, valeur] issues de la Map
 *   }
 *
 * Exports :
 *   saveSession(data, params, overrides)  — déclenche le téléchargement JSON
 *   loadSession(file)                     — lit un File, retourne Promise<SessionPayload>
 */

'use strict';

/** Version du format de fichier — à incrémenter si structure change. */
const SESSION_VERSION = '1.0';

// ============================================================
// SAVE
// ============================================================

/**
 * Sérialise l'état courant et déclenche le téléchargement.
 *
 * @param {object}          data       BilanData complet
 * @param {object}          params     BilanParams complet
 * @param {Map<string,number>} overrides  Registre des postes verrouillés
 */
export function saveSession(data, params, overrides) {
  const payload = {
    version:   SESSION_VERSION,
    timestamp: new Date().toISOString(),
    params,
    data,
    // Map non sérialisable nativement — conversion en tableau de paires
    overrides: [...overrides.entries()],
  };

  const json     = JSON.stringify(payload, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const filename = _buildFilename(params);

  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();

  // Libération immédiate de l'URL objet
  URL.revokeObjectURL(url);
}

/**
 * Construit le nom de fichier suggéré à partir des params.
 * Ex. : bilapp_AcmeSarl_2024.json
 *
 * @param {object} params BilanParams
 * @returns {string}
 */
function _buildFilename(params) {
  const nom    = (params.societe?.nom ?? 'societe').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const annee  = params.societe?.anneeExercice ?? new Date().getFullYear();
  return `bilapp_${nom}_${annee}.json`;
}

// ============================================================
// LOAD
// ============================================================

/**
 * @typedef {object} SessionPayload
 * @property {string}             version
 * @property {string}             timestamp
 * @property {object}             params     BilanParams restauré
 * @property {object}             data       BilanData restauré
 * @property {[string, number][]} overrides  Paires [path, valeur]
 */

/**
 * Lit un fichier .json uploadé par l'utilisateur et parse le payload.
 * Ne restaure pas l'état — la responsabilité est au module appelant.
 *
 * @param {File} file  Fichier sélectionné via <input type="file">
 * @returns {Promise<SessionPayload>}
 * @throws {Error} Si le JSON est invalide ou la version incompatible
 */
export function loadSession(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        _validatePayload(payload);
        resolve(payload);
      } catch (err) {
        reject(new Error(`[Bilapp session] Fichier invalide : ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('[Bilapp session] Échec de lecture du fichier.'));

    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Vérifie la structure minimale du payload chargé.
 * @param {object} payload
 * @throws {Error}
 */
function _validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('JSON vide ou non-objet.');
  }
  if (!payload.version || !payload.params || !payload.data) {
    throw new Error('Champs obligatoires manquants (version, params, data).');
  }
  if (payload.version !== SESSION_VERSION) {
    // Avertissement non bloquant — on charge quand même
    console.warn(`[Bilapp session] Version ${payload.version} ≠ ${SESSION_VERSION} — compatibilité non garantie.`);
  }
  if (!Array.isArray(payload.overrides)) {
    // Tolérance : overrides absent → tableau vide
    payload.overrides = [];
  }
}
