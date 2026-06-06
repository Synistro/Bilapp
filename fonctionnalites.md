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
| F09 | Résultat neutre jamais nul (plancher ±1 000€) | ✅ | engine.js + reconcile.js |

## Rendu documents

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F10 | Rendu bilan comptable HTML | ✅ | bilan.js |
| F11 | Rendu compte de résultat HTML | ✅ | resultat.js |
| F12 | Navigation par onglets entre documents | ✅ | bilan.js — buildTabs |
| F13 | Rendu annexe | 🔴 | P7 |
| F14 | Rendu liasse fiscale Cerfa 2050-2058 | 🔴 | P8 |

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

## Export

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F40 | Export PDF via window.print() | ✅ | P6 — pdf.js + print.css |
| F41 | En-tête navy imprimé avec couleurs | ✅ | print-color-adjust |
| F42 | Mention fictif en pied de page | ✅ | .print-footer |
| F43 | Saut de page actif / passif | ✅ | print.css |
| F44 | Export Excel / CSV | 🔴 | Backlog |

## Paramétrage pédagogique

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F50 | Scénario bilan positif / négatif / neutre | ✅ | ORIENTATIONS dans constants.js |
| F51 | Aspect international | ✅ | hasInternational |
| F52 | Choix forme juridique (SAS, SARL, SA) | ✅ | |
| F53 | Ratios sectoriels (commerce/services/industrie) | ✅ | RATIOS_SECTORIELS |

## Évolutions futures (backlog)

| # | Fonctionnalité | Statut | Notes |
|---|---------------|--------|-------|
| F60 | SIG — Soldes Intermédiaires de Gestion | 🟡 | resultat.js prêt à accueillir |
| F61 | CAF — Capacité d'Autofinancement | 🟡 | idem |
| F62 | Ratios de rentabilité | 🟡 | calculables depuis BilanData |
| F63 | Tableau de financement | 🔴 | Niveau DSCG |
| F64 | Mode élève / formateur | 🔴 | Droits d'édition différenciés |
| F65 | SCI / EI — formes juridiques supplémentaires | 🔴 | |
| F66 | Export Excel / CSV | 🔴 | |
