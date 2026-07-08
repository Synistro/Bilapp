# README — Bilapp

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
- **Niveaux de granularité** pour les immobilisations (aucune / matériel léger / standard / lourd) et les stocks (aucun / marchandises / marchandises+MP / complet) — permettent des cas pédagogiques ciblés
- **Moteur de calcul** conforme PCG 2024 — ratios sectoriels, IS PME, trésorerie équilibrée automatiquement
- **Bilan actif/passif** et **compte de résultat** avec colonnes N et N-1 optionnelles
- **Annexe comptable** — immobilisations, amortissements, capitaux propres, méthodes
- **Liasse fiscale complète** — 12 imprimés Cerfa 2050 à 2059-A avec codes lignes exacts

### Hints comptables
- **Icône ⓘ** sur chaque poste du bilan et du CR — tooltip au survol (desktop) ou au tap (mobile)
- Définitions courtes orientées élèves, avec exemples concrets
- **Masqués à l'impression** — les documents imprimés restent propres

### Rappel du Plan Comptable Général
- **Badge n° de compte PCG** affiché en permanence à côté de chaque poste (ex. Clients `411`, Capital `101`, Constructions `213`)
- Présent sur **Bilan, Compte de résultat, Annexe et Liasse fiscale** (en complément des codes Cerfa)
- Le n° de compte est aussi **rappelé dans l'infobulle ⓘ** (« Compte 411 — Factures émises… »)
- Mapping centralisé `COMPTES_POSTES` (constants.js), badge conservé à l'impression

### Analyse financière
- **Onglet Analyse** — FR, BFR, Trésorerie Nette, SIG complet (VA, EBE, EBIT, RCAI), CAF
- **Ratios** — ROE, ROA, marge nette, autonomie financière avec interprétations contextuelles

### Télédéclaration (Teledec)
- **Onglet Télédéclaration** — simule le dépôt de la liasse fiscale à la DGFiP en mode **EDI-TDFC**, via un partenaire EDI agréé (type Teledec.fr)
- **Contrôles de cohérence EDI** — équilibre du bilan, cohérence résultat CR ↔ bilan, SIRET valide, période renseignée ; un bilan déséquilibré déclenche un **rejet de dépôt** pédagogique
- **Boutons d'explication** sur chaque contrôle (« Pourquoi ça bloque ? / Comment corriger ? ») — auto-dépliés quand le contrôle échoue ; l'accusé de rejet liste les anomalies avec leur correction
- **Données transmises** — CA, résultat comptable/fiscal, IS dû, total bilan extraits automatiquement de la liasse
- **Accusé de réception DGFiP** fictif — numéro de dépôt déterministe (`TDFC-AAAA-XXXXXXXX`), statut ACCEPTÉ / REFUSÉ

### Réalisme pédagogique
- **SIRET/SIREN fictifs** générés par algorithme Luhn — valides mais non réels
- **Adresse postale fictive** cohérente (ville + code postal français)
- Résultat net jamais nul — randomisé pour éviter les cas trop parfaits
- Amortissements clampés (amort ≤ brut), cohérence CR ↔ bilan garantie

### Édition et workflow
- **Édition inline** — cliquer sur n'importe quel poste pour le modifier ; les totaux se recalculent en cascade et le bilan reste équilibré
- **Verrouillage de postes** — les valeurs modifiées sont protégées (🔒) et résistent aux recalculs
- **Régénérer** — relance le moteur en conservant les postes verrouillés et le N-1 figé
- **📅 Année suivante** — duplique le bilan courant en N-1 figé, génère un exercice N+1 avec un CA ancré sur le CA réel N (±15%), dates en heure locale pour éviter les décalages UTC
- **Sauvegarde / Chargement de session** — export `.json` complet (format v4.0), rechargeable depuis l'accueil ; migration automatique des sessions v1–v3
- **Export PDF** via impression navigateur

---

## Stack

Vanilla HTML / CSS / JS — zéro framework, zéro bundler, zéro dépendance.  
Modules ES6 natifs (`type="module"`).

```
js/
  core/
    constants.js    ← PCG 2024, ratios, taux, NIVEAUX_IMMOS, NIVEAUX_STOCKS, VILLES_FR
    engine.js       ← moteur de calcul (fonctions pures) — caBaseN pour cohérence interannuelle
    hints.js        ← définitions courtes des postes (tooltips élèves)
    validator.js    ← règles de cohérence comptable (V01-V06)
    overrides.js    ← registre des postes verrouillés
    reconcile.js    ← recalcul en cascade post-édition
  modules/
    form.js         ← formulaire multi-étapes — radio-groups niveaux immos/stocks
    bilan.js        ← renderer bilan + édition inline + actions + année suivante
    resultat.js     ← renderer compte de résultat
    annexe.js       ← renderer annexe comptable
    liasse.js       ← renderer liasse fiscale (12 imprimés Cerfa)
    teledec.js      ← renderer télédéclaration EDI-TDFC (réutilise calcFiscal de liasse.js)
    ratios.js       ← calcul et rendu analyse financière
  utils/
    doc-helpers.js  ← formatage, buildHeader, buildTabs, hintIcon()
    tooltip.js      ← gestion hover/tap des tooltips hints (délégation document)
    identite.js     ← génération SIRET/SIREN (Luhn) + adresse fictive
  export/
    pdf.js          ← export PDF via window.print()
    session.js      ← save/load session JSON (v4.0) + migration v1–v3
```

---

## Format de session

| Version | Changement |
|---------|------------|
| v1.0 | Format initial |
| v2.0 | Champs dates exercice (dateDebut/dateFin) |
| v3.0 | dataN1Figee + dureeExerciceMois |
| v4.0 | niveauImmos + niveauStocks (remplace booléens hasImmobilisations/hasStocks) |

Les sessions v1–v3 sont migrées automatiquement au chargement.

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
| P9d | Duplication année suivante + session v3.0 | ✅ |
| P10 | Exercices décalés (date début/fin libre, F54) | ✅ |
| F64/F65 | Granularité immos/stocks (4 niveaux) — session v4.0 | ✅ |
| Hints | Tooltips comptables élèves sur bilan + CR | ✅ |
| Teledec | Télédéclaration EDI-TDFC (contrôles + accusé DGFiP) | ✅ |

---

> Projet pédagogique — aucune donnée réelle, aucun backend, 100% client-side.
