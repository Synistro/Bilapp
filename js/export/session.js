/**
 * session.js — Bilapp
 * -------------------------------------------------------
 * Save/Load d'une session Bilapp au format JSON.
 *
 * Format de fichier v4.0 :
 *   {
 *     version:      string,             // "4.0"
 *     timestamp:    string,             // ISO 8601
 *     params:       BilanParams,        // paramètres du formulaire
 *     data:         BilanData,          // données N calculées (snapshot)
 *     overrides:    [string, number][]  // paires [path, valeur]
 *     dataN1Figee:  BilanData | null    // données N-1 figées (P9d)
 *   }
 *
 * Rétrocompatibilité :
 *   v1.0 — dataN1Figee absent → null ; dateDebut/dateFin reconstruits depuis anneeExercice
 *   v2.0 — dateDebut/dateFin absents  → reconstruits depuis anneeExercice
 *   v3.0 — hasImmobilisations / hasStocks (booléens) → niveauImmos / niveauStocks
 *
 * Exports :
 *   saveSession(data, params, overrides, dataN1Figee?)
 *   loadSession(file) → Promise<SessionPayload>
 */

'use strict';

/** Version courante du format. Incrémenter si structure change. */
const SESSION_VERSION = '4.0';

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
 * Ex. : bilapp_AcmeSarl_2024.json (exercice standard)
 *       bilapp_AcmeSarl_2024-03-15_2024-12-31.json (exercice décalé)
 *
 * @param {object} params BilanParams
 * @returns {string}
 */
function _buildFilename(params) {
  const nom   = (params.societe?.nom ?? 'societe').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const debut = params.societe?.dateDebut;
  const fin   = params.societe?.dateFin;

  // Exercice décalé ou court → inclure les deux dates dans le nom
  const debutD    = debut ? new Date(debut) : null;
  const estDecale = debutD && (debutD.getMonth() !== 0 || debutD.getDate() !== 1);
  const duree     = params.societe?.dureeExerciceMois ?? 12;
  const estCourt  = duree < 11.5;

  if ((estDecale || estCourt) && debut && fin) {
    return `bilapp_${nom}_${debut}_${fin}.json`;
  }

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
        _validateAndMigrate(payload);
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
 * Vérifie la structure minimale du payload et applique les migrations.
 *
 * Migrations :
 *   v1.0 / v2.0 → v3.0 :
 *     params.societe.dateDebut/dateFin absents → reconstruire depuis anneeExercice
 *     dureeExerciceMois absent → 12 (exercice plein supposé)
 *   v3.0 → v4.0 :
 *     hasImmobilisations booléen → niveauImmos ('mixte' si true, 'off' si false)
 *     hasStocks booléen → niveauStocks ('marchandises' si true, 'off' si false)
 *
 * @param {object} payload
 * @throws {Error}
 */
function _validateAndMigrate(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('JSON vide ou non-objet.');
  }
  if (!payload.version || !payload.params || !payload.data) {
    throw new Error('Champs obligatoires manquants (version, params, data).');
  }

  if (!Array.isArray(payload.overrides)) {
    payload.overrides = [];
  }

  // Rétrocompatibilité v1.0 : dataN1Figee absent → null
  if (!('dataN1Figee' in payload)) {
    payload.dataN1Figee = null;
  }

  const s = payload.params.societe;
  const f = payload.params.finance;

  // Migration v1.0 / v2.0 → v3.0 : champs dates absents
  if (s && !s.dateDebut) {
    const annee = s.anneeExercice ?? new Date().getFullYear() - 1;
    s.dateDebut         = `${annee}-01-01`;
    s.dateFin           = `${annee}-12-31`;
    s.dureeExerciceMois = 12;
    console.info(`[Bilapp session] Migration v${payload.version}→v3.0 : dates reconstruites depuis anneeExercice=${annee}`);
  }

  // Garantir dureeExerciceMois même si dateFin présent mais durée absente
  if (s && s.dateDebut && s.dateFin && !s.dureeExerciceMois) {
    const d = new Date(s.dateDebut);
    const fDate = new Date(s.dateFin);
    s.dureeExerciceMois = Math.round(((fDate - d) / (1000 * 60 * 60 * 24 * (365.25 / 12))) * 100) / 100;
  }

  // Migration v3.0 → v4.0 : booléens → niveaux de granularité
  if (f && !('niveauImmos' in f) && 'hasImmobilisations' in f) {
    f.niveauImmos = f.hasImmobilisations ? 'mixte' : 'off';
    console.info(`[Bilapp session] Migration v3.0→v4.0 : hasImmobilisations=${f.hasImmobilisations} → niveauImmos='${f.niveauImmos}'`);
  }
  if (f && !('niveauStocks' in f) && 'hasStocks' in f) {
    f.niveauStocks = f.hasStocks ? 'marchandises' : 'off';
    console.info(`[Bilapp session] Migration v3.0→v4.0 : hasStocks=${f.hasStocks} → niveauStocks='${f.niveauStocks}'`);
  }

  // Valeurs par défaut si les deux champs sont totalement absents (session très ancienne)
  if (f && !('niveauImmos'  in f)) f.niveauImmos  = 'off';
  if (f && !('niveauStocks' in f)) f.niveauStocks = 'off';

  // Mettre à jour la version dans le payload chargé
  if (payload.version !== SESSION_VERSION) {
    console.warn(`[Bilapp session] Version ${payload.version} migrée vers ${SESSION_VERSION}.`);
    payload.version = SESSION_VERSION;
  }
}
