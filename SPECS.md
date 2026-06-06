# SPECS — Bilapp
> Source de vérité du projet. Toute implémentation découle de ce document.
> Statut : 🟡 EN COURS DE RÉDACTION — Session 001

---

## 1. Vision produit

Application web pédagogique permettant de générer des documents comptables français fictifs,
conformes au Plan Comptable Général (PCG), destinés à la formation en comptabilité et fiscalité.

**Public cible :**
- Élèves en formation comptable (BTS, DCG, DSCG)
- Formateurs en gestion fiscale française

**Contrainte légale absolue :**
Tous les documents générés portent la mention visible :
> "DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT"

**Hébergement :** GitHub Pages — https://synistro.github.io/Bilapp/

---

## 2. Stack technique

- Vanilla HTML / CSS / JS — zéro framework, zéro bundler
- Modules ES6 natifs (`type="module"`)
- Export PDF via `window.print()` + CSS `@media print`
- Zéro dépendance externe
- Fonctionne sans serveur (`file://`) et sur GitHub Pages

---

## 3. Structure des fichiers

```
Bilapp/
├── index.html
├── css/
│   ├── main.css            ← styles globaux, variables CSS
│   ├── form.css            ← formulaire multi-étapes
│   ├── documents.css       ← rendu documents comptables
│   └── print.css           ← @media print / export PDF
├── js/
│   ├── core/
│   │   ├── constants.js    ← comptes PCG, libellés, cases Cerfa, taux
│   │   ├── engine.js       ← moteur de calcul comptable (pur, zéro DOM)
│   │   └── validator.js    ← règles de cohérence comptable
│   ├── modules/
│   │   ├── form.js         ← formulaire multi-étapes + collecte BilanParams
│   │   ├── bilan.js        ← génération + rendu bilan
│   │   ├── resultat.js     ← génération + rendu compte de résultat
│   │   ├── annexe.js       ← génération + rendu annexe
│   │   └── liasse.js       ← génération + rendu liasse Cerfa 2050-2058
│   ├── export/
│   │   └── pdf.js          ← logique export PDF
│   └── app.js              ← orchestrateur principal
└── assets/
    └── cerfa/              ← templates visuels Cerfa
```

---

## 4. Schéma de données central — BilanParams

Objet unique généré par le formulaire et transmis à tous les modules.

```js
const BilanParams = {

  // --- Identité société ---
  societe: {
    nom:             String,   // ex: "Dupont & Associés"
    formeJuridique:  String,   // 'SAS' | 'SARL' | 'SA'
    secteur:         String,   // 'commerce' | 'services' | 'industrie'
    activiteDetail:  String,   // description libre, ex: "vente de matériel informatique"
    anneeExercice:   Number,   // ex: 2024
  },

  // --- Taille & structure ---
  taille: {
    ca:          String,  // 'micro' (<80k€) | 'tpe' (<500k€) | 'pme' (<5M€) | 'eti' (<50M€)
    nbEmployes:  String,  // 'aucun' | '1-5' | '6-20' | '21-50' | '50+'
    nbClients:   String,  // 'mono' | 'peu' (<20) | 'moyen' (<200) | 'masse' (200+)
  },

  // --- Paramètres financiers ---
  finance: {
    orientation:        String,   // 'positif' | 'negatif' | 'neutre'
    hasImmobilisations: Boolean,  // bureaux, machines, véhicules…
    hasDettesBancaires: Boolean,
    hasStocks:          Boolean,  // auto-false si secteur = 'services'
    hasInternational:   Boolean,  // clients/fournisseurs hors France
    regimeTVA:          String,   // 'reel_normal' | 'reel_simplifie' | 'franchise'
  },

  // --- Documents à générer ---
  output: {
    bilan:          Boolean,  // défaut: true
    compteResultat: Boolean,  // défaut: true
    annexe:         Boolean,
    liasseFiscale:  Boolean,
    compareN1:      Boolean,
  }
}
```

**Règles de cohérence BilanParams :**
- `hasStocks` → forcé à `false` si `secteur === 'services'`
- `regimeTVA` → défaut `'franchise'` si `ca === 'micro'`, sinon `'reel_normal'`
- `formeJuridique` MVP : `SAS | SARL | SA` uniquement

---

## 5. Formulaire multi-étapes

### UX
- 4 étapes séquentielles avec barre de progression
- Navigation Précédent / Suivant
- Validation par étape avant passage à la suivante
- Récapitulatif avant génération
- Affichage conditionnel : question 12 (stocks) masquée si secteur = services

### Étape 1 — Identité
| # | Question | Type | Valeurs |
|---|----------|------|---------|
| Q01 | Nom de la société | Texte libre | — |
| Q02 | Forme juridique | Select | SAS / SARL / SA |
| Q03 | Secteur d'activité | Select | Commerce / Prestation de services / Industrie |
| Q04 | Description de l'activité | Texte libre | ex: "vente de matériel informatique" |
| Q05 | Année de l'exercice | Nombre | ex: 2024 |

### Étape 2 — Taille
| # | Question | Type | Valeurs |
|---|----------|------|---------|
| Q06 | Chiffre d'affaires approximatif | Select | Micro (<80k€) / TPE (<500k€) / PME (<5M€) / ETI (<50M€) |
| Q07 | Nombre d'employés | Select | Aucun / 1-5 / 6-20 / 21-50 / 50+ |
| Q08 | Nombre de clients | Select | 1 seul / Moins de 20 / Entre 20 et 200 / Plus de 200 |

### Étape 3 — Structure financière
| # | Question | Type | Valeurs / Notes |
|---|----------|------|-----------------|
| Q09 | Résultat souhaité | Select | Bénéficiaire / Déficitaire / À l'équilibre |
| Q10 | Immobilisations ? | Toggle Oui/Non | Bureaux, machines, véhicules… |
| Q11 | Dettes bancaires ? | Toggle Oui/Non | — |
| Q12 | Stocks ? | Toggle Oui/Non | Masqué si secteur = services |
| Q13 | Activité internationale ? | Toggle Oui/Non | Clients/fournisseurs hors France |
| Q14 | Régime TVA | Select | Réel normal / Réel simplifié / Franchise en base |

### Étape 4 — Documents à générer
| # | Question | Type | Défaut |
|---|----------|------|--------|
| Q15 | Bilan | Checkbox | ✅ coché |
| Q16 | Compte de résultat | Checkbox | ✅ coché |
| Q17 | Annexe | Checkbox | ☐ |
| Q18 | Liasse fiscale complète | Checkbox | ☐ |
| Q19 | Inclure comparatif N-1 | Toggle Oui/Non | Non |

---

## 6. Documents générés

### 6.1 Bilan comptable
- Format PCG officiel, présentation en tableau (Actif gauche / Passif droite)
- Colonnes : Brut / Amortissements & Dépréciations / Net N / Net N-1 (si compareN1)
- Règle absolue : `Total Actif Net = Total Passif` (vérifié par validator.js)
- Watermark : "DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT"

**Structure Actif (PCG) :**
```
ACTIF IMMOBILISÉ
  Immobilisations incorporelles
    Frais d'établissement                    (201)
    Frais de recherche et développement      (203)
    Concessions, brevets, licences           (205)
    Fonds commercial                         (207)
    Autres immobilisations incorporelles     (208)
  Immobilisations corporelles
    Terrains                                 (211)
    Constructions                            (213)
    Installations techniques, matériel       (215)
    Autres immobilisations corporelles       (218)
  Immobilisations financières
    Participations                           (261)
    Autres immobilisations financières       (27)
ACTIF CIRCULANT
  Stocks et en-cours
    Matières premières                       (31)
    En-cours de production                   (33)
    Produits finis                           (35)
    Marchandises                             (37)
  Créances
    Créances clients                         (411)
    Autres créances                          (46)
  Disponibilités
    Valeurs mobilières de placement          (50)
    Disponibilités (banque, caisse)          (51/53)
COMPTES DE RÉGULARISATION
  Charges constatées d'avance               (486)
```

**Structure Passif (PCG) :**
```
CAPITAUX PROPRES
  Capital social                             (101)
  Primes d'émission                          (104)
  Réserves
    Réserve légale                           (1061)
    Réserves statutaires                     (1063)
    Autres réserves                          (1068)
  Report à nouveau                           (110/119)
  Résultat de l'exercice                     (120/129)  ← positif | négatif | nul
PROVISIONS
  Provisions pour risques                    (151)
  Provisions pour charges                    (158)
DETTES
  Emprunts et dettes bancaires               (164)
  Dettes fournisseurs                        (401)
  Dettes fiscales et sociales                (43/44)
  Autres dettes                              (46)
COMPTES DE RÉGULARISATION
  Produits constatés d'avance               (487)
```

### 6.2 Compte de résultat
- Format PCG, présentation en liste (Charges / Produits)
- Règle absolue : `Résultat net = Produits totaux - Charges totales`
- Résultat net = Résultat net du bilan (vérifié par validator.js)

**Structure (PCG) :**
```
PRODUITS D'EXPLOITATION
  Chiffre d'affaires net                     (70)
  Production stockée                         (71)
  Production immobilisée                     (72)
  Subventions d'exploitation                 (74)
  Autres produits                            (75)
CHARGES D'EXPLOITATION
  Achats de marchandises                     (607)
  Variation de stocks                        (6037)
  Achats matières premières                  (601)
  Autres achats et charges externes          (61/62)
  Impôts et taxes                            (63)
  Charges de personnel                       (64)
  Dotations amortissements                   (68)
  Autres charges                             (65)
  → RÉSULTAT D'EXPLOITATION
PRODUITS FINANCIERS                          (76)
CHARGES FINANCIÈRES                          (66)
  → RÉSULTAT FINANCIER
  → RÉSULTAT COURANT AVANT IMPÔTS
PRODUITS EXCEPTIONNELS                       (77)
CHARGES EXCEPTIONNELLES                      (67)
  → RÉSULTAT EXCEPTIONNEL
PARTICIPATION DES SALARIÉS                   (691)
IMPÔTS SUR LES BÉNÉFICES                    (695)
  → RÉSULTAT NET
```

### 6.3 Annexe
> À spécifier — Session ultérieure
- Tableau des immobilisations
- Tableau des amortissements
- Variation des capitaux propres
- Engagements hors bilan

### 6.4 Liasse fiscale Cerfa 2050-2058
> À spécifier — Session ultérieure

---

## 7. Moteur de calcul (engine.js)

### Principe
- Génère des montants cohérents à partir de `BilanParams`
- Fonctions pures uniquement — zéro DOM, zéro état global
- Produit un objet `BilanData` consommé par les renderers

### Fourchettes par tranche de CA
| Tranche | CA min | CA max |
|---------|--------|--------|
| micro   | 20 000 | 80 000 |
| tpe     | 80 000 | 500 000 |
| pme     | 500 000 | 5 000 000 |
| eti     | 5 000 000 | 50 000 000 |

### Règles de génération
- Les montants sont générés avec une variation aléatoire ±15% pour éviter les chiffres ronds
- Le CA est tiré aléatoirement dans la fourchette de la tranche
- Les ratios sectoriels s'appliquent (voir constants.js)
- L'orientation (positif/négatif/neutre) pilote le résultat net :
  - `positif` → résultat net = 3% à 12% du CA
  - `negatif` → résultat net = -1% à -15% du CA
  - `neutre` → résultat net = -0.5% à +0.5% du CA
- `hasStocks = false` → tous les postes stocks = 0
- `hasImmobilisations = false` → actif immobilisé = 0, pas de dotations
- `hasDettesBancaires = false` → compte 164 = 0
- `hasInternational = true` → créances/dettes libellées avec mention devise

### Objet BilanData (output du moteur)
> Structure détaillée à compléter lors du développement de engine.js

---

## 8. Validateur (validator.js)

Vérifie la cohérence avant tout rendu. Bloque la génération si échec.

| Règle | Contrôle |
|-------|----------|
| V01 | `Total Actif Net === Total Passif` (tolérance : 1€ arrondi) |
| V02 | `Résultat net bilan === Résultat net compte de résultat` |
| V03 | `Capital social > 0` pour SAS/SARL/SA |
| V04 | `Résultat net < 0` si orientation = 'negatif' |
| V05 | `Stocks === 0` si `hasStocks === false` |
| V06 | `Actif immobilisé === 0` si `hasImmobilisations === false` |

Format de retour :
```js
{ success: Boolean, errors: Array<{ code: String, message: String }> }
```

---

## 9. Export PDF (pdf.js)

- Basé sur `window.print()` + CSS `@media print`
- Chaque document généré = une page imprimable distincte
- En-tête sur chaque page : nom société, exercice, mention FICTIF
- Pied de page : "Généré par Bilapp — Document fictif à des fins pédagogiques"
- Marges : 1.5cm sur tous les côtés
- Police : serif (rendu professionnel)

---

## 10. Contraintes & hors-périmètre

- ❌ Pas de vrais numéros SIREN/SIRET valides générés
- ❌ Pas de simulation de signature d'expert-comptable
- ❌ Pas de comptabilité analytique
- ❌ Pas de gestion de paie
- ❌ Pas de trésorerie temps-réel
- ❌ Pas de backend / base de données
- ❌ SCI et EI : hors-périmètre MVP (version ultérieure)
- ✅ Fonctionne 100% côté client, zéro donnée transmise

---

## 11. Roadmap MVP

| Phase | Contenu | Statut |
|-------|---------|--------|
| P0 | Setup repo, structure fichiers, constants.js | 🔴 |
| P1 | Formulaire multi-étapes + BilanParams | 🔴 |
| P2 | engine.js — moteur de calcul | 🔴 |
| P3 | validator.js | 🔴 |
| P4 | Rendu bilan | 🔴 |
| P5 | Rendu compte de résultat | 🔴 |
| P6 | Export PDF | 🔴 |
| P7 | Annexe | 🔴 |
| P8 | Liasse fiscale Cerfa | 🔴 |
