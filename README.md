# Bilapp

Générateur de documents comptables français fictifs à des fins pédagogiques.

**[→ Ouvrir l'application](https://synistro.github.io/Bilapp/)**

---

## À quoi ça sert ?

Bilapp génère des bilans comptables et comptes de résultat réalistes, conformes au PCG 2024, pour un usage exclusivement pédagogique. Public cible : élèves BTS/DCG/DSCG et formateurs en gestion fiscale.

Tous les documents portent la mention obligatoire **"DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT"**.

---

## Fonctionnalités

- **Formulaire guidé** en 4 étapes : identité société, taille, structure financière, documents souhaités
- **Moteur de calcul** conforme PCG 2024 — ratios sectoriels, IS PME, trésorerie équilibrée
- **Bilan actif/passif** et **compte de résultat** avec colonnes N et N-1 optionnelles
- **Édition inline** — cliquer sur n'importe quel poste pour le modifier ; les totaux se recalculent en cascade et le bilan reste équilibré
- **Verrouillage de postes** — les valeurs modifiées sont protégées (🔒) et ne bougent plus
- Navigation par onglets entre les documents générés

---

## Stack

Vanilla HTML / CSS / JS — zéro framework, zéro bundler, zéro dépendance.  
Modules ES6 natifs (`type="module"`).

```
js/
  core/
    constants.js    ← PCG 2024, ratios, taux
    engine.js       ← moteur de calcul (fonctions pures)
    validator.js    ← règles de cohérence comptable
    overrides.js    ← registre des postes verrouillés
    reconcile.js    ← recalcul en cascade post-édition
  modules/
    form.js         ← formulaire multi-étapes
    bilan.js        ← renderer bilan + édition inline
    resultat.js     ← renderer compte de résultat
  utils/
    doc-helpers.js  ← formatage et composants partagés
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
| P3 | Validateur | ✅ |
| P4 | Renderer bilan | ✅ |
| P5 | Renderer compte de résultat + archi modulaire | ✅ |
| P5b | Édition inline + réconciliation | ✅ |
| P6 | Export PDF | 🔴 |
| P7 | Annexe comptable | 🔴 |
| P8 | Liasse fiscale Cerfa 2050-2058 | 🔴 |

---

> Projet pédagogique — aucune donnée réelle, aucun backend, 100% client-side.
