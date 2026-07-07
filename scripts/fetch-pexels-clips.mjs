// Downloads free stock video clips from Pexels into public/broll/, so
// Remotion renders from local files instead of hitting the network mid-render.
//
// Usage:
//   node --env-file=.env scripts/fetch-pexels-clips.mjs "two friends laughing" 3
//   PEXELS_API_KEY=xxx node scripts/fetch-pexels-clips.mjs "two friends laughing" 3
//
// Requires Node 20.6+ for --env-file (Node 22 here) and the global fetch API.
//
// For downloading everything ViralPromo.tsx needs in one go, see
// fetch-broll-manifest.mjs instead.

import fs from "node:fs";
import path from "node:path";
import { slugify, searchVideos, pickBestFile, downloadFile } from "./pexels-client.mjs";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const OUTPUT_DIR = path.resolve("public/broll");

async function main() {
  if (!PEXELS_API_KEY) {
    console.error(
      "Missing PEXELS_API_KEY. Pass it as an env var, e.g.\n" +
        '  node --env-file=.env scripts/fetch-pexels-clips.mjs "search term"'
    );
    process.exit(1);
  }

  const query = process.argv[2];
  const count = Number(process.argv[3] ?? 1);

  if (!query) {
    console.error(
      'Usage: node scripts/fetch-pexels-clips.mjs "search term" [count]'
    );
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { videos } = await searchVideos(PEXELS_API_KEY, query, count);
  if (!videos?.length) {
    console.error(`No Pexels results for "${query}"`);
    process.exit(1);
  }

  const slug = slugify(query);

  for (const [i, video] of videos.slice(0, count).entries()) {
    const file = pickBestFile(video);
    if (!file) {
      console.warn(`No suitable portrait mp4 for video ${video.id}, skipping`);
      continue;
    }

    const destName = count === 1 ? `${slug}.mp4` : `${slug}-${i + 1}.mp4`;
    const destPath = path.join(OUTPUT_DIR, destName);

    console.log(`Downloading "${query}" (${i + 1}/${count}) -> public/broll/${destName}`);
    await downloadFile(file.link, destPath);
  }

  console.log("Done. Credit Pexels + the video author per their license: https://www.pexels.com/license/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
