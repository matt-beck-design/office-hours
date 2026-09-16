# Office Hours design rules

Strict. Prefer removing chrome over adding it.

## Typography

1. **No all-caps** headers, labels, or microcopy. Sentence case only.
2. **No unnecessary labels or subheads.** If the content already explains itself (dates on rows, tabs in nav), do not repeat a section title.
3. **As few type styles as possible.** Default stack:
   - Body: 16px / regular (or medium for titles)
   - Meta: 13px / muted
   Do not invent extra sizes, letter-spacing tricks, or decorative weights.

## Layout & chrome

4. **Be minimalistic.** Prefer whitespace and hierarchy over borders, chips, and helper text.
5. **Only fully rounded corners** (`border-radius: 9999px`). No squircles (8–16px soft rectangles).
6. **No dot separators** (`·`, bullets between meta). Separate with space only.

## When adding UI

Ask: can this work with less text, fewer styles, and no new radius token? If yes, ship that.

See also [AGENTS.md](AGENTS.md) for Next.js notes in this repo.
