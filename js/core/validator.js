/**
 * validator.js — Bilapp
 * -------------------------------------------------------
 * Règles de cohérence comptable.
 * Vérifie un objet BilanData avant tout rendu.
 * Bloque la génération si une règle échoue.
 *
 * Retourne toujours : { success: Boolean, errors: Array<{ code, message }> }
 *
 * Règles implémentées :
 *   V01 — Total Actif Net === Total Passif (tolérance 1€)
 *   V02 — Résultat net bilan === Résultat net compte de résultat
 *   V03 — Capital social > 0 pour SAS/SARL/SA
 *   V04 — Résultat net < 0 si orientation = 'negatif'
 *   V05 — Stocks === 0 si hasStocks === false
 *   V06 — Actif immobilisé === 0 si hasImmobilisations === false
 */

'use strict';

// TODO — Phase P3 : implémenter le validateur
