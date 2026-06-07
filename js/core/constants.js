/**
 * constants.js — Bilapp
 * -------------------------------------------------------
 * Source de vérité pour toutes les constantes du projet :
 * - Plan Comptable Général (PCG 2024)
 * - Taux fiscaux et sociaux
 * - Fourchettes de CA par tranche
 * - Ratios sectoriels
 * - Labels UI du formulaire
 * - Table de villes françaises (adresses fictives)
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
// ============================================================

export const TRANCHES_CA = {
  micro: { label: 'Micro-entreprise (< 80 000 €)',  min: 20_000,    max: 79_999    },
  tpe:   { label: 'TPE (< 500 000 €)',              min: 80_000,    max: 499_999   },
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
  positif: { label: 'Bénéficiaire',    minRatio: 0.03,   maxRatio: 0.12  },
  negatif: { label: 'Déficitaire',     minRatio: -0.15,  maxRatio: -0.01 },
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
  IS_PME_REDUIT:          0.15,
  IS_NORMAL:              0.25,
  SEUIL_IS_REDUIT:        42_500,
  TVA_NORMALE:            0.20,
  TVA_REDUITE:            0.10,
  TVA_SUPER_RED:          0.055,
  CHARGES_PATRON:         0.42,
  RESERVE_LEGALE_TAUX:    0.05,
  RESERVE_LEGALE_PLAFOND: 0.10,
};

// ============================================================
// CAPITAL SOCIAL
// ============================================================

export const CAPITAL_MINIMUM = {
  SAS:  1,
  SARL: 1,
  SA:   37_000,
};

export const CAPITAL_TYPIQUE = {
  micro: { SAS: 1_000,     SARL: 1_000,    SA: 37_000    },
  tpe:   { SAS: 10_000,    SARL: 10_000,   SA: 37_000    },
  pme:   { SAS: 100_000,   SARL: 50_000,   SA: 100_000   },
  eti:   { SAS: 1_000_000, SARL: 500_000,  SA: 1_000_000 },
};

// ============================================================
// PLAN COMPTABLE GÉNÉRAL (PCG 2024)
// ============================================================

export const PCG = {
  '101':  { libelle: 'Capital social',                                            classe: 1 },
  '104':  { libelle: 'Primes liées au capital social',                            classe: 1 },
  '1061': { libelle: 'Réserve légale',                                            classe: 1 },
  '1063': { libelle: 'Réserves statutaires ou contractuelles',                    classe: 1 },
  '1068': { libelle: 'Autres réserves',                                           classe: 1 },
  '110':  { libelle: 'Report à nouveau (solde créditeur)',                        classe: 1 },
  '119':  { libelle: 'Report à nouveau (solde débiteur)',                         classe: 1 },
  '120':  { libelle: 'Résultat de l\'exercice (bénéfice)',                        classe: 1 },
  '129':  { libelle: 'Résultat de l\'exercice (perte)',                           classe: 1 },
  '151':  { libelle: 'Provisions pour risques',                                   classe: 1 },
  '158':  { libelle: 'Autres provisions pour charges',                            classe: 1 },
  '164':  { libelle: 'Emprunts auprès des établissements de crédit',              classe: 1 },
  '165':  { libelle: 'Dépôts et cautionnements reçus',                           classe: 1 },
  '201':  { libelle: 'Frais d\'établissement',                                    classe: 2 },
  '203':  { libelle: 'Frais de recherche et développement',                       classe: 2 },
  '205':  { libelle: 'Concessions, brevets, licences, marques',                  classe: 2 },
  '207':  { libelle: 'Fonds commercial',                                          classe: 2 },
  '208':  { libelle: 'Autres immobilisations incorporelles',                      classe: 2 },
  '211':  { libelle: 'Terrains',                                                  classe: 2 },
  '213':  { libelle: 'Constructions',                                             classe: 2 },
  '215':  { libelle: 'Installations techniques, matériel et outillage',           classe: 2 },
  '218':  { libelle: 'Autres immobilisations corporelles',                        classe: 2 },
  '261':  { libelle: 'Titres de participation',                                   classe: 2 },
  '271':  { libelle: 'Titres immobilisés (droit de propriété)',                   classe: 2 },
  '274':  { libelle: 'Prêts',                                                     classe: 2 },
  '2801': { libelle: 'Amortissements — Frais d\'établissement',                  classe: 2 },
  '2803': { libelle: 'Amortissements — Frais R&D',                               classe: 2 },
  '2805': { libelle: 'Amortissements — Concessions, brevets',                    classe: 2 },
  '2813': { libelle: 'Amortissements — Constructions',                            classe: 2 },
  '2815': { libelle: 'Amortissements — Installations techniques',                 classe: 2 },
  '2818': { libelle: 'Amortissements — Autres immos corporelles',                 classe: 2 },
  '31':   { libelle: 'Matières premières et fournitures',                         classe: 3 },
  '33':   { libelle: 'En-cours de production de biens',                           classe: 3 },
  '35':   { libelle: 'Stocks de produits',                                        classe: 3 },
  '37':   { libelle: 'Stocks de marchandises',                                    classe: 3 },
  '401':  { libelle: 'Fournisseurs',                                              classe: 4 },
  '411':  { libelle: 'Clients',                                                   classe: 4 },
  '421':  { libelle: 'Personnel — Rémunérations dues',                           classe: 4 },
  '431':  { libelle: 'Sécurité sociale',                                          classe: 4 },
  '441':  { libelle: 'État — Subventions à recevoir',                            classe: 4 },
  '444':  { libelle: 'État — Impôts sur les bénéfices',                          classe: 4 },
  '445':  { libelle: 'État — Taxes sur le chiffre d\'affaires',                  classe: 4 },
  '486':  { libelle: 'Charges constatées d\'avance',                             classe: 4 },
  '487':  { libelle: 'Produits constatés d\'avance',                             classe: 4 },
  '512':  { libelle: 'Banques, établissements financiers',                        classe: 5 },
  '530':  { libelle: 'Caisse',                                                    classe: 5 },
  '601':  { libelle: 'Achats de matières premières',                              classe: 6 },
  '603':  { libelle: 'Variations de stocks',                                      classe: 6 },
  '607':  { libelle: 'Achats de marchandises',                                    classe: 6 },
  '613':  { libelle: 'Locations',                                                 classe: 6 },
  '615':  { libelle: 'Entretien et réparations',                                  classe: 6 },
  '616':  { libelle: 'Primes d\'assurance',                                       classe: 6 },
  '641':  { libelle: 'Rémunérations du personnel',                                classe: 6 },
  '645':  { libelle: 'Charges de sécurité sociale et de prévoyance',             classe: 6 },
  '661':  { libelle: 'Charges d\'intérêts',                                       classe: 6 },
  '671':  { libelle: 'Charges exceptionnelles sur opérations de gestion',         classe: 6 },
  '681':  { libelle: 'Dotations aux amortissements — exploitation',               classe: 6 },
  '691':  { libelle: 'Participation des salariés aux résultats',                  classe: 6 },
  '695':  { libelle: 'Impôts sur les bénéfices',                                  classe: 6 },
  '701':  { libelle: 'Ventes de produits finis',                                  classe: 7 },
  '706':  { libelle: 'Prestations de services',                                   classe: 7 },
  '707':  { libelle: 'Ventes de marchandises',                                    classe: 7 },
  '713':  { libelle: 'Variation des stocks de produits finis',                    classe: 7 },
  '740':  { libelle: 'Subventions d\'exploitation',                               classe: 7 },
  '758':  { libelle: 'Produits divers de gestion courante',                       classe: 7 },
  '761':  { libelle: 'Produits de participations',                                classe: 7 },
  '764':  { libelle: 'Revenus des valeurs mobilières de placement',               classe: 7 },
  '766':  { libelle: 'Gains de change',                                           classe: 7 },
  '771':  { libelle: 'Produits exceptionnels sur opérations de gestion',          classe: 7 },
  '775':  { libelle: 'Produits des cessions d\'éléments d\'actif',               classe: 7 },
};

// ============================================================
// RATIOS SECTORIELS
// ============================================================

export const RATIOS_SECTORIELS = {
  commerce: {
    achats_marchandises: { min: 0.55, max: 0.70 },
    charges_externes:    { min: 0.06, max: 0.12 },
    charges_personnel:   { min: 0.08, max: 0.18 },
    stocks:              { min: 0.08, max: 0.20 },
    creances_clients:    { min: 0.04, max: 0.12 },
    dettes_fournisseurs: { min: 0.08, max: 0.18 },
  },
  services: {
    achats_marchandises: { min: 0.00, max: 0.05 },
    charges_externes:    { min: 0.10, max: 0.25 },
    charges_personnel:   { min: 0.35, max: 0.60 },
    stocks:              { min: 0.00, max: 0.00 },
    creances_clients:    { min: 0.08, max: 0.20 },
    dettes_fournisseurs: { min: 0.04, max: 0.10 },
  },
  industrie: {
    achats_marchandises: { min: 0.30, max: 0.50 },
    charges_externes:    { min: 0.08, max: 0.18 },
    charges_personnel:   { min: 0.20, max: 0.35 },
    stocks:              { min: 0.10, max: 0.30 },
    creances_clients:    { min: 0.08, max: 0.18 },
    dettes_fournisseurs: { min: 0.10, max: 0.22 },
  },
};

// ============================================================
// MENTIONS LÉGALES
// ============================================================

export const MENTION_FICTIF = 'DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT';
export const MENTION_PIED   = 'Généré par Bilapp — Document fictif à des fins pédagogiques uniquement';

// ============================================================
// VARIATION ALÉATOIRE
// ============================================================

export const VARIATION_MONTANTS = 0.15; // ±15%

// ============================================================
// PLANCHER RÉSULTAT NEUTRE
// Un résultat net à 0 exact n'existe pas en pratique comptable.
// Si |resultatNet| < PLANCHER_RESULTAT_NEUTRE sur orientation 'neutre',
// on force à ±PLANCHER_RESULTAT_NEUTRE (signe conservé, positif si 0).
// ============================================================

export const PLANCHER_RESULTAT_NEUTRE = 1_000; // €

// ============================================================
// VILLES FRANÇAISES — TABLE POUR ADRESSES FICTIVES
// Utilisée par identite.js pour générer des adresses plausibles.
// ============================================================

export const VILLES_FR = [
  { ville: 'Paris',            cp: '75001' },
  { ville: 'Paris',            cp: '75008' },
  { ville: 'Paris',            cp: '75015' },
  { ville: 'Lyon',             cp: '69002' },
  { ville: 'Lyon',             cp: '69008' },
  { ville: 'Marseille',        cp: '13001' },
  { ville: 'Marseille',        cp: '13008' },
  { ville: 'Toulouse',         cp: '31000' },
  { ville: 'Nice',             cp: '06000' },
  { ville: 'Nantes',           cp: '44000' },
  { ville: 'Strasbourg',       cp: '67000' },
  { ville: 'Montpellier',      cp: '34000' },
  { ville: 'Bordeaux',         cp: '33000' },
  { ville: 'Lille',            cp: '59000' },
  { ville: 'Rennes',           cp: '35000' },
  { ville: 'Reims',            cp: '51100' },
  { ville: 'Le Havre',         cp: '76600' },
  { ville: 'Saint-Étienne',    cp: '42000' },
  { ville: 'Toulon',           cp: '83000' },
  { ville: 'Grenoble',         cp: '38000' },
  { ville: 'Dijon',            cp: '21000' },
  { ville: 'Angers',           cp: '49000' },
  { ville: 'Nîmes',            cp: '30000' },
  { ville: 'Villeurbanne',     cp: '69100' },
  { ville: 'Le Mans',          cp: '72000' },
  { ville: 'Aix-en-Provence',  cp: '13100' },
  { ville: 'Clermont-Ferrand', cp: '63000' },
  { ville: 'Tours',            cp: '37000' },
  { ville: 'Amiens',           cp: '80000' },
  { ville: 'Limoges',          cp: '87000' },
  { ville: 'Metz',             cp: '57000' },
  { ville: 'Brest',            cp: '29200' },
  { ville: 'Nancy',            cp: '54000' },
  { ville: 'Perpignan',        cp: '66000' },
  { ville: 'Caen',             cp: '14000' },
  { ville: 'Orléans',          cp: '45000' },
  { ville: 'Rouen',            cp: '76000' },
  { ville: 'Mulhouse',         cp: '68100' },
  { ville: 'Besançon',         cp: '25000' },
  { ville: 'Pau',              cp: '64000' },
  { ville: 'Annecy',           cp: '74000' },
  { ville: 'La Rochelle',      cp: '17000' },
  { ville: 'Bayonne',          cp: '64100' },
  { ville: 'Troyes',           cp: '10000' },
  { ville: 'Poitiers',         cp: '86000' },
  { ville: 'Valence',          cp: '26000' },
  { ville: 'Dunkerque',        cp: '59140' },
  { ville: 'Avignon',          cp: '84000' },
  { ville: 'Chambéry',         cp: '73000' },
  { ville: 'Colmar',           cp: '68000' },
];

// ============================================================
// DURÉES D'AMORTISSEMENT PAR CATÉGORIE (PCG 2024)
// Utilisées dans l'annexe comptable — bloc méthodes et modes.
// Les fourchettes reflètent les usages courants admis par l'administration.
// ============================================================

export const DUREES_AMORT = {
  fraisEtablissement: { min: 5,  max: 5,  methode: 'Linéaire', label: 'Frais d\'établissement' },
  fraisRD:            { min: 3,  max: 5,  methode: 'Linéaire', label: 'Frais de R&D' },
  brevets:            { min: 5,  max: 20, methode: 'Linéaire', label: 'Brevets, licences, marques' },
  fondsCommercial:    { min: 10, max: 10, methode: 'Linéaire', label: 'Fonds commercial (durée limitée)' },
  constructions:      { min: 20, max: 50, methode: 'Linéaire', label: 'Constructions' },
  installations:      { min: 5,  max: 10, methode: 'Linéaire / Dégressif', label: 'Installations techniques' },
  autresCorporel:     { min: 3,  max: 10, methode: 'Linéaire / Dégressif', label: 'Autres immobilisations corporelles' },
};
