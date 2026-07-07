// Downloads the single background clip src/compositions/ListStory.tsx needs,
// based on src/data/listStory.json's background.pexelsQuery/broll. Run this
// before `npx remotion render ListStory` — the composition will hang/fail
// if that file doesn't exist yet.
//
// Usage:
//   node --env-file=.env scripts/fetch-list-story-broll.mjs
//   PEXELS_API_KEY=xxx node scripts/fetch-list-story-broll.mjs
//
// Pass --force to re-download even if the file already exists.

import fs from "node:fs";
import path from "node:path";
import { searchVideos, pickBestFile, downloadFile } from "./pexels-client.mjs";
import listStoryData from "../src/data/listStory.json" with { type: "json" };

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const OUTPUT_DIR = path.resolve("public/broll");
const FORCE = process.argv.includes("--force");

async function main() {
  if (!PEXELS_API_KEY) {
    console.error(
      "Missing PEXELS_API_KEY. Pass it as an env var, e.g.\n" +
        "  node --env-file=.env scripts/fetch-list-story-broll.mjs"
    );
    process.exit(1);
  }

  const { pexelsQuery, broll } = listStoryData.background;
  const destPath = path.join(OUTPUT_DIR, broll);

  if (!FORCE && fs.existsSync(destPath)) {
    console.log(`Skipping ${broll} (already exists, pass --force to redo)`);
    return;
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { videos } = await searchVideos(PEXELS_API_KEY, pexelsQuery, 1);
  const video = videos?.[0];
  if (!video) {
    console.error(`No Pexels results for "${pexelsQuery}"`);
    process.exit(1);
  }

  const file = pickBestFile(video);
  if (!file) {
    console.error(`No suitable portrait mp4 for "${pexelsQuery}"`);
    process.exit(1);
  }

  console.log(`Downloading "${pexelsQuery}" -> public/broll/${broll}`);
  await downloadFile(file.link, destPath);
  console.log("Done. Credit Pexels + the video author per their license: https://www.pexels.com/license/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
