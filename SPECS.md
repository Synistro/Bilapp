# SPECS — Bilapp
> Source de vérité du projet. Toute implémentation découle de ce document.
> Statut : 🟡 EN COURS — Session 003

---

## 1. Vision produit

Application web pédagogique permettant de générer des documents comptables français fictifs,
conformes au Plan Comptable Général (PCG 2024), destinés à la formation en comptabilité et fiscalité.

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
- Requiert un serveur HTTP local (ES6 modules incompatibles avec `file://`)

---

## 3. Structure des fichiers

```
Bilapp/
├── index.html
├── css/
│   ├── main.css            ← styles globaux, variables CSS
│   ├── form.css            ← formulaire multi-étapes
│   ├── documents.css       ← rendu documents comptables + édition inline
│   └── print.css           ← @media print / export PDF
├── js/
│   ├── core/
│   │   ├── constants.js    ← comptes PCG, libellés, taux, ratios sectoriels
│   │   ├── engine.js       ← moteur de calcul comptable (pur, zéro DOM)
│   │   ├── validator.js    ← règles de cohérence comptable (V01-V06)
│   │   ├── overrides.js    ← registre des postes verrouillés manuellement
│   │   └── reconcile.js    ← réconciliation post-édition (totaux + équilibre)
│   ├── modules/
│   │   ├── form.js         ← formulaire multi-étapes + collecte BilanParams
│   │   ├── bilan.js        ← renderer bilan + orchestration onglets + édition inline
│   │   ├── resultat.js     ← renderer compte de résultat + édition inline
│   │   ├── annexe.js       ← renderer annexe (P7)
│   │   └── liasse.js       ← renderer liasse Cerfa 2050-2058 (P8)
│   ├── utils/
│   │   └── doc-helpers.js  ← formatage montants, buildHeader, buildTabs
│   ├── export/
│   │   └── pdf.js          ← logique export PDF
│   └── app.js              ← orchestrateur principal
└── assets/
    └── cerfa/              ← templates visuels Cerfa
```

---

## 4. Schéma de données central — BilanParams

```js
const BilanParams = {
  societe: {
    nom:             String,
    formeJuridique:  String,   // 'SAS' | 'SARL' | 'SA'
    secteur:         String,   // 'commerce' | 'services' | 'industrie'
    activiteDetail:  String,
    anneeExercice:   Number,
  },
  taille: {
    ca:          String,  // 'micro' | 'tpe' | 'pme' | 'eti'
    nbEmployes:  String,  // 'aucun' | '1-5' | '6-20' | '21-50' | '50+'
    nbClients:   String,  // 'mono' | 'peu' | 'moyen' | 'masse'
  },
  finance: {
    orientation:        String,   // 'positif' | 'negatif' | 'neutre'
    hasImmobilisations: Boolean,
    hasDettesBancaires: Boolean,
    hasStocks:          Boolean,
    hasInternational:   Boolean,
    regimeTVA:          String,   // 'reel_normal' | 'reel_simplifie' | 'franchise'
  },
  output: {
    bilan:          Boolean,
    compteResultat: Boolean,
    annexe:         Boolean,
    liasseFiscale:  Boolean,
    compareN1:      Boolean,
  }
}
```

**Règles de cohérence :**
- `hasStocks` forcé à `false` si `secteur === 'services'`
- `regimeTVA` défaut `'franchise'` si `ca === 'micro'`

---

## 5. Formulaire multi-étapes

4 étapes séquentielles — voir form.js pour le détail complet des questions Q01-Q19.

---

## 6. Documents générés

### 6.1 Bilan comptable
- Format PCG, tableau Actif / Passif côte à côte
- Colonnes : Brut / Amort&Dép / Net N / Net N-1 (si compareN1)
- Contrainte : `Total Actif Net === Total Passif` (±1€)
- Édition inline activée sur tous les postes de détail (voir §9)

### 6.2 Compte de résultat
- Format PCG, liste Produits → Charges → Résultats intermédiaires
- Contrainte : `Résultat net === passif.capitauxPropres.resultat`
- Édition inline activée sur tous les postes de détail (voir §9)

### 6.3 Annexe — P7
> À spécifier

### 6.4 Liasse fiscale Cerfa 2050-2058 — P8
> À spécifier

---

## 7. Moteur de calcul (engine.js)

### Principe
Fonctions pures, zéro DOM. Produit un `BilanData` complet à partir de `BilanParams`.

### Règles de génération
- CA tiré aléatoirement dans `TRANCHES_CA[params.taille.ca]` ±15%
- Charges calculées via `RATIOS_SECTORIELS[secteur]`
- Résultat net cible = CA × ratio `ORIENTATIONS[orientation]`
- **Orientation neutre** : résultat net jamais nul — plancher ±1 000 € (voir §7.1)
- IS calculé : taux réduit 15% sur 42 500€, taux normal 25% au-delà
- Amortissements : clampés à brut (amort ≤ brut, impossible en PCG)
- Trésorerie = variable d'ajustement pour équilibrer actif/passif
- Dotations aux amortissements = variable d'ajustement pour atteindre le résultat cible
- `hasImmobilisations = false` → actif immobilisé = 0
- `hasStocks = false` → stocks = 0
- `hasDettesBancaires = false` → emprunts = 0
- `compareN1 = true` → génère N-1 avec CA × rand(0.85, 1.10)
- Tous les montants arrondis à l'euro

### 7.1 Contrainte résultat neutre non-nul
Un résultat net à 0 exact n'existe pas en pratique comptable.
Pour orientation `neutre`, si le résultat calculé est compris entre -1 000€ et +1 000€,
on le force à ±1 000€ (signe conservé, ou positif si 0 exact).
Cette contrainte s'applique à la génération initiale ET à la réconciliation post-édition.

### BilanData — structure de sortie
Voir engine.js pour la structure complète.

---

## 8. Validateur (validator.js)

| Règle | Contrôle |
|-------|----------|
| V01 | `actif.totalNet === passif.total` (±1€) |
| V02 | `resultat.resultatNet === passif.capitauxPropres.resultat` |
| V03 | `capital > 0` |
| V04 | `resultatNet < 0` si orientation = 'negatif' |
| V05 | `stocks.total.net === 0` si `hasStocks = false` |
| V06 | `immobilise.total.net === 0` si `hasImmobilisations = false` |

Retour : `{ success: Boolean, errors: Array<{ code, message }> }`

---

## 9. Édition inline — Spec fonctionnelle

### Principe
Après génération, l'utilisateur peut modifier n'importe quel poste de détail directement
dans le tableau affiché. Les résultats intermédiaires et le résultat net ne sont jamais
éditables — ils sont toujours calculés en cascade.

### Interaction
1. **Clic sur une cellule éditable** → input inline apparaît, valeur pré-remplie
2. **Saisie** → chiffre en euros (formats acceptés : "1234", "1 234", "1234,56", "1234 €")
3. **Confirmation** → `Enter` ou blur hors de la cellule
4. **Annulation** → `Escape` restaure la valeur précédente sans modification
5. **Post-confirmation** → poste verrouillé (icône 🔒, fond ambre), réconciliation déclenchée

### Postes éditables
- **Actif** : brut et amort de chaque poste de détail (net = brut - amort, recalculé)
- **Passif** : chaque poste de détail (capital, réserves, dettes, provisions…)
- **Compte de résultat** : chaque poste de produit ou charge

### Postes non éditables
- Tous les totaux et sous-totaux (recalculés automatiquement)
- Résultat net (calculé en cascade depuis le CR)

### Verrouillage
- Un poste confirmé est verrouillé pour toute la session
- Clic sur un poste déjà verrouillé → rééditable (déverrouillement implicite à la confirmation)
- Le compteur de verrous est affiché dans la barre d'actions
- `clearOverrides()` appelé automatiquement à "Nouveau bilan"

### Réconciliation (reconcile.js)
Déclenchée à chaque confirmation. Reçoit BilanData + overrides + BilanParams. Ordre :
1. Appliquer les overrides (clamp amort ≤ brut)
2. Si CA modifié → recalibrer les charges non verrouillées par ratio observé
3. Synchroniser variation stocks bilan → CR (PCG : stock final - stock initial)
4. Recalcul CR + ajustement dotations pour respecter l'orientation
5. Propager `resultatNet` → `passif.capitauxPropres.resultat`
6. Recalculer totaux passif
7. Recalculer totaux actif
8. Équilibrer via trésorerie (sauf si verrouillée → bandeau déséquilibre)

### Cohérence post-édition
- L'orientation d'origine est une contrainte permanente
- Si CA augmente sur une simulation neutre, les dotations absorbent pour maintenir l'équilibre
- Résultat neutre jamais nul (plancher ±1 000€ appliqué aussi en réconciliation)
- Stocks bilan modifiés → variationStocks CR mis à jour automatiquement

### Déséquilibre résiduel
Bandeau rouge avec écart chiffré si trésorerie verrouillée.

---

## 10. Export PDF — P6 ✅

- Basé sur `window.print()` + CSS `@media print`
- `pdf.js` prépare `#print-target` avant impression, nettoie après
- Actif page 1-2, passif page 3, CR page suivante
- En-tête navy sur chaque document
- Pied de page mention fictif
- Marges A4 : 15mm tous côtés sauf bas 20mm

---

## 11. Évolutions futures (hors MVP)

- **SIG / CAF** : Soldes Intermédiaires de Gestion et Capacité d'Autofinancement (resultat.js prêt)
- **Ratios de rentabilité** : calculés depuis BilanData
- **Tableau de financement** : niveau DSCG
- **SCI / EI** : formes juridiques supplémentaires
- **Mode élève / formateur** : droits d'édition différenciés
- **Export Excel/CSV**

---

## 12. Contraintes & hors-périmètre

- ❌ Pas de vrais numéros SIREN/SIRET valides
- ❌ Pas de signature d'expert-comptable simulée
- ❌ Pas de comptabilité analytique
- ❌ Pas de backend / base de données
- ❌ Zéro donnée transmise — 100% client-side

---

## 13. Roadmap MVP

| Phase | Contenu                                          | Statut |
|-------|--------------------------------------------------|--------|
| P0    | Setup repo, structure, constants.js              | ✅ |
| P1    | Formulaire multi-étapes + BilanParams            | ✅ |
| P2    | engine.js — moteur de calcul                     | ✅ |
| P3    | validator.js                                     | ✅ |
| P4    | Renderer bilan + documents.css                   | ✅ |
| P5    | Renderer compte de résultat + archi modulaire    | ✅ |
| P5b   | Édition inline + overrides + reconcile           | ✅ |
| P5c   | Fix cohérence CR↔bilan + résultat neutre non-nul | ✅ |
| P6    | Export PDF                                       | ✅ |
| P7    | Annexe                                           | 🔴 |
| P8    | Liasse fiscale Cerfa                             | 🔴 |
