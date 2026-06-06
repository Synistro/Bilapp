/**
 * validator.js — Bilapp
 * -------------------------------------------------------
 * Valide les contraintes comptables d'un BilanData produit
 * par engine.js. Fonctions pures, zéro effet de bord.
 *
 * Retourne { success, errors } pour permettre un affichage
 * ciblé des violations sans crasher l'UI.
 */

'use strict';

// ============================================================
// RÈGLES DE VALIDATION
// ============================================================

const RULES = [
  {
    code: 'V01',
    message: 'Actif net ≠ Passif total (tolérance ±1€)',
    /**
     * @param {object} data  BilanData
     * @returns {boolean}    true = règle respectée
     */
    check: (data) =>
      Math.abs(data.bilan.actif.totalNet - data.bilan.passif.total) <= 1,
  },
  {
    code: 'V02',
    message: 'Résultat net ≠ Résultat au passif (capitaux propres)',
    check: (data) =>
      data.resultat.resultatNet === data.bilan.passif.capitauxPropres.resultat,
  },
  {
    code: 'V03',
    message: 'Capital social ≤ 0',
    check: (data) =>
      data.bilan.passif.capitauxPropres.capital > 0,
  },
  {
    code: 'V04',
    message: 'Résultat net positif alors que l\'orientation est déficitaire',
    check: (data) =>
      data.meta.orientation !== 'negatif' || data.resultat.resultatNet < 0,
  },
  {
    code: 'V05',
    message: 'Stocks ≠ 0 alors que hasStocks = false',
    check: (data) =>
      data.meta.hasStocks || data.bilan.actif.circulant.stocks.total.net === 0,
  },
  {
    code: 'V06',
    message: 'Actif immobilisé ≠ 0 alors que hasImmobilisations = false',
    check: (data) =>
      data.meta.hasImmobilisations || data.bilan.actif.immobilise.total.net === 0,
  },
];

// ============================================================
// FONCTION PUBLIQUE
// ============================================================

/**
 * Valide un BilanData produit par engine.generate().
 *
 * @param {object} data  BilanData complet
 * @returns {{ success: boolean, errors: Array<{ code: string, message: string }> }}
 */
export function validate(data) {
  const errors = RULES
    .filter((rule) => !rule.check(data))
    .map(({ code, message }) => ({ code, message }));

  return {
    success: errors.length === 0,
    errors,
  };
}
