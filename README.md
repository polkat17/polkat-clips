# polkat-clips

Remotion project for generating Recalla ("Never forget human details.") promo
videos — 9:16, for TikTok/YouTube Shorts/Reels.

## Setup

```bash
npm install
npm start   # opens the Remotion Studio to preview compositions
```

## Compositions

### ViralPromo — the main one

A single 35s fast-cut video: a relatable stock-footage montage of people
forgetting small details about each other, then a short reveal of the real
app. Structure (`src/compositions/ViralPromo.tsx`):

1. **Hook** (3s) — one awkward/relatable stock clip + caption.
2. **Escalation** (15s) — six quick beats (dog/cat mixup, forgotten name,
   ex-partner, kid's name, job, birthday), each its own stock clip + caption.
3. **Reveal** (6s) — "What if you never forgot the little things about
   people again?" on the brand background.
4. **Solution** (8s) — the real app footage (`public/reference/`), with
   feature bullets cycling at the bottom.
5. **Ending** (3s) — logo + "Because people remember when you remember."

All copy and stock-footage search queries live in `src/data/viralPromo.json`
— edit captions/queries there rather than in the `.tsx` file.

### DemoClip — per-person variant demo

The earlier 25s format (Hook → Problem → Reveal → CTA) for a single
person's story, swapped via `src/data/scripts.json` (one composition per
entry, e.g. `DemoClip-sarah-promotion`). Needs a real screen recording per
variant in `public/screen-recordings/`.

## Structure

- `src/theme.ts` — shared brand colors/fonts/FPS/dimensions for every
  composition.
- `src/compositions/shared/EndCard.tsx` — the logo + tagline + fade-out
  closing card, reused by both compositions.
- `src/Root.tsx` — registers every composition.
- `public/screen-recordings/` — per-variant app recordings for `DemoClip`.
- `public/broll/` — stock clips for `ViralPromo`, fetched via the scripts
  below. Gitignored (regenerate with `npm run fetch:broll`), not committed.
- `public/reference/` — the existing finished promo videos; `ViralPromo`'s
  Solution phase plays `reference/recalla-promo-vertical-final.mp4` directly.
- `public/music/` — background tracks (not wired in yet, see TODO in each
  composition).
- `public/logo.png` — Recalla app icon, used by `EndCard`.

## Rendering

```bash
npx remotion render ViralPromo out/viral-promo.mp4
npx remotion render DemoClip-sarah-promotion out/sarah-promotion.mp4
npx remotion render                # renders every registered composition
```

## Pexels stock footage

**Get a key:** sign up free at https://www.pexels.com/api/ (instant, no
billing, 200 req/hour / 20k/month).

**`npm run fetch:broll`** — downloads everything `ViralPromo.tsx` needs,
based on the `pexelsQuery`/`broll` pairs in `src/data/viralPromo.json`
(skips clips that already exist; pass `-- --force` to redo all of them).
Run this before rendering `ViralPromo` locally.

**`npm run fetch:pexels -- "search term" 3`** — ad-hoc single query, for
grabbing a one-off clip outside the manifest.

Both read `PEXELS_API_KEY` from the environment. Locally:
```bash
cp .env.example .env      # then paste your key into .env — it's gitignored
npm run fetch:broll
```

**In CI:** `.github/workflows/render-viral-promo.yml` runs both steps
(fetch broll, then `remotion render`) on manual trigger from the Actions tab,
using a `PEXELS_API_KEY` repository secret, and uploads the rendered mp4 as
a build artifact. To add the secret (GitHub only allows this over the
authenticated web UI, not the API):
1. `github.com/polkat17/polkat-clips` → **Settings** → **Secrets and
   variables** → **Actions** → **New repository secret**.
2. Name: `PEXELS_API_KEY`, value: your key. Save.
