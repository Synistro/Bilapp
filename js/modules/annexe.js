/**
 * annexe.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML de l'annexe comptable pédagogique.
 *
 * Contenu :
 *   1. Tableau des immobilisations (brut début/fin + acquisitions/cessions)
 *   2. Tableau des amortissements (cumulés début/fin + dotations N)
 *   3. Variation des capitaux propres (N-1 → affectation → N)
 *   4. Règles et méthodes comptables (texte paramétré)
 *
 * Exports :
 *   buildAnnexe(data, params) — retourne du HTML pur
 *
 * RÈGLE : lecture seule — zéro édition inline, zéro effet de bord.
 * L'annexe consomme BilanData ; elle ne le modifie jamais.
 *
 * Données N-1 : affichées si data.n1 !== null, sinon colonnes marquées '—'.
 */

'use strict';

import { fmt, fmtResultat, fmtDateFR } from '../utils/doc-helpers.js';
import { DUREES_AMORT }                 from '../core/constants.js';

// ============================================================
// UTILITAIRES INTERNES
// ============================================================

/**
 * Affiche un montant ou '—' si null/undefined.
 * @param {number|null|undefined} n
 * @returns {string}
 */
function fmtOpt(n) {
  return (n == null) ? '—' : fmt(n);
}

/**
 * Calcule les acquisitions nettes de l'exercice pour un poste d'actif.
 * Acquisitions = brut N − brut N-1 si positif, 0 sinon.
 * Cessions     = brut N-1 − brut N  si positif, 0 sinon.
 * @param {number} brutN
 * @param {number|null} brutN1
 * @returns {{ acquisitions: number|null, cessions: number|null }}
 */
function deltaImmo(brutN, brutN1) {
  if (brutN1 == null) return { acquisitions: null, cessions: null };
  const delta = brutN - brutN1;
  return {
    acquisitions: delta > 0 ? delta : 0,
    cessions:     delta < 0 ? -delta : 0,
  };
}

// ============================================================
// SECTION 1 — TABLEAU DES IMMOBILISATIONS
// ============================================================

/**
 * Une ligne du tableau immos : brut début, acquisitions, cessions, brut fin.
 * @param {string}      libelle
 * @param {number}      brutN
 * @param {number|null} brutN1
 * @param {boolean}     isTotal
 * @returns {string}
 */
function rowImmo(libelle, brutN, brutN1, isTotal = false) {
  const { acquisitions, cessions } = deltaImmo(brutN, brutN1);
  const cls = isTotal ? 'row--subtotal' : '';
  return `
    <tr class="${cls}">
      <td>${libelle}</td>
      <td class="col--num">${fmtOpt(brutN1)}</td>
      <td class="col--num">${fmtOpt(acquisitions)}</td>
      <td class="col--num">${fmtOpt(cessions)}</td>
      <td class="col--num">${fmt(brutN)}</td>
    </tr>
  `;
}

/**
 * @param {object}      immoN   bilan.actif.immobilise (exercice N)
 * @param {object|null} immoN1  bilan.actif.immobilise (exercice N-1) ou null
 * @returns {string}
 */
function buildTableauImmos(immoN, immoN1) {
  const b1 = (fn) => immoN1 ? fn(immoN1) : null;
  const i   = immoN;

  return `
    <div class="doc-section">
      <div class="doc-section__title">1. Tableau des immobilisations</div>
      <table class="doc-table annexe-table">
        <colgroup>
          <col style="width:36%"/>
          <col style="width:16%"/>
          <col style="width:16%"/>
          <col style="width:16%"/>
          <col style="width:16%"/>
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th class="col--num">Brut début<br/>d'exercice</th>
            <th class="col--num">Acquisitions</th>
            <th class="col--num">Cessions /<br/>sorties</th>
            <th class="col--num">Brut fin<br/>d'exercice</th>
          </tr>
        </thead>
        <tbody>
          <tr class="row--section"><td colspan="5">Immobilisations incorporelles</td></tr>
          ${rowImmo('Frais d\'établissement',     i.incorporel.fraisEtablissement.brut, b1(x => x.incorporel.fraisEtablissement.brut))}
          ${rowImmo('Frais de R&D',               i.incorporel.fraisRD.brut,            b1(x => x.incorporel.fraisRD.brut))}
          ${rowImmo('Brevets, licences, marques', i.incorporel.brevets.brut,            b1(x => x.incorporel.brevets.brut))}
          ${rowImmo('Fonds commercial',           i.incorporel.fondsCommercial.brut,    b1(x => x.incorporel.fondsCommercial.brut))}
          ${rowImmo('Autres incorporelles',       i.incorporel.autresIncorporel.brut,   b1(x => x.incorporel.autresIncorporel.brut))}
          ${rowImmo('Sous-total incorporel',      i.incorporel.total.brut,              b1(x => x.incorporel.total.brut), true)}

          <tr class="row--section"><td colspan="5">Immobilisations corporelles</td></tr>
          ${rowImmo('Terrains',                 i.corporel.terrains.brut,       b1(x => x.corporel.terrains.brut))}
          ${rowImmo('Constructions',            i.corporel.constructions.brut,  b1(x => x.corporel.constructions.brut))}
          ${rowImmo('Installations techniques', i.corporel.installations.brut,  b1(x => x.corporel.installations.brut))}
          ${rowImmo('Autres corporelles',       i.corporel.autresCorporel.brut, b1(x => x.corporel.autresCorporel.brut))}
          ${rowImmo('Sous-total corporel',      i.corporel.total.brut,          b1(x => x.corporel.total.brut), true)}

          <tr class="row--section"><td colspan="5">Immobilisations financières</td></tr>
          ${rowImmo('Titres de participation',    i.financier.participations.brut,   b1(x => x.financier.participations.brut))}
          ${rowImmo('Autres financières',         i.financier.autresFinancier.brut,  b1(x => x.financier.autresFinancier.brut))}
          ${rowImmo('Sous-total financier',       i.financier.total.brut,            b1(x => x.financier.total.brut), true)}

          <tr class="row--total">
            <td>TOTAL IMMOBILISATIONS</td>
            <td class="col--num">${fmtOpt(b1(x => x.total.brut))}</td>
            <td class="col--num">—</td>
            <td class="col--num">—</td>
            <td class="col--num">${fmt(i.total.brut)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// SECTION 2 — TABLEAU DES AMORTISSEMENTS
// ============================================================

/**
 * Une ligne du tableau amortissements : cumulés début, dotation N, cumulés fin.
 * Dotation estimée = amort N − amort N-1 si N-1 dispo et positif, sinon '—'.
 * @param {string}      libelle
 * @param {number}      amortN
 * @param {number|null} amortN1
 * @param {boolean}     isTotal
 * @returns {string}
 */
function rowAmort(libelle, amortN, amortN1, isTotal = false) {
  const dotation = (amortN1 != null && amortN > amortN1) ? amortN - amortN1 : null;
  const cls = isTotal ? 'row--subtotal' : '';
  return `
    <tr class="${cls}">
      <td>${libelle}</td>
      <td class="col--num">${fmtOpt(amortN1)}</td>
      <td class="col--num">${fmtOpt(dotation)}</td>
      <td class="col--num">${fmt(amortN)}</td>
    </tr>
  `;
}

/**
 * @param {object}      immoN
 * @param {object|null} immoN1
 * @param {number}      dotationsTotalesN  resultat.chargesExploitation.dotationsAmort
 * @returns {string}
 */
function buildTableauAmorts(immoN, immoN1, dotationsTotalesN) {
  const b1 = (fn) => immoN1 ? fn(immoN1) : null;
  const i   = immoN;

  return `
    <div class="doc-section">
      <div class="doc-section__title">2. Tableau des amortissements</div>
      <p class="annexe-note">
        Les dotations de l'exercice issues du compte de résultat s'élèvent à
        <strong>${fmt(dotationsTotalesN)}</strong>.
        Le détail par catégorie est estimé proportionnellement au brut de chaque poste.
      </p>
      <table class="doc-table annexe-table">
        <colgroup>
          <col style="width:40%"/>
          <col style="width:20%"/>
          <col style="width:20%"/>
          <col style="width:20%"/>
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th class="col--num">Cumulés début<br/>d'exercice</th>
            <th class="col--num">Dotations N</th>
            <th class="col--num">Cumulés fin<br/>d'exercice</th>
          </tr>
        </thead>
        <tbody>
          <tr class="row--section"><td colspan="4">Immobilisations incorporelles</td></tr>
          ${rowAmort('Frais d\'établissement',     i.incorporel.fraisEtablissement.amort, b1(x => x.incorporel.fraisEtablissement.amort))}
          ${rowAmort('Frais de R&D',               i.incorporel.fraisRD.amort,            b1(x => x.incorporel.fraisRD.amort))}
          ${rowAmort('Brevets, licences, marques', i.incorporel.brevets.amort,            b1(x => x.incorporel.brevets.amort))}
          ${rowAmort('Autres incorporelles',       i.incorporel.autresIncorporel.amort,   b1(x => x.incorporel.autresIncorporel.amort))}
          ${rowAmort('Sous-total incorporel',      i.incorporel.total.amort,              b1(x => x.incorporel.total.amort), true)}

          <tr class="row--section"><td colspan="4">Immobilisations corporelles</td></tr>
          ${rowAmort('Constructions',            i.corporel.constructions.amort,  b1(x => x.corporel.constructions.amort))}
          ${rowAmort('Installations techniques', i.corporel.installations.amort,  b1(x => x.corporel.installations.amort))}
          ${rowAmort('Autres corporelles',       i.corporel.autresCorporel.amort, b1(x => x.corporel.autresCorporel.amort))}
          ${rowAmort('Sous-total corporel',      i.corporel.total.amort,          b1(x => x.corporel.total.amort), true)}

          <tr class="row--total">
            <td>TOTAL AMORTISSEMENTS</td>
            <td class="col--num">${fmtOpt(b1(x => x.total.amort))}</td>
            <td class="col--num">${fmt(dotationsTotalesN)}</td>
            <td class="col--num">${fmt(i.total.amort)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// SECTION 3 — VARIATION DES CAPITAUX PROPRES
// ============================================================

/**
 * @param {object}      cpN   passif.capitauxPropres (N)
 * @param {object|null} cpN1  passif.capitauxPropres (N-1) ou null
 * @returns {string}
 */
function buildVariationCP(cpN, cpN1) {
  const hasN1 = cpN1 !== null;

  // Affectation du résultat N-1 : s'il est positif, va en réserves ;
  // s'il est négatif, report à nouveau.
  // On ne peut que l'estimer — on affiche la logique sans recalcul.
  const affectationLabel = hasN1 && cpN1.resultat >= 0
    ? 'Affectation résultat N-1 en réserves'
    : 'Report à nouveau résultat N-1';

  function rowCP(libelle, valN, valN1 = null, isTotal = false) {
    const cls = isTotal ? 'row--subtotal' : '';
    const n1Cell = hasN1
      ? `<td class="col--num">${fmtOpt(valN1)}</td>`
      : '';
    const { text, cls: numCls } = valN != null ? fmtResultat(valN) : { text: '—', cls: '' };
    return `
      <tr class="${cls}">
        <td>${libelle}</td>
        ${n1Cell}
        <td class="col--num is-placeholder">—</td>
        <td class="col--num ${numCls}">${text}</td>
      </tr>
    `;
  }

  const thN1 = hasN1 ? `<th class="col--num">Solde N-1</th>` : '';

  return `
    <div class="doc-section">
      <div class="doc-section__title">3. Variation des capitaux propres</div>
      <table class="doc-table annexe-table">
        <colgroup>
          <col style="width:40%"/>
          ${hasN1 ? '<col style="width:20%"/>' : ''}
          <col style="width:${hasN1 ? '20%' : '30%'}"/>
          <col style="width:${hasN1 ? '20%' : '30%'}"/>
        </colgroup>
        <thead>
          <tr>
            <th></th>
            ${thN1}
            <th class="col--num">${affectationLabel}</th>
            <th class="col--num">Solde N</th>
          </tr>
        </thead>
        <tbody>
          ${rowCP('Capital social',          cpN.capital,        hasN1 ? cpN1.capital        : null)}
          ${rowCP('Primes d\'émission',      cpN.primesEmission, hasN1 ? cpN1.primesEmission : null)}
          ${rowCP('Réserve légale',          cpN.reserveLegale,  hasN1 ? cpN1.reserveLegale  : null)}
          ${rowCP('Autres réserves',         cpN.autresReserves, hasN1 ? cpN1.autresReserves : null)}
          ${rowCP('Report à nouveau',        cpN.reportANouveau, hasN1 ? cpN1.reportANouveau : null)}
          ${rowCP('Résultat de l\'exercice', cpN.resultat,       hasN1 ? cpN1.resultat       : null)}
          ${rowCP('TOTAL CAPITAUX PROPRES',  cpN.total,          hasN1 ? cpN1.total          : null, true)}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// SECTION 4 — RÈGLES ET MÉTHODES COMPTABLES
// ============================================================

/**
 * Génère le bloc textuel des méthodes comptables.
 * Les durées viennent de DUREES_AMORT (constants.js).
 * F54 : utilise la plage de dates si exercice décalé/court.
 * @param {object} meta  BilanData.meta
 * @returns {string}
 */
function buildMethodes(meta) {
  const rows = Object.entries(DUREES_AMORT)
    .map(([, d]) => `
      <tr>
        <td>${d.label}</td>
        <td class="col--center">${d.methode}</td>
        <td class="col--center">${d.min === d.max ? `${d.min} ans` : `${d.min} – ${d.max} ans`}</td>
      </tr>
    `)
    .join('');

  // F54 — libellé de la période dans le texte des méthodes
  const debutD    = meta.dateDebut ? new Date(meta.dateDebut) : null;
  const estDecale = debutD && (debutD.getMonth() !== 0 || debutD.getDate() !== 1);
  const estCourt  = (meta.dureeExerciceMois ?? 12) < 11.5;
  const periodeTxt = (estDecale || estCourt) && meta.dateDebut && meta.dateFin
    ? `du <strong>${fmtDateFR(meta.dateDebut)}</strong> au <strong>${fmtDateFR(meta.dateFin)}</strong>`
    : `clos le <strong>31/12/${meta.anneeExercice}</strong>`;

  return `
    <div class="doc-section">
      <div class="doc-section__title">4. Règles et méthodes comptables</div>

      <p class="annexe-note">
        Les comptes de l'exercice ${periodeTxt} sont établis
        conformément aux dispositions du Plan Comptable Général (PCG 2024) et du Code de commerce.
        Les méthodes d'évaluation retenues sont identiques à celles de l'exercice précédent.
      </p>

      <h4 class="annexe-subtitle">Immobilisations et amortissements</h4>
      <p class="annexe-note">
        Les immobilisations sont comptabilisées à leur coût d'acquisition.
        Les amortissements sont calculés selon le mode linéaire ou dégressif
        en fonction de la nature des biens, sur les durées suivantes :
      </p>
      <table class="doc-table annexe-table annexe-table--compact">
        <colgroup>
          <col style="width:50%"/>
          <col style="width:25%"/>
          <col style="width:25%"/>
        </colgroup>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th class="col--center">Mode</th>
            <th class="col--center">Durée</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <h4 class="annexe-subtitle">Stocks</h4>
      <p class="annexe-note">
        Les stocks sont évalués au coût moyen pondéré (CMP).
        Les dépréciations éventuelles sont constatées par voie de provisions.
      </p>

      <h4 class="annexe-subtitle">Créances et dettes</h4>
      <p class="annexe-note">
        Les créances et dettes sont valorisées à leur valeur nominale.
        Les créances douteuses font l'objet d'une dépréciation individuelle.
      </p>

      ${meta.hasInternational ? `
      <h4 class="annexe-subtitle">Opérations en devises</h4>
      <p class="annexe-note">
        Les opérations libellées en devises sont converties en euros au cours du jour de l'opération.
        Les écarts de conversion sont comptabilisés en compte de résultat.
      </p>
      ` : ''}

      <h4 class="annexe-subtitle">Impôt sur les sociétés</h4>
      <p class="annexe-note">
        La société est soumise à l'impôt sur les sociétés au taux de droit commun (25 %).
        Le taux réduit de 15 % s'applique sur la tranche de bénéfice inférieure à 42 500 €
        sous réserve des conditions d'éligibilité PME.
      </p>
    </div>
  `;
}

// ============================================================
// POINT D'ENTRÉE PUBLIC
// ============================================================

/**
 * Construit l'annexe comptable complète en HTML pur.
 *
 * @param {object} data    BilanData complet
 * @param {object} params  BilanParams (non utilisé directement — réservé extensions futures)
 * @returns {string}       HTML
 */
export function buildAnnexe(data, params) {
  const immoN  = data.bilan.actif.immobilise;
  const immoN1 = data.n1?.bilan?.actif?.immobilise ?? null;
  const cpN    = data.bilan.passif.capitauxPropres;
  const cpN1   = data.n1?.bilan?.passif?.capitauxPropres ?? null;
  const dotations = data.resultat.chargesExploitation.dotationsAmort;

  // L'annexe n'a de sens que si des immobilisations existent
  const hasImmos = immoN.total.brut > 0;

  return `
    <div class="doc-section annexe-wrapper">

      ${hasImmos
        ? buildTableauImmos(immoN, immoN1)
        : `<div class="doc-section">
             <div class="doc-section__title">1. Tableau des immobilisations</div>
             <p class="annexe-note">La société ne possède pas d'immobilisations au cours de l'exercice.</p>
           </div>`
      }

      ${hasImmos
        ? buildTableauAmorts(immoN, immoN1, dotations)
        : `<div class="doc-section">
             <div class="doc-section__title">2. Tableau des amortissements</div>
             <p class="annexe-note">Aucun amortissement à constater.</p>
           </div>`
      }

      ${buildVariationCP(cpN, cpN1)}

      ${buildMethodes(data.meta)}

    </div>
  `;
}
