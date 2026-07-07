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

## Pexels stock footage (`public/broll/`)

`scripts/fetch-pexels-clips.mjs` downloads free stock video clips from Pexels
into `public/broll/` so renders read local files instead of hitting the
network mid-render. It isn't wired into `DemoClip.tsx` yet — that's a
follow-up once we decide where footage fits creatively.

**Get a key:** sign up free at https://www.pexels.com/api/ (instant, no
billing, 200 req/hour / 20k/month).

**Run it locally:**
```bash
cp .env.example .env      # then paste your key into .env — it's gitignored
npm run fetch:pexels -- "two friends laughing" 3
```

**Run it in CI (GitHub Actions):** the script just reads `PEXELS_API_KEY`
from the environment, so any workflow can call it directly:
```bash
node scripts/fetch-pexels-clips.mjs "two friends laughing" 3
```
To make the key available there, add it as a repository secret (I don't have
a tool that can do this for you — GitHub doesn't expose secret creation over
the API for security reasons, only over the authenticated web UI):
1. Go to `github.com/polkat17/polkat-clips` → **Settings** → **Secrets and
   variables** → **Actions**.
2. Click **New repository secret**.
3. Name: `PEXELS_API_KEY`, value: your key. Save.
4. Reference it in a workflow step as `${{ secrets.PEXELS_API_KEY }}`, e.g.
   `env: { PEXELS_API_KEY: ${{ secrets.PEXELS_API_KEY }} }`.

No workflow file exists yet — ask and I'll add one once we know the trigger
(manual dispatch, pre-render step, etc.) and whether downloaded clips should
be committed back or just used transiently during a render job.
