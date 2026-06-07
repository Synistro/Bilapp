/**
 * identite.js — Bilapp
 * -------------------------------------------------------
 * Génération d'identifiants fictifs mais valides :
 *   - SIREN (9 chiffres, algorithme Luhn)
 *   - SIRET (SIREN + NIC 5 chiffres, Luhn)
 *   - Adresse postale française plausible
 *
 * Exports :
 *   genererSIREN()          → string '123456782'
 *   genererSIRET(siren)     → string '12345678200012'
 *   genererAdresse()        → { numero, voie, cp, ville }
 *   genererIdentite()       → { siret, adresse } — point d'entrée principal
 *
 * RÈGLE : fonctions pures, zéro effet de bord, zéro import DOM.
 */

'use strict';

import { VILLES_FR } from '../core/constants.js';

// ============================================================
// TABLES INTERNES
// ============================================================

/** Types de voies pour les adresses fictives. */
const TYPES_VOIE = [
  'rue', 'avenue', 'boulevard', 'allée', 'impasse',
  'place', 'chemin', 'route', 'passage', 'square',
];

/** Noms de voies génériques mais plausibles. */
const NOMS_VOIE = [
  'de la République',   'du Général de Gaulle', 'Victor Hugo',
  'Jean Jaurès',        'de la Paix',            'du Commerce',
  'des Fleurs',         'de la Liberté',         'Pasteur',
  'Gambetta',           'du Maréchal Foch',       'de la Mairie',
  'des Artisans',       'de l\'Industrie',        'des Sciences',
  'du 8 Mai 1945',      'de la Forêt',            'des Lilas',
  'Émile Zola',         'Auguste Renoir',          'du Moulin',
  'des Entrepreneurs',  'de la Gare',             'du Stade',
  'des Acacias',        'de l\'Église',
];

// ============================================================
// ALGORITHME DE LUHN
// ============================================================

/**
 * Calcule la clé de contrôle Luhn pour un tableau de chiffres.
 * La clé est le chiffre à ajouter pour que la somme Luhn totale
 * soit divisible par 10.
 * @param {number[]} digits — chiffres sans la clé
 * @returns {number}         chiffre de contrôle (0-9)
 */
function luhnKey(digits) {
  // On simule l'ajout d'un 0 en position finale, puis on calcule
  const all = [...digits, 0];
  let sum = 0;
  const len = all.length;

  for (let i = 0; i < len; i++) {
    // Position comptée depuis la droite : les positions paires (0-indexed depuis droite) sont doublées
    let d = all[i];
    if ((len - 1 - i) % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Vérifie qu'un tableau de chiffres passe la validation Luhn.
 * @param {number[]} digits
 * @returns {boolean}
 */
function luhnValid(digits) {
  let sum = 0;
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    let d = digits[i];
    if ((len - 1 - i) % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// ============================================================
// UTILITAIRES
// ============================================================

/**
 * Retourne un entier aléatoire dans [min, max] inclus.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Pioche un élément aléatoire dans un tableau.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pad un nombre en string avec des zéros à gauche.
 * @param {number} n
 * @param {number} width
 * @returns {string}
 */
function pad(n, width) {
  return String(n).padStart(width, '0');
}

// ============================================================
// GÉNÉRATION SIREN
// ============================================================

/**
 * Génère un SIREN fictif valide selon l'algorithme Luhn.
 * Format : 9 chiffres, ex. '732829320'
 * Le premier chiffre est toujours 1-9 (pas de SIREN commençant par 0).
 * @returns {string}
 */
export function genererSIREN() {
  // 8 chiffres aléatoires, premier ≥ 1
  const digits = [randInt(1, 9)];
  for (let i = 0; i < 7; i++) {
    digits.push(randInt(0, 9));
  }
  // 9e chiffre = clé Luhn
  digits.push(luhnKey(digits));

  // Sanity check (ne devrait jamais échouer)
  if (!luhnValid(digits)) {
    // Fallback déterministe connu valide
    return '732829320';
  }

  return digits.join('');
}

// ============================================================
// GÉNÉRATION SIRET
// ============================================================

/**
 * Génère un SIRET fictif valide pour un SIREN donné.
 * SIRET = SIREN (9) + NIC (5), l'ensemble doit passer Luhn.
 * @param {string} siren — 9 chiffres
 * @returns {string}       14 chiffres
 */
export function genererSIRET(siren) {
  const sirenDigits = siren.split('').map(Number);

  // 4 chiffres NIC aléatoires, puis clé Luhn en 5e position
  const nic4 = [randInt(0, 9), randInt(0, 9), randInt(0, 9), randInt(0, 9)];
  const all13 = [...sirenDigits, ...nic4];
  const cle   = luhnKey(all13);
  const siret = [...all13, cle];

  if (!luhnValid(siret)) {
    // Fallback : NIC = 00001 avec clé recalculée
    const fallback13 = [...sirenDigits, 0, 0, 0, 0];
    const fallbackCle = luhnKey(fallback13);
    return siren + '0000' + fallbackCle;
  }

  return siret.join('');
}

// ============================================================
// GÉNÉRATION ADRESSE
// ============================================================

/**
 * Génère une adresse postale française fictive mais plausible.
 * @returns {{ numero: string, voie: string, cp: string, ville: string }}
 */
export function genererAdresse() {
  const { ville, cp } = pick(VILLES_FR);
  const numero        = String(randInt(1, 150));
  const typeVoie      = pick(TYPES_VOIE);
  const nomVoie       = pick(NOMS_VOIE);
  const voie          = typeVoie.charAt(0).toUpperCase() + typeVoie.slice(1) + ' ' + nomVoie;

  return { numero, voie, cp, ville };
}

// ============================================================
// POINT D'ENTRÉE PRINCIPAL
// ============================================================

/**
 * Génère l'ensemble des identifiants fictifs d'une société.
 * À appeler une seule fois à la création du BilanParams.
 * @returns {{ siret: string, adresse: { numero: string, voie: string, cp: string, ville: string } }}
 */
export function genererIdentite() {
  const siren   = genererSIREN();
  const siret   = genererSIRET(siren);
  const adresse = genererAdresse();
  return { siret, adresse };
}
