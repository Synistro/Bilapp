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
| F44 | Save session → download `.json` | ✅ | session.js, bouton 💾 |
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
| F54 | Dates d'exercice paramétrables (début/fin libres) | 🔴 | P9b — voir specs |
| F55 | SIRET/SIREN fictifs générés (Luhn) | 🔴 | P9c — voir specs |
| F56 | Adresse fictive générée (ville + CP cohérents) | 🔴 | P9c — voir specs |

## Réalisme comptable (P9a)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F90 | FR / BFR / Trésorerie nette calculés et affichés | 🔴 | P9a — onglet ou section dédiée |
| F91 | SIG complet — VA, EBE, EBIT, RCAI | 🔴 | P9a — resultat.js prêt |
| F92 | CAF — Capacité d'Autofinancement | 🔴 | P9a — idem |
| F93 | Ratios de rentabilité (ROE, ROA, marge nette) | 🔴 | P9a — calculables depuis BilanData |

## UX / Workflow (P9d)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F95 | Duplication de session vers année suivante | 🔴 | P9d — N devient N-1, nouveaux params, voir specs |

## Évolutions futures (backlog)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F60 | Tableau de financement | 🔴 | Niveau DSCG |
| F61 | Mode élève / formateur | 🔴 | Droits d'édition différenciés |
| F62 | SCI / EI — formes juridiques supplémentaires | 🔴 | |
| F63 | Export Excel / CSV | 🔴 | |
