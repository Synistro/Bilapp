/**
 * bilan.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML du bilan comptable (actif + passif).
 * Orchestre aussi la navigation par onglets entre documents.
 *
 * Exports :
 *   renderDocuments(data, params) — point d'entrée principal
 *
 * RÈGLE : zéro calcul métier ici. Ce module transforme
 * BilanData en HTML uniquement.
 */

'use strict';

import { fmt, zeroCls, buildHeader, buildTabs } from '../utils/doc-helpers.js';
import { buildResultat }                         from './resultat.js';

// ============================================================
// ACTIF — CONSTRUCTEURS DE LIGNES
// ============================================================

/**
 * Ligne de poste actif (brut / amort / net / n1-net optionnel).
 * @param {string}      libelle
 * @param {object}      p        { brut, amort, net }
 * @param {number|null} n1Net
 * @param {boolean}     indent
 * @returns {string}
 */
function rowActif(libelle, p, n1Net = null, indent = true) {
  const n1Cell = n1Net !== null
    ? `<td class="col--n1 ${zeroCls(n1Net)}">${fmt(n1Net)}</td>`
    : '';
  return `
    <tr>
      <td style="${indent ? 'padding-left:2rem' : ''}">${libelle}</td>
      <td class="${zeroCls(p.brut)}">${fmt(p.brut)}</td>
      <td class="${zeroCls(p.amort)}">${fmt(p.amort)}</td>
      <td class="${zeroCls(p.net)}">${fmt(p.net)}</td>
      ${n1Cell}
    </tr>
  `;
}

/**
 * Ligne de sous-total actif.
 * @param {string}      libelle
 * @param {object}      p
 * @param {number|null} n1Net
 * @returns {string}
 */
function rowActifSubtotal(libelle, p, n1Net = null) {
  const n1Cell = n1Net !== null
    ? `<td class="col--n1">${fmt(n1Net)}</td>`
    : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td>${fmt(p.brut)}</td>
      <td>${fmt(p.amort)}</td>
      <td>${fmt(p.net)}</td>
      ${n1Cell}
    </tr>
  `;
}

// ============================================================
// ACTIF — TABLEAU COMPLET
// ============================================================

/**
 * Construit le tableau Actif complet.
 * @param {object}      bilan
 * @param {object|null} n1
 * @returns {string}    HTML
 */
function buildActif(bilan, n1) {
  const a     = bilan.actif;
  const an1   = n1?.bilan?.actif ?? null;
  const hasN1 = an1 !== null;
  const cols  = hasN1 ? 5 : 4;

  const thN1 = hasN1 ? `<th class="col-width--n1">N-1 Net</th>` : '';
  const n1v  = (fn) => hasN1 ? fn(an1) : null;

  return `
    <div class="doc-section">
      <div class="doc-section__title">Actif</div>
      <table class="doc-table">
        <colgroup>
          <col class="col-width--libelle" />
          <col class="col-width--brut" />
          <col class="col-width--amort" />
          <col class="col-width--net" />
          ${hasN1 ? '<col class="col-width--n1" />' : ''}
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Brut</th>
            <th>Amort / Dép.</th>
            <th>Net</th>
            ${thN1}
          </tr>
        </thead>
        <tbody>

          <tr class="row--section"><td colspan="${cols}">Actif immobilisé</td></tr>

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations incorporelles</td></tr>
          ${rowActif('Frais d\'établissement',     a.immobilise.incorporel.fraisEtablissement, n1v(x => x.immobilise.incorporel.fraisEtablissement.net))}
          ${rowActif('Frais de R&D',               a.immobilise.incorporel.fraisRD,            n1v(x => x.immobilise.incorporel.fraisRD.net))}
          ${rowActif('Brevets, licences, marques', a.immobilise.incorporel.brevets,            n1v(x => x.immobilise.incorporel.brevets.net))}
          ${rowActif('Fonds commercial',           a.immobilise.incorporel.fondsCommercial,    n1v(x => x.immobilise.incorporel.fondsCommercial.net))}
          ${rowActif('Autres immos incorporelles', a.immobilise.incorporel.autresIncorporel,   n1v(x => x.immobilise.incorporel.autresIncorporel.net))}
          ${rowActifSubtotal('Total incorporel',   a.immobilise.incorporel.total,              n1v(x => x.immobilise.incorporel.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations corporelles</td></tr>
          ${rowActif('Terrains',                 a.immobilise.corporel.terrains,       n1v(x => x.immobilise.corporel.terrains.net))}
          ${rowActif('Constructions',            a.immobilise.corporel.constructions,  n1v(x => x.immobilise.corporel.constructions.net))}
          ${rowActif('Installations techniques', a.immobilise.corporel.installations,  n1v(x => x.immobilise.corporel.installations.net))}
          ${rowActif('Autres immos corporelles', a.immobilise.corporel.autresCorporel, n1v(x => x.immobilise.corporel.autresCorporel.net))}
          ${rowActifSubtotal('Total corporel',   a.immobilise.corporel.total,          n1v(x => x.immobilise.corporel.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Immobilisations financières</td></tr>
          ${rowActif('Participations',           a.immobilise.financier.participations, n1v(x => x.immobilise.financier.participations.net))}
          ${rowActif('Autres immos financières', a.immobilise.financier.autresFinancier,n1v(x => x.immobilise.financier.autresFinancier.net))}
          ${rowActifSubtotal('Total financier',  a.immobilise.financier.total,          n1v(x => x.immobilise.financier.total.net))}

          ${rowActifSubtotal('TOTAL ACTIF IMMOBILISÉ', a.immobilise.total, n1v(x => x.immobilise.total.net))}

          <tr class="row--section"><td colspan="${cols}">Actif circulant</td></tr>

          <tr class="row--subsection"><td colspan="${cols}">Stocks et en-cours</td></tr>
          ${rowActif('Matières premières',     a.circulant.stocks.matieresPremières, n1v(x => x.circulant.stocks.matieresPremières.net))}
          ${rowActif('En-cours de production', a.circulant.stocks.enCours,           n1v(x => x.circulant.stocks.enCours.net))}
          ${rowActif('Produits finis',         a.circulant.stocks.produitsFinis,     n1v(x => x.circulant.stocks.produitsFinis.net))}
          ${rowActif('Marchandises',           a.circulant.stocks.marchandises,      n1v(x => x.circulant.stocks.marchandises.net))}
          ${rowActifSubtotal('Total stocks',   a.circulant.stocks.total,             n1v(x => x.circulant.stocks.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Créances</td></tr>
          ${rowActif('Clients et comptes rattachés', a.circulant.creances.clients,        n1v(x => x.circulant.creances.clients.net))}
          ${rowActif('Autres créances',              a.circulant.creances.autresCreances, n1v(x => x.circulant.creances.autresCreances.net))}
          ${rowActifSubtotal('Total créances',       a.circulant.creances.total,          n1v(x => x.circulant.creances.total.net))}

          <tr class="row--subsection"><td colspan="${cols}">Disponibilités</td></tr>
          ${rowActif('Valeurs mobilières de placement', a.circulant.disponibilites.vmp,          n1v(x => x.circulant.disponibilites.vmp.net))}
          ${rowActif('Banques, caisses',                a.circulant.disponibilites.banqueCaisse, n1v(x => x.circulant.disponibilites.banqueCaisse.net))}
          ${rowActifSubtotal('Total disponibilités',    a.circulant.disponibilites.total,        n1v(x => x.circulant.disponibilites.total.net))}

          ${rowActifSubtotal('TOTAL ACTIF CIRCULANT', a.circulant.total, n1v(x => x.circulant.total.net))}

          <tr class="row--section"><td colspan="${cols}">Comptes de régularisation</td></tr>
          ${rowActif('Charges constatées d\'avance', a.regularisation.chargesConstatees, n1v(x => x.regularisation.chargesConstatees.net), false)}

          <tr class="row--total">
            <td>TOTAL ACTIF</td>
            <td></td>
            <td></td>
            <td>${fmt(a.totalNet)}</td>
            ${hasN1 ? `<td class="col--n1">${fmt(an1.totalNet)}</td>` : ''}
          </tr>

        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// PASSIF — CONSTRUCTEURS DE LIGNES
// ============================================================

/**
 * Ligne de poste passif.
 * @param {string}      libelle
 * @param {number}      montant
 * @param {number|null} n1
 * @param {boolean}     indent
 * @returns {string}
 */
function rowPassif(libelle, montant, n1 = null, indent = true) {
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
 * Ligne de sous-total passif.
 * @param {string}      libelle
 * @param {number}      montant
 * @param {number|null} n1
 * @returns {string}
 */
function rowPassifSubtotal(libelle, montant, n1 = null) {
  const n1Cell = n1 !== null ? `<td class="col--n1">${fmt(n1)}</td>` : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td>${fmt(montant)}</td>
      ${n1Cell}
    </tr>
  `;
}

// ============================================================
// PASSIF — TABLEAU COMPLET
// ============================================================

/**
 * Construit le tableau Passif complet.
 * @param {object}      bilan
 * @param {object|null} n1
 * @returns {string}    HTML
 */
function buildPassif(bilan, n1) {
  const p     = bilan.passif;
  const pn1   = n1?.bilan?.passif ?? null;
  const hasN1 = pn1 !== null;
  const cols  = hasN1 ? 3 : 2;

  const thN1 = hasN1 ? `<th class="col-width--n1">N-1</th>` : '';
  const n1v  = (fn) => hasN1 ? fn(pn1) : null;

  return `
    <div class="doc-section">
      <div class="doc-section__title">Passif</div>
      <table class="doc-table">
        <colgroup>
          <col style="width:60%" />
          <col style="width:${hasN1 ? '20%' : '40%'}" />
          ${hasN1 ? '<col style="width:20%" />' : ''}
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>Montant</th>
            ${thN1}
          </tr>
        </thead>
        <tbody>

          <tr class="row--section"><td colspan="${cols}">Capitaux propres</td></tr>
          ${rowPassif('Capital social',          p.capitauxPropres.capital,        n1v(x => x.capitauxPropres.capital))}
          ${rowPassif('Primes d\'émission',      p.capitauxPropres.primesEmission, n1v(x => x.capitauxPropres.primesEmission))}
          ${rowPassif('Réserve légale',          p.capitauxPropres.reserveLegale,  n1v(x => x.capitauxPropres.reserveLegale))}
          ${rowPassif('Autres réserves',         p.capitauxPropres.autresReserves, n1v(x => x.capitauxPropres.autresReserves))}
          ${rowPassif('Report à nouveau',        p.capitauxPropres.reportANouveau, n1v(x => x.capitauxPropres.reportANouveau))}
          ${rowPassif('Résultat de l\'exercice', p.capitauxPropres.resultat,       n1v(x => x.capitauxPropres.resultat))}
          ${rowPassifSubtotal('TOTAL CAPITAUX PROPRES', p.capitauxPropres.total,   n1v(x => x.capitauxPropres.total))}

          <tr class="row--section"><td colspan="${cols}">Provisions</td></tr>
          ${rowPassif('Provisions pour risques', p.provisions.risques, n1v(x => x.provisions.risques))}
          ${rowPassif('Provisions pour charges', p.provisions.charges, n1v(x => x.provisions.charges))}
          ${rowPassifSubtotal('TOTAL PROVISIONS', p.provisions.total,  n1v(x => x.provisions.total))}

          <tr class="row--section"><td colspan="${cols}">Dettes</td></tr>
          ${rowPassif('Emprunts et dettes financières',    p.dettes.emprunts,         n1v(x => x.dettes.emprunts))}
          ${rowPassif('Fournisseurs et comptes rattachés', p.dettes.fournisseurs,     n1v(x => x.dettes.fournisseurs))}
          ${rowPassif('Dettes fiscales et sociales',       p.dettes.fiscalesSociales, n1v(x => x.dettes.fiscalesSociales))}
          ${rowPassif('Autres dettes',                     p.dettes.autresDettes,     n1v(x => x.dettes.autresDettes))}
          ${rowPassifSubtotal('TOTAL DETTES', p.dettes.total, n1v(x => x.dettes.total))}

          <tr class="row--section"><td colspan="${cols}">Comptes de régularisation</td></tr>
          ${rowPassif('Produits constatés d\'avance', p.regularisation.produitsConstates, n1v(x => x.regularisation.produitsConstates), false)}

          <tr class="row--total">
            <td>TOTAL PASSIF</td>
            <td>${fmt(p.total)}</td>
            ${hasN1 ? `<td class="col--n1">${fmt(pn1.total)}</td>` : ''}
          </tr>

        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
// ORCHESTRATEUR
// ============================================================

/**
 * Injecte les documents dans #app et gère la navigation par onglets.
 *
 * @param {object} data    BilanData complet
 * @param {object} params  BilanParams
 */
export function renderDocuments(data, params) {
  const app = document.getElementById('app');

  function renderTab(tab) {
    const titres = {
      bilan:    'Bilan comptable',
      resultat: 'Compte de résultat',
      annexe:   'Annexe comptable',
    };

    let content = '';
    if (tab === 'bilan') {
      content = `
        <div class="bilan-layout">
          ${buildActif(data.bilan, data.n1)}
          ${buildPassif(data.bilan, data.n1)}
        </div>
      `;
    } else if (tab === 'resultat') {
      content = buildResultat(data.resultat, data.n1);
    }
    // tab === 'annexe' → P7

    app.innerHTML = `
      <header class="app-header">
        <div class="container">
          <div class="app-header__logo">Bil<span>app</span></div>
          <div class="app-header__subtitle">Générateur de bilans comptables pédagogiques</div>
        </div>
      </header>
      <div class="doc-page">
        ${buildHeader(data.meta, titres[tab] ?? tab)}
        <div class="doc-actions">
          <div class="doc-actions__left">
            <button class="btn btn--secondary btn--sm" id="btnRetour">← Nouveau bilan</button>
          </div>
          <div class="doc-actions__right">
            <button class="btn btn--ghost btn--sm" id="btnPrint">⎙ Imprimer</button>
          </div>
        </div>
        ${buildTabs(tab, params.output)}
        <div id="docContent">${content}</div>
      </div>
    `;

    app.querySelectorAll('.doc-tab').forEach(btn => {
      btn.addEventListener('click', () => renderTab(btn.dataset.tab));
    });

    app.querySelector('#btnRetour')?.addEventListener('click', () => {
      window.location.reload();
    });

    app.querySelector('#btnPrint')?.addEventListener('click', () => {
      window.print();
    });
  }

  renderTab(params.output.bilan ? 'bilan' : 'resultat');
}
