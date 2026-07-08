# Sessions de travail — Bilapp

## Session 001 — 2026-06-06
**Objectif :** Mise en place de l'environnement, spécifications complètes, P0 + P1
**Participants :** Julien + Marc (Claude)
**État :** ✅ Terminée

### Ce qui a été fait
- Création du dossier projet `Bilapp/`
- Création des fichiers de référence (skill, sessions, bonnes-pratiques, fonctionnalites, SPECS)
- Repo GitHub créé : https://github.com/Synistro/Bilapp
- Git initialisé, `.gitignore` commité, `push.bat` créé
- `.md` exclus du repo via `.gitignore`
- GitHub Pages : à activer (Settings → Pages → main → / (root))
- Brainstorm formulaire : 19 questions, 4 étapes UX définies
- Schéma `BilanParams` défini et validé
- SPECS complètes rédigées (sections 1 à 11)
- Structure PCG bilan + compte de résultat spécifiée avec numéros de comptes
- Moteur de calcul spécifié (fourchettes CA, ratios, règles orientation)
- Validateur spécifié (6 règles V01-V06)
- Export PDF spécifié
- **P0 terminée** : structure fichiers complète + `constants.js` PCG 2024 complet
- **P1 terminée** : formulaire multi-étapes complet, testé et validé visuellement

### Décisions prises
- Nom de l'app : **Bilapp**
- Stack : Vanilla HTML/CSS/JS, zéro framework, zéro bundler
- Hébergement : GitHub Pages → https://synistro.github.io/Bilapp/
- Documents générés marqués "FICTIF / À DES FINS PÉDAGOGIQUES"
- MVP : SAS/SARL/SA uniquement (SCI/EI version ultérieure)
- CA en fourchettes → moteur génère les chiffres cohérents
- Orientation résultat : positif / négatif / neutre
- PDF via `window.print()` + CSS print
- Fonts : DM Sans (UI) + Playfair Display (documents)
- `.md` hors repo, code seul dans GitHub

### État du repo au commit final session 001
```
Bilapp/
├── index.html                  ✅ complet
├── .gitignore                  ✅
├── push.bat                    ✅
├── css/
│   ├── main.css                ✅ design system complet (variables, composants)
│   ├── form.css                ✅ formulaire complet
│   ├── documents.css           ✅ stub (P4)
│   └── print.css               ✅ stub (P6)
├── js/
│   ├── core/
│   │   ├── constants.js        ✅ COMPLET — PCG 2024, ratios, taux, labels
│   │   ├── engine.js           ✅ stub (P2)
│   │   └── validator.js        ✅ stub (P3)
│   ├── modules/
│   │   ├── form.js             ✅ COMPLET — 4 étapes, validation, BilanParams
│   │   ├── bilan.js            ✅ stub (P4)
│   │   ├── resultat.js         ✅ stub (P5)
│   │   ├── annexe.js           ✅ stub (P7)
│   │   └── liasse.js           ✅ stub (P8)
│   ├── export/
│   │   └── pdf.js              ✅ stub (P6)
│   └── app.js                  ✅ orchestrateur partiel (debug mode actif)
└── assets/cerfa/               ✅
```

---

## Session 002 — À DÉMARRER
**Objectif :** Implémenter P2 (engine.js) + P3 (validator.js)
**État :** 🔴 Non démarrée

### Contexte de reprise

Charger au démarrage :
- `skill-bilapp.md`
- `sessions.md`
- `bonnes-pratiques.md`
- `SPECS.md`

### Prochaine action immédiate : P2 — engine.js

Le formulaire est fonctionnel et produit un objet `BilanParams` complet.
La prochaine étape est d'implémenter `js/core/engine.js` qui :
1. Reçoit `BilanParams`
2. Génère tous les montants comptables cohérents
3. Retourne un objet `BilanData`

#### Structure BilanData attendue (à implémenter)

```js
BilanData = {
  meta: {
    societe:         String,   // nom société
    formeJuridique:  String,
    secteur:         String,
    anneeExercice:   Number,
    anneeN1:         Number,   // anneeExercice - 1
    regimeTVA:       String,
    hasInternational:Boolean,
    orientation:     String,
    mention:         String,   // MENTION_FICTIF depuis constants.js
  },

  bilan: {
    actif: {
      immobilise: {
        incorporel: {
          fraisEtablissement:   { brut, amort, net },
          fraisRD:              { brut, amort, net },
          brevets:              { brut, amort, net },
          fondsCommercial:      { brut, amort, net },
          autresIncorporel:     { brut, amort, net },
          total:                { brut, amort, net },
        },
        corporel: {
          terrains:             { brut, amort, net },
          constructions:        { brut, amort, net },
          installations:        { brut, amort, net },
          autresCorporel:       { brut, amort, net },
          total:                { brut, amort, net },
        },
        financier: {
          participations:       { brut, amort, net },
          autresFinancier:      { brut, amort, net },
          total:                { brut, amort, net },
        },
        total:                  { brut, amort, net },
      },
      circulant: {
        stocks: {
          matieresPremières:    { brut, amort, net },
          enCours:              { brut, amort, net },
          produitsFinis:        { brut, amort, net },
          marchandises:         { brut, amort, net },
          total:                { brut, amort, net },
        },
        creances: {
          clients:              { brut, amort, net },
          autresCreances:       { brut, amort, net },
          total:                { brut, amort, net },
        },
        disponibilites: {
          vmp:                  { brut, amort, net },
          banqueCaisse:         { brut, amort, net },
          total:                { brut, amort, net },
        },
        total:                  { brut, amort, net },
      },
      regularisation: {
        chargesConstatees:      { brut, amort, net },
        total:                  { brut, amort, net },
      },
      totalNet:  Number,   // = sum de tous les net — DOIT = passif.total
    },

    passif: {
      capitauxPropres: {
        capital:          Number,
        primesEmission:   Number,
        reserveLegale:    Number,
        autresReserves:   Number,
        reportANouveau:   Number,   // positif ou négatif
        resultat:         Number,   // positif, négatif ou 0 — DOIT = resultat.resultatNet
        total:            Number,
      },
      provisions: {
        risques:          Number,
        charges:          Number,
        total:            Number,
      },
      dettes: {
        emprunts:         Number,
        fournisseurs:     Number,
        fiscalesSociales: Number,
        autresDettes:     Number,
        total:            Number,
      },
      regularisation: {
        produitsConstates:Number,
        total:            Number,
      },
      total:            Number,   // DOIT = actif.totalNet
    },
  },

  resultat: {
    produitsExploitation: {
      ca:               Number,   // chiffre d'affaires net
      productionStockee:Number,
      subventions:      Number,
      autresProduits:   Number,
      total:            Number,
    },
    chargesExploitation: {
      achatsMarchandises:   Number,
      variationStocks:      Number,
      achatsMatieres:       Number,
      autresAchats:         Number,
      impotsTaxes:          Number,
      chargesPersonnel:     Number,
      dotationsAmort:       Number,
      autresCharges:        Number,
      total:                Number,
    },
    resultatExploitation: Number,

    produitsFinanciers:   Number,
    chargesFinancieres:   Number,
    resultatFinancier:    Number,

    resultatCourant:      Number,

    produitsExceptionnels:Number,
    chargesExceptionnelles:Number,
    resultatExceptionnel: Number,

    participation:        Number,
    impots:               Number,
    resultatNet:          Number,   // DOIT = bilan.passif.capitauxPropres.resultat
  },

  // Données N-1 (même structure, générées indépendamment si compareN1 = true)
  n1: null, // | BilanData (sans le champ n1)
}
```

#### Règles de génération à implémenter dans engine.js

1. Tirer le CA aléatoirement dans la fourchette `TRANCHES_CA[params.taille.ca]` avec ±15%
2. Appliquer `RATIOS_SECTORIELS[params.societe.secteur]` pour dériver les postes charges
3. Calculer le résultat net selon `ORIENTATIONS[params.finance.orientation]`
4. Construire le passif en partant du résultat → capitaux propres → dettes
5. Construire l'actif en équilibrant sur le passif total
6. Si `hasImmobilisations = false` → tous les postes immobilisé = 0
7. Si `hasStocks = false` → tous les postes stocks = 0
8. Si `hasDettesBancaires = false` → emprunts = 0
9. Si `compareN1 = true` → générer un second jeu de données N-1 cohérent (CA N-1 = CA N * ratio 0.85-1.10)
10. Arrondir tous les montants à l'euro (Math.round)

#### Après engine.js → P3 validator.js

Implémenter les 6 règles V01-V06 définies dans SPECS.md section 8.

#### Après validator.js → P4 bilan.js + documents.css

Renderer du bilan : tableau Actif/Passif côte à côte, format PCG officiel.

### À ne pas oublier en session 002
- Activer GitHub Pages si pas encore fait
- Connecter engine.js dans app.js (remplacer `_renderDebug` par le vrai flux)
- Tester la cohérence actif = passif sur plusieurs générations

---

> _Sessions 003-013 : voir les fichiers `sessions/*_reprise.md` (le journal n'a pas été tenu entre 002 et 014)._

---

## Session 014 — 2026-07-08
**Objectif :** Section Télédéclaration (Teledec) + revue de code + enrichissements pédagogiques
**Participants :** Julien + Marc (Claude)
**État :** ✅ Terminée — 8 commits poussés (`0f308e2` → `968f57c`)

### Ce qui a été fait
- **Section Télédéclaration (Teledec)** — nouveau module `teledec.js` + onglet : simule le dépôt EDI-TDFC de la liasse à la DGFiP. Contrôles de cohérence avec aide dépliable (« Pourquoi ça bloque ? / Comment corriger »), accusé de dépôt/rejet. Rejet pédagogique si bilan déséquilibré.
- **Correctif d'équilibre du bilan** (revue de code) — ~48% des bilans étaient déséquilibrés (trésorerie plafonnée). `equilibrerActifPassif()` route le déficit en emprunt/découvert au passif → actif = passif toujours. Vérifié sur 24 192 configs.
- **Correctif chargement de session** — le bouton « Charger » de l'accueil déverrouillait les cellules (appelait `renderDocuments` qui purge les overrides). Chemin unique `renderLoadedSession()`.
- **Rappel du Plan Comptable Général** — badge n° de compte PCG sur chaque poste (Bilan, CR, Annexe, Liasse) + rappel dans l'infobulle. Mapping `COMPTES_POSTES`.
- **Bouton verrou par cellule (🔓/🔒)** — figer/libérer un poste sans l'éditer (déverrouiller était impossible avant). Lignes verrouillées un peu plus foncées.
- **Ligne Comptes courants d'associés (455)** au passif — dette envers les associés, réaliste TPE/PME.

### Décisions / notes
- Repo renommé `Synistro/Bilapp` (remote encore en minuscule, redirection OK)
- Projet déplacé dans `Achive\Bilapp\`
- Rétrocompat vérifiée : une ancienne sauvegarde v3.0 se charge sans erreur (migrations + gardes `?? 0`)
- Vérifications faites en conditions réelles (serveur local + navigateur), pas seulement en théorie

### Reprise
Fichier de reprise : `sessions/session_014_reprise.md`
