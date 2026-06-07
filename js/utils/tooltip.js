/**
 * tooltip.js — Bilapp
 * -------------------------------------------------------
 * Gestion des tooltips pour les hints comptables.
 *
 * Stratégie : délégation sur le document — un seul listener,
 * une seule bulle réutilisée. Pas de librairie externe.
 *
 * Déclenchement :
 *   - Desktop : mouseenter / mouseleave sur .hint-icon
 *   - Mobile  : tap sur .hint-icon (toggle), fermeture au tap ailleurs
 *
 * La bulle est positionnée pour rester dans le viewport
 * (flip vertical si trop près du bas).
 *
 * Exports :
 *   initTooltips()    — à appeler une fois après chaque renderTab()
 *   destroyTooltips() — nettoie la bulle et les listeners globaux
 */

'use strict';

// ============================================================
// ÉTAT MODULE
// ============================================================

/** Bulle DOM unique, créée une fois */
let _bubble = null;

/** Dernier bouton hint ayant ouvert la bulle (pour le toggle mobile) */
let _activeBtn = null;

/** Listeners globaux actifs (pour cleanup propre) */
let _docClickHandler  = null;
let _docTouchHandler  = null;

// ============================================================
// CRÉATION DE LA BULLE
// ============================================================

function _ensureBubble() {
  if (_bubble) return;
  _bubble = document.createElement('div');
  _bubble.className   = 'hint-bubble';
  _bubble.setAttribute('role', 'tooltip');
  _bubble.setAttribute('aria-hidden', 'true');
  document.body.appendChild(_bubble);
}

// ============================================================
// POSITIONNEMENT
// ============================================================

/**
 * Positionne la bulle au-dessus ou en-dessous du bouton
 * selon l'espace disponible dans le viewport.
 * @param {HTMLElement} btn
 */
function _positionBubble(btn) {
  const rect      = btn.getBoundingClientRect();
  const bubbleH   = _bubble.offsetHeight || 60;
  const margin    = 8;
  const spaceTop  = rect.top;
  const spaceBot  = window.innerHeight - rect.bottom;
  const showAbove = spaceTop > bubbleH + margin && spaceTop >= spaceBot;

  // Position horizontale : centré sur le bouton, clampé aux bords
  let left = rect.left + rect.width / 2 - _bubble.offsetWidth / 2 + window.scrollX;
  left = Math.max(8, Math.min(left, window.innerWidth - _bubble.offsetWidth - 8));

  const top = showAbove
    ? rect.top + window.scrollY - bubbleH - margin
    : rect.bottom + window.scrollY + margin;

  _bubble.style.left = `${left}px`;
  _bubble.style.top  = `${top}px`;
  _bubble.dataset.placement = showAbove ? 'top' : 'bottom';
}

// ============================================================
// AFFICHAGE / MASQUAGE
// ============================================================

function _showBubble(btn, text) {
  _ensureBubble();
  _bubble.textContent    = text;
  _bubble.style.display  = 'block';
  _bubble.style.opacity  = '0';
  _bubble.setAttribute('aria-hidden', 'false');

  // Position calculée après affichage (pour avoir les dimensions réelles)
  requestAnimationFrame(() => {
    _positionBubble(btn);
    _bubble.style.opacity = '1';
  });

  _activeBtn = btn;
}

function _hideBubble() {
  if (!_bubble) return;
  _bubble.style.opacity = '0';
  _bubble.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (_bubble) _bubble.style.display = 'none';
  }, 150);
  _activeBtn = null;
}

// ============================================================
// INITIALISATION — DÉLÉGATION
// ============================================================

/**
 * Attache les listeners de délégation sur le document.
 * Idempotent : détruit les anciens avant de recréer.
 */
export function initTooltips() {
  destroyTooltips();
  _ensureBubble();

  // --- DESKTOP : hover ---
  document.addEventListener('mouseover', _onMouseOver);
  document.addEventListener('mouseout',  _onMouseOut);

  // --- MOBILE : tap ---
  _docClickHandler = _onDocClick;
  document.addEventListener('click', _docClickHandler);
}

function _onMouseOver(e) {
  const btn = e.target.closest('.hint-icon');
  if (!btn) return;
  const text = btn.dataset.hint;
  if (text) _showBubble(btn, text);
}

function _onMouseOut(e) {
  const btn = e.target.closest('.hint-icon');
  if (!btn) return;
  // Ne masque pas si le curseur entre dans la bulle
  if (_bubble && _bubble.contains(e.relatedTarget)) return;
  _hideBubble();
}

function _onDocClick(e) {
  const btn = e.target.closest('.hint-icon');

  if (btn) {
    e.stopPropagation();
    if (_activeBtn === btn) {
      // Toggle : ferme si déjà ouvert
      _hideBubble();
    } else {
      const text = btn.dataset.hint;
      if (text) _showBubble(btn, text);
    }
    return;
  }

  // Clic ailleurs → ferme
  if (_activeBtn) _hideBubble();
}

// ============================================================
// CLEANUP
// ============================================================

/**
 * Supprime les listeners globaux et masque la bulle.
 * À appeler avant chaque re-render complet du DOM.
 */
export function destroyTooltips() {
  document.removeEventListener('mouseover', _onMouseOver);
  document.removeEventListener('mouseout',  _onMouseOut);

  if (_docClickHandler) {
    document.removeEventListener('click', _docClickHandler);
    _docClickHandler = null;
  }

  _hideBubble();
  _activeBtn = null;
}
