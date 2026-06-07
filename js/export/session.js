/**
 * session.js — Bilapp
 * -------------------------------------------------------
 * Save/Load d'une session Bilapp au format JSON.
 *
 * Format de fichier v2.0 :
 *   {
 *     version:      string,             // "2.0"
 *     timestamp:    string,             // ISO 8601
 *     params:       BilanParams,        // paramètres du formulaire
 *     data:         BilanData,          // données N calculées (snapshot)
 *     overrides:    [string, number][]  // paires [path, valeur]
 *     dataN1Figee:  BilanData | null    // données N-1 figées (P9d)
 *   }
 *
 * Rétrocompatibilité : les sessions v1.0 sont acceptées (dataN1Figee absent → null).
 *
 * Exports :
 *   saveSession(data, params, overrides, dataN1Figee?)
 *   loadSession(file) → Promise<SessionPayload>
 */

'use strict';

/** Version courante du format. Incrémenter si structure change. */
const SESSION_VERSION = '2.0';

// ============================================================
// SAVE
// ============================================================

/**
 * Sérialise l'état courant et déclenche le téléchargement JSON.
 *
 * @param {object}             data         BilanData N complet
 * @param {object}             params       BilanParams complet
 * @param {Map<string,number>} overrides    Registre des postes verrouillés
 * @param {object|null}        [dataN1Figee] BilanData N-1 figé (P9d) — optionnel
 */
export function saveSession(data, params, overrides, dataN1Figee = null) {
  const payload = {
    version:     SESSION_VERSION,
    timestamp:   new Date().toISOString(),
    params,
    data,
    // Map non sérialisable nativement — conversion en tableau de paires
    overrides:   [...overrides.entries()],
    dataN1Figee: dataN1Figee ?? null,
  };

  const json     = JSON.stringify(payload, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const filename = _buildFilename(params);

  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();

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
  const nom   = (params.societe?.nom ?? 'societe').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const annee = params.societe?.anneeExercice ?? new Date().getFullYear();
  return `bilapp_${nom}_${annee}.json`;
}

// ============================================================
// LOAD
// ============================================================

/**
 * @typedef {object} SessionPayload
 * @property {string}             version
 * @property {string}             timestamp
 * @property {object}             params       BilanParams restauré
 * @property {object}             data         BilanData N restauré
 * @property {[string, number][]} overrides    Paires [path, valeur]
 * @property {object|null}        dataN1Figee  BilanData N-1 figé ou null
 */

/**
 * Lit un fichier .json uploadé par l'utilisateur et parse le payload.
 * Ne restaure pas l'état — la responsabilité est au module appelant.
 *
 * @param {File} file  Fichier sélectionné via <input type="file">
 * @returns {Promise<SessionPayload>}
 * @throws {Error} Si le JSON est invalide ou la structure incohérente
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
 * Tolère les sessions v1.0 (dataN1Figee absent).
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
    // Avertissement non bloquant — on charge les sessions v1.0
    console.warn(`[Bilapp session] Version ${payload.version} ≠ ${SESSION_VERSION} — compatibilité assurée.`);
  }
  if (!Array.isArray(payload.overrides)) {
    payload.overrides = [];
  }
  // Rétrocompatibilité v1.0 : dataN1Figee absent → null
  if (!('dataN1Figee' in payload)) {
    payload.dataN1Figee = null;
  }
}
