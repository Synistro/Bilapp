# Prompt de reprise — Session 014 Bilapp

> Copier-coller TOUT ce fichier en premier message du nouveau chat.

---

## CONVENTION FAILSAFE (à respecter dans toutes les sessions)

Quand le contexte approche ~80% de consommation, Claude lève ce signal :

```
FAILSAFE - contexte ~80% consommé
On arrête le code ici. Bilan d'état + mise à jour reprise avant de couper.
```

Actions à ce moment :
1. Noter exactement où on en est (fichier, fonction, en cours)
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
**Stack :** Vanilla HTML/CSS/JS, ES6 modules natifs, zéro framework, zéro bundler, zéro dépendance.
**Local (déplacé) :** `C:\Users\Julie\Documents\Perso\Projects\Achive\Bilapp\` — le projet est désormais dans le dossier d'archive `Achive\`.
**Serveur local :** `npx serve .` → `http://localhost:3000` (les modules ES6 exigent HTTP, `file://` ne marche pas).

> ⚠️ **Remote Git renommé** : `origin` pointe encore sur `synistro/Bilapp` (minuscule), GitHub redirige vers `Synistro/Bilapp`. Pour nettoyer un jour :
> `git remote set-url origin https://github.com/Synistro/Bilapp.git`

---

## Ce qui est fait (sessions 001-014)

### Core
- `constants.js` — PCG 2024, ratios sectoriels, taux, fourchettes CA, `DUREES_AMORT`, `VILLES_FR`, `NIVEAUX_IMMOS`, `NIVEAUX_STOCKS`, **`COMPTES_POSTES` (poste → n° de compte PCG, s014)**
- `engine.js` — moteur de calcul, fonctions pures, BilanData, `caBaseN`. **`equilibrerActifPassif()` (s014) : garantit actif = passif ; si l'actif dépasse le passif, le déficit va en emprunt/découvert au passif.** Génère `comptesCourantsAssocies` (s014).
- `hints.js` — définitions courtes des postes (tooltips élèves), ~50 entrées + `comptesCourantsAssocies` (s014)
- `validator.js` — 6 règles V01-V06
- `overrides.js` — registre des postes verrouillés (`removeOverride` désormais câblé à l'UI, s014)
- `reconcile.js` — recalcul en cascade + plancher neutre randomisé ; `dettes.total` inclut `comptesCourantsAssocies` (s014)

### Modules
- `form.js` — formulaire 4 étapes, BilanParams, dates F54, toggles étape 4 dont **`teledec` (s014)**
- `bilan.js` — renderer bilan + onglets + édition inline + session + Régénérer + Année suivante. **`renderLoadedSession()` (s014) = chemin de chargement unique (accueil + document) qui restaure verrous + N-1 figé sans les purger.** **Bouton verrou par cellule via délégation (s014).** Onglet `teledec` câblé.
- `resultat.js` — renderer CR + édition inline + hints + badges PCG + verrous (s014)
- `annexe.js` — annexe comptable 4 sections + badges PCG (s014)
- `liasse.js` — liasse fiscale 12 imprimés Cerfa 2050-2059-A. `calcFiscal` **exporté** (réutilisé par teledec). Badges PCG sur imprimés bilan/CR 2050-2053. Ligne DS = comptes courants d'associés (s014).
- `ratios.js` — onglet Analyse (FR, BFR, TN, SIG, CAF, ratios). Comptes courants d'associés comptés en capitaux permanents (s014).
- **`teledec.js` (NOUVEAU s014)** — onglet Télédéclaration : simule le dépôt EDI-TDFC de la liasse à la DGFiP. Récap déclaration, contrôles de cohérence EDI (avec aide dépliable `<details>` par contrôle), données transmises, circuit, accusé de dépôt/rejet. Rejet si bilan déséquilibré. Pédagogique, mention FICTIF.

### Utils
- `doc-helpers.js` — fmt, fmtResultat, zeroCls, fmtDateFR, buildHeader, buildTabs (+ onglet `teledec`). **`hintIcon(key)` = badge n° compte PCG + ⓘ (infobulle « Compte 411 — … »).** **`compteBadge(key)` (badge seul, liasse).** **`lockToggle(path)` (bouton verrou 🔓/🔒, sans listener — clic capté par la `<td>`).** (s014)
- `tooltip.js` — `initTooltips()` / `destroyTooltips()`, délégation document, hover + tap mobile
- `identite.js` — genererSIREN/SIRET/Adresse/Identite (Luhn, 100% valides)

### Export / Session
- `pdf.js` — export PDF via window.print()
- `session.js` — v4.0 : save/load .json + `dataN1Figee` + migration v1/v2/v3. Rétrocompat OK avec les champs récents grâce aux gardes `?? 0`.

### App
- `app.js` — orchestrateur + bouton Charger session (accueil) → appelle `renderLoadedSession` (s014)

### CSS
- `main.css` — design tokens + `.hint-icon`/`.hint-bubble` + **`.poste-compte` (badge PCG)** (s014)
- `documents.css` — bilan/CR/annexe/analyse + **`.lock-toggle`** (verrou par cellule) + lignes verrouillées un peu plus foncées (`.has-lock` opacity 0.08) (s014)
- `form.css`
- `print.css` — masque `.hint-icon`, `.hint-bubble`, **`.lock-toggle`** (le badge `.poste-compte` reste imprimé)

---

## Session 014 — récap détaillé (POURQUOI + QUOI)

Demande initiale : adapter Bilapp pour une **section Teledec** (télédéclaration).
Enchaîné sur plusieurs demandes + une revue de code complète. 8 commits, tous poussés.

1. **Section Télédéclaration (Teledec)** — `0f308e2` puis aide pédagogique `8f76cb8`
   *Pourquoi :* Teledec.fr = partenaire EDI agréé qui télétransmet la liasse fiscale à la DGFiP en mode EDI-TDFC. La liasse existait déjà → on simule son **dépôt**.
   *Quoi :* nouveau module `teledec.js` + onglet + toggle formulaire. Contrôles de cohérence (équilibre, résultat CR↔bilan, SIRET, CA, période) avec **bouton d'aide dépliable** (« Pourquoi ça bloque ? / Comment corriger ») auto-ouvert en cas d'échec ; accusé de rejet listant les anomalies. Rejet pédagogique si bilan déséquilibré.

2. **Correctif d'équilibre du bilan** — `8324844`
   *Pourquoi :* revue de code → ~48% des bilans générés étaient déséquilibrés (actif ≠ passif > 1 €), car la trésorerie d'ajustement était plafonnée par le bas. Bug pré-existant, visible dans l'onglet Bilan ET rejeté à tort par Teledec.
   *Quoi :* `equilibrerActifPassif()` route le déficit de financement en **emprunt/découvert au passif** → bilan toujours équilibré. Tolérance ±1 € alignée sur le validateur côté Teledec. Vérifié : 0 déséquilibre sur 24 192 configs.

3. **Chargement de session qui déverrouillait les cellules** — `ba8eb7e`
   *Pourquoi :* le bouton « Charger » de l'accueil appelait `renderDocuments()` (qui commence par `clearOverrides()`) après avoir restauré les verrous → verrous + N-1 figé perdus. Le bouton dans le document, lui, marchait (deux chemins divergents).
   *Quoi :* chemin unique `renderLoadedSession(payload)` utilisé par les deux boutons.

4. **Rappel du Plan Comptable Général** — `b0e926f`
   *Pourquoi :* pédagogie — rappeler le n° de compte de chaque poste.
   *Quoi :* mapping `COMPTES_POSTES`, badge visible + rappel dans l'infobulle, sur Bilan + CR + Annexe + Liasse (en plus des codes Cerfa).

5. **Bouton verrou par cellule (🔓/🔒)** — `4be655d` + nuance visuelle `af11e8c`
   *Pourquoi :* avant, verrouiller = éditer une valeur, et **déverrouiller était impossible** (removeOverride jamais câblé). But : figer/libérer facilement avant de régénérer.
   *Quoi :* `lockToggle(path)` (bouton visuel), clic capté par le listener de la `<td>` (délégation → robuste aux re-rendus). Lignes verrouillées un peu plus foncées.

6. **Ligne Comptes courants d'associés (455)** — `968f57c`
   *Pourquoi :* réalisme — dette de la société envers ses associés, très courante en TPE/PME. Relie au cas « banque à découvert → un associé injecte de la trésorerie ».
   *Quoi :* poste au passif (dettes), éditable/verrouillable, badge 455, généré (~1-6% du CA, moindre en SA), inclus dans les totaux, reporté en ligne Cerfa DS, compté en ressource stable dans l'analyse. Rétrocompat vieilles sessions (`?? 0`).

**Vérifié en fin de session :** une **ancienne sauvegarde v3.0 se charge sans erreur** sur la version à jour (migrations auto + gardes `?? 0` ; onglets récents absents s'ils n'étaient pas cochés ; verrous restaurés).

---

## BilanParams (à jour s014)

```js
{
  societe: { nom, formeJuridique, secteur, activiteDetail,
    dateDebut, dateFin, dureeExerciceMois, anneeExercice, siret, adresse, caBaseN },
  taille:  { ca, nbEmployes, nbClients },
  finance: { orientation, niveauImmos, hasDettesBancaires, niveauStocks, hasInternational, regimeTVA },
  output:  { bilan, compteResultat, annexe, liasseFiscale, compareN1, analyse, teledec }, // teledec NOUVEAU
}
```

## BilanData — changement s014
`bilan.passif.dettes` contient désormais **`comptesCourantsAssocies`** :
```js
dettes: { emprunts, comptesCourantsAssocies, fournisseurs, fiscalesSociales, autresDettes, total }
```
(structure complète : voir `sessions/session_002_reprise` / SPECS.md)

---

## Conventions (non négociables)
- JSDoc sur toutes les fonctions publiques
- Commentaires inline = POURQUOI uniquement
- Zéro magic numbers → constants.js
- Fonctions pures dans core/
- `.gitignore` contient `*.md` → **`git add -f` pour committer les .md** (README, sessions/)
- PowerShell : `;` jamais `&&`
- Vérité = git/hash sur le nœud, jamais un snapshot

---

## Démarrage session 015
Lire les fichiers concernés selon la demande, puis coder. App stable et déployée à ce jour.
