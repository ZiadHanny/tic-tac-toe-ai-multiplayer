# Accessibility (WCAG 2.1 AA)

This document lists the accessibility decisions in the client and why each
one was made, so they don't get quietly regressed later.

## Keyboard operability (2.1.1, 2.1.2)

The board (`client/src/components/Board.tsx` + `Cell.tsx`) is nine real
`<button>` elements, not `<div onClick>`s. That alone gives Tab-order
navigation and Enter/Space activation for free, with no ARIA needed to
fake it.

Arrow keys are layered on top as a spatial shortcut (`ArrowUp/Down/Left/Right`
move focus by row/column, wrapping at the edges), matching the brief's
"arrows *or* Tab" requirement — both work, independently of each other.

**Cells are never made `disabled`.** An occupied cell, or a cell you can't
play right now (not your turn, game over), is marked `aria-disabled="true"`
for assistive tech and styled as non-interactive, but keeps native
`disabled` off. The reason: a `disabled` button is removed from the tab
order and can't receive focus at all, which would mean arrow-key
navigation "loses" the ability to move through/past played cells, and Tab
would skip over them — breaking exactly the requirement this is meant to
satisfy. The actual move legality is enforced independently, in
`useLocalGame`'s reducer and again in the server's `RoomStore.makeMove`
(see ARCHITECTURE.md) — so `aria-disabled` is a UX hint, not the real
guard, and there's no risk of an "inert-looking" cell actually being
playable by mistake.

## Labels and state (1.3.1, 4.1.2)

Every cell's `aria-label` states its position and content in one phrase:
`"Row 2, column 3, contains X"` / `"Row 1, column 1, empty"`. A screen
reader user gets full spatial context without having to cross-reference a
visual grid.

## Live announcements (4.1.3)

Turn changes and game outcomes are announced via a single `role="status"
aria-live` element (`StatusAnnouncer.tsx`) that is *also* the visible status
line — not a visually-hidden duplicate next to a separate visible one.
Keeping it to one element means the announced text can never drift from
what's on screen.

- Ordinary turn changes use `aria-live="polite"` — announced without
  interrupting whatever the screen reader is already saying.
- A win, a draw, or an opponent leaving uses `aria-live="assertive"` —
  these are the moments a player must not miss, so they interrupt.

## Color is never the only signal (1.4.1)

X and O are rendered as the literal characters "X" and "O" — different
*shapes*, not just different colors. Colors are added on top for scannability
(see contrast table below), but removing color entirely (e.g. print,
grayscale, a color-vision deficiency) leaves the board fully legible. The
winning line is likewise indicated by a background-color change on the
three cells *and* the cells already show the winner's mark — not by color
alone.

## Contrast — 4.5:1 minimum (1.4.3)

Every text/background and mark/background pairing was checked against the
WCAG relative-luminance formula (not just eyeballed — a browser's own
contrast tooling was not used here since this was written and verified
independently). All figures below are ratios against the same-theme
background/surface color they're actually rendered on.

| Pair | Light theme | Dark theme |
| --- | --- | --- |
| Body text vs. page background | ~17.1 : 1 | ~16.3 : 1 |
| Accent (buttons, links, focus ring) vs. surface | 6.29 : 1 | 5.98 : 1 |
| X mark vs. surface | 6.70 : 1 | 5.75 : 1 |
| O mark vs. surface | 6.47 : 1 | 5.29 : 1 |

Every pair clears 4.5:1 with margin, including the smallest ones (dark-theme
O mark at 5.29:1) — so there's headroom before this needs re-checking if a
color token ever changes.

## Focus indicator (2.4.7)

A global `:focus-visible` rule gives every interactive element a 3px
outline in the accent color with a 2px offset — applied once in
`globals.css`, not per-component, so nothing can accidentally ship a
focusable control with no visible focus state. Plain `:focus` is
suppressed in favor of `:focus-visible` so the ring appears for keyboard
users without also flashing on every mouse click.

## Zoom to 200% (1.4.4, 1.4.10)

No viewport meta tag restricts scaling (Next.js's default viewport already
permits pinch/browser zoom — this project doesn't override it), and the
layout uses relative sizing and wrapping flex/grid rather than fixed pixel
widths that could clip content at high zoom.

## Reduced motion (2.3.3)

A global `prefers-reduced-motion: reduce` media query collapses all
animation and transition durations to effectively zero. Because the winning
line is communicated by a persistent background-color change (see above)
rather than by an animation, a reduced-motion user still gets the same
information — they just don't get the transition into that state.

## Skip link

A "Skip to content" link is the first focusable element on every page,
visually hidden until it receives focus, so a keyboard user doesn't have to
tab through the header on every single navigation.
