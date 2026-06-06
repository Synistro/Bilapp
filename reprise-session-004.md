# Prompt de reprise — Session 004 Bilapp

> Copier-coller TOUT ce fichier en premier message du nouveau chat.

---

Bonjour, on reprend le développement de Bilapp. Voici le contexte complet :

---

## Projet

**Bilapp** — Générateur de bilans comptables pédagogiques français.
Conformes PCG 2024. Marqués "DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT".
Public : élèves comptabilité (BTS/DCG/DSCG) + formateurs fiscalité.

**Repo :** https://github.com/Synistro/Bilapp
**GitHub Pages :** https://synistro.github.io/Bilapp/
**Stack :** Vanilla HTML/CSS/JS, ES6 modules natifs, zéro framework, zéro bundler.
**Local :** `C:\Users\Julie\Documents\Perso\Projects\Bilapp\`
**Serveur local :** `npx serve .` → `http://localhost:3000`

---

## Ce qui est fait

### Core
- `constants.js` — PCG 2024, ratios sectoriels, taux, fourchettes CA ✅
- `engine.js` — moteur de calcul, fonctions pures, BilanData ✅
- `validator.js` — 6 règles V01-V06 ✅
- `overrides.js` — registre des postes verrouillés ✅
- `reconcile.js` — recalcul en cascade CR→passif→actif→tréso, cohérence orientation ✅

### Modules
- `form.js` — formulaire 4 étapes, BilanParams ✅
- `bilan.js` — renderer bilan + onglets + édition inline ✅
- `resultat.js` — renderer CR + édition inline ✅
- `doc-helpers.js` — fmt, fmtResultat, zeroCls, buildHeader, buildTabs ✅

### CSS
- `main.css`, `form.css`, `documents.css`, `print.css` ✅

### App
- `app.js` — orchestrateur ✅
- `pdf.js` — export PDF via window.print() ✅

---

## Comportements clés implémentés

### Génération
- CA ±15%, ratios sectoriels, IS PME, tréso variable d'ajustement
- Dotations = variable d'ajustement pour résultat cible
- Amort clampé ≤ brut (fix bug N-1)
- **Résultat neutre jamais nul** : si |resultatNet| < 1 000€, forcé à ±1 000€ — À IMPLÉMENTER (spécifié, pas encore codé)

### Édition inline
- Clic → input → Enter/blur → verrouillage 🔒
- Reconcile reçoit (BilanData, overrides, BilanParams)
- CR modifié → résultatNet propagé au passif → tréso absorbe
- CA modifié → charges recalibrées par ratio observé
- Stocks bilan modifiés → variationStocks CR mis à jour (PCG)
- Orientation toujours respectée via dotations

### Export PDF
- `exportDocument('#docContent')` → injecte dans `#print-target` → `window.print()`
- Actif p1, passif p2, CR p3

---

## Ce qui reste à faire

| Phase | Contenu | Priorité |
|-------|---------|----------|
| Fix | Résultat neutre jamais nul (plancher ±1 000€) dans engine.js + reconcile.js | **Immédiat** |
| P7 | `js/modules/annexe.js` — tableau immos, amortissements, capitaux propres | Après |
| P8 | `js/modules/liasse.js` — liasse fiscale Cerfa 2050-2058 | Après |

---

## Conventions (non négociables)

- JSDoc sur toutes les fonctions publiques
- Commentaires inline = POURQUOI uniquement
- Zéro magic numbers → constants.js
- Fonctions pures dans core/
- Commits : `fix: résultat neutre non-nul`
- MCP filesystem actif sur `C:\Users\Julie\Documents\Perso\Projects\`
- Problème EPERM → `Remove-Item` le fichier avant réécriture
- `.gitignore` contient `*.md` → `git add -f` pour les .md

---

## BilanParams — schéma

```js
{
  societe: { nom, formeJuridique, secteur, activiteDetail, anneeExercice },
  taille:  { ca, nbEmployes, nbClients },
  finance: { orientation, hasImmobilisations, hasDettesBancaires, hasStocks, hasInternational, regimeTVA },
  output:  { bilan, compteResultat, annexe, liasseFiscale, compareN1 }
}
```

---

On commence par le fix résultat neutre non-nul, puis P7.
