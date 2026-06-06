/**
 * overrides.js — Bilapp
 * -------------------------------------------------------
 * Registre des postes modifiés manuellement par l'utilisateur.
 * Un poste verrouillé ne sera jamais écrasé par le moteur de calcul.
 *
 * Les chemins de postes utilisent la dot-notation correspondant
 * à la structure de BilanData, ex :
 *   'bilan.actif.immobilise.corporel.constructions.brut'
 *   'bilan.passif.dettes.emprunts'
 *   'resultat.chargesExploitation.chargesPersonnel'
 *
 * État en mémoire uniquement — réinitialisé à chaque nouveau bilan.
 */

'use strict';

/** @type {Map<string, number>} */
const _registry = new Map();

/**
 * Enregistre une valeur manuelle pour un poste.
 * @param {string} path   Chemin dot-notation du poste
 * @param {number} valeur Valeur saisie par l'utilisateur (entier €)
 */
export function setOverride(path, valeur) {
  _registry.set(path, Math.round(valeur));
}

/**
 * Supprime le verrou d'un poste (le remet sous contrôle du moteur).
 * @param {string} path
 */
export function removeOverride(path) {
  _registry.delete(path);
}

/**
 * Retourne true si le poste est verrouillé manuellement.
 * @param {string} path
 * @returns {boolean}
 */
export function isLocked(path) {
  return _registry.has(path);
}

/**
 * Retourne la valeur verrouillée d'un poste, ou undefined.
 * @param {string} path
 * @returns {number|undefined}
 */
export function getOverride(path) {
  return _registry.get(path);
}

/**
 * Retourne une copie de tous les overrides actifs.
 * @returns {Map<string, number>}
 */
export function getOverrides() {
  return new Map(_registry);
}

/**
 * Vide tous les verrous (appelé au démarrage d'un nouveau bilan).
 */
export function clearOverrides() {
  _registry.clear();
}

/**
 * Retourne le nombre de postes verrouillés.
 * @returns {number}
 */
export function countOverrides() {
  return _registry.size;
}
