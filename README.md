# Bilapp

Générateur de documents comptables français fictifs à des fins pédagogiques.

**[→ Ouvrir l'application](https://synistro.github.io/Bilapp/)**

---

## À quoi ça sert ?

Bilapp génère des bilans comptables complets et réalistes, conformes au PCG 2024, pour un usage exclusivement pédagogique. Public cible : élèves BTS/DCG/DSCG et formateurs en gestion fiscale.

Tous les documents portent la mention obligatoire **"DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT"**.

---

## Fonctionnalités

### Génération de documents
- **Formulaire guidé** en 4 étapes : identité société, taille, structure financière, documents souhaités
- **Moteur de calcul** conforme PCG 2024 — ratios sectoriels, IS PME, trésorerie équilibrée automatiquement
- **Bilan actif/passif** et **compte de résultat** avec colonnes N et N-1 optionnelles
- **Annexe comptable** — immobilisations, amortissements, capitaux propres, méthodes
- **Liasse fiscale complète** — 12 imprimés Cerfa 2050 à 2059-A avec codes lignes exacts

### Analyse financière
- **Onglet Analyse** — FR, BFR, Trésorerie Nette, SIG complet (VA, EBE, EBIT, RCAI), CAF
- **Ratios** — ROE, ROA, marge nette, autonomie financière avec interprétations contextuelles

### Réalisme pédagogique
- **SIRET/SIREN fictifs** générés par algorithme Luhn — valides mais non réels
- **Adresse postale fictive** cohérente (ville + code postal français)
- Résultat net jamais nul — randomisé pour éviter les cas trop parfaits
- Amortissements clampés (amort ≤ brut), cohérence CR ↔ bilan garantie

### Édition et workflow
- **Édition inline** — cliquer sur n'importe quel poste pour le modifier ; les totaux se recalculent en cascade et le bilan reste équilibré
- **Verrouillage de postes** — les valeurs modifiées sont protégées (🔒) et résistent aux recalculs
- **Régénérer** — relance le moteur en conservant les postes verrouillés
- **📅 Année suivante** — duplique le bilan courant en N-1 figé et génère un nouvel exercice N
- **Sauvegarde / Chargement de session** — export `.json` complet, rechargeable depuis l'accueil
- **Export PDF** via impression navigateur

---

## Stack

Vanilla HTML / CSS / JS — zéro framework, zéro bundler, zéro dépendance.  
Modules ES6 natifs (`type="module"`).

```
js/
  core/
    constants.js    ← PCG 2024, ratios, taux, VILLES_FR
    engine.js       ← moteur de calcul (fonctions pures)
    validator.js    ← règles de cohérence comptable (V01-V06)
    overrides.js    ← registre des postes verrouillés
    reconcile.js    ← recalcul en cascade post-édition
  modules/
    form.js         ← formulaire multi-étapes (BilanParams)
    bilan.js        ← renderer bilan + édition inline + actions
    resultat.js     ← renderer compte de résultat
    annexe.js       ← renderer annexe comptable
    liasse.js       ← renderer liasse fiscale (12 imprimés Cerfa)
    ratios.js       ← calcul et rendu analyse financière
  utils/
    doc-helpers.js  ← formatage, buildHeader, buildTabs
    identite.js     ← génération SIRET/SIREN (Luhn) + adresse fictive
  export/
    pdf.js          ← export PDF via window.print()
    session.js      ← save/load session JSON (v2.0)
```

---

## Lancer en local

Les modules ES6 nécessitent un serveur HTTP — `file://` ne fonctionne pas.

```bash
npx serve .
# puis ouvrir http://localhost:3000
```

---

## Roadmap

| Phase | Contenu | Statut |
|-------|---------|--------|
| P1 | Formulaire + BilanParams | ✅ |
| P2 | Moteur de calcul engine.js | ✅ |
| P3 | Validateur + réconciliation | ✅ |
| P4 | Renderer bilan + édition inline | ✅ |
| P5 | Renderer compte de résultat + archi modulaire | ✅ |
| P6 | Export PDF + CSS impression | ✅ |
| P7 | Annexe comptable | ✅ |
| P8 | Liasse fiscale Cerfa 2050–2059-A | ✅ |
| P9a | Analyse financière (FR/BFR/SIG/CAF/ratios) | ✅ |
| P9c | SIRET/SIREN fictifs (Luhn) + adresse fictive | ✅ |
| P9d | Duplication année suivante + session v2.0 | ✅ |
| P10 | Exercices décalés (date début/fin libre) | 🟡 En cours |

---

> Projet pédagogique — aucune donnée réelle, aucun backend, 100% client-side.
