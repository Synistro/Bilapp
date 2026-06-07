# Fonctionnalites - Bilapp

## Legende
- Non demarre
- En cours / En discussion
- Valide / Specifie
- Implemente

---

## Core - Generation de bilan

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F01 | Formulaire de parametrage 4 etapes | Implemente | form.js - Q01-Q19 |
| F02 | Generation du Bilan (Actif / Passif) conforme PCG | Implemente | engine.js |
| F03 | Generation du Compte de Resultat | Implemente | engine.js |
| F04 | Coherence automatique Actif = Passif | Implemente | Tresorerie variable d'ajustement |
| F05 | Coherence resultat bilan <-> compte de resultat | Implemente | validator.js V02 + reconcile.js |
| F06 | Watermark / mention FICTIF sur tous les documents | Implemente | Bandeau fixe + en-tete |
| F07 | Comparatif N-1 | Implemente | engine.js + renderers |
| F08 | Amortissements clampes (amort <= brut) | Implemente | engine.js poste() |
| F09 | Resultat neutre jamais nul - randomise dans [-999,-1]u[1,999] | Implemente | engine.js + reconcile.js |

## Rendu documents

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F10 | Rendu bilan comptable HTML | Implemente | bilan.js |
| F11 | Rendu compte de resultat HTML | Implemente | resultat.js |
| F12 | Navigation par onglets entre documents | Implemente | bilan.js - buildTabs |
| F13 | Rendu annexe (4 sections) | Implemente | annexe.js - lecture seule |
| F14 | Rendu liasse fiscale Cerfa 2050-2059-A | Implemente | liasse.js - 12 imprimes, codes lignes exacts |

## Edition inline

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F20 | Clic sur cellule -> input inline | Implemente | bilan.js - activerEdition |
| F21 | Confirmation Enter/blur -> verrouillage | Implemente | overrides.js |
| F22 | Annulation Escape | Implemente | |
| F23 | Recalcul totaux en cascade | Implemente | reconcile.js |
| F24 | Propagation resultatNet -> passif (CR -> bilan) | Implemente | reconcile.js |
| F25 | Tresorerie comme variable d'ajustement | Implemente | reconcile.js |
| F26 | Icone cadenas sur postes verrouilles | Implemente | documents.css |
| F27 | Compteur de verrous dans la barre d'actions | Implemente | bilan.js - updateLockCount |
| F28 | Bandeau desequilibre si treso verrouillee | Implemente | documents.css + bilan.js |
| F29 | Reset des verrous au nouveau bilan | Implemente | clearOverrides() |
| F30 | Recalibrage charges par ratio si CA modifie | Implemente | reconcile.js |
| F31 | Sync variation stocks bilan -> CR (PCG) | Implemente | reconcile.js |
| F32 | Orientation respectee apres edition | Implemente | reconcile.js - dotations |
| F33 | Bouton Regenerer - relance engine, garde les overrides | Implemente | bilan.js - bindRegenerer() + generate() |

## Export / Session

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F40 | Export PDF via window.print() | Implemente | pdf.js + print.css |
| F41 | En-tete navy imprime avec couleurs | Implemente | print-color-adjust |
| F42 | Mention fictif en pied de page | Implemente | .print-footer |
| F43 | Saut de page actif / passif | Implemente | print.css |
| F44 | Save session -> download .json | Implemente | session.js v3.0, bouton |
| F45 | Load session -> upload .json -> restore (vue documents) | Implemente | session.js, bouton |
| F46 | Load session depuis la page d'accueil | Implemente | app.js - _bindLoadSessionHome() |
| F47 | Export Excel / CSV | Non demarre | Backlog |

## Liasse fiscale

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F70 | Imprime 2050 - Bilan actif Cerfa | Implemente | Codes lignes exacts AA-BN |
| F71 | Imprime 2051 - Bilan passif Cerfa | Implemente | Codes lignes exacts CA-EE |
| F72 | Imprime 2052 - CR produits Cerfa | Implemente | Codes lignes exacts FA-HJ |
| F73 | Imprime 2053 - CR charges Cerfa | Implemente | Codes lignes exacts GA-HN |
| F74 | Imprime 2054 - Tableau immobilisations | Implemente | Debut/acq/dim/fin simules |
| F75 | Imprime 2055 - Tableau amortissements | Implemente | Debut/dot/dim/fin simules |
| F76 | Imprime 2056 - Tableau provisions | Implemente | |
| F77 | Imprime 2057 - Creances et dettes | Implemente | Ventilation echeances <=1an / >1an |
| F78 | Imprime 2058-A - Resultat fiscal | Implemente | Reintegrations simulees 0.5-2% charges ext. |
| F79 | Imprime 2058-B - Deficits reportables | Implemente | Vide si beneficiaire |
| F80 | Imprime 2058-C - Affectation resultat | Implemente | |
| F81 | Imprime 2059-A - Valeurs mobilieres | Implemente | PV/MV latentes simulees |

## Parametrage pedagogique

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F50 | Scenario bilan positif / negatif / neutre | Implemente | ORIENTATIONS dans constants.js |
| F51 | Aspect international | Implemente | hasInternational |
| F52 | Choix forme juridique (SAS, SARL, SA) | Implemente | |
| F53 | Ratios sectoriels (commerce/services/industrie) | Implemente | RATIOS_SECTORIELS |
| F54 | Exercice decale - date de debut libre | Implemente | Session 010 - date pickers + prorata CA + session v3.0 |
| F55 | SIRET/SIREN fictifs generes (Luhn) | Implemente | identite.js |
| F56 | Adresse fictive generee (ville + CP coherents) | Implemente | identite.js, VILLES_FR dans constants.js |
| F64 | Granularite immobilisations (4 niveaux) | Valide / Specifie | Session 012 - voir spec ci-dessous |
| F65 | Granularite stocks (4 niveaux) | Valide / Specifie | Session 012 - voir spec ci-dessous |

## Realisme comptable

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F90 | FR / BFR / Tresorerie nette calcules et affiches | Implemente | ratios.js, onglet Analyse |
| F91 | SIG complet - VA, EBE, EBIT, RCAI | Implemente | ratios.js |
| F92 | CAF - Capacite d'Autofinancement | Implemente | ratios.js |
| F93 | Ratios de rentabilite (ROE, ROA, marge nette, autonomie) | Implemente | ratios.js |

## UX / Workflow

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F95 | Duplication de session vers annee suivante | Implemente | bilan.js bindAnneeSuivante(), session.js v2.0 dataN1Figee |
| F96 | Annee suivante - dates correctes (exercice court -> plein) | Implemente | Session 011 - _calcDatesAnneeSuivante() |
| F97 | Annee suivante - dialogue choix orientation | Implemente | Session 011 - _showDialogueOrientation() |
| F98 | Annee suivante - report a nouveau coherent (affectation resultat N) | Implemente | Session 011 - _ajusterReportANouveau() |

## Evolutions futures (backlog)

| # | Fonctionnalite | Statut | Notes |
|---|---------------|--------|-------|
| F60 | Tableau de financement | Non demarre | Niveau DSCG - necessite comparatif N-1 fige (infra dispo depuis F95) |
| F61 | Mode eleve / formateur | Non demarre | Droits d'edition differencies |
| F62 | SCI / EI - formes juridiques supplementaires | Non demarre | SCI -> pas d'IS, resultat transparent. EI -> pas de capital social |
| F63 | Export Excel / CSV | Non demarre | Tableaux brut/amort/net + CR en .xlsx ou .csv |
| F66 | Dettes bancaires graduees | Non demarre | Backlog - complexe (amortissement dette, capital restant du en annee 2) |
| F67 | Pourcentage d'export international | Non demarre | Backlog - CA ventile France/export, creances en devises, liasse 2052 |

---

## Spec F64/F65 - Granularite des caracteristiques (session 012)

### Niveaux stocks (niveauStocks) - remplace hasStocks
| Cle | Label | Postes generes |
|-----|-------|---------------|
| off | Pas de stocks | aucun |
| marchandises | Marchandises | compte 37 |
| marchandises_mp | Marchandises + MP | comptes 37 + 31 |
| complet | Complet | comptes 37 + 31 + 33 + 35 |

Niveaux disponibles par secteur :
- services  : masque (inchange)
- commerce  : off / marchandises / marchandises_mp
- industrie : off / marchandises_mp / complet

### Niveaux immos (niveauImmos) - remplace hasImmobilisations
| Cle | Label | Postes generes |
|-----|-------|---------------|
| off | Aucune | aucun |
| leger | Materiel leger | installations + autresCorporel |
| mixte | Standard | incorporel + corporel sans terrain |
| lourd | Lourd | tout : terrains + constructions + incorporel + corporel |

Tous niveaux disponibles pour tous les secteurs.

### Migration session v3.0 -> v4.0
- hasImmobilisations=true  -> niveauImmos='mixte'
- hasImmobilisations=false -> niveauImmos='off'
- hasStocks=true           -> niveauStocks='marchandises'
- hasStocks=false          -> niveauStocks='off'

### Fichiers touches
| Fichier | Nature |
|---------|--------|
| `js/core/constants.js` | Ajouter NIVEAUX_STOCKS + NIVEAUX_IMMOS |
| `js/modules/form.js` | Remplacer toggles par radios 4 niveaux |
| `js/core/engine.js` | Logique 4 niveaux dans calculerActifImmobilise + calculerActifCirculant |
| `js/export/session.js` | v4.0 + migration booleens -> niveaux |
| `css/form.css` | Styles radio niveaux si necessaire |
