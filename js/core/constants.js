/**
 * constants.js — Bilapp
 * -------------------------------------------------------
 * Source de vérité pour toutes les constantes du projet :
 * - Plan Comptable Général (PCG 2024)
 * - Taux fiscaux et sociaux
 * - Fourchettes de CA par tranche
 * - Ratios sectoriels
 * - Labels UI du formulaire
 *
 * RÈGLE : aucune valeur numérique ou libellé métier ne doit
 * être écrit en dur ailleurs que dans ce fichier.
 */

'use strict';

// ============================================================
// FORMES JURIDIQUES
// ============================================================

export const FORMES_JURIDIQUES = {
  SAS:  'Société par Actions Simplifiée (SAS)',
  SARL: 'Société à Responsabilité Limitée (SARL)',
  SA:   'Société Anonyme (SA)',
};

// ============================================================
// SECTEURS D'ACTIVITÉ
// ============================================================

export const SECTEURS = {
  commerce:  'Commerce',
  services:  'Prestation de services',
  industrie: 'Industrie',
};

// ============================================================
// TRANCHES DE CHIFFRE D'AFFAIRES
// Fourchettes en euros utilisées par le moteur de calcul.
// ============================================================

export const TRANCHES_CA = {
  micro: { label: 'Micro-entreprise (< 80 000 €)',  min: 20_000,    max: 79_999   },
  tpe:   { label: 'TPE (< 500 000 €)',              min: 80_000,    max: 499_999  },
  pme:   { label: 'PME (< 5 000 000 €)',            min: 500_000,   max: 4_999_999 },
  eti:   { label: 'ETI (< 50 000 000 €)',           min: 5_000_000, max: 49_999_999 },
};

// ============================================================
// TRANCHES D'EMPLOYÉS
// ============================================================

export const TRANCHES_EMPLOYES = {
  aucun:  'Aucun salarié',
  '1-5':  '1 à 5 salariés',
  '6-20': '6 à 20 salariés',
  '21-50':'21 à 50 salariés',
  '50+':  'Plus de 50 salariés',
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
// ORIENTATIONS DU RÉSULTAT
// Pilotent les ratios résultat/CA dans le moteur.
// ============================================================

export const ORIENTATIONS = {
  positif: { label: 'Bénéficiaire', minRatio: 0.03,   maxRatio: 0.12  },
  negatif: { label: 'Déficitaire',  minRatio: -0.15,  maxRatio: -0.01 },
  neutre:  { label: 'À l\'équilibre', minRatio: -0.005, maxRatio: 0.005 },
};

// ============================================================
// RÉGIMES TVA
// ============================================================

export const REGIMES_TVA = {
  reel_normal:    'Réel normal',
  reel_simplifie: 'Réel simplifié',
  franchise:      'Franchise en base',
};

// Régime TVA par défaut selon la tranche de CA
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
  // Impôt sur les sociétés
  IS_PME_REDUIT:  0.15,   // Taux réduit PME sur les 42 500 premiers euros
  IS_NORMAL:      0.25,   // Taux normal IS
  SEUIL_IS_REDUIT: 42_500,

  // TVA
  TVA_NORMALE:    0.20,
  TVA_REDUITE:    0.10,
  TVA_SUPER_RED:  0.055,

  // Charges sociales patronales approximatives
  CHARGES_PATRON: 0.42,

  // Réserve légale obligatoire (5% du bénéfice jusqu'à 10% du capital)
  RESERVE_LEGALE_TAUX:  0.05,
  RESERVE_LEGALE_PLAFOND: 0.10,
};

// ============================================================
// CAPITAL SOCIAL MINIMUM PAR FORME JURIDIQUE (en euros)
// ============================================================

export const CAPITAL_MINIMUM = {
  SAS:  1,      // Pas de minimum légal, on met 1€ symbolique
  SARL: 1,      // Idem
  SA:   37_000, // Minimum légal SA
};

// Capital social typique par tranche (pour génération réaliste)
export const CAPITAL_TYPIQUE = {
  micro: { SAS: 1_000,    SARL: 1_000,    SA: 37_000  },
  tpe:   { SAS: 10_000,   SARL: 10_000,   SA: 37_000  },
  pme:   { SAS: 100_000,  SARL: 50_000,   SA: 100_000 },
  eti:   { SAS: 1_000_000, SARL: 500_000, SA: 1_000_000 },
};

// ============================================================
// PLAN COMPTABLE GÉNÉRAL (PCG 2024)
// Structure : { code, libelle, classe }
// ============================================================

export const PCG = {

  // --- CLASSE 1 — Comptes de capitaux ---
  '101':  { libelle: 'Capital social',                          classe: 1 },
  '104':  { libelle: 'Primes liées au capital social',          classe: 1 },
  '1061': { libelle: 'Réserve légale',                          classe: 1 },
  '1063': { libelle: 'Réserves statutaires ou contractuelles',  classe: 1 },
  '1068': { libelle: 'Autres réserves',                         classe: 1 },
  '110':  { libelle: 'Report à nouveau (solde créditeur)',      classe: 1 },
  '119':  { libelle: 'Report à nouveau (solde débiteur)',       classe: 1 },
  '120':  { libelle: 'Résultat de l\'exercice (bénéfice)',      classe: 1 },
  '129':  { libelle: 'Résultat de l\'exercice (perte)',         classe: 1 },
  '151':  { libelle: 'Provisions pour risques',                 classe: 1 },
  '158':  { libelle: 'Autres provisions pour charges',         classe: 1 },
  '164':  { libelle: 'Emprunts auprès des établissements de crédit', classe: 1 },
  '165':  { libelle: 'Dépôts et cautionnements reçus',         classe: 1 },

  // --- CLASSE 2 — Comptes d'immobilisations ---
  '201':  { libelle: 'Frais d\'établissement',                  classe: 2 },
  '203':  { libelle: 'Frais de recherche et développement',     classe: 2 },
  '205':  { libelle: 'Concessions, brevets, licences, marques', classe: 2 },
  '207':  { libelle: 'Fonds commercial',                        classe: 2 },
  '208':  { libelle: 'Autres immobilisations incorporelles',    classe: 2 },
  '211':  { libelle: 'Terrains',                                classe: 2 },
  '213':  { libelle: 'Constructions',                           classe: 2 },
  '215':  { libelle: 'Installations techniques, matériel et outillage industriels', classe: 2 },
  '218':  { libelle: 'Autres immobilisations corporelles',      classe: 2 },
  '261':  { libelle: 'Titres de participation',                 classe: 2 },
  '271':  { libelle: 'Titres immobilisés (droit de propriété)', classe: 2 },
  '274':  { libelle: 'Prêts',                                   classe: 2 },

  // Amortissements (comptes de dépréciation — soustractifs)
  '2801': { libelle: 'Amortissements — Frais d\'établissement', classe: 2 },
  '2803': { libelle: 'Amortissements — Frais R&D',             classe: 2 },
  '2805': { libelle: 'Amortissements — Concessions, brevets',  classe: 2 },
  '2813': { libelle: 'Amortissements — Constructions',         classe: 2 },
  '2815': { libelle: 'Amortissements — Installations techniques', classe: 2 },
  '2818': { libelle: 'Amortissements — Autres immos corporelles', classe: 2 },

  // --- CLASSE 3 — Comptes de stocks ---
  '31':   { libelle: 'Matières premières et fournitures',       classe: 3 },
  '33':   { libelle: 'En-cours de production de biens',         classe: 3 },
  '35':   { libelle: 'Stocks de produits',                      classe: 3 },
  '37':   { libelle: 'Stocks de marchandises',                  classe: 3 },

  // --- CLASSE 4 — Comptes de tiers ---
  '401':  { libelle: 'Fournisseurs',                            classe: 4 },
  '403':  { libelle: 'Fournisseurs — Effets à payer',          classe: 4 },
  '411':  { libelle: 'Clients',                                 classe: 4 },
  '413':  { libelle: 'Clients — Effets à recevoir',            classe: 4 },
  '421':  { libelle: 'Personnel — Rémunérations dues',         classe: 4 },
  '431':  { libelle: 'Sécurité sociale',                        classe: 4 },
  '437':  { libelle: 'Autres organismes sociaux',               classe: 4 },
  '441':  { libelle: 'État — Subventions à recevoir',          classe: 4 },
  '444':  { libelle: 'État — Impôts sur les bénéfices',        classe: 4 },
  '445':  { libelle: 'État — Taxes sur le chiffre d\'affaires',classe: 4 },
  '447':  { libelle: 'Autres impôts, taxes et versements assimilés', classe: 4 },
  '455':  { libelle: 'Associés — Comptes courants',            classe: 4 },
  '462':  { libelle: 'Créances sur cessions d\'immobilisations',classe: 4 },
  '467':  { libelle: 'Autres comptes débiteurs ou créditeurs', classe: 4 },
  '486':  { libelle: 'Charges constatées d\'avance',           classe: 4 },
  '487':  { libelle: 'Produits constatés d\'avance',           classe: 4 },

  // --- CLASSE 5 — Comptes financiers ---
  '501':  { libelle: 'Parts dans des entreprises liées',        classe: 5 },
  '503':  { libelle: 'Actions',                                 classe: 5 },
  '506':  { libelle: 'Obligations',                             classe: 5 },
  '512':  { libelle: 'Banques, établissements financiers',      classe: 5 },
  '530':  { libelle: 'Caisse',                                  classe: 5 },

  // --- CLASSE 6 — Comptes de charges ---
  '601':  { libelle: 'Achats de matières premières',            classe: 6 },
  '602':  { libelle: 'Achats de fournitures consommables',      classe: 6 },
  '603':  { libelle: 'Variations de stocks',                    classe: 6 },
  '604':  { libelle: 'Achats d\'études et prestations de services', classe: 6 },
  '607':  { libelle: 'Achats de marchandises',                  classe: 6 },
  '611':  { libelle: 'Sous-traitance générale',                 classe: 6 },
  '613':  { libelle: 'Locations',                               classe: 6 },
  '615':  { libelle: 'Entretien et réparations',                classe: 6 },
  '616':  { libelle: 'Primes d\'assurance',                     classe: 6 },
  '617':  { libelle: 'Études et recherches',                    classe: 6 },
  '618':  { libelle: 'Divers (documentation, conférences…)',    classe: 6 },
  '621':  { libelle: 'Personnel extérieur à l\'entreprise',     classe: 6 },
  '622':  { libelle: 'Rémunérations d\'intermédiaires',         classe: 6 },
  '623':  { libelle: 'Publicité, publications, relations publiques', classe: 6 },
  '624':  { libelle: 'Transports de biens et transports collectifs', classe: 6 },
  '625':  { libelle: 'Déplacements, missions et réceptions',    classe: 6 },
  '626':  { libelle: 'Frais postaux et frais de télécommunications', classe: 6 },
  '627':  { libelle: 'Services bancaires et assimilés',         classe: 6 },
  '628':  { libelle: 'Divers',                                  classe: 6 },
  '631':  { libelle: 'Impôts, taxes et versements assimilés sur rémunérations', classe: 6 },
  '635':  { libelle: 'Autres impôts, taxes et versements assimilés', classe: 6 },
  '641':  { libelle: 'Rémunérations du personnel',              classe: 6 },
  '645':  { libelle: 'Charges de sécurité sociale et de prévoyance', classe: 6 },
  '648':  { libelle: 'Autres charges de personnel',             classe: 6 },
  '651':  { libelle: 'Redevances pour concessions, brevets, licences', classe: 6 },
  '661':  { libelle: 'Charges d\'intérêts',                     classe: 6 },
  '665':  { libelle: 'Escomptes accordés',                      classe: 6 },
  '671':  { libelle: 'Charges exceptionnelles sur opérations de gestion', classe: 6 },
  '675':  { libelle: 'Valeurs comptables des éléments d\'actif cédés', classe: 6 },
  '681':  { libelle: 'Dotations aux amortissements — exploitation', classe: 6 },
  '686':  { libelle: 'Dotations aux amortissements — financier', classe: 6 },
  '691':  { libelle: 'Participation des salariés aux résultats', classe: 6 },
  '695':  { libelle: 'Impôts sur les bénéfices',                classe: 6 },

  // --- CLASSE 7 — Comptes de produits ---
  '701':  { libelle: 'Ventes de produits finis',                classe: 7 },
  '706':  { libelle: 'Prestations de services',                 classe: 7 },
  '707':  { libelle: 'Ventes de marchandises',                  classe: 7 },
  '708':  { libelle: 'Produits des activités annexes',          classe: 7 },
  '713':  { libelle: 'Variation des stocks de produits finis',  classe: 7 },
  '721':  { libelle: 'Production immobilisée',                  classe: 7 },
  '740':  { libelle: 'Subventions d\'exploitation',             classe: 7 },
  '751':  { libelle: 'Redevances pour concessions, brevets',    classe: 7 },
  '752':  { libelle: 'Revenus des immeubles non affectés aux activités professionnelles', classe: 7 },
  '755':  { libelle: 'Quotes-parts de résultat sur opérations faites en commun', classe: 7 },
  '757':  { libelle: 'Quote-part des subventions d\'investissement', classe: 7 },
  '758':  { libelle: 'Produits divers de gestion courante',     classe: 7 },
  '761':  { libelle: 'Produits de participations',              classe: 7 },
  '762':  { libelle: 'Produits des autres immobilisations financières', classe: 7 },
  '764':  { libelle: 'Revenus des valeurs mobilières de placement', classe: 7 },
  '765':  { libelle: 'Escomptes obtenus',                       classe: 7 },
  '766':  { libelle: 'Gains de change',                         classe: 7 },
  '771':  { libelle: 'Produits exceptionnels sur opérations de gestion', classe: 7 },
  '775':  { libelle: 'Produits des cessions d\'éléments d\'actif', classe: 7 },
  '777':  { libelle: 'Quote-part des subventions d\'investissement virée au résultat', classe: 7 },
};

// ============================================================
// RATIOS SECTORIELS
// Ratios appliqués au CA pour générer des postes cohérents.
// Source : moyennes sectorielles françaises (ordre de grandeur).
// ============================================================

export const RATIOS_SECTORIELS = {

  commerce: {
    // Achats de marchandises / CA
    achats_marchandises:     { min: 0.55, max: 0.70 },
    // Charges externes / CA
    charges_externes:        { min: 0.06, max: 0.12 },
    // Charges de personnel / CA (si employés)
    charges_personnel:       { min: 0.08, max: 0.18 },
    // Stocks / CA
    stocks:                  { min: 0.08, max: 0.20 },
    // Créances clients / CA (en jours → ratio)
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
// MENTION LÉGALE OBLIGATOIRE
// Doit apparaître sur tous les documents générés.
// ============================================================

export const MENTION_FICTIF = 'DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT';
export const MENTION_PIED   = 'Généré par Bilapp — Document fictif à des fins pédagogiques uniquement';

// ============================================================
// VARIATION ALÉATOIRE
// Appliquée aux montants générés pour éviter les chiffres ronds.
// ============================================================

export const VARIATION_MONTANTS = 0.15; // ±15%
