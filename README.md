# polkat-clips

Remotion project for generating Recalla ("Never forget human details.") promo
video variants — 9:16, 25s clips for TikTok/YouTube Shorts.

## Setup

```bash
npm install
npm start   # opens the Remotion Studio to preview compositions
```

## Structure

- `src/data/scripts.json` — one entry per video variant (hook/problem/CTA copy,
  the screen recording to use, and the person's name/detail for the caption).
- `src/compositions/DemoClip.tsx` — the 4-phase composition (Hook → Problem →
  Reveal → CTA). Branding (fonts/colors) lives in the `theme` object at the
  top of the file.
- `src/Root.tsx` — registers a `DemoClip` composition per `scripts.json` entry.
- `public/screen-recordings/` — drop each variant's app screen recording here,
  named to match `screenRecordingFile` in `scripts.json`.
- `public/music/` — background tracks (not wired in yet, see TODO in
  `DemoClip.tsx`).
- `public/reference/` — the existing finished promo videos, kept for visual/
  pacing reference. Not used by any composition.
- `public/logo.png` — Recalla app icon, used in the CTA phase.

## Rendering

```bash
npx remotion render DemoClip-sarah-promotion out/sarah-promotion.mp4
npx remotion render                # renders every registered composition
```
