/**
 * hints.js — Bilapp
 * -------------------------------------------------------
 * Définitions courtes des postes comptables affichées
 * en tooltip dans les documents générés (bilan, CR).
 *
 * Clés : identifiants sémantiques des postes (pas les numéros PCG,
 * pour rester indépendant de la structure de données).
 *
 * Règle de rédaction :
 *   - Une seule phrase, max ~80 caractères
 *   - Langage élève (BTS/DCG), pas de jargon expert
 *   - Exemple concret si ça aide (ex. matière)
 */

'use strict';

export const HINTS = {

  // ============================================================
  // ACTIF IMMOBILISÉ — INCORPOREL
  // ============================================================
  fraisEtablissement:
    'Dépenses de création de la société (notaire, immatriculation…).',
  fraisRD:
    'Coûts de recherche et développement activés à l\'actif.',
  brevets:
    'Brevets, licences et marques détenus par la société.',
  fondsCommercial:
    'Valeur de la clientèle et de l\'emplacement acquis avec un fonds.',
  autresIncorporel:
    'Autres actifs immatériels non classés ailleurs.',

  // ============================================================
  // ACTIF IMMOBILISÉ — CORPOREL
  // ============================================================
  terrains:
    'Terrains possédés par la société. Non amortissables.',
  constructions:
    'Bâtiments et aménagements. Amortis sur 20 à 50 ans.',
  installations:
    'Machines, outillage et matériel technique. Ex. : chaîne de production.',
  autresCorporel:
    'Mobilier, véhicules, matériel informatique…',

  // ============================================================
  // ACTIF IMMOBILISÉ — FINANCIER
  // ============================================================
  participations:
    'Parts détenues dans d\'autres sociétés (filiales, prises de participation).',
  autresFinancier:
    'Prêts accordés, dépôts de garantie versés…',

  // ============================================================
  // ACTIF CIRCULANT — STOCKS
  // ============================================================
  matieresPremières:
    'Matières achetées pour fabriquer les produits. Ex. : tissu pour un fabricant de vêtements.',
  enCours:
    'Produits en cours de fabrication, pas encore finis.',
  produitsFinis:
    'Produits fabriqués par la société, prêts à être vendus.',
  marchandises:
    'Articles achetés pour être revendus en l\'état. Ex. : téléphones pour un revendeur.',

  // ============================================================
  // ACTIF CIRCULANT — CRÉANCES
  // ============================================================
  clients:
    'Factures émises mais pas encore encaissées. Ce que les clients doivent.',
  autresCreances:
    'Autres sommes dues à la société (État, associés…).',

  // ============================================================
  // ACTIF CIRCULANT — DISPONIBILITÉS
  // ============================================================
  vmp:
    'Placements financiers à court terme (SICAV, obligations…).',
  banqueCaisse:
    'Argent disponible immédiatement en banque et en caisse.',

  // ============================================================
  // COMPTES DE RÉGULARISATION — ACTIF
  // ============================================================
  chargesConstatees:
    'Charges payées d\'avance rattachées à l\'exercice suivant. Ex. : loyer de janvier payé en décembre.',

  // ============================================================
  // PASSIF — CAPITAUX PROPRES
  // ============================================================
  capital:
    'Apports des associés lors de la création ou d\'augmentations de capital.',
  primesEmission:
    'Surplus versé par les nouveaux associés au-dessus de la valeur nominale.',
  reserveLegale:
    'Réserve obligatoire : 5% du bénéfice chaque année, plafonnée à 10% du capital.',
  autresReserves:
    'Bénéfices des années passées mis en réserve (non distribués).',
  reportANouveau:
    'Résultat des exercices antérieurs non affecté. Peut être positif ou négatif.',
  resultatExercice:
    'Bénéfice ou perte de l\'exercice en cours.',

  // ============================================================
  // PASSIF — PROVISIONS
  // ============================================================
  provisionsRisques:
    'Sommes mises de côté pour couvrir un risque probable. Ex. : litige en cours.',
  provisionsCharges:
    'Sommes réservées pour des charges futures certaines mais non encore facturées.',

  // ============================================================
  // PASSIF — DETTES
  // ============================================================
  emprunts:
    'Emprunts bancaires à rembourser (moyen/long terme).',
  comptesCourantsAssocies:
    'Sommes prêtées par les associés à la société, remboursables (apports en compte courant).',
  fournisseurs:
    'Factures reçues mais pas encore payées aux fournisseurs.',
  fiscalesSociales:
    'TVA à payer, cotisations sociales, impôts dus…',
  autresDettes:
    'Autres dettes envers les associés, le personnel…',

  // ============================================================
  // COMPTES DE RÉGULARISATION — PASSIF
  // ============================================================
  produitsConstates:
    'Produits encaissés d\'avance rattachés à l\'exercice suivant. Ex. : abonnement annuel payé par le client.',

  // ============================================================
  // COMPTE DE RÉSULTAT — PRODUITS
  // ============================================================
  ca:
    'Total des ventes de biens et services de l\'exercice.',
  productionStockee:
    'Variation de stock de produits fabriqués (positif = augmentation).',
  subventions:
    'Aides publiques liées à l\'activité (subventions d\'exploitation).',
  autresProduits:
    'Produits divers non liés directement aux ventes.',

  // ============================================================
  // COMPTE DE RÉSULTAT — CHARGES
  // ============================================================
  achatsMarchandises:
    'Coût des marchandises achetées pour être revendues.',
  variationStocks:
    'Différence de stock entre début et fin d\'exercice (signe négatif = déstockage).',
  achatsMatieres:
    'Coût des matières premières consommées pour la production.',
  autresAchats:
    'Loyers, assurances, honoraires, sous-traitance…',
  impotsTaxes:
    'Taxe foncière, CFE, taxe sur les salaires… (hors IS)',
  chargesPersonnel:
    'Salaires bruts + charges patronales versés aux salariés.',
  dotationsAmort:
    'Dépréciation annuelle des immobilisations. Ex. : un ordi à 1 200 € sur 3 ans = 400 €/an.',

  // ============================================================
  // COMPTE DE RÉSULTAT — FINANCIER
  // ============================================================
  produitsFinanciers:
    'Intérêts et dividendes reçus, gains de change…',
  chargesFinancieres:
    'Intérêts des emprunts bancaires, agios…',

  // ============================================================
  // COMPTE DE RÉSULTAT — EXCEPTIONNEL
  // ============================================================
  produitsExceptionnels:
    'Produits hors activité courante. Ex. : vente d\'une immobilisation.',
  chargesExceptionnelles:
    'Charges hors activité courante. Ex. : pénalités, amendes.',

  // ============================================================
  // COMPTE DE RÉSULTAT — IS + PARTICIPATION
  // ============================================================
  participation:
    'Part des bénéfices reversée aux salariés (obligatoire >50 salariés).',
  impots:
    'Impôt sur les sociétés dû au titre de l\'exercice.',
};
