# Prompt de reprise — Session 013 Bilapp

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

**Bilapp** - Générateur de bilans comptables pédagogiques français.
Conformes PCG 2024. Marqués "DOCUMENT FICTIF - À DES FINS PÉDAGOGIQUES UNIQUEMENT".
Public : élèves comptabilité (BTS/DCG/DSCG) + formateurs fiscalité.

**Repo :** https://github.com/Synistro/Bilapp
**GitHub Pages :** https://synistro.github.io/Bilapp/
**Stack :** Vanilla HTML/CSS/JS, ES6 modules natifs, zéro framework, zéro bundler.
**Local :** `C:\Users\Julie\Documents\Perso\Projects\Bilapp\`
**Serveur local :** `npx serve .` → `http://localhost:3000`

---

## Ce qui est fait (sessions 001-012)

### Core
- `constants.js` — PCG 2024, ratios sectoriels, taux, fourchettes CA, `DUREES_AMORT`, `VILLES_FR`, `NIVEAUX_IMMOS`, `NIVEAUX_STOCKS`
- `engine.js` — moteur de calcul, fonctions pures, BilanData, meta.siret + meta.adresse. Supporte `params.societe.caBaseN` pour ancrer le CA N+1 sur le CA réel N (cohérence interannuelle).
- `hints.js` — définitions courtes des postes comptables (tooltips élèves), ~50 entrées
- `validator.js` — 6 règles V01-V06
- `overrides.js` — registre des postes verrouillés
- `reconcile.js` — recalcul en cascade + plancher neutre randomisé

### Modules
- `form.js` — formulaire 4 étapes, BilanParams, date pickers F54, toggle analyse étape 4, radio-groups niveauImmos/niveauStocks (4 niveaux chacun, filtrés par secteur)
- `bilan.js` — renderer bilan + onglets + édition inline + session + Régénérer + Année suivante avec dialogue orientation + ajustement report à nouveau. Tooltips hints initialisés à chaque renderTab. Dates calculées en heure locale (fix timezone UTC).
- `resultat.js` — renderer CR + édition inline + hints
- `annexe.js` — annexe comptable 4 sections
- `liasse.js` — liasse fiscale 12 imprimés Cerfa 2050-2059-A, lecture seule
- `ratios.js` — onglet Analyse : FR, BFR, TN, VA, EBE, EBIT, RCAI, CAF, ROE, ROA, marge nette, autonomie

### Utils
- `doc-helpers.js` — fmt, fmtResultat, zeroCls, fmtDateFR, buildHeader (SIRET + adresse + F54), buildTabs, `hintIcon(key)` (retourne bouton ⓘ ou '' si clé absente)
- `tooltip.js` — `initTooltips()` / `destroyTooltips()` — délégation document, hover desktop + tap mobile, positionnement viewport avec flip vertical
- `identite.js` — genererSIREN(), genererSIRET(), genererAdresse(), genererIdentite() (Luhn)

### Export / Session
- `pdf.js` — export PDF via window.print()
- `session.js` — v4.0 : save/load session .json + dataN1Figee + migration v1/v2/v3 rétrocompat

### App
- `app.js` — orchestrateur + bouton Charger session depuis page d'accueil

### CSS
- `main.css` — design tokens + styles hints/tooltips (.hint-icon, .hint-bubble)
- `form.css`, `documents.css` (incl. styles Analyse + dialogue orientation + F54), `print.css` (masque .hint-icon et .hint-bubble)

---

## Bugs corrigés en session 012

### Bug "Année suivante" — dates timezone
`new Date('YYYY-MM-DD')` parse en UTC → décalage d'un jour en heure locale (UTC+1/+2).
**Fix :** parsing manuel `new Date(y, m-1, d)` + formatage `fmtISO()` sans passer par `toISOString()`.

### Bug "Année suivante" — CA incohérent
`generate()` tirait un CA aléatoire dans la fourchette de tranche → année N+1 déconnectée de N.
**Fix :** `params.societe.caBaseN` = CA réel N → engine utilise `caBaseN × (1 ± 15%)` clampé dans la tranche.

### Bug "Régénérer" — écrasait le N-1 figé
`generate()` avec `compareN1=true` régénérait un N-1 aléatoire.
**Fix :** `bindRegenerer` réinjecte `_dataN1Figee` dans `freshData.n1` après `generate()`.

---

## BilanParams v4.0

```js
{
  societe: {
    nom, formeJuridique, secteur, activiteDetail,
    dateDebut, dateFin, dureeExerciceMois, anneeExercice,
    siret, adresse,
    caBaseN,  // NOUVEAU (optionnel) — ancre CA pour "Année suivante"
  },
  taille: { ca, nbEmployes, nbClients },
  finance: {
    orientation,
    niveauImmos,        // 'off'|'leger'|'mixte'|'lourd'
    hasDettesBancaires,
    niveauStocks,       // 'off'|'marchandises'|'marchandises_mp'|'complet'
    hasInternational,
    regimeTVA,
  },
  output: { bilan, compteResultat, annexe, liasseFiscale, compareN1, analyse },
}
```

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

## Conventions (non négociables)
- JSDoc sur toutes les fonctions publiques
- Commentaires inline = POURQUOI uniquement
- Zéro magic numbers → constants.js
- Fonctions pures dans core/
- MCP filesystem actif sur `C:\Users\Julie\Documents\Perso\Projects\`
- `.gitignore` contient `*.md` → `git add -f` pour les .md
- `write_file` uniquement (pas `edit_file` — EPERM sur rename)

---

## Démarrage session 013
Lire les fichiers concernés selon l'agenda, puis coder.
