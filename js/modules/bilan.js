/**
 * bilan.js — Bilapp
 * -------------------------------------------------------
 * Renderer HTML du bilan comptable et du compte de résultat.
 * Reçoit un BilanData (produit par engine.js) et injecte
 * le HTML dans le conteneur #app.
 *
 * Exports :
 *   renderDocuments(data, params) — point d'entrée principal
 *
 * RÈGLE : zéro calcul métier ici. Ce module ne fait que
 * transformer BilanData en HTML. Toute logique appartient
 * à engine.js.
 */

'use strict';

// ============================================================
// UTILITAIRES DE FORMATAGE
// ============================================================

/**
 * Formate un montant en euros, style français.
 * Les zéros sont rendus comme un tiret pour lisibilité comptable.
 * @param {number} n
 * @returns {string}
 */
function fmt(n) {
  if (n === 0) return '—';
  return n.toLocaleString('fr-FR') + ' €';
}

/**
 * Formate un montant et retourne aussi la classe CSS associée.
 * @param {number} n
 * @returns {{ text: string, cls: string }}
 */
function fmtResultat(n) {
  if (n === 0) return { text: '—', cls: '' };
  const text = n.toLocaleString('fr-FR') + ' €';
  const cls  = n > 0 ? 'is-positive' : 'is-negative';
  return { text, cls };
}

/**
 * Retourne 'is-zero' si la valeur est 0, '' sinon.
 * @param {number} n
 * @returns {string}
 */
function zeroCls(n) {
  return n === 0 ? 'is-zero' : '';
}

// ============================================================
// EN-TÊTE DOCUMENT
// ============================================================

/**
 * Construit l'en-tête commun à tous les documents.
 * @param {object} meta   BilanData.meta
 * @param {string} titre  Titre du document
 * @returns {string}      HTML
 */
function buildHeader(meta, titre) {
  return `
    <div class="doc-header">
      <div class="doc-header__left">
        <div class="doc-header__logo">Bilapp</div>
        <div class="doc-header__societe">${meta.societe}</div>
        <div class="doc-header__meta">
          <span class="doc-header__meta-item">
            <strong>${meta.formeJuridique}</strong>
          </span>
          <span class="doc-header__meta-item">
            Secteur : <strong>${meta.secteur}</strong>
          </span>
          <span class="doc-header__meta-item">
            TVA : <strong>${meta.regimeTVA.replace('_', ' ')}</strong>
          </span>
        </div>
      </div>
      <div class="doc-header__right">
        <div class="doc-header__title">${titre}</div>
        <div class="doc-header__exercice">
          Exercice clos le 31/12/${meta.anneeExercice}
        </div>
        <div class="doc-header__mention">${meta.mention}</div>
      </div>
    </div>
  `;
}

// ============================================================
// ONGLETS DE NAVIGATION
// ============================================================

/**
 * Construit les onglets de navigation entre documents.
 * @param {string}   active   Onglet actif : 'bilan' | 'resultat'
 * @param {object}   output   BilanParams.output
 * @returns {string}          HTML
 */
function buildTabs(active, output) {
  const tabs = [];
  if (output.bilan)          tabs.push({ id: 'bilan',    label: 'Bilan' });
  if (output.compteResultat) tabs.push({ id: 'resultat', label: 'Compte de résultat' });
  if (output.annexe)         tabs.push({ id: 'annexe',   label: 'Annexe' });

  return `
    <div class="doc-tabs" role="tablist">
      ${tabs.map(t => `
        <button
          class="doc-tab${active === t.id ? ' is-active' : ''}"
          data-tab="${t.id}"
          role="tab"
          aria-selected="${active === t.id}"
        >${t.label}</button>
      `).join('')}
    </div>
  `;
}

// ============================================================
// BILAN — ACTIF
// ============================================================

/**
 * Génère une ligne de poste actif (brut / amort / net / n1-net).
 * @param {string}  libelle
 * @param {object}  p       { brut, amort, net }
 * @param {number|null} n1Net
 * @param {boolean} indent  Appliquer l'indentation sous-poste
 * @returns {string}
 */
function rowActif(libelle, p, n1Net = null, indent = true) {
  const n1Cell = n1Net !== null
    ? `<td class="col--n1 ${zeroCls(n1Net)}">${fmt(n1Net)}</td>`
    : '';
  return `
    <tr>
      <td class="col--libelle${indent ? ' col--libelle' : ''}" style="${indent ? 'padding-left:2rem' : ''}">${libelle}</td>
      <td class="${zeroCls(p.brut)}">${fmt(p.brut)}</td>
      <td class="${zeroCls(p.amort)}">${fmt(p.amort)}</td>
      <td class="${zeroCls(p.net)}">${fmt(p.net)}</td>
      ${n1Cell}
    </tr>
  `;
}

/**
 * Génère une ligne de sous-total actif.
 * @param {string}  libelle
 * @param {object}  p
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

/**
 * Construit le tableau Actif complet.
 * @param {object} bilan    BilanData.bilan
 * @param {object|null} n1  BilanData.n1
 * @returns {string}        HTML
 */
function buildActif(bilan, n1) {
  const a   = bilan.actif;
  const an1 = n1?.bilan?.actif ?? null;
  const hasN1 = an1 !== null;

  const thN1 = hasN1 ? `<th class="col-width--n1">N-1 Net</th>` : '';

  const n1v = (fn) => hasN1 ? fn(an1) : null;

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

          <!-- ACTIF IMMOBILISÉ -->
          <tr class="row--section"><td colspan="${hasN1 ? 5 : 4}">Actif immobilisé</td></tr>

          <tr class="row--subsection"><td colspan="${hasN1 ? 5 : 4}">Immobilisations incorporelles</td></tr>
          ${rowActif('Frais d\'établissement',    a.immobilise.incorporel.fraisEtablissement, n1v(x => x.immobilise.incorporel.fraisEtablissement.net))}
          ${rowActif('Frais de R&D',              a.immobilise.incorporel.fraisRD,            n1v(x => x.immobilise.incorporel.fraisRD.net))}
          ${rowActif('Brevets, licences, marques',a.immobilise.incorporel.brevets,            n1v(x => x.immobilise.incorporel.brevets.net))}
          ${rowActif('Fonds commercial',          a.immobilise.incorporel.fondsCommercial,    n1v(x => x.immobilise.incorporel.fondsCommercial.net))}
          ${rowActif('Autres immos incorporelles',a.immobilise.incorporel.autresIncorporel,   n1v(x => x.immobilise.incorporel.autresIncorporel.net))}
          ${rowActifSubtotal('Total incorporel',  a.immobilise.incorporel.total,              n1v(x => x.immobilise.incorporel.total.net))}

          <tr class="row--subsection"><td colspan="${hasN1 ? 5 : 4}">Immobilisations corporelles</td></tr>
          ${rowActif('Terrains',                  a.immobilise.corporel.terrains,     n1v(x => x.immobilise.corporel.terrains.net))}
          ${rowActif('Constructions',             a.immobilise.corporel.constructions,n1v(x => x.immobilise.corporel.constructions.net))}
          ${rowActif('Installations techniques',  a.immobilise.corporel.installations,n1v(x => x.immobilise.corporel.installations.net))}
          ${rowActif('Autres immos corporelles',  a.immobilise.corporel.autresCorporel,n1v(x => x.immobilise.corporel.autresCorporel.net))}
          ${rowActifSubtotal('Total corporel',    a.immobilise.corporel.total,        n1v(x => x.immobilise.corporel.total.net))}

          <tr class="row--subsection"><td colspan="${hasN1 ? 5 : 4}">Immobilisations financières</td></tr>
          ${rowActif('Participations',            a.immobilise.financier.participations, n1v(x => x.immobilise.financier.participations.net))}
          ${rowActif('Autres immos financières',  a.immobilise.financier.autresFinancier,n1v(x => x.immobilise.financier.autresFinancier.net))}
          ${rowActifSubtotal('Total financier',   a.immobilise.financier.total,          n1v(x => x.immobilise.financier.total.net))}

          ${rowActifSubtotal('TOTAL ACTIF IMMOBILISÉ', a.immobilise.total, n1v(x => x.immobilise.total.net))}

          <!-- ACTIF CIRCULANT -->
          <tr class="row--section"><td colspan="${hasN1 ? 5 : 4}">Actif circulant</td></tr>

          <tr class="row--subsection"><td colspan="${hasN1 ? 5 : 4}">Stocks et en-cours</td></tr>
          ${rowActif('Matières premières',        a.circulant.stocks.matieresPremières, n1v(x => x.circulant.stocks.matieresPremières.net))}
          ${rowActif('En-cours de production',    a.circulant.stocks.enCours,           n1v(x => x.circulant.stocks.enCours.net))}
          ${rowActif('Produits finis',            a.circulant.stocks.produitsFinis,     n1v(x => x.circulant.stocks.produitsFinis.net))}
          ${rowActif('Marchandises',              a.circulant.stocks.marchandises,      n1v(x => x.circulant.stocks.marchandises.net))}
          ${rowActifSubtotal('Total stocks',      a.circulant.stocks.total,             n1v(x => x.circulant.stocks.total.net))}

          <tr class="row--subsection"><td colspan="${hasN1 ? 5 : 4}">Créances</td></tr>
          ${rowActif('Clients et comptes rattachés', a.circulant.creances.clients,       n1v(x => x.circulant.creances.clients.net))}
          ${rowActif('Autres créances',              a.circulant.creances.autresCreances,n1v(x => x.circulant.creances.autresCreances.net))}
          ${rowActifSubtotal('Total créances',       a.circulant.creances.total,         n1v(x => x.circulant.creances.total.net))}

          <tr class="row--subsection"><td colspan="${hasN1 ? 5 : 4}">Disponibilités</td></tr>
          ${rowActif('Valeurs mobilières de placement', a.circulant.disponibilites.vmp,         n1v(x => x.circulant.disponibilites.vmp.net))}
          ${rowActif('Banques, caisses',                a.circulant.disponibilites.banqueCaisse,n1v(x => x.circulant.disponibilites.banqueCaisse.net))}
          ${rowActifSubtotal('Total disponibilités',    a.circulant.disponibilites.total,       n1v(x => x.circulant.disponibilites.total.net))}

          ${rowActifSubtotal('TOTAL ACTIF CIRCULANT', a.circulant.total, n1v(x => x.circulant.total.net))}

          <!-- RÉGULARISATION -->
          <tr class="row--section"><td colspan="${hasN1 ? 5 : 4}">Comptes de régularisation</td></tr>
          ${rowActif('Charges constatées d\'avance', a.regularisation.chargesConstatees, n1v(x => x.regularisation.chargesConstatees.net), false)}

          <!-- TOTAL GÉNÉRAL -->
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
// BILAN — PASSIF
// ============================================================

/**
 * Génère une ligne de poste passif.
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
 * Génère une ligne de sous-total passif.
 * @param {string}      libelle
 * @param {number}      montant
 * @param {number|null} n1
 * @returns {string}
 */
function rowPassifSubtotal(libelle, montant, n1 = null) {
  const n1Cell = n1 !== null
    ? `<td class="col--n1">${fmt(n1)}</td>`
    : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td>${fmt(montant)}</td>
      ${n1Cell}
    </tr>
  `;
}

/**
 * Construit le tableau Passif complet.
 * @param {object}      bilan
 * @param {object|null} n1
 * @returns {string}    HTML
 */
function buildPassif(bilan, n1) {
  const p   = bilan.passif;
  const pn1 = n1?.bilan?.passif ?? null;
  const hasN1 = pn1 !== null;

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

          <!-- CAPITAUX PROPRES -->
          <tr class="row--section"><td colspan="${hasN1 ? 3 : 2}">Capitaux propres</td></tr>
          ${rowPassif('Capital social',         p.capitauxPropres.capital,        n1v(x => x.capitauxPropres.capital))}
          ${rowPassif('Primes d\'émission',     p.capitauxPropres.primesEmission, n1v(x => x.capitauxPropres.primesEmission))}
          ${rowPassif('Réserve légale',         p.capitauxPropres.reserveLegale,  n1v(x => x.capitauxPropres.reserveLegale))}
          ${rowPassif('Autres réserves',        p.capitauxPropres.autresReserves, n1v(x => x.capitauxPropres.autresReserves))}
          ${rowPassif('Report à nouveau',       p.capitauxPropres.reportANouveau, n1v(x => x.capitauxPropres.reportANouveau))}
          ${rowPassif('Résultat de l\'exercice',p.capitauxPropres.resultat,       n1v(x => x.capitauxPropres.resultat))}
          ${rowPassifSubtotal('TOTAL CAPITAUX PROPRES', p.capitauxPropres.total,  n1v(x => x.capitauxPropres.total))}

          <!-- PROVISIONS -->
          <tr class="row--section"><td colspan="${hasN1 ? 3 : 2}">Provisions</td></tr>
          ${rowPassif('Provisions pour risques', p.provisions.risques, n1v(x => x.provisions.risques))}
          ${rowPassif('Provisions pour charges', p.provisions.charges, n1v(x => x.provisions.charges))}
          ${rowPassifSubtotal('TOTAL PROVISIONS', p.provisions.total,  n1v(x => x.provisions.total))}

          <!-- DETTES -->
          <tr class="row--section"><td colspan="${hasN1 ? 3 : 2}">Dettes</td></tr>
          ${rowPassif('Emprunts et dettes financières', p.dettes.emprunts,         n1v(x => x.dettes.emprunts))}
          ${rowPassif('Fournisseurs et comptes rattachés', p.dettes.fournisseurs,  n1v(x => x.dettes.fournisseurs))}
          ${rowPassif('Dettes fiscales et sociales',    p.dettes.fiscalesSociales, n1v(x => x.dettes.fiscalesSociales))}
          ${rowPassif('Autres dettes',                  p.dettes.autresDettes,     n1v(x => x.dettes.autresDettes))}
          ${rowPassifSubtotal('TOTAL DETTES', p.dettes.total, n1v(x => x.dettes.total))}

          <!-- RÉGULARISATION -->
          <tr class="row--section"><td colspan="${hasN1 ? 3 : 2}">Comptes de régularisation</td></tr>
          ${rowPassif('Produits constatés d\'avance', p.regularisation.produitsConstates, n1v(x => x.regularisation.produitsConstates), false)}

          <!-- TOTAL GÉNÉRAL -->
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
// COMPTE DE RÉSULTAT
// ============================================================

/**
 * Génère une ligne du compte de résultat.
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
 * Génère une ligne de sous-total du compte de résultat.
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
 * Génère une ligne de résultat intermédiaire (avec couleur +/-).
 */
function rowCRResultat(libelle, montant, n1 = null) {
  const { text, cls } = fmtResultat(montant);
  const n1r = n1 !== null ? fmtResultat(n1) : null;
  const n1Cell = n1r !== null
    ? `<td class="col--n1 ${n1r.cls}">${n1r.text}</td>`
    : '';
  return `
    <tr class="row--subtotal">
      <td>${libelle}</td>
      <td class="${cls}">${text}</td>
      ${n1Cell}
    </tr>
  `;
}

/**
 * Construit le tableau Compte de résultat complet.
 * @param {object}      resultat  BilanData.resultat
 * @param {object|null} n1        BilanData.n1
 * @returns {string}              HTML
 */
function buildResultat(resultat, n1) {
  const r   = resultat;
  const rn1 = n1?.resultat ?? null;
  const hasN1 = rn1 !== null;

  const thN1 = hasN1 ? `<th class="col-width--cr-n1">N-1</th>` : '';
  const n1v  = (fn) => hasN1 ? fn(rn1) : null;
  const cols = hasN1 ? 3 : 2;

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
            <th>${r.produitsExploitation.ca > 0 ? 'Exercice N' : 'Montant'}</th>
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
          ${rowCR('Achats de marchandises',           r.chargesExploitation.achatsMarchandises, n1v(x => x.chargesExploitation.achatsMarchandises))}
          ${rowCR('Variation de stocks',              r.chargesExploitation.variationStocks,    n1v(x => x.chargesExploitation.variationStocks))}
          ${rowCR('Achats de matières premières',     r.chargesExploitation.achatsMatieres,     n1v(x => x.chargesExploitation.achatsMatieres))}
          ${rowCR('Autres achats et charges externes',r.chargesExploitation.autresAchats,       n1v(x => x.chargesExploitation.autresAchats))}
          ${rowCR('Impôts, taxes et versements',      r.chargesExploitation.impotsTaxes,        n1v(x => x.chargesExploitation.impotsTaxes))}
          ${rowCR('Charges de personnel',             r.chargesExploitation.chargesPersonnel,   n1v(x => x.chargesExploitation.chargesPersonnel))}
          ${rowCR('Dotations aux amortissements',     r.chargesExploitation.dotationsAmort,     n1v(x => x.chargesExploitation.dotationsAmort))}
          ${rowCRSubtotal('Total charges exploitation', r.chargesExploitation.total,            n1v(x => x.chargesExploitation.total))}

          ${rowCRResultat('RÉSULTAT D\'EXPLOITATION', r.resultatExploitation, n1v(x => x.resultatExploitation))}

          <!-- FINANCIER -->
          <tr class="row--section"><td colspan="${cols}">Résultat financier</td></tr>
          ${rowCR('Produits financiers', r.produitsFinanciers, n1v(x => x.produitsFinanciers))}
          ${rowCR('Charges financières', r.chargesFinancieres, n1v(x => x.chargesFinancieres))}
          ${rowCRResultat('RÉSULTAT FINANCIER', r.resultatFinancier, n1v(x => x.resultatFinancier))}

          ${rowCRResultat('RÉSULTAT COURANT AVANT IMPÔTS', r.resultatCourant, n1v(x => x.resultatCourant))}

          <!-- EXCEPTIONNEL -->
          <tr class="row--section"><td colspan="${cols}">Résultat exceptionnel</td></tr>
          ${rowCR('Produits exceptionnels', r.produitsExceptionnels,  n1v(x => x.produitsExceptionnels))}
          ${rowCR('Charges exceptionnelles',r.chargesExceptionnelles, n1v(x => x.chargesExceptionnelles))}
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

// ============================================================
// RENDU PRINCIPAL
// ============================================================

/**
 * Injecte les documents dans #app.
 * Gère la navigation par onglets entre bilan et compte de résultat.
 *
 * @param {object} data    BilanData complet
 * @param {object} params  BilanParams (pour savoir quels onglets afficher)
 */
export function renderDocuments(data, params) {
  const app = document.getElementById('app');

  /**
   * Render un onglet donné dans le conteneur de contenu.
   * @param {string} tab  'bilan' | 'resultat'
   */
  function renderTab(tab) {
    const header = buildHeader(
      data.meta,
      tab === 'bilan' ? 'Bilan comptable' : 'Compte de résultat'
    );
    const tabs   = buildTabs(tab, params.output);

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

    app.innerHTML = `
      <header class="app-header">
        <div class="container">
          <div class="app-header__logo">Bil<span>app</span></div>
          <div class="app-header__subtitle">Générateur de bilans comptables pédagogiques</div>
        </div>
      </header>
      <div class="doc-page">
        ${header}
        <div class="doc-actions">
          <div class="doc-actions__left">
            <button class="btn btn--secondary btn--sm" id="btnRetour">← Nouveau bilan</button>
          </div>
          <div class="doc-actions__right">
            <button class="btn btn--ghost btn--sm" id="btnPrint">⎙ Imprimer</button>
          </div>
        </div>
        ${tabs}
        <div id="docContent">${content}</div>
      </div>
    `;

    // Navigation onglets
    app.querySelectorAll('.doc-tab').forEach(btn => {
      btn.addEventListener('click', () => renderTab(btn.dataset.tab));
    });

    // Retour formulaire
    app.querySelector('#btnRetour')?.addEventListener('click', () => {
      // Recharge la page pour repartir du formulaire proprement
      window.location.reload();
    });

    // Impression
    app.querySelector('#btnPrint')?.addEventListener('click', () => {
      window.print();
    });
  }

  // Onglet initial : bilan si demandé, sinon résultat
  const initialTab = params.output.bilan ? 'bilan' : 'resultat';
  renderTab(initialTab);
}
