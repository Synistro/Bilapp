# Prompt de reprise — Session 009 Bilapp

> Copier-coller TOUT ce fichier en premier message du nouveau chat.

---

## ⚠️ CONVENTION FAILSAFE (à respecter dans toutes les sessions)

Quand le contexte approche ~80% de consommation, Claude lève ce signal :

```
⚠️ FAILSAFE — contexte ~80% consommé
On arrête le code ici. Bilan d'état + mise à jour reprise avant de couper.
```

Actions à ce moment :
1. Noter exactement où on en est (fichier, fonction, imprimé en cours)
2. Mettre à jour le fichier de reprise de la session suivante
3. Committer ce qui est stable (`git add -f` pour les .md)
4. Ouvrir un nouveau chat avec le fichier de reprise

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
- `constants.js` — PCG 2024, ratios sectoriels, taux, fourchettes CA, `DUREES_AMORT` ✅
- `engine.js` — moteur de calcul, fonctions pures, BilanData ✅
  - Résultat neutre randomisé dans `[-999, -1] ∪ [1, 999]` (jamais 0 ni round) ✅
- `validator.js` — 6 règles V01-V06 ✅
- `overrides.js` — registre des postes verrouillés ✅
- `reconcile.js` — recalcul en cascade + plancher neutre randomisé ✅

### Modules
- `form.js` — formulaire 4 étapes, BilanParams ✅
- `bilan.js` — renderer bilan + onglets + édition inline + 💾/📂 session + 🔄 Régénérer ✅
- `resultat.js` — renderer CR + édition inline ✅
- `annexe.js` — annexe comptable 4 sections ✅
- `liasse.js` — liasse fiscale 12 imprimés Cerfa 2050–2059-A, lecture seule ✅
- `doc-helpers.js` — fmt, fmtResultat, zeroCls, buildHeader, buildTabs ✅

### Export / Session
- `pdf.js` — export PDF via window.print() ✅
- `session.js` — save/load session `.json` ✅

### App
- `app.js` — orchestrateur + bouton 📂 Charger session depuis page d'accueil ✅

### CSS
- `main.css`, `form.css`, `documents.css`, `print.css` ✅

---

## MCP filesystem — RÉSOLU session 008
Le dossier était en lecture seule. **Maintenant corrigé — `edit_file` et `write_file` fonctionnent sur les fichiers existants.** Plus besoin de patch manuel.

Config `claude_desktop_config.json` :
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "C:\\Users\\Julie\\Documents\\Perso\\Projects\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js",
        "C:\\Users\\Julie\\Documents\\Perso\\Projects"
      ]
    }
  }
}
```

---

## Agenda session 009 — P9

Trois features validées, à implémenter dans cet ordre (du plus simple au plus complexe) :

### P9a — Ratios / SIG / CAF (~4-5k tokens)
**Nouveau fichier `js/modules/ratios.js`**
- FR = Capitaux permanents − Actif immobilisé net
- BFR = (Stocks + Créances) − Dettes d'exploitation
- TN = FR − BFR
- SIG : VA, EBE, EBIT, RCAI
- CAF = Résultat net + Dotations − Reprises
- Ratios : ROE, ROA, marge nette, autonomie financière
- Nouvel onglet "Analyse" dans `buildTabs` (conditionnel sur `output.analyse` — à ajouter dans BilanParams + form.js étape 4)
- Lecture seule, pas d'édition inline

### P9c — SIRET/SIREN + Adresse fictive (~3-4k tokens)
**Nouveau fichier `js/utils/identite.js`**
- `genererSIREN()` — 9 chiffres valides (algorithme Luhn)
- `genererSIRET(siren)` — SIREN + NIC 5 chiffres
- `genererAdresse()` — tirage dans une table ~50 villes FR avec CP
- Table villes dans `constants.js`
- Affichage dans `buildHeader` (doc-helpers.js)
- BilanParams : `societe.siret`, `societe.adresse` (générés automatiquement à la création)

### P9d — Duplication vers année suivante (~5-6k tokens)
**Bouton "📅 Année suivante" dans bilan.js**
- `params.societe.anneeExercice += 1`
- BilanData courant → figé comme N-1 exact (pas régénéré)
- `generate(newParams)` → nouvelles données N
- `compareN1 = true` forcé
- Session sauvegardée avec les deux années
- `session.js` : payload étendu avec `dataN1Figee`

---

## Ordre recommandé
1. P9c (isolé, zéro dépendance) → rapide win
2. P9a (nouveau module, onglet) → valeur pédagogique forte
3. P9d (logique N/N-1) → plus complexe, garder pour fin de session

---

## BilanParams — schéma actuel
```js
{
  societe: { nom, formeJuridique, secteur, activiteDetail, anneeExercice },
  taille:  { ca, nbEmployes, nbClients },
  finance: { orientation, hasImmobilisations, hasDettesBancaires, hasStocks, hasInternational, regimeTVA },
  output:  { bilan, compteResultat, annexe, liasseFiscale, compareN1 }
}
```

**Évolutions prévues session 009 :**
- `societe` : + `siret`, `adresse` (P9c)
- `output` : + `analyse` (P9a)

---

## Conventions (non négociables)
- JSDoc sur toutes les fonctions publiques
- Commentaires inline = POURQUOI uniquement
- Zéro magic numbers → constants.js
- Fonctions pures dans core/
- MCP filesystem actif sur `C:\Users\Julie\Documents\Perso\Projects\`
- `.gitignore` contient `*.md` → `git add -f` pour les .md

---

## Démarrage session 009
1. Lire `js/core/constants.js` (pour y ajouter la table villes)
2. Lire `js/utils/doc-helpers.js` (pour le wiring buildHeader + buildTabs)
3. Lire `js/modules/bilan.js` (pour le wiring onglet Analyse + bouton Année suivante)
4. Lire `js/modules/form.js` (pour ajouter le toggle `output.analyse` étape 4)
5. Coder P9c → P9a → P9d
6. ⚠️ Surveiller la limite de contexte — lever le FAILSAFE à ~80%
