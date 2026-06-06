/**
 * app.js — Bilapp
 * -------------------------------------------------------
 * Orchestrateur principal de l'application.
 * Initialise les modules, gère le routing entre les vues
 * (formulaire → récapitulatif → documents générés).
 *
 * État applicatif global (le seul endroit autorisé) :
 *   - bilanParams  : objet BilanParams courant
 *   - bilanData    : objet BilanData généré par engine.js
 *   - currentStep  : étape courante du formulaire
 */

'use strict';

import { initForm }      from './modules/form.js';
import { renderBilan }   from './modules/bilan.js';
import { renderResultat } from './modules/resultat.js';
import { renderAnnexe }  from './modules/annexe.js';
import { renderLiasse }  from './modules/liasse.js';
import { initExport }    from './export/pdf.js';

// TODO — Phase P1+ : implémenter l'orchestrateur
