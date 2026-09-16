# Office Hours design rules

Ultra premium. Minimal. Aesthete. Prefer absence over ornament.

## Posture

Build like Swiss / editorial graphic design: a clear modular grid, asymmetric balance where useful, generous negative space between sections, and almost no decoration. The layout should feel inevitable — not like a SaaS dashboard.

References: gallery and editorial mobile sites (serif titles, strict left grid, tight related clusters, airy section breaks). Keep the existing dark palette.

## Color

Keep the current tokens:

- Background `#0B0A09`
- Foreground `#F5F5F5`
- Muted `#A7A09B`
- Border `#2a2826`

Do not invent accent colors. Hierarchy is color + spacing + face, not fills.

## Typography

1. **Two faces only.**
   - **Serif** (`--font-serif`, Newsreader): brand, content titles, body copy, reader. Not a condensed display serif.
   - **Sans** (`--font-sans`, Inter): nav, meta, filters, utility chrome only.
2. **Sentence case** for app chrome and labels. No all-caps microcopy.
3. **Display serifs are banned.** Never use condensed/display faces (e.g. Instrument Serif).
4. **One size for content.** Titles and body share the same serif size. Brand may be a slight lift only. Do not enlarge list titles, video titles, or calendar titles.
5. Hierarchy comes from **color** (foreground vs muted), **face** (serif vs sans), and **spacing** — never from weight or oversized title scale.

## Layout & rhythm

6. **Tight then loose.** Related elements (title → summary → meta, image → caption) sit close. Distinct sections get large negative space.
7. **Swiss grid.** Align to `--gutter` and `--column`. Flush left edge for text and media in the content column.
8. **Spacing creates structure.** Gaps and hairlines define sections — not boxes or cards.
9. **Be minimalistic.** If removing an element does not hurt understanding, remove it.

## Chrome to avoid

10. **No SaaS furniture:** containers, cards-with-borders, icons, pills, badges, chips, tags, or dots.
11. **No dot separators** (`·`, bullets between meta). Separate with space only.
12. **No squircles** and **no pill chrome**. Prefer flush corners (`border-radius: 0`) on the content grid.

## Interaction

13. Active / inactive via **color** (foreground vs muted), not fills, borders, or decorative underlines.
14. Hover stays nearly invisible — color/opacity only, not hover cards.

## When adding UI

Ask, in order:

1. Can spacing alone express this?
2. Can face + color alone express hierarchy?
3. Can this ship with less text and zero new chrome?

If yes, ship that.
