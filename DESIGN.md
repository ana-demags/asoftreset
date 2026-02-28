# Soft Exhale — design document

> A mindfulness PWA combining gentle puzzles with breathing exercises.  
> Domain: softexhale.app

---

## What this is

Soft Exhale is a calm, screen-positive app for people who want to decompress. It combines simple tapping puzzles with a breathing timer, designed to be usable in stolen moments — waiting rooms, commutes, difficult days.

The core loop: pick a session length → do a breathing exercise → settle into a pattern puzzle → exhale.

---

## Product philosophy

**Calm over clever.** Every decision should reduce cognitive load, not add to it. No streaks, scores, leaderboards, or notifications.

**No forced completion.** The pattern puzzles are open sandboxes — users fill shapes at their own pace. There is no "wrong" answer, no timer, no failure state.

**Infinite content, zero pipeline.** The v1 pattern generator is fully algorithmic. Every composition is generated from a seed, meaning infinite unique puzzles with no content curation work.

**Botanical and organic as a through-line.** The visual vocabulary — shapes, palettes, typography — should feel like it belongs in a 19th century herbarium, not a gamified wellness app.

---

## Visual identity

### Typography

*Not yet decided. To be finalized during early development.*

### Color system

The palette system uses named palettes — users choose a palette, not individual colors.

| Palette | Feel |
|---------|------|
| `meadow` | Green and earthy, the default |
| `dusk` | Deep purple night, moody |
| `mist` | Cool grey-blue, airy |
| `bloom` | Warm rose and apricot |
| `slate` | Dark and minimal |

Each palette contains 6 colors that always work together — no arbitrary color picking. The background color shows through between shapes and is part of the composition.

*Specific hex values to be finalized during visual design. Dark palettes (dusk, slate) should use lighter strokes to maintain contrast.*

### Surface and chrome

*Not yet decided. To be finalized during visual design.*

### Motion

- All animations use ease-out cubic for line draws and fills
- Fill reveals: 700–900ms
- Shape transitions: 260–300ms
- **Always respect `prefers-reduced-motion`.** When this media query is active: skip all animation, show final state immediately, no rAF loops.

---

## Accessibility

This section defines the accessibility approach for Soft Exhale. It should be treated as non-negotiable, not as a polish pass.

### Cognitive accessibility (primary focus)

Soft Exhale is explicitly designed for users with ADHD, anxiety, and related conditions. These principles drive every interaction decision:

**Reduce decision fatigue.** Limit choices at any one moment. The interface presents: one puzzle, one palette, one time tier. Settings are always available but never foregrounded.

**Clear state.** The user should always know what has happened and what to do next. Progress text ("7 of 22 shapes filled") updates immediately on each action. Never leave the user wondering if something registered.

**No time pressure.** No countdown timers during puzzles. Session length controls complexity, not a deadline.

**Generous hit targets.** Touch targets are minimum 44×44px per WCAG, but we aim higher — shape hit detection uses a 50px radius around centers. Dots in connect-the-dots use a 50px tap radius. On mobile, make it easy to tap correctly, not satisfying to tap precisely.

**No punishing errors.** Tapping a shape that's already colored just recolors it. Tapping the wrong dot in connect-the-dots does nothing — no error sound, no visual penalty. The next dot is always highlighted to guide the user forward.

**Simple, complete instructions.** Each puzzle mode has a single line of contextual copy that tells the user exactly what to do. Never assume the user has used the app before.

### Visual accessibility

**Color is never the only signal.** Shape outlines remain visible regardless of fill. The active dot in connect-the-dots is larger and has a ring, not just a different color.

**Contrast.** All text meets WCAG AA (4.5:1) against its background. Check and boost UI label contrast during implementation if needed.

**Font size minimums.** Nothing below 9px on canvas (rendered at device pixel ratio). UI text minimum ~11px. Avoid relying on very small text to convey meaning.

**Canvas accessibility.** All canvas elements must have an accessible description via `aria-label` or a visually-hidden text alternative. Example: `aria-label="Pattern coloring puzzle: 7 of 22 shapes filled"`. Update this dynamically as the user makes progress.

**Focus management.** All interactive controls (buttons, palette selectors, style pickers) must be keyboard accessible. Canvas interaction is pointer-only by design, but all surrounding controls use standard tab order with visible focus states.

### Motor accessibility

**Pointer events only where necessary.** Canvas-based interaction (tapping shapes, connecting dots) is inherently pointer-centric. For v1 this is acceptable given the nature of the puzzles, but document this as a known limitation.

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

### v1: Pattern generator (shipped first)

The core puzzle. Algorithmically generated shapes the user colors in.

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

Tiers control composition complexity. There is no completion requirement — users can tap "new puzzle" or leave at any time.

**Interaction model:**
1. User selects a color from the palette row
2. User taps any shape to fill it with that color
3. Progress shown as percentage ("42% filled")
4. No win state — "new puzzle ✦" generates a fresh composition with the same settings

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

- Modes: box breathing (4-4-4-4), 4-7-8, simple inhale/exhale
- Visual: expanding/contracting circle with phase text ("inhale · hold · exhale · hold")
- Audio: soft chime on phase transition — optional, off by default
- Always respect `prefers-reduced-motion` — animation-free text countdown as fallback
- Timer is the entry point: users complete a breathing session before the puzzle, or can skip

---

## Tech stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS utility classes
- **Canvas:** Pure Canvas 2D API — no canvas libraries. Pattern rendering uses `Path2D` objects.
- **PWA:** Manifest + service worker. Offline-first for the puzzle experience.
- **Persistence:** localStorage for preferences (palette, style, time tier). No account required for v1.
- **Audio:** Web Audio API for breathing cues. Keep the audio module isolated and lazy-loaded.

---

## Suggested file structure

```
/app
  /page.tsx              — home / entry
  /breathe/page.tsx      — breathing timer
  /puzzle/page.tsx       — pattern coloring

/lib
  /patterns.ts           — shape generators (blobs, pills, petals, geo, leaves)
  /prng.ts               — seeded PRNG
  /palettes.ts           — palette definitions
  /breathing.ts          — breathing timer logic
  /hitDetect.ts          — offscreen canvas hit testing

/components
  /Canvas.tsx            — base canvas wrapper with resize handling
  /ColorPicker.tsx       — palette swatch row
  /StylePicker.tsx       — style selector buttons
  /TierPicker.tsx        — time tier selector
  /BreathingCircle.tsx   — breathing animation
```

---

## Copy and voice

The app's voice is: **quiet, present, unhurried**. Not cheerful. Not clinical.

**Do:**
- Short, factual progress text: "7 of 22", "tap dot 1 to begin", "42% filled"
- Gentle completion text: "✦ complete ✦", "the leaf comes to life..."
- Action labels that describe simply: "new puzzle ✦", "start over ↺", "clear ↺"

**Don't:**
- Exclamation points
- Gamified language ("Level up!", "Streak!")
- Instructions that assume the user is confused ("Welcome! Here's how to use this app:")
- Passive voice or jargon

*UI capitalization style to be decided. Currently using lowercase in prototype — confirm before development.*

---

## Known limitations and open questions

**Canvas accessibility.** Canvas hit detection is pointer-only. A full keyboard navigation fallback for the pattern puzzle would require significant architecture changes. Document this clearly in the accessibility statement.

**Color blindness.** Palettes not yet tested for CVD users. Before launch: run all palettes through a CVD simulator and adjust as needed.

**Dark mode.** The `dusk` and `slate` palettes serve dark-mode users, but the app chrome doesn't currently adapt to `prefers-color-scheme: dark`. Consider offering automatic dark/light chrome based on system preference in v1.1.

**BHL licensing.** Pre-1925 botanical illustrations are public domain. Newer BHL digitizations may be CC BY-NC-SA — verify per-image before use in any commercial context.

---

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| Feb 2026 | Ship pattern generator first, connect-the-dots in v2 | Patterns are infinite/algorithmic; dots need content pipeline |
| Feb 2026 | 5 shape styles: blobs, pills, petals, geo, leaves | Covers organic/graphic/botanical/structured without overlap |
| Feb 2026 | Rejected "shards" style | Angular shapes fight the soft exhale brand |
| Feb 2026 | No win condition on pattern puzzle | Open sandbox reduces pressure, more meditative |
| Feb 2026 | Curated palettes only, no color picker | Prevents ugly combinations, reduces decision fatigue |
| Feb 2026 | Seeded PRNG for compositions | Reproducible puzzles without server-side state |
| Feb 2026 | Offscreen canvas for hit detection | Correct O(1) hit testing without iterating shapes on every tap |
| Feb 2026 | Time tiers control density, not a deadline | Keeps the experience pressure-free |

---

*Update this document as decisions evolve. If Claude Code suggests something that contradicts what's here, bring it back to this doc and decide intentionally.*
