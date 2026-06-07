# Fonctionnalités — Bilapp

## Légende
- 🔴 Non démarré
- 🟡 En cours / En discussion
- 🟢 Validé / Spécifié
- ✅ Implémenté

---

## Core — Génération de bilan

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F01 | Formulaire de paramétrage 4 étapes | ✅ | form.js — Q01-Q19 |
| F02 | Génération du Bilan (Actif / Passif) conforme PCG | ✅ | engine.js |
| F03 | Génération du Compte de Résultat | ✅ | engine.js |
| F04 | Cohérence automatique Actif = Passif | ✅ | Trésorerie variable d'ajustement |
| F05 | Cohérence résultat bilan ↔ compte de résultat | ✅ | validator.js V02 + reconcile.js |
| F06 | Watermark / mention FICTIF sur tous les documents | ✅ | Bandeau fixe + en-tête |
| F07 | Comparatif N-1 | ✅ | engine.js + renderers |
| F08 | Amortissements clampés (amort ≤ brut) | ✅ | engine.js poste() |
| F09 | Résultat neutre jamais nul — randomisé dans [-999,-1]∪[1,999] | ✅ | engine.js + reconcile.js |

## Rendu documents

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F10 | Rendu bilan comptable HTML | ✅ | bilan.js |
| F11 | Rendu compte de résultat HTML | ✅ | resultat.js |
| F12 | Navigation par onglets entre documents | ✅ | bilan.js — buildTabs |
| F13 | Rendu annexe (4 sections) | ✅ | annexe.js — lecture seule |
| F14 | Rendu liasse fiscale Cerfa 2050-2059-A | ✅ | liasse.js — 12 imprimés, codes lignes exacts |

## Édition inline

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F20 | Clic sur cellule → input inline | ✅ | bilan.js — activerEdition |
| F21 | Confirmation Enter/blur → verrouillage | ✅ | overrides.js |
| F22 | Annulation Escape | ✅ | |
| F23 | Recalcul totaux en cascade | ✅ | reconcile.js |
| F24 | Propagation resultatNet → passif (CR → bilan) | ✅ | reconcile.js |
| F25 | Trésorerie comme variable d'ajustement | ✅ | reconcile.js |
| F26 | Icône cadenas sur postes verrouillés | ✅ | documents.css |
| F27 | Compteur de verrous dans la barre d'actions | ✅ | bilan.js — updateLockCount |
| F28 | Bandeau déséquilibre si tréso verrouillée | ✅ | documents.css + bilan.js |
| F29 | Reset des verrous au nouveau bilan | ✅ | clearOverrides() |
| F30 | Recalibrage charges par ratio si CA modifié | ✅ | reconcile.js |
| F31 | Sync variation stocks bilan → CR (PCG) | ✅ | reconcile.js |
| F32 | Orientation respectée après édition | ✅ | reconcile.js — dotations |
| F33 | Bouton 🔄 Régénérer — relance engine, garde les overrides | ✅ | bilan.js — bindRegenerer() + generate() |

## Export / Session

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F40 | Export PDF via window.print() | ✅ | pdf.js + print.css |
| F41 | En-tête navy imprimé avec couleurs | ✅ | print-color-adjust |
| F42 | Mention fictif en pied de page | ✅ | .print-footer |
| F43 | Saut de page actif / passif | ✅ | print.css |
| F44 | Save session → download `.json` | ✅ | session.js v2.0, bouton 💾 |
| F45 | Load session → upload `.json` → restore (vue documents) | ✅ | session.js, bouton 📂 |
| F46 | Load session depuis la page d'accueil | ✅ | app.js — _bindLoadSessionHome() |
| F47 | Export Excel / CSV | 🔴 | Backlog |

## Liasse fiscale (P8 — terminée)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F70 | Imprimé 2050 — Bilan actif Cerfa | ✅ | Codes lignes exacts AA–BN |
| F71 | Imprimé 2051 — Bilan passif Cerfa | ✅ | Codes lignes exacts CA–EE |
| F72 | Imprimé 2052 — CR produits Cerfa | ✅ | Codes lignes exacts FA–HJ |
| F73 | Imprimé 2053 — CR charges Cerfa | ✅ | Codes lignes exacts GA–HN |
| F74 | Imprimé 2054 — Tableau immobilisations | ✅ | Début/acq/dim/fin simulés |
| F75 | Imprimé 2055 — Tableau amortissements | ✅ | Début/dot/dim/fin simulés |
| F76 | Imprimé 2056 — Tableau provisions | ✅ | |
| F77 | Imprimé 2057 — Créances et dettes | ✅ | Ventilation échéances ≤1an / >1an |
| F78 | Imprimé 2058-A — Résultat fiscal | ✅ | Réintégrations simulées 0.5–2% charges ext. |
| F79 | Imprimé 2058-B — Déficits reportables | ✅ | Vide si bénéficiaire |
| F80 | Imprimé 2058-C — Affectation résultat | ✅ | |
| F81 | Imprimé 2059-A — Valeurs mobilières | ✅ | PV/MV latentes simulées |

## Paramétrage pédagogique

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F50 | Scénario bilan positif / négatif / neutre | ✅ | ORIENTATIONS dans constants.js |
| F51 | Aspect international | ✅ | hasInternational |
| F52 | Choix forme juridique (SAS, SARL, SA) | ✅ | |
| F53 | Ratios sectoriels (commerce/services/industrie) | ✅ | RATIOS_SECTORIELS |
| F54 | Exercice décalé — date de début libre | 🟢 | Voir spec ci-dessous |
| F55 | SIRET/SIREN fictifs générés (Luhn) | ✅ | P9c — identite.js |
| F56 | Adresse fictive générée (ville + CP cohérents) | ✅ | P9c — identite.js, VILLES_FR dans constants.js |

## Réalisme comptable (P9a — terminée)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F90 | FR / BFR / Trésorerie nette calculés et affichés | ✅ | P9a — ratios.js, onglet Analyse |
| F91 | SIG complet — VA, EBE, EBIT, RCAI | ✅ | P9a — ratios.js |
| F92 | CAF — Capacité d'Autofinancement | ✅ | P9a — ratios.js |
| F93 | Ratios de rentabilité (ROE, ROA, marge nette, autonomie) | ✅ | P9a — ratios.js |

## UX / Workflow (P9d — terminée)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F95 | Duplication de session vers année suivante | ✅ | P9d — bilan.js bindAnneeSuivante(), session.js v2.0 dataN1Figee |

## Évolutions futures (backlog)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F60 | Tableau de financement | 🔴 | Niveau DSCG |
| F61 | Mode élève / formateur | 🔴 | Droits d'édition différenciés |
| F62 | SCI / EI — formes juridiques supplémentaires | 🔴 | |
| F63 | Export Excel / CSV | 🔴 | |

---

## Spec F54 — Exercice décalé

### Contexte
En France, une société peut ouvrir son exercice n'importe quel jour de l'année.
Cas fréquents en pédagogie : 01/07→30/06 (grande distribution, agriculture),
01/04→31/03 (filiales UK/JP), et surtout **première année incomplète** (création
en cours d'année, ex. 15/03/2024 → 31/12/2024 = 9,5 mois).

### Ce qui change dans le formulaire (étape 1)
- Remplacer le champ `anneeExercice` (number) par deux champs :
  - `dateDebut` — `<input type="date">` — défaut : 01/01/année précédente
  - `dateFin`   — `<input type="date">` — défaut : 31/12/même année
- Validation : dateFin > dateDebut, durée ≤ 24 mois (exercice exceptionnel max légal)
- La durée en mois est calculée et stockée dans `params.societe.dureeExerciceMois`

### Ce qui change dans BilanParams
```js
societe: {
  // Remplace anneeExercice
  dateDebut:           'YYYY-MM-DD',  // ex. '2024-03-15'
  dateFin:             'YYYY-MM-DD',  // ex. '2024-12-31'
  dureeExerciceMois:   number,        // ex. 9.5 — calculé, pas saisi
  // anneeExercice conservé comme alias = année de dateFin (rétrocompat sessions v1/v2)
  anneeExercice:       number,
  // ... reste inchangé
}
```

### Ce qui change dans engine.js
- Le CA généré est multiplié par `dureeExerciceMois / 12` si durée < 12 mois
  (ex. 9 mois → CA × 0.75). Cela rend le bilan cohérent pour une première année courte.
- Pas de prorata si durée ≥ 12 mois (exercice normal ou exceptionnel long).

### Ce qui change dans doc-helpers.js — buildHeader
- Affichage : "Exercice du JJ/MM/AAAA au JJ/MM/AAAA" au lieu de "Exercice clos le 31/12/AAAA"
- Si durée < 12 mois : badge "(exercice court — X mois)" visible dans l'en-tête

### Ce qui change dans les renderers
- `bilan.js`, `resultat.js`, `annexe.js`, `liasse.js` : partout où on affiche
  `anneeExercice` seul, on affiche la plage de dates.
- La liasse fiscale (Cerfa) utilise déjà des champs date — à câbler avec dateDebut/dateFin.

### Rétrocompatibilité sessions v1.0 / v2.0
- Au chargement d'une session ancienne sans `dateDebut`/`dateFin` :
  reconstruire `dateDebut = '${anneeExercice}-01-01'`, `dateFin = '${anneeExercice}-12-31'`

### Fichiers touchés
| Fichier | Nature de la modif |
|---------|-------------------|
| `js/modules/form.js` | Remplace Q05 par deux date pickers + validation + calcul durée |
| `js/core/constants.js` | Aucune |
| `js/core/engine.js` | Prorata CA si dureeExerciceMois < 12 |
| `js/utils/doc-helpers.js` | buildHeader — affichage plage dates + badge exercice court |
| `js/export/session.js` | v3.0 — migration rétrocompat dateDebut/dateFin |
| `js/modules/bilan.js` | Passe dateDebut/dateFin là où anneeExercice est affiché |
| `js/modules/resultat.js` | Idem |
| `js/modules/annexe.js` | Idem |
| `js/modules/liasse.js` | Câblage champs date Cerfa |

### Estimation complexité
~4–5k tokens. Session courte autonome.
