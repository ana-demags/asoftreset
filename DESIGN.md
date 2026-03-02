# asoftreset — design document

> A mindfulness PWA combining gentle composition with breathing exercises.  
> Product name: asoftreset. Domain TBD.

---

## What this is

asoftreset is a calm, screen-positive app for people who want to decompress. It combines simple tapping composition (paint and weave) with a breathing timer, designed to be usable in stolen moments — waiting rooms, commutes, difficult days.

**Core flow:** Home → Start (choose Breathe or Compose) → either complete a breathing session or enter Compose. From Compose, the user chooses Paint (color organic shapes) or Weave (thread bands over and under), then settles into one activity. No forced order — users can go straight to Compose or Breathe from Start.

---

## Product philosophy

**Calm over clever.** Every decision should reduce cognitive load, not add to it. No streaks, scores, leaderboards, or notifications.

**No forced completion.** Both compose modes (Paint and Weave) are open sandboxes — users work at their own pace. There is no "wrong" answer, no timer, no failure state.

**Infinite content, zero pipeline.** The Paint (pattern) generator is fully algorithmic; Weave patterns are also algorithmic. Every composition is generated from a seed, meaning infinite unique compositions with no content curation work.

**Botanical and organic as a through-line.** The visual vocabulary — shapes, palettes, typography — should feel like it belongs in a 19th century herbarium, not a gamified wellness app.

---

## Visual identity

All choices in this section (type size, contrast, grain) align with the **Accessibility** section and must not regress WCAG AA or cognitive clarity.

### Typography

- **Current implementation:** Display and headings use **Gambarino** (local woff2 in `public/fonts/`). Body and UI use **Figtree** (Google Font). Serif for hierarchy and calm; sans for readable body — aligned with the botanical, refined identity.
- **Hierarchy:** Via **size and spacing**, not weight — avoid bold for now. Use large sizes for headings; regular or medium weight throughout.
- **Headings:** Large sizes, tight line-height (e.g. 1.1–1.2).
- **Body / paragraphs:** Generous line-height (e.g. 1.5–1.65) for readability and calm.
- **Accessibility:** All UI text at or above 11px minimum (per Visual accessibility). All text meets WCAG AA (4.5:1) against background; use warm black/charcoal on cream, not pure black. Typescale and font variables live in `app/globals.css`; a design reference page exists at `/typescale` for internal use.

### Color system

The palette system uses named palettes — users choose a palette, not individual colors.

| Palette | Feel |
|---------|------|
| `stone` | Warm neutrals, wabi-sabi, zen (default) |
| `mist` | Cool grey-blue, airy |
| `dew` | Soft sage and eucalyptus, morning mist |
| `tide` | Soft grey-teal, seafoam, coastal calm |
| `haze` | Soft lavender-grey, distant hills |

Each palette contains 6 colors that always work together — no arbitrary color picking. The background color shows through between shapes and is part of the composition. Palettes are chosen to be soothing and calming for mindfulness use.

*Specific hex values to be finalized during visual design. Chrome uses neutral/muted tones; stronger accents deferred.*

### Surface and chrome

- **Background:** Warm off-white/cream (e.g. #F5F3ED–#F8F7F0). Foreground/text: warm black or deep charcoal; contrast must remain WCAG AA (≥ 4.5:1). Current implementation: `--background: #f7f5f0`, `--foreground: #1a1a18` (contrast ~14:1, WCAG AAA).
- **Optional grain:** Barely-there texture on main app background only. Must be subtle enough that it does not reduce legibility or create distracting noise; implementation should be tunable or disableable. Test with zoom and low-vision scenarios before shipping.

### Color and theme variables (CSS)

App chrome uses CSS custom properties in `app/globals.css` so one place controls the look and Tailwind can reference them via `@theme inline`.

| Variable | Purpose | Current value |
|----------|---------|----------------|
| `--background` | Page and chrome background | `#f7f5f0` |
| `--text` | Body and paragraphs (lighter gray) | `#51514D` |
| `--heading` | Headings (dark) | `#1a1a18` |
| `--foreground` | UI (focus ring, primary button) — same as heading | `var(--heading)` |
| `--border-subtle` | Dividers, subtle borders | `#e0ded9` (gentle silver) |
| `--surface-overlay` | Glass/card overlay on background | `rgba(255,255,255,0.7)` |

Use these in components instead of hardcoded hex/rgba for chrome. Feature-specific palettes (Paint and Weave) stay in `lib/palettes.ts` and `lib/weaving.ts`; they are not part of the global theme. For future dark chrome (v1.1), add e.g. `--border-subtle-dark` and switch in a `prefers-color-scheme: dark` block or a theme class.

**Typescale and font variables** (in `app/globals.css`): `--text-display`, `--text-heading-1`, `--text-heading-2`, `--text-heading-3`, `--text-body`, `--text-body-sm`; `--leading-display`, `--leading-tight`, `--leading-body`; `--font-serif` (Gambarino), `--font-figtree`. These keep hierarchy and readability consistent and must remain accessible (minimum sizes and contrast as above).

### Motion

- All animations use ease-out cubic for line draws and fills
- Fill reveals: 700–900ms
- Shape transitions: 260–300ms
- **Always respect `prefers-reduced-motion`.** When this media query is active: skip all animation, show final state immediately, no rAF loops.

---

## Accessibility

This section defines the accessibility approach for asoftreset. It should be treated as non-negotiable, not as a polish pass. All compose modes (Paint and Weave) and the breathing experience must follow these guidelines.

### Cognitive accessibility (primary focus)

asoftreset is explicitly designed for users with ADHD, anxiety, and related conditions. These principles drive every interaction decision:

**Reduce decision fatigue.** Limit choices at any one moment. The interface presents: one composition, one palette (or palette set), one time tier where applicable. Settings are always available but never foregrounded. The Start and Compose hub pages offer exactly two options each (Breathe or Compose; Paint or Weave) to keep decisions simple.

**Clear state.** The user should always know what has happened and what to do next. Progress text ("7 of 22 shapes filled") updates immediately on each action. Never leave the user wondering if something registered.

**No time pressure.** No countdown timers during composition. Session length controls complexity, not a deadline.

**Generous hit targets.** Touch targets are minimum 44×44px per WCAG, but we aim higher — shape hit detection uses a 50px radius around centers. Dots in connect-the-dots use a 50px tap radius. On mobile, make it easy to tap correctly, not satisfying to tap precisely.

**No punishing errors.** Tapping a shape that's already colored just recolors it. Tapping the wrong dot in connect-the-dots does nothing — no error sound, no visual penalty. The next dot is always highlighted to guide the user forward.

**Simple, complete instructions.** Each compose mode has a single line of contextual copy that tells the user exactly what to do. Never assume the user has used the app before.

### Visual accessibility

**Color is never the only signal.** In Paint, shape outlines remain visible regardless of fill. In Weave, structure is clear via over/under and contrast. The active dot in connect-the-dots (v2) is larger and has a ring, not just a different color.

**Contrast.** All text meets WCAG AA (4.5:1) against its background. Check and boost UI label contrast during implementation if needed.

**Font size minimums.** Nothing below 9px on canvas (rendered at device pixel ratio). UI text minimum ~11px. Avoid relying on very small text to convey meaning.

**Canvas accessibility.** All canvas elements (Paint and Weave) must have an accessible description via `aria-label` or a visually-hidden text alternative. Example: `aria-label="Pattern composition: 7 of 22 shapes filled"` or equivalent for Weave (e.g. bands placed). Update this dynamically as the user makes progress.

**Focus management.** All interactive controls (buttons, palette selectors, style pickers) must be keyboard accessible. Canvas interaction is pointer-only by design, but all surrounding controls use standard tab order with visible focus states.

### Motor accessibility

**Pointer events only where necessary.** Canvas-based interaction (tapping shapes, weaving bands, connecting dots) is inherently pointer-centric. For v1 this is acceptable given the nature of the compositions, but document this as a known limitation.

**Large touch targets everywhere else.** Palette swatches: minimum 34×34px. Buttons: 44px tall minimum. Style and tier selectors: 34px tall minimum.

**No drag-required interactions.** Everything is tap-only. No swipe-to-dismiss, no hold-and-drag.

### Motion and vestibular

Always implement and respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

In JavaScript (rAF animations): check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before starting any animation loop. Skip to the final state if true.

The breathing timer animation (expanding/contracting circle) is central to the product. When reduced motion is active, replace the animation with a text-only countdown.

---

## Puzzle system

Compose is the umbrella for two v1 activities, chosen from `/compose`: **Paint** (pattern coloring) and **Weave** (band weaving). Both are open-ended, tap-only, and follow the same accessibility and voice guidelines.

### v1: Paint (pattern generator)

Lives at `/compose/paint`. Algorithmically generated shapes the user colors in.

**How it works:**
- A seeded PRNG generates shape positions and sizes
- Shapes are placed to avoid awkward overlaps
- Each composition is reproducible from its seed
- Hit detection uses an offscreen canvas with RGB-encoded shape IDs (O(1) lookup per tap)

**Shape styles (5 in v1):**

| Style | Character | Shape math |
|-------|-----------|------------|
| `blobs` | Organic, amoeba-like, warm | Catmull-Rom curves through jittered radial points |
| `pills` | Graphic, confident, Dusen Dusen | Rotated rounded rectangles |
| `petals` | Botanical, soft, scattered | Teardrop/petal bezier curve |
| `geo` | Structured, stained-glass | Regular polygons: triangles, squares, hexagons, octagons |
| `leaves` | Botanical, delicate, fallen-leaf | Symmetric pointed ovals at random angles |

**Rejected styles:** `shards` (angular irregular polygons) — too sharp, fights the brand.

**Time tiers → shape count:**

| Tier | Shapes | Feel |
|------|--------|------|
| 5 min | 12 | Spacious, quick, each shape feels significant |
| 10 min | 22 | Medium density, good balance |
| 15 min | 34 | Rich, intricate, satisfying to complete |

Tiers control composition complexity. There is no completion requirement — users can tap "new" or leave at any time.

**Interaction model:**
1. User selects a color from the palette row
2. User taps any shape to fill it with that color
3. Progress shown as percentage ("42% filled")
4. No win state — "new ✦" generates a fresh composition with the same settings

### v1: Weave

Lives at `/compose/weave`. Horizontal bands the user threads over and under to reveal patterns. Same philosophy as Paint: no timer, no failure, one palette set at a time. Weaving palettes and pattern logic live in `lib/weaving.ts` and `lib/weavingRender.ts`. All accessibility rules apply: clear state, generous tap targets, color not the only signal, and canvas `aria-label` (or equivalent) updated as the user works.

### v2: Connect the dots (planned, deferred)

Botanical shapes revealed by connecting numbered dots in sequence.

**Mechanics proven in prototype:**
- Dots sampled along SVG path using `path.getPointAtLength()`
- All dots visible from the start, numbered
- Line draws with eased animation (260ms) on each tap
- Completion triggers fill reveal → secondary veins animate in staggered
- Dots fade out as fill arrives

**Content approach:**
- Start with hand-authored shapes (leaf, flower, fern, tulip) — 4 shapes proven and working
- Pipeline: source SVG outline → sample N points → done
- BHL (Biodiversity Heritage Library) Flickr as botanical illustration source — pre-1925 works only for commercial use

**Why v2 not v1:** Requires content curation and a tracing pipeline. Pattern generator ships faster with zero dependencies.

---

## Breathing timer

- **Route:** `/breathe`. Reached from Start (`/start`) via the Breathe card.
- Modes: box breathing (4-4-4-4), 4-7-8, simple inhale/exhale (see `lib/breathing.ts`).
- **Visual:** Expanding/contracting blob rendered by `SoftBlobSphere` with phase text ("inhale · hold · exhale · hold"). When `prefers-reduced-motion` is active, use a text-only countdown — no animation loop.
- Audio: soft chime on phase transition — optional, off by default.
- **Accessibility:** Always respect `prefers-reduced-motion`; no rAF animation when reduced motion is preferred.

---

## Tech stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS utility classes
- **Canvas:** Pure Canvas 2D API — no canvas libraries. Pattern rendering uses `Path2D` objects.
- **PWA:** Manifest + service worker. Offline-first for the compose experience.
- **Persistence:** localStorage for preferences (palette, style, time tier). No account required for v1.
- **Audio:** Web Audio API for breathing cues. Keep the audio module isolated and lazy-loaded.

---

## Suggested file structure

```
/app
  page.tsx                 — home / entry
  layout.tsx                — fonts, RouteTransition wrapper
  RouteTransition.tsx       — route transition wrapper
  globals.css               — theme, typescale, accessibility (e.g. reduced-motion)
  /start
    page.tsx                — hub: Breathe | Compose
  /breathe
    page.tsx                — breathing timer (uses SoftBlobSphere)
  /compose
    page.tsx                — compose hub: Paint | Weave (StylePicker)
    /paint
      page.tsx              — pattern coloring (shapes, TierPicker, ColorPicker)
    /weave
      page.tsx              — weaving (WeavingPaletteSwitcher, canvas)
  /typescale
    page.tsx                — design reference (typescale); internal use

/lib
  patterns.ts               — shape generators (blobs, pills, petals, geo, leaves)
  prng.ts                   — seeded PRNG
  palettes.ts               — Paint palette definitions
  weaving.ts                — Weave palette and band logic
  weavingRender.ts           — Weave canvas rendering
  breathing.ts               — breathing timer logic (modes, phases)
  hitDetect.ts              — offscreen canvas hit testing (Paint)

/components
  Canvas.tsx                 — base canvas wrapper with resize handling
  ColorPicker.tsx            — Paint palette swatch row
  PaletteSwitcher.tsx        — Paint palette switcher (if separate from picker)
  WeavingPaletteSwitcher.tsx — Weave palette/band selector
  StylePicker.tsx            — Paint vs Weave selector (compose hub)
  TierPicker.tsx             — time tier selector (Paint)
  SoftBlobSphere.tsx         — breathing animation (expanding/contracting blob)
  Breadcrumb.tsx             — navigation breadcrumb (a11y-friendly)
  Button.tsx                 — primary UI button (variants: default, card)
```

---

## Copy and voice

The app's voice is: **quiet, present, unhurried**. Not cheerful. Not clinical.

**Do:**
- Short, factual progress text: "7 of 22", "tap dot 1 to begin", "42% filled"
- Gentle completion text: "✦ complete ✦", "the leaf comes to life..."
- Action labels that describe simply: "new ✦", "start over ↺", "clear ↺"

**Don't:**
- Exclamation points
- Gamified language ("Level up!", "Streak!")
- Instructions that assume the user is confused ("Welcome! Here's how to use this app:")
- Passive voice or jargon

*UI capitalization style to be decided. Currently using lowercase in prototype — confirm before development.*

---

## Known limitations and open questions

**Canvas accessibility.** Canvas hit detection (Paint and Weave) is pointer-only. A full keyboard navigation fallback would require significant architecture changes. Document this clearly in the accessibility statement.

**Color blindness.** Palettes not yet tested for CVD users. Before launch: run all palettes through a CVD simulator and adjust as needed.

**Dark mode.** The app chrome doesn't currently adapt to `prefers-color-scheme: dark`. Consider offering automatic dark/light chrome based on system preference in v1.1; a dedicated dark, calming compose palette could be added then if needed.

**BHL licensing.** Pre-1925 botanical illustrations are public domain. Newer BHL digitizations may be CC BY-NC-SA — verify per-image before use in any commercial context.

---

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| Feb 2026 | Ship pattern generator first, connect-the-dots in v2 | Patterns are infinite/algorithmic; dots need content pipeline |
| Feb 2026 | 5 shape styles: blobs, pills, petals, geo, leaves | Covers organic/graphic/botanical/structured without overlap |
| Feb 2026 | Rejected "shards" style | Angular shapes fight the calm, botanical brand |
| Feb 2026 | No win condition on pattern composition | Open sandbox reduces pressure, more meditative |
| Feb 2026 | Curated palettes only, no color picker | Prevents ugly combinations, reduces decision fatigue |
| Feb 2026 | Seeded PRNG for compositions | Reproducible compositions without server-side state |
| Feb 2026 | Offscreen canvas for hit detection | Correct O(1) hit testing without iterating shapes on every tap |
| Feb 2026 | Time tiers control density, not a deadline | Keeps the experience pressure-free |
| Mar 2026 | Product name: asoftreset | Align doc with current app branding |
| Mar 2026 | Start page as hub (Breathe or Compose) | Single, low-fatigue choice point before activities |
| Mar 2026 | Compose hub: Paint or Weave (StylePicker) | Two compose modes; pattern coloring at /compose/paint, weaving at /compose/weave |
| Mar 2026 | Weave as v1 compose mode | Algorithmic band weaving; palettes in lib/weaving.ts; same a11y rules as Paint |
| Mar 2026 | Typography: Gambarino + Figtree, typescale in globals.css | Single source of truth for hierarchy; /typescale as design reference |
| Mar 2026 | Breathing visual: SoftBlobSphere component | Replaces generic "BreathingCircle"; respects prefers-reduced-motion |

---

*Update this document as decisions evolve. If Claude Code suggests something that contradicts what's here, bring it back to this doc and decide intentionally.*
