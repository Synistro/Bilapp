/**
 * constants.js â€” Bilapp
 * -------------------------------------------------------
 * Source de vÃ©ritÃ© pour toutes les constantes du projet :
 * - Plan Comptable GÃ©nÃ©ral (PCG 2024)
 * - Taux fiscaux et sociaux
 * - Fourchettes de CA par tranche
 * - Ratios sectoriels
 * - Labels UI du formulaire
 *
 * RÃˆGLE : aucune valeur numÃ©rique ou libellÃ© mÃ©tier ne doit
 * Ãªtre Ã©crit en dur ailleurs que dans ce fichier.
 */

'use strict';

// ============================================================
// FORMES JURIDIQUES
// ============================================================

export const FORMES_JURIDIQUES = {
  SAS:  'SociÃ©tÃ© par Actions SimplifiÃ©e (SAS)',
  SARL: 'SociÃ©tÃ© Ã  ResponsabilitÃ© LimitÃ©e (SARL)',
  SA:   'SociÃ©tÃ© Anonyme (SA)',
};

// ============================================================
// SECTEURS D'ACTIVITÃ‰
// ============================================================

export const SECTEURS = {
  commerce:  'Commerce',
  services:  'Prestation de services',
  industrie: 'Industrie',
};

// ============================================================
// TRANCHES DE CHIFFRE D'AFFAIRES
// Fourchettes en euros utilisÃ©es par le moteur de calcul.
// ============================================================

export const TRANCHES_CA = {
  micro: { label: 'Micro-entreprise (< 80 000 â‚¬)',  min: 20_000,    max: 79_999   },
  tpe:   { label: 'TPE (< 500 000 â‚¬)',              min: 80_000,    max: 499_999  },
  pme:   { label: 'PME (< 5 000 000 â‚¬)',            min: 500_000,   max: 4_999_999 },
  eti:   { label: 'ETI (< 50 000 000 â‚¬)',           min: 5_000_000, max: 49_999_999 },
};

// ============================================================
// TRANCHES D'EMPLOYÃ‰S
// ============================================================

export const TRANCHES_EMPLOYES = {
  aucun:  'Aucun salariÃ©',
  '1-5':  '1 Ã  5 salariÃ©s',
  '6-20': '6 Ã  20 salariÃ©s',
  '21-50':'21 Ã  50 salariÃ©s',
  '50+':  'Plus de 50 salariÃ©s',
};

// ============================================================
// TRANCHES DE CLIENTS
// ============================================================

export const TRANCHES_CLIENTS = {
  mono:  '1 seul client',
  peu:   'Moins de 20 clients',
  moyen: 'Entre 20 et 200 clients',
  masse: 'Plus de 200 clients',
};

// ============================================================
// ORIENTATIONS DU RÃ‰SULTAT
// Pilotent les ratios rÃ©sultat/CA dans le moteur.
// ============================================================

export const ORIENTATIONS = {
  positif: { label: 'BÃ©nÃ©ficiaire', minRatio: 0.03,   maxRatio: 0.12  },
  negatif: { label: 'DÃ©ficitaire',  minRatio: -0.15,  maxRatio: -0.01 },
  neutre:  { label: 'Ã€ l\'Ã©quilibre', minRatio: -0.005, maxRatio: 0.005 },
};

// ============================================================
// RÃ‰GIMES TVA
// ============================================================

export const REGIMES_TVA = {
  reel_normal:    'RÃ©el normal',
  reel_simplifie: 'RÃ©el simplifiÃ©',
  franchise:      'Franchise en base',
};

// RÃ©gime TVA par dÃ©faut selon la tranche de CA
export const TVA_DEFAUT_PAR_TRANCHE = {
  micro: 'franchise',
  tpe:   'reel_simplifie',
  pme:   'reel_normal',
  eti:   'reel_normal',
};

// ============================================================
// TAUX FISCAUX ET SOCIAUX (PCG 2024)
// ============================================================

export const TAUX = {
  // ImpÃ´t sur les sociÃ©tÃ©s
  IS_PME_REDUIT:  0.15,   // Taux rÃ©duit PME sur les 42 500 premiers euros
  IS_NORMAL:      0.25,   // Taux normal IS
  SEUIL_IS_REDUIT: 42_500,

  // TVA
  TVA_NORMALE:    0.20,
  TVA_REDUITE:    0.10,
  TVA_SUPER_RED:  0.055,

  // Charges sociales patronales approximatives
  CHARGES_PATRON: 0.42,

  // RÃ©serve lÃ©gale obligatoire (5% du bÃ©nÃ©fice jusqu'Ã  10% du capital)
  RESERVE_LEGALE_TAUX:  0.05,
  RESERVE_LEGALE_PLAFOND: 0.10,
};

// ============================================================
// CAPITAL SOCIAL MINIMUM PAR FORME JURIDIQUE (en euros)
// ============================================================

export const CAPITAL_MINIMUM = {
  SAS:  1,      // Pas de minimum lÃ©gal, on met 1â‚¬ symbolique
  SARL: 1,      // Idem
  SA:   37_000, // Minimum lÃ©gal SA
};

// Capital social typique par tranche (pour gÃ©nÃ©ration rÃ©aliste)
export const CAPITAL_TYPIQUE = {
  micro: { SAS: 1_000,    SARL: 1_000,    SA: 37_000  },
  tpe:   { SAS: 10_000,   SARL: 10_000,   SA: 37_000  },
  pme:   { SAS: 100_000,  SARL: 50_000,   SA: 100_000 },
  eti:   { SAS: 1_000_000, SARL: 500_000, SA: 1_000_000 },
};

// ============================================================
// PLAN COMPTABLE GÃ‰NÃ‰RAL (PCG 2024)
// Structure : { code, libelle, classe }
// ============================================================

export const PCG = {

  // --- CLASSE 1 â€” Comptes de capitaux ---
  '101':  { libelle: 'Capital social',                          classe: 1 },
  '104':  { libelle: 'Primes liÃ©es au capital social',          classe: 1 },
  '1061': { libelle: 'RÃ©serve lÃ©gale',                          classe: 1 },
  '1063': { libelle: 'RÃ©serves statutaires ou contractuelles',  classe: 1 },
  '1068': { libelle: 'Autres rÃ©serves',                         classe: 1 },
  '110':  { libelle: 'Report Ã  nouveau (solde crÃ©diteur)',      classe: 1 },
  '119':  { libelle: 'Report Ã  nouveau (solde dÃ©biteur)',       classe: 1 },
  '120':  { libelle: 'RÃ©sultat de l\'exercice (bÃ©nÃ©fice)',      classe: 1 },
  '129':  { libelle: 'RÃ©sultat de l\'exercice (perte)',         classe: 1 },
  '151':  { libelle: 'Provisions pour risques',                 classe: 1 },
  '158':  { libelle: 'Autres provisions pour charges',         classe: 1 },
  '164':  { libelle: 'Emprunts auprÃ¨s des Ã©tablissements de crÃ©dit', classe: 1 },
  '165':  { libelle: 'DÃ©pÃ´ts et cautionnements reÃ§us',         classe: 1 },

  // --- CLASSE 2 â€” Comptes d'immobilisations ---
  '201':  { libelle: 'Frais d\'Ã©tablissement',                  classe: 2 },
  '203':  { libelle: 'Frais de recherche et dÃ©veloppement',     classe: 2 },
  '205':  { libelle: 'Concessions, brevets, licences, marques', classe: 2 },
  '207':  { libelle: 'Fonds commercial',                        classe: 2 },
  '208':  { libelle: 'Autres immobilisations incorporelles',    classe: 2 },
  '211':  { libelle: 'Terrains',                                classe: 2 },
  '213':  { libelle: 'Constructions',                           classe: 2 },
  '215':  { libelle: 'Installations techniques, matÃ©riel et outillage industriels', classe: 2 },
  '218':  { libelle: 'Autres immobilisations corporelles',      classe: 2 },
  '261':  { libelle: 'Titres de participation',                 classe: 2 },
  '271':  { libelle: 'Titres immobilisÃ©s (droit de propriÃ©tÃ©)', classe: 2 },
  '274':  { libelle: 'PrÃªts',                                   classe: 2 },

  // Amortissements (comptes de dÃ©prÃ©ciation â€” soustractifs)
  '2801': { libelle: 'Amortissements â€” Frais d\'Ã©tablissement', classe: 2 },
  '2803': { libelle: 'Amortissements â€” Frais R&D',             classe: 2 },
  '2805': { libelle: 'Amortissements â€” Concessions, brevets',  classe: 2 },
  '2813': { libelle: 'Amortissements â€” Constructions',         classe: 2 },
  '2815': { libelle: 'Amortissements â€” Installations techniques', classe: 2 },
  '2818': { libelle: 'Amortissements â€” Autres immos corporelles', classe: 2 },

  // --- CLASSE 3 â€” Comptes de stocks ---
  '31':   { libelle: 'MatiÃ¨res premiÃ¨res et fournitures',       classe: 3 },
  '33':   { libelle: 'En-cours de production de biens',         classe: 3 },
  '35':   { libelle: 'Stocks de produits',                      classe: 3 },
  '37':   { libelle: 'Stocks de marchandises',                  classe: 3 },

  // --- CLASSE 4 â€” Comptes de tiers ---
  '401':  { libelle: 'Fournisseurs',                            classe: 4 },
  '403':  { libelle: 'Fournisseurs â€” Effets Ã  payer',          classe: 4 },
  '411':  { libelle: 'Clients',                                 classe: 4 },
  '413':  { libelle: 'Clients â€” Effets Ã  recevoir',            classe: 4 },
  '421':  { libelle: 'Personnel â€” RÃ©munÃ©rations dues',         classe: 4 },
  '431':  { libelle: 'SÃ©curitÃ© sociale',                        classe: 4 },
  '437':  { libelle: 'Autres organismes sociaux',               classe: 4 },
  '441':  { libelle: 'Ã‰tat â€” Subventions Ã  recevoir',          classe: 4 },
  '444':  { libelle: 'Ã‰tat â€” ImpÃ´ts sur les bÃ©nÃ©fices',        classe: 4 },
  '445':  { libelle: 'Ã‰tat â€” Taxes sur le chiffre d\'affaires',classe: 4 },
  '447':  { libelle: 'Autres impÃ´ts, taxes et versements assimilÃ©s', classe: 4 },
  '455':  { libelle: 'AssociÃ©s â€” Comptes courants',            classe: 4 },
  '462':  { libelle: 'CrÃ©ances sur cessions d\'immobilisations',classe: 4 },
  '467':  { libelle: 'Autres comptes dÃ©biteurs ou crÃ©diteurs', classe: 4 },
  '486':  { libelle: 'Charges constatÃ©es d\'avance',           classe: 4 },
  '487':  { libelle: 'Produits constatÃ©s d\'avance',           classe: 4 },

  // --- CLASSE 5 â€” Comptes financiers ---
  '501':  { libelle: 'Parts dans des entreprises liÃ©es',        classe: 5 },
  '503':  { libelle: 'Actions',                                 classe: 5 },
  '506':  { libelle: 'Obligations',                             classe: 5 },
  '512':  { libelle: 'Banques, Ã©tablissements financiers',      classe: 5 },
  '530':  { libelle: 'Caisse',                                  classe: 5 },

  // --- CLASSE 6 â€” Comptes de charges ---
  '601':  { libelle: 'Achats de matiÃ¨res premiÃ¨res',            classe: 6 },
  '602':  { libelle: 'Achats de fournitures consommables',      classe: 6 },
  '603':  { libelle: 'Variations de stocks',                    classe: 6 },
  '604':  { libelle: 'Achats d\'Ã©tudes et prestations de services', classe: 6 },
  '607':  { libelle: 'Achats de marchandises',                  classe: 6 },
  '611':  { libelle: 'Sous-traitance gÃ©nÃ©rale',                 classe: 6 },
  '613':  { libelle: 'Locations',                               classe: 6 },
  '615':  { libelle: 'Entretien et rÃ©parations',                classe: 6 },
  '616':  { libelle: 'Primes d\'assurance',                     classe: 6 },
  '617':  { libelle: 'Ã‰tudes et recherches',                    classe: 6 },
  '618':  { libelle: 'Divers (documentation, confÃ©rencesâ€¦)',    classe: 6 },
  '621':  { libelle: 'Personnel extÃ©rieur Ã  l\'entreprise',     classe: 6 },
  '622':  { libelle: 'RÃ©munÃ©rations d\'intermÃ©diaires',         classe: 6 },
  '623':  { libelle: 'PublicitÃ©, publications, relations publiques', classe: 6 },
  '624':  { libelle: 'Transports de biens et transports collectifs', classe: 6 },
  '625':  { libelle: 'DÃ©placements, missions et rÃ©ceptions',    classe: 6 },
  '626':  { libelle: 'Frais postaux et frais de tÃ©lÃ©communications', classe: 6 },
  '627':  { libelle: 'Services bancaires et assimilÃ©s',         classe: 6 },
  '628':  { libelle: 'Divers',                                  classe: 6 },
  '631':  { libelle: 'ImpÃ´ts, taxes et versements assimilÃ©s sur rÃ©munÃ©rations', classe: 6 },
  '635':  { libelle: 'Autres impÃ´ts, taxes et versements assimilÃ©s', classe: 6 },
  '641':  { libelle: 'RÃ©munÃ©rations du personnel',              classe: 6 },
  '645':  { libelle: 'Charges de sÃ©curitÃ© sociale et de prÃ©voyance', classe: 6 },
  '648':  { libelle: 'Autres charges de personnel',             classe: 6 },
  '651':  { libelle: 'Redevances pour concessions, brevets, licences', classe: 6 },
  '661':  { libelle: 'Charges d\'intÃ©rÃªts',                     classe: 6 },
  '665':  { libelle: 'Escomptes accordÃ©s',                      classe: 6 },
  '671':  { libelle: 'Charges exceptionnelles sur opÃ©rations de gestion', classe: 6 },
  '675':  { libelle: 'Valeurs comptables des Ã©lÃ©ments d\'actif cÃ©dÃ©s', classe: 6 },
  '681':  { libelle: 'Dotations aux amortissements â€” exploitation', classe: 6 },
  '686':  { libelle: 'Dotations aux amortissements â€” financier', classe: 6 },
  '691':  { libelle: 'Participation des salariÃ©s aux rÃ©sultats', classe: 6 },
  '695':  { libelle: 'ImpÃ´ts sur les bÃ©nÃ©fices',                classe: 6 },

  // --- CLASSE 7 â€” Comptes de produits ---
  '701':  { libelle: 'Ventes de produits finis',                classe: 7 },
  '706':  { libelle: 'Prestations de services',                 classe: 7 },
  '707':  { libelle: 'Ventes de marchandises',                  classe: 7 },
  '708':  { libelle: 'Produits des activitÃ©s annexes',          classe: 7 },
  '713':  { libelle: 'Variation des stocks de produits finis',  classe: 7 },
  '721':  { libelle: 'Production immobilisÃ©e',                  classe: 7 },
  '740':  { libelle: 'Subventions d\'exploitation',             classe: 7 },
  '751':  { libelle: 'Redevances pour concessions, brevets',    classe: 7 },
  '752':  { libelle: 'Revenus des immeubles non affectÃ©s aux activitÃ©s professionnelles', classe: 7 },
  '755':  { libelle: 'Quotes-parts de rÃ©sultat sur opÃ©rations faites en commun', classe: 7 },
  '757':  { libelle: 'Quote-part des subventions d\'investissement', classe: 7 },
  '758':  { libelle: 'Produits divers de gestion courante',     classe: 7 },
  '761':  { libelle: 'Produits de participations',              classe: 7 },
  '762':  { libelle: 'Produits des autres immobilisations financiÃ¨res', classe: 7 },
  '764':  { libelle: 'Revenus des valeurs mobiliÃ¨res de placement', classe: 7 },
  '765':  { libelle: 'Escomptes obtenus',                       classe: 7 },
  '766':  { libelle: 'Gains de change',                         classe: 7 },
  '771':  { libelle: 'Produits exceptionnels sur opÃ©rations de gestion', classe: 7 },
  '775':  { libelle: 'Produits des cessions d\'Ã©lÃ©ments d\'actif', classe: 7 },
  '777':  { libelle: 'Quote-part des subventions d\'investissement virÃ©e au rÃ©sultat', classe: 7 },
};

// ============================================================
// RATIOS SECTORIELS
// Ratios appliquÃ©s au CA pour gÃ©nÃ©rer des postes cohÃ©rents.
// Source : moyennes sectorielles franÃ§aises (ordre de grandeur).
// ============================================================

export const RATIOS_SECTORIELS = {

  commerce: {
    // Achats de marchandises / CA
    achats_marchandises:     { min: 0.55, max: 0.70 },
    // Charges externes / CA
    charges_externes:        { min: 0.06, max: 0.12 },
    // Charges de personnel / CA (si employÃ©s)
    charges_personnel:       { min: 0.08, max: 0.18 },
    // Stocks / CA
    stocks:                  { min: 0.08, max: 0.20 },
    // CrÃ©ances clients / CA (en jours â†’ ratio)
    creances_clients:        { min: 0.04, max: 0.12 },
    // Dettes fournisseurs / achats
    dettes_fournisseurs:     { min: 0.08, max: 0.18 },
  },

  services: {
    achats_marchandises:     { min: 0.00, max: 0.05 },
    charges_externes:        { min: 0.10, max: 0.25 },
    charges_personnel:       { min: 0.35, max: 0.60 },
    stocks:                  { min: 0.00, max: 0.00 }, // Pas de stocks en services
    creances_clients:        { min: 0.08, max: 0.20 },
    dettes_fournisseurs:     { min: 0.04, max: 0.10 },
  },

  industrie: {
    achats_marchandises:     { min: 0.30, max: 0.50 },
    charges_externes:        { min: 0.08, max: 0.18 },
    charges_personnel:       { min: 0.20, max: 0.35 },
    stocks:                  { min: 0.10, max: 0.30 },
    creances_clients:        { min: 0.08, max: 0.18 },
    dettes_fournisseurs:     { min: 0.10, max: 0.22 },
  },
};

// ============================================================
// MENTION LÃ‰GALE OBLIGATOIRE
// Doit apparaÃ®tre sur tous les documents gÃ©nÃ©rÃ©s.
// ============================================================

export const MENTION_FICTIF = 'DOCUMENT FICTIF â€” Ã€ DES FINS PÃ‰DAGOGIQUES UNIQUEMENT';
export const MENTION_PIED   = 'GÃ©nÃ©rÃ© par Bilapp â€” Document fictif Ã  des fins pÃ©dagogiques uniquement';

// ============================================================
// VARIATION ALÃ‰ATOIRE
// AppliquÃ©e aux montants gÃ©nÃ©rÃ©s pour Ã©viter les chiffres ronds.
// ============================================================

export const VARIATION_MONTANTS = 0.15; // Â±15%


// ============================================================
// PLANCHER RÉSULTAT NEUTRE
// Un résultat net à 0 exact n'existe pas en pratique comptable.
// Si |resultatNet| < PLANCHER_RESULTAT_NEUTRE sur orientation 'neutre',
// on force à ±PLANCHER_RESULTAT_NEUTRE (signe conservé, positif si 0).
// ============================================================

export const PLANCHER_RESULTAT_NEUTRE = 1_000; // €