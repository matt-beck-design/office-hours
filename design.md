# Office Hours design rules

Ultra premium. Minimal. Aesthete. Prefer absence over ornament.

## Posture

Build like Swiss graphic design: a clear modular grid, asymmetric balance where useful, generous whitespace, and almost no decoration. The layout should feel inevitable — not like a SaaS dashboard.

## Typography

1. **No all-caps** headers, labels, or microcopy. Sentence case only.
2. **No unnecessary labels or subheads.** If content already explains itself (dates on rows, tabs in nav), do not repeat a section title.
3. **As few type treatments as possible.** One face, one size for app chrome and content titles. Hierarchy comes from **color** (foreground vs muted) and **spacing**, never from weight or size changes.
4. Do not invent letter-spacing tricks, decorative weights, or micro type scales.

## Layout

5. **Spacing creates structure.** Rhythm and gaps define sections — not boxes.
6. **Swiss grid thinking.** Align to a consistent column and modular vertical units. Prefer flush edges and predictable intervals over nested frames.
7. **Be minimalistic.** If removing an element does not hurt understanding, remove it.

## Chrome to avoid

8. **No SaaS furniture:** containers, cards-with-borders, icons, pills, badges, chips, tags, or dots.
9. **No dot separators** (`·`, bullets between meta). Separate with space only.
10. **No squircles** (8–16px soft rectangles) and **no pill chrome**. Prefer flush corners (`border-radius: 0`) on the content grid. Rounding is not a brand device here.

## Interaction

11. Active / inactive state via **color** (foreground vs muted), not fills, borders, or underlines-as-decoration.
12. Hover states stay nearly invisible — prefer opacity or color shifts, not hover “cards.”

## When adding UI

Ask, in order:

1. Can spacing alone express this?
2. Can color alone express hierarchy?
3. Can this ship with less text and zero new chrome?

If yes, ship that.
