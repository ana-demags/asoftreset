# Accessibility audit: Compose & Weaving keyboard navigation

**Scope:** Compose setup, Paint (compose/play), and Weaving experiences.  
**Focus:** Keyboard reachability and operability (reach and use all features with keyboard only).

---

## Summary

| Area | Keyboard reachable? | Keyboard operable? | Notes |
|------|---------------------|--------------------|--------|
| Compose setup (style, start) | ✅ Yes | ⚠️ Partial | Tabs focusable; tablist missing arrow-key roving |
| Paint (shapes + palette) | ❌ No | ❌ No | Canvas not focusable; no way to move focus to shapes or paint with keys |
| Weaving (grid + actions) | ❌ No | ❌ No | Canvas not focusable; no key to weave next row/column |

---

## 1. Compose setup (`/compose`)

- **Breadcrumb “back”:** Focusable, has `focus-visible:ring`. ✅
- **StylePicker (paint / weave):** Uses `role="tablist"` and buttons with `role="tab"`. Tabs are focusable via Tab. **Gap:** ARIA tablist pattern expects **arrow-key roving** (Left/Right to move between tabs). Without it, keyboard users can Tab to each tab but arrow keys do nothing. ⚠️
- **Start button:** Focusable. ✅

**Recommendation:** Add arrow-key handling to StylePicker so Left/Right move selection and focus between tabs.

---

## 2. Paint experience (`/compose/play`)

- **Canvas:** Has `aria-label` (e.g. “pattern composition: X of Y shapes filled”) but **no `tabIndex`**. Canvas is not in the tab order, so keyboard users cannot focus it. **No keyboard way to choose a shape or paint.** ❌
- **Color swatches (ColorPicker):** Native `<button>`s; focusable and activatable with Enter/Space. ✅
- **PaletteSwitcher, Clear, New, Exit:** Buttons; focusable. ✅
- **Sheets (Palettes / Actions):** Close control and actions are buttons; dialog has `aria-label`. ✅

**Recommendations:**

1. **Make the canvas focusable** (`tabIndex={0}`) and ensure it has a visible focus ring when focused.
2. **Keyboard model for painting:**
   - Focus canvas (Tab to it).
   - **Move between shapes:** e.g. Arrow Right/Down = next shape, Arrow Left/Up = previous shape (wrap at ends). Optionally include “background” as a focus target (e.g. last position = background).
   - **Paint:** Enter or Space applies the currently selected color to the focused shape (or background if that’s in scope).
3. **Screen reader:** Update the canvas `aria-label` (or use live region) to reflect “Shape N of M” and “painted” / “unpainted” so users get feedback when moving focus and after painting.

---

## 3. Weaving experience (`/weaving`)

- **Canvas:** Only `onPointerUp` is used; no `tabIndex` or key handler. Keyboard users **cannot focus the canvas or trigger weaving.** ❌
- **Palettes, Clear, New, Exit:** Buttons; focusable. ✅
- **Sheets:** Same as paint; focusable and labeled. ✅

**Recommendations:**

1. **Make the canvas focusable** (`tabIndex={0}`) with a visible focus ring.
2. **Weave with keyboard:** On canvas focus, **Enter or Space** should perform the same action as a click: weave the next horizontal row (or next vertical column when in vertical phase). This matches “one tap = one weave step” and keeps the model simple.
3. **Announce progress:** The existing `aria-label` (“Weave: X% complete”) is good; ensure it’s updated as progress changes so screen reader users get feedback after each weave step.

---

## 4. Implementation checklist

- [x] **Canvas component:** Support optional `tabIndex` and `onKeyDown` (so parent can make canvas focusable and handle keys). Visible focus ring when `tabIndex={0}` (`.focusable-canvas` in globals.css).
- [x] **Paint:** Canvas focusable; state for “focused shape index”; Arrow keys move focus (including “background” as last position); Enter/Space paint focused shape or background; dynamic aria-label for shape position and paint state.
- [x] **Weaving:** Canvas focusable; Enter/Space trigger same logic as pointer up (weave next row/column); aria-label includes instruction when actionable.
- [x] **StylePicker:** Arrow Left/Right (and Home/End) roving between tabs; selection and focus move together.

---

## 5. Other notes

- **ColorPicker / PaletteSwitcher / WeavingPaletteSwitcher:** All use buttons or Button components with `focusRing`; no change needed for basic keyboard use.
- **Reduced motion:** Weaving already respects `prefers-reduced-motion` for animation; keyboard changes do not add new motion.
- **Focus order:** With canvas in the tab order, order should remain logical: e.g. toolbar (palette, colors, actions) then canvas, or canvas then toolbar, depending on desired flow. Current paint layout suggests toolbar then canvas.
