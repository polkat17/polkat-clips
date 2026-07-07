// Downloads free stock video clips from Pexels into public/broll/, so
// Remotion renders from local files instead of hitting the network mid-render.
//
// Usage:
//   node --env-file=.env scripts/fetch-pexels-clips.mjs "two friends laughing" 3
//   PEXELS_API_KEY=xxx node scripts/fetch-pexels-clips.mjs "two friends laughing" 3
//
// Requires Node 20.6+ for --env-file (Node 22 here) and the global fetch API.

import fs from "node:fs";
import path from "node:path";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const OUTPUT_DIR = path.resolve("public/broll");

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function searchVideos(query, perPage) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(
    query
  )}&orientation=portrait&per_page=${perPage}`;

  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) {
    throw new Error(`Pexels API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Pexels returns the same clip encoded at several resolutions. Prefer a
// portrait (9:16-ish) file no wider than 1080px, since that's what DemoClip
// renders at — no point downloading 4K b-roll for a 1080-wide composition.
function pickBestFile(video) {
  const portraitMp4s = video.video_files
    .filter((f) => f.file_type === "video/mp4" && f.height >= f.width)
    .sort((a, b) => b.width - a.width);

  return (
    portraitMp4s.find((f) => f.width <= 1080) ??
    portraitMp4s[portraitMp4s.length - 1]
  );
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

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

  const { videos } = await searchVideos(query, count);
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
