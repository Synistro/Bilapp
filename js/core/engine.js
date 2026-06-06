/**
 * engine.js — Bilapp
 * -------------------------------------------------------
 * Moteur de calcul comptable.
 * Génère un objet BilanData cohérent à partir de BilanParams.
 *
 * RÈGLES ABSOLUES :
 * - Zéro accès au DOM
 * - Fonctions pures uniquement (mêmes inputs → mêmes outputs)
 * - Zéro état global
 * - Tout libellé/taux/ratio → importé depuis constants.js
 */

'use strict';

import {
  TRANCHES_CA,
  RATIOS_SECTORIELS,
  ORIENTATIONS,
  TAUX,
  CAPITAL_TYPIQUE,
  VARIATION_MONTANTS,
} from './constants.js';

// TODO — Phase P2 : implémenter le moteur de calcul
