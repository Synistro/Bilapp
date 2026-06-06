/**
 * resultat.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML du compte de résultat.
 * Reçoit BilanData et retourne du HTML pur — zéro DOM direct.
 *
 * Exports :
 *   buildResultat(resultat, n1) — construit le tableau HTML
 *
 * Évolutions prévues :
 *   - Soldes Intermédiaires de Gestion (SIG)
 *   - Capacité d'Autofinancement (CAF)
 *   - Ratios de rentabilité
 */

'use strict';

import { fmt, fmtResultat, zeroCls } from '../utils/doc-helpers.js';

// ============================================================
// CONSTRUCTEURS DE LIGNES
// ============================================================

/**
 * Ligne de poste standard.
 * @param {string}      libelle
 * @param {number}      montant
 * @param {number|null} n1
 * @param {boolean}     indent
 * @returns {string}
 */
function rowCR(libelle, montant, n1 = null, indent = true) {
  const n1Cell = n1 !== null
    ? `<td class="col--n1 ${zeroCls(n1)}">${fmt(n1)}</td>`
    : '';
  return `
    <tr>
      <td style="${indent ? 'padding-left:2rem' : ''}">${libelle}</td>
      <td class="${zeroCls(montant)}">${fmt(montant)}</td>
      ${n1Cell}
    </tr>
  `;
}

/**
 * Ligne de sous-total.
 * @param {string}      libelle
 * @param {number}      montant
 * @param {number|null} n1
 * @returns {string}
 */
function rowCRSubtotal(libelle, montant, n1 = null) {
  const n1Cell = n1 !== null ? `<td class="col--n1">${fmt(n1)}</td>` : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td>${fmt(montant)}</td>
      ${n1Cell}
    </tr>
  `;
}

/**
 * Ligne de résultat intermédiaire avec couleur positif/négatif.
 * @param {string}      libelle
 * @param {number}      montant
 * @param {number|null} n1
 * @returns {string}
 */
function rowCRResultat(libelle, montant, n1 = null) {
  const { text, cls } = fmtResultat(montant);
  const n1Cell = n1 !== null
    ? (() => { const r = fmtResultat(n1); return `<td class="col--n1 ${r.cls}">${r.text}</td>`; })()
    : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td class="${cls}">${text}</td>
      ${n1Cell}
    </tr>
  `;
}

// ============================================================
// CONSTRUCTEUR PRINCIPAL
// ============================================================

/**
 * Construit le tableau HTML du compte de résultat complet.
 *
 * @param {object}      resultat  BilanData.resultat
 * @param {object|null} n1        BilanData.n1 (ou null)
 * @returns {string}              HTML
 */
export function buildResultat(resultat, n1) {
  const r     = resultat;
  const rn1   = n1?.resultat ?? null;
  const hasN1 = rn1 !== null;
  const cols  = hasN1 ? 3 : 2;

  const thN1             = hasN1 ? `<th class="col-width--cr-n1">N-1</th>` : '';
  const n1v              = (fn) => hasN1 ? fn(rn1) : null;
  const { text: rnetText, cls: rnetCls } = fmtResultat(r.resultatNet);

  return `
    <div class="doc-section">
      <div class="doc-section__title">Compte de résultat</div>
      <table class="doc-table">
        <colgroup>
          <col class="col-width--cr-libelle" />
          <col class="col-width--cr-montant" />
          ${hasN1 ? '<col class="col-width--cr-n1" />' : ''}
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Exercice N</th>
            ${thN1}
          </tr>
        </thead>
        <tbody>

          <!-- PRODUITS D'EXPLOITATION -->
          <tr class="row--section"><td colspan="${cols}">Produits d'exploitation</td></tr>
          ${rowCR('Chiffre d\'affaires net',         r.produitsExploitation.ca,                n1v(x => x.produitsExploitation.ca))}
          ${rowCR('Production stockée',              r.produitsExploitation.productionStockee, n1v(x => x.produitsExploitation.productionStockee))}
          ${rowCR('Subventions d\'exploitation',     r.produitsExploitation.subventions,       n1v(x => x.produitsExploitation.subventions))}
          ${rowCR('Autres produits',                 r.produitsExploitation.autresProduits,    n1v(x => x.produitsExploitation.autresProduits))}
          ${rowCRSubtotal('Total produits exploitation', r.produitsExploitation.total,         n1v(x => x.produitsExploitation.total))}

          <!-- CHARGES D'EXPLOITATION -->
          <tr class="row--section"><td colspan="${cols}">Charges d'exploitation</td></tr>
          ${rowCR('Achats de marchandises',            r.chargesExploitation.achatsMarchandises, n1v(x => x.chargesExploitation.achatsMarchandises))}
          ${rowCR('Variation de stocks',               r.chargesExploitation.variationStocks,    n1v(x => x.chargesExploitation.variationStocks))}
          ${rowCR('Achats de matières premières',      r.chargesExploitation.achatsMatieres,     n1v(x => x.chargesExploitation.achatsMatieres))}
          ${rowCR('Autres achats et charges externes', r.chargesExploitation.autresAchats,       n1v(x => x.chargesExploitation.autresAchats))}
          ${rowCR('Impôts, taxes et versements',       r.chargesExploitation.impotsTaxes,        n1v(x => x.chargesExploitation.impotsTaxes))}
          ${rowCR('Charges de personnel',              r.chargesExploitation.chargesPersonnel,   n1v(x => x.chargesExploitation.chargesPersonnel))}
          ${rowCR('Dotations aux amortissements',      r.chargesExploitation.dotationsAmort,     n1v(x => x.chargesExploitation.dotationsAmort))}
          ${rowCRSubtotal('Total charges exploitation', r.chargesExploitation.total,             n1v(x => x.chargesExploitation.total))}

          ${rowCRResultat('RÉSULTAT D\'EXPLOITATION', r.resultatExploitation, n1v(x => x.resultatExploitation))}

          <!-- FINANCIER -->
          <tr class="row--section"><td colspan="${cols}">Résultat financier</td></tr>
          ${rowCR('Produits financiers', r.produitsFinanciers, n1v(x => x.produitsFinanciers))}
          ${rowCR('Charges financières', r.chargesFinancieres, n1v(x => x.chargesFinancieres))}
          ${rowCRResultat('RÉSULTAT FINANCIER', r.resultatFinancier, n1v(x => x.resultatFinancier))}

          ${rowCRResultat('RÉSULTAT COURANT AVANT IMPÔTS', r.resultatCourant, n1v(x => x.resultatCourant))}

          <!-- EXCEPTIONNEL -->
          <tr class="row--section"><td colspan="${cols}">Résultat exceptionnel</td></tr>
          ${rowCR('Produits exceptionnels',  r.produitsExceptionnels,  n1v(x => x.produitsExceptionnels))}
          ${rowCR('Charges exceptionnelles', r.chargesExceptionnelles, n1v(x => x.chargesExceptionnelles))}
          ${rowCRResultat('RÉSULTAT EXCEPTIONNEL', r.resultatExceptionnel, n1v(x => x.resultatExceptionnel))}

          <!-- IS + PARTICIPATION -->
          <tr class="row--section"><td colspan="${cols}">Impôts et participation</td></tr>
          ${rowCR('Participation des salariés', r.participation, n1v(x => x.participation), false)}
          ${rowCR('Impôts sur les bénéfices',   r.impots,        n1v(x => x.impots),        false)}

          <!-- RÉSULTAT NET -->
          <tr class="row--resultat-net">
            <td>RÉSULTAT NET DE L'EXERCICE</td>
            <td class="${rnetCls}">${rnetText}</td>
            ${hasN1 ? (() => { const rn = fmtResultat(rn1.resultatNet); return `<td class="col--n1 ${rn.cls}">${rn.text}</td>`; })() : ''}
          </tr>

        </tbody>
      </table>
    </div>
  `;
}
