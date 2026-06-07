# Prompt de reprise — Session 010 Bilapp

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

## Ce qui est fait (sessions 001–009)

### Core
- `constants.js` — PCG 2024, ratios sectoriels, taux, fourchettes CA, `DUREES_AMORT`, `VILLES_FR` ✅
- `engine.js` — moteur de calcul, fonctions pures, BilanData, `meta.siret` + `meta.adresse` ✅
- `validator.js` — 6 règles V01-V06 ✅
- `overrides.js` — registre des postes verrouillés ✅
- `reconcile.js` — recalcul en cascade + plancher neutre randomisé ✅

### Modules
- `form.js` — formulaire 4 étapes, BilanParams, toggle `analyse` étape 4 ✅
- `bilan.js` — renderer bilan + onglets + édition inline + 💾/📂 session + 🔄 Régénérer + 📅 Année suivante ✅
- `resultat.js` — renderer CR + édition inline ✅
- `annexe.js` — annexe comptable 4 sections ✅
- `liasse.js` — liasse fiscale 12 imprimés Cerfa 2050–2059-A, lecture seule ✅
- `ratios.js` — onglet Analyse : FR, BFR, TN, VA, EBE, EBIT, RCAI, CAF, ROE, ROA, marge nette, autonomie ✅
- `doc-helpers.js` — fmt, fmtResultat, zeroCls, buildHeader (SIRET + adresse), buildTabs (onglet analyse) ✅

### Utils
- `identite.js` — `genererSIREN()`, `genererSIRET()`, `genererAdresse()`, `genererIdentite()` (Luhn) ✅

### Export / Session
- `pdf.js` — export PDF via window.print() ✅
- `session.js` — v2.0 : save/load session `.json` + `dataN1Figee` (P9d) ✅

### App
- `app.js` — orchestrateur + bouton 📂 Charger session depuis page d'accueil ✅

### CSS
- `main.css`, `form.css`, `documents.css` (incl. styles Analyse), `print.css` ✅

---

## MCP filesystem
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

**Note EPERM :** `edit_file` échoue sur les fichiers existants (rename atomique bloqué).
Utiliser `write_file` (overwrite complet) — fonctionne partout. Lire le fichier entier avant d'écrire.

---

## Agenda session 010 — F54 : Exercice décalé

### Contexte
En France, une société peut ouvrir son exercice n'importe quel jour de l'année.
Cas fréquents en pédagogie : 01/07→30/06, 01/04→31/03, et surtout **première année
incomplète** (création en cours d'année, ex. 15/03/2024 → 31/12/2024 = 9,5 mois).

Actuellement `anneeExercice = 2024` → affiche "Exercice clos le 31/12/2024".
F54 remplace ça par deux date pickers et propage les dates partout.

### Spec complète

**Formulaire étape 1 — form.js**
- Remplacer le champ `anneeExercice` (number) par deux `<input type="date">` :
  - `dateDebut` — défaut : `${anneeActuelle - 1}-01-01`
  - `dateFin`   — défaut : `${anneeActuelle - 1}-12-31`
- Validation :
  - `dateFin > dateDebut` obligatoire
  - durée ≤ 24 mois (exercice exceptionnel max légal français)
- `dureeExerciceMois` calculé = diff en mois décimaux (ex. 9.5), stocké dans params
- `anneeExercice` conservé comme alias = `new Date(dateFin).getFullYear()` — rétrocompat

**BilanParams — schéma mis à jour**
```js
societe: {
  nom, formeJuridique, secteur, activiteDetail,
  dateDebut,          // 'YYYY-MM-DD' — remplace anneeExercice comme source de vérité
  dateFin,            // 'YYYY-MM-DD'
  dureeExerciceMois,  // number — calculé, jamais saisi
  anneeExercice,      // number — alias = année de dateFin, pour rétrocompat
  siret, adresse,
}
```

**engine.js**
- Si `dureeExerciceMois < 12` : CA × `(dureeExerciceMois / 12)` avant toute génération
- Si `dureeExerciceMois ≥ 12` : pas de prorata (exercice normal ou long)
- `meta` expose `dateDebut`, `dateFin`, `dureeExerciceMois`

**doc-helpers.js — buildHeader**
- Remplacer `"Exercice clos le 31/12/${anneeExercice}"` par :
  - Exercice normal : `"Exercice clos le ${fmt_date(dateFin)}"`
  - Exercice décalé (début ≠ 01/01) ou court : `"Exercice du ${fmt_date(dateDebut)} au ${fmt_date(dateFin)}"`
  - Badge optionnel : `"(exercice court — X mois)"` si dureeExerciceMois < 11.5

**session.js — v3.0**
- Bump version `'3.0'`
- Migration rétrocompat au chargement :
  - v1.0/v2.0 sans `dateDebut`/`dateFin` → reconstruire depuis `anneeExercice` :
    `dateDebut = '${anneeExercice}-01-01'`, `dateFin = '${anneeExercice}-12-31'`, `dureeExerciceMois = 12`

**Autres renderers — affichage dates**
- `bilan.js` : partout où `meta.anneeExercice` est affiché seul → utiliser `meta.dateFin` ou la plage
- `resultat.js` : idem
- `annexe.js` : idem
- `liasse.js` : câbler `dateDebut`/`dateFin` dans les champs date des imprimés Cerfa

### Fichiers à modifier (dans l'ordre)
1. `js/modules/form.js` — deux date pickers + validation + calcul duréeExerciceMois
2. `js/core/engine.js` — prorata CA + meta étendu
3. `js/utils/doc-helpers.js` — buildHeader plage dates + badge
4. `js/export/session.js` — v3.0 + migration rétrocompat
5. `js/modules/resultat.js` — affichage dates (vérifier)
6. `js/modules/annexe.js` — affichage dates (vérifier)
7. `js/modules/liasse.js` — champs date Cerfa (vérifier)
8. `js/modules/bilan.js` — si nécessaire

### Estimation
~4–5k tokens. Session courte.

---

## BilanParams — schéma complet actuel (avant F54)
```js
{
  societe: { nom, formeJuridique, secteur, activiteDetail, anneeExercice, siret, adresse },
  taille:  { ca, nbEmployes, nbClients },
  finance: { orientation, hasImmobilisations, hasDettesBancaires, hasStocks, hasInternational, regimeTVA },
  output:  { bilan, compteResultat, annexe, liasseFiscale, compareN1, analyse }
}
```

---

## Conventions (non négociables)
- JSDoc sur toutes les fonctions publiques
- Commentaires inline = POURQUOI uniquement
- Zéro magic numbers → constants.js
- Fonctions pures dans core/
- MCP filesystem actif sur `C:\Users\Julie\Documents\Perso\Projects\`
- `.gitignore` contient `*.md` → `git add -f` pour les .md
- `write_file` uniquement (pas `edit_file` — EPERM sur rename)

---

## Démarrage session 010
1. Lire `js/modules/form.js` (étape 1 — champ anneeExercice à remplacer)
2. Lire `js/core/engine.js` (section generate() — prorata CA)
3. Lire `js/utils/doc-helpers.js` (buildHeader — ligne exercice)
4. Lire `js/export/session.js` (migration)
5. Lire `js/modules/resultat.js`, `annexe.js`, `liasse.js` (repérer les refs à anneeExercice)
6. Coder dans l'ordre ci-dessus
7. ⚠️ Surveiller la limite de contexte — lever le FAILSAFE à ~80%
