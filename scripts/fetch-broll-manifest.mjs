// Downloads every stock clip src/compositions/ViralPromo.tsx needs, based on
// the pexelsQuery/broll pairs in src/data/viralPromo.json. Run this before
// `npx remotion render ViralPromo` — the composition will hang/fail on any
// beat whose broll file doesn't exist yet.
//
// Usage:
//   node --env-file=.env scripts/fetch-broll-manifest.mjs
//   PEXELS_API_KEY=xxx node scripts/fetch-broll-manifest.mjs
//
// Pass --force to re-download clips that already exist in public/broll/.

import fs from "node:fs";
import path from "node:path";
import { searchVideos, pickBestFile, downloadFile } from "./pexels-client.mjs";
import viralPromoData from "../src/data/viralPromo.json" with { type: "json" };

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const OUTPUT_DIR = path.resolve("public/broll");
const FORCE = process.argv.includes("--force");

async function fetchBeat({ pexelsQuery, broll }) {
  const destPath = path.join(OUTPUT_DIR, broll);

  if (!FORCE && fs.existsSync(destPath)) {
    console.log(`Skipping ${broll} (already exists, pass --force to redo)`);
    return;
  }

  const { videos } = await searchVideos(PEXELS_API_KEY, pexelsQuery, 1);
  const video = videos?.[0];
  if (!video) {
    console.warn(`No Pexels results for "${pexelsQuery}" (${broll}), skipping`);
    return;
  }

  const file = pickBestFile(video);
  if (!file) {
    console.warn(`No suitable portrait mp4 for "${pexelsQuery}" (${broll}), skipping`);
    return;
  }

  console.log(`Downloading "${pexelsQuery}" -> public/broll/${broll}`);
  await downloadFile(file.link, destPath);
}

async function main() {
  if (!PEXELS_API_KEY) {
    console.error(
      "Missing PEXELS_API_KEY. Pass it as an env var, e.g.\n" +
        "  node --env-file=.env scripts/fetch-broll-manifest.mjs"
    );
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const beats = [viralPromoData.hook, ...viralPromoData.escalationBeats];

  for (const beat of beats) {
    await fetchBeat(beat);
  }

  console.log("Done. Credit Pexels + each video's author per their license: https://www.pexels.com/license/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
