# Sessions de travail — Bilapp

## Session 001 — 2026-06-06
**Objectif :** Mise en place de l'environnement de travail + spécifications complètes
**Participants :** Julien + Marc (Claude)
**État :** 🟡 En cours

### Ce qui a été fait
- Création du dossier projet `Bilapp/`
- Création des fichiers de référence (skill, sessions, bonnes-pratiques, fonctionnalites, SPECS)
- Repo GitHub créé : https://github.com/Synistro/Bilapp
- Git initialisé, `.gitignore` commité, `push.bat` créé
- GitHub Pages à activer : Settings → Pages → main → / (root)
- Brainstorm formulaire : 19 questions, 4 étapes UX définies
- Schéma `BilanParams` défini et validé
- SPECS complètes rédigées (sections 1 à 11)
- Structure PCG bilan + compte de résultat spécifiée avec numéros de comptes
- Moteur de calcul spécifié (fourchettes CA, ratios, règles orientation)
- Validateur spécifié (6 règles V01-V06)
- Export PDF spécifié

### Décisions prises
- Nom de l'app : **Bilapp**
- Stack : Vanilla HTML/CSS/JS, zéro framework, zéro bundler
- Hébergement : GitHub Pages
- Documents générés marqués "FICTIF / À DES FINS PÉDAGOGIQUES"
- MVP : SAS/SARL/SA uniquement (SCI/EI version ultérieure)
- CA en fourchettes (pas montant exact) → moteur génère les chiffres
- Orientation résultat : positif / négatif / neutre
- PDF via `window.print()` + CSS print

### En attente / Prochaine session
- Activer GitHub Pages sur le repo
- Démarrer P0 : structure fichiers + constants.js
- Spécifier la structure détaillée de `BilanData` (output engine.js)
- Spécifier annexe (section 6.3)
- Spécifier liasse fiscale Cerfa (section 6.4)

---
