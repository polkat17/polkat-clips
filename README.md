# polkat-clips

Remotion project for generating Recalla ("Never forget human details.") promo
videos — 9:16, for TikTok/YouTube Shorts/Reels.

## Setup

```bash
npm install
npm start   # opens the Remotion Studio to preview compositions
```

## Compositions

### ChatStory — the current format

A full pivot from footage entirely: the whole video happens inside an
iMessage-style conversation — no actors, no stock clips, no AI generation.
Just text bubbles, timed like a real exchange that gets progressively more
awkward, then a hard cut to the Recalla reveal. Cheapest format to produce
(nothing to fetch, no per-clip cost) and the best fit for what Remotion is
actually good at: data-driven UI animation.

Every episode follows the same 7-beat structure (documented in full at the
top of `ChatStory.tsx`) so the format becomes recognizable across episodes:
normal conversation → one innocent mistake → a curt correction → a failed
recovery attempt → one specific, much-worse detail → a dry punchline → a
short (~1.5-2s) reveal. One composition per concept, in
`src/data/chatStories/*.json` — edit the conversation there, not in the
`.tsx` file.

```bash
npx remotion render ChatStory-ex-partner out/ex-partner.mp4
```

Known limitation, not solved here: trending audio is a TikTok-native concept
applied at upload time, not something to bake into the render — see the TODO
in `ChatStory.tsx`.

### BaxterClip — single AI-performer clip (HeyGen)

One performer, one location, one joke on camera, then a hard cut to the tag
line — an alternative to both the stock montage and the text-only format.
The source is a HeyGen free-tier screen recording; `BaxterClip.tsx` crops out
the incidental browser/player chrome but **cannot and does not** remove the
tiled HeyGen watermark baked into the actual video frames — see the file
header. Previews the format only; not postable without a clean paid export.

### ListStory — text-driven single-shot format (superseded by ChatStory)

A 20s video built around the lesson from ViralPromo's real-world feedback:
multi-scene stock montages read as "AI-generated commercial," not TikTok
content. `ListStory.tsx` fixes that structurally, not just cosmetically:

- **One continuous background shot** for the entire joke — no scene cuts
  during the hook/list, so there's no "different actor every 2 seconds" tell.
- **Bold instant-pop captions** (self-hosted Liberation Sans Bold, hard
  stroke, ~3-frame pop-in) instead of slow cinematic serif fades.
- **Text-driven escalating list joke** ("Things I've said to avoid admitting
  I forgot someone's name: 1... 2... 3...") instead of disconnected vignettes
  — the escalation lives in the captions, not in acted-out scenes, so it
  doesn't need custom footage per beat.

Only needs **one** Pexels clip (vs. ViralPromo's seven). Copy/query lives in
`src/data/listStory.json`.

### ViralPromo — fast-cut stock montage (superseded by ListStory)

A single 35s fast-cut video: a relatable stock-footage montage of people
forgetting small details about each other, then a short reveal of the real
app. All copy and stock-footage search queries live in
`src/data/viralPromo.json`.

### DemoClip — per-person variant demo

The earlier 25s format (Hook → Problem → Reveal → CTA) for a single
person's story, swapped via `src/data/scripts.json` (one composition per
entry, e.g. `DemoClip-sarah-promotion`). Needs a real screen recording per
variant in `public/screen-recordings/`.

## Structure

- `src/theme.ts` — shared brand colors/fonts/FPS/dimensions for every
  composition.
- `src/compositions/shared/NativeTagCard.tsx` — the current reveal treatment
  (logo → "Recalla" wordmark → tagline, all bold instant-pop), used by
  `ChatStory` and `BaxterClip`.
- `src/compositions/shared/EndCard.tsx` — the older, slower fade-to-brand-
  color closing card, still used by `DemoClip`/`ViralPromo`.
- `src/Root.tsx` — registers every composition.
- `assets/LiberationSans-Bold.ttf` / `-Regular.ttf` — source font files
  (SIL OFL licensed), embedded as base64 data URIs (`src/captionFontData.ts`
  / `src/messageFontData.ts`, loaded via `src/loadCaptionFont.tsx` /
  `src/loadMessageFont.tsx`) rather than fetched via `staticFile()` — a
  networked/delayRender-based font load intermittently hung partway through
  long renders (Remotion recycles browser pages during rendering, which
  re-runs module-scope code; see the comment in `loadCaptionFont.tsx`). A
  plain CSS `@font-face` with an embedded data URI has nothing to hang on.
- `public/screen-recordings/` — per-variant app recordings for `DemoClip`.
- `public/creator-clips/` — the raw HeyGen clip for `BaxterClip`.
- `public/broll/` — stock clips for `ViralPromo`/`ListStory`, fetched via the
  scripts below. Gitignored (regenerate with `npm run fetch:broll` /
  `npm run fetch:list-story-broll`), not committed.
- `public/reference/` — the existing finished promo videos; `ViralPromo`'s
  Solution phase plays `reference/recalla-promo-vertical-final.mp4` directly.
- `public/music/` — background tracks (not wired in yet, see TODO in each
  composition).
- `public/logo.png` — Recalla app icon, used by `NativeTagCard`/`EndCard`.

## Rendering

```bash
npx remotion render ChatStory-ex-partner out/ex-partner.mp4
npx remotion render BaxterClip out/baxter-clip.mp4
npx remotion render ListStory out/list-story.mp4
npx remotion render ViralPromo out/viral-promo.mp4
npx remotion render DemoClip-sarah-promotion out/sarah-promotion.mp4
npx remotion render                # renders every registered composition
```

Long renders should use `--concurrency=1` — see the font-loading note above;
this sidesteps a class of intermittent page-recycling issues entirely.

## Pexels stock footage

**Get a key:** sign up free at https://www.pexels.com/api/ (instant, no
billing, 200 req/hour / 20k/month).

**`npm run fetch:broll`** — downloads everything `ViralPromo.tsx` needs,
based on the `pexelsQuery`/`broll` pairs in `src/data/viralPromo.json`
(skips clips that already exist; pass `-- --force` to redo all of them).
Run this before rendering `ViralPromo` locally.

**`npm run fetch:list-story-broll`** — downloads the single clip
`ListStory.tsx` needs, based on `src/data/listStory.json`'s `background`
field.

**`npm run fetch:pexels -- "search term" 3`** — ad-hoc single query, for
grabbing a one-off clip outside either manifest.

All read `PEXELS_API_KEY` from the environment. Locally:
```bash
cp .env.example .env      # then paste your key into .env — it's gitignored
npm run fetch:list-story-broll
```

**In CI:** `.github/workflows/render-list-story.yml` and
`render-viral-promo.yml` each fetch their broll, render, and upload the mp4
as a build artifact, on manual trigger from the Actions tab, using a
`PEXELS_API_KEY` repository secret. To add the secret (GitHub only allows
this over the authenticated web UI, not the API):
1. `github.com/polkat17/polkat-clips` → **Settings** → **Secrets and
   variables** → **Actions** → **New repository secret**.
2. Name: `PEXELS_API_KEY`, value: your key. Save.
