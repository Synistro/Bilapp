# Bonnes pratiques — Bilapp

## Général
- Toute décision structurante → documentée dans `sessions.md` + répercutée dans `SPECS.md`
- Les SPECS sont la source de vérité. Code = implémentation des SPECS, jamais l'inverse.
- Pas de code avant SPECS validées.

---

## Architecture

### Structure des fichiers
```
Bilapp/ (repo GitHub)
├── index.html              ← entry point unique
├── css/
│   ├── main.css            ← styles globaux, variables CSS
│   ├── form.css            ← formulaire
│   ├── documents.css       ← rendu comptable
│   └── print.css           ← media query impression/PDF
├── js/
│   ├── core/
│   │   ├── engine.js       ← moteur de calcul comptable (pur, zéro DOM)
│   │   ├── validator.js    ← règles de cohérence (actif=passif, etc.)
│   │   └── constants.js    ← comptes PCG, libellés officiels, cases Cerfa
│   ├── modules/
│   │   ├── form.js         ← gestion formulaire + collecte params
│   │   ├── bilan.js        ← génération + rendu bilan
│   │   ├── resultat.js     ← génération + rendu compte de résultat
│   │   ├── annexe.js       ← génération + rendu annexe
│   │   └── liasse.js       ← génération + rendu liasse Cerfa
│   ├── export/
│   │   └── pdf.js          ← logique export PDF
│   └── app.js              ← orchestrateur principal, init, routing
├── assets/
│   └── cerfa/              ← templates visuels Cerfa si nécessaire
└── push.bat                ← script de push rapide (voir Versioning)
```

### Fichiers hors repo (local uniquement)
```
C:\Users\Julie\Documents\Perso\Projects\Bilapp\
├── skill-bilapp.md         ← contexte projet pour Claude
├── sessions.md             ← récap sessions de travail
├── bonnes-pratiques.md     ← ce fichier
├── fonctionnalites.md      ← backlog fonctionnel
└── SPECS.md                ← spécifications complètes
```

### Principes fondamentaux

**1. Séparation stricte data / logique / rendu**
- `engine.js` ne touche jamais le DOM
- Les renderers (bilan.js, resultat.js, etc.) ne font aucun calcul
- `app.js` orchestre, ne calcule pas, ne rend pas directement

**2. Fonctions pures dans le moteur**
- Mêmes inputs → mêmes outputs, sans effets de bord
- Testables indépendamment de l'UI
- Pas d'accès à `window`, `document` ou état global

**3. Constants externalisées**
- Tous les libellés PCG, numéros de comptes, cases Cerfa → `constants.js`
- Jamais hardcodés dans la logique métier
- Exemples : `TAUX_IS_PME = 0.15`, `COMPTE_CAPITAL = '101'`

**4. Schéma de données central**
- Un objet `BilanParams` unique transite entre tous les modules
- Sa structure est définie dans les SPECS et dans `constants.js`
- Aucun module n'invente ses propres structures de données

**5. Gestion d'erreur explicite**
- Chaque fonction de calcul valide ses inputs
- Retourne une erreur typée si incohérence détectée (jamais un `null` silencieux)
- Format : `{ success: false, error: 'ACTIF_PASSIF_MISMATCH', detail: '...' }`

---

## Conventions de code

### Nommage
- Fichiers : `kebab-case.js`
- Variables / fonctions : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`
- Classes CSS : `kebab-case`
- IDs DOM : `camelCase`

### Commentaires — règle JSDoc obligatoire sur toutes les fonctions publiques
```js
/**
 * Calcule le total de l'actif immobilisé net.
 * @param {Object} immos - Immobilisations brutes par poste (cf. PCG classe 2)
 * @param {Object} amorts - Amortissements cumulés par poste
 * @returns {number} Total actif immobilisé net en euros
 */
function calcActifImmobiliseNet(immos, amorts) { ... }
```

### Commentaires inline
- Uniquement pour expliquer le POURQUOI, jamais le QUOI
- ✅ `// PCG impose l'ordre : immobilisations incorporelles avant corporelles`
- ❌ `// On additionne immos et amorts`

### Pas de magic numbers
```js
// ✅ Correct
const impot = benefice * TAUX_IS_PME;

// ❌ Interdit
const impot = benefice * 0.15;
```

### Modules ES6
- Chaque fichier JS exporte explicitement ses fonctions publiques
- Les imports sont déclarés en tête de fichier
- Pas de variables globales (sauf `app.js` pour l'état applicatif)

---

## Comptabilité / Conformité

- Références normatives : PCG 2024, liasse fiscale Cerfa 2050 à 2058
- Tout document généré affiche en filigrane ET en header :
  **"DOCUMENT FICTIF — À DES FINS PÉDAGOGIQUES UNIQUEMENT"**
- Les numéros de comptes utilisés sont conformes au plan PCG officiel
- L'équilibre `Actif total = Passif total` est vérifié par `validator.js` avant tout rendu
- Le résultat net du bilan = résultat net du compte de résultat (vérifié par `validator.js`)
- Ratios sectoriels plausibles selon le secteur et la taille déclarés
- Aucun vrai numéro SIREN/SIRET valide généré
- Aucune simulation de signature d'expert-comptable

---

## Versioning & Workflow

### Setup repo
- Repo GitHub : https://github.com/Synistro/Bilapp
- GitHub Pages : `Settings → Pages → Deploy from branch → main → / (root)`
- URL publique : `https://synistro.github.io/Bilapp/`
- Branche principale : `main`

### Conventions de commit
Format : `type: description courte en français`

| Type | Usage |
|------|-------|
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `docs:` | Documentation uniquement |
| `refactor:` | Refactoring sans changement fonctionnel |
| `style:` | CSS, mise en forme |
| `chore:` | Config, tooling, .gitignore |

Exemples :
```
feat: ajout moteur de calcul bilan actif
fix: correction équilibre actif/passif sur bilan négatif
docs: mise à jour SPECS section formulaire
refactor: extraction constantes PCG dans constants.js
```

### Push rapide
Utiliser `push.bat` à la racine du repo :
```bash
.\push.bat
# Prompt interactif → saisir le message de commit
# Fait automatiquement : git add . + git commit + git push
```

### Workflow de session
À chaque session de travail :
1. **Début de session** → mettre à jour `sessions.md` (nouvelle entrée)
2. **Pendant** → committer régulièrement, pas de gros commits monolithiques
3. **Fin de session** → mettre à jour `sessions.md` (ce qui a été fait, décisions, en attente) + push final

### Branches
- `main` → code stable, déployé sur GitHub Pages
- `feat/nom-module` → développement d'un module isolé (optionnel)
- Merger dans `main` uniquement quand le module est fonctionnel

---

## Stack
- Vanilla HTML / CSS / JS — zéro framework, zéro bundler
- Un fichier par module, lisible et modifiable directement
- Export PDF via `window.print()` + CSS `@media print`
- Déployable sans serveur (`file://`) et sur tout hébergeur statique
- Hébergement : GitHub Pages
