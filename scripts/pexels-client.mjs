// Shared helpers for talking to the Pexels Videos API. Used by both
// fetch-pexels-clips.mjs (ad-hoc single query) and fetch-broll-manifest.mjs
// (batch download for src/data/viralPromo.json).

import fs from "node:fs";

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function searchVideos(apiKey, query, perPage) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(
    query
  )}&orientation=portrait&per_page=${perPage}`;

  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    throw new Error(`Pexels API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Pexels returns the same clip encoded at several resolutions. Prefer a
// portrait (9:16-ish) file no wider than 1080px — that's what these
// compositions render at, so there's no point downloading 4K b-roll.
export function pickBestFile(video) {
  const portraitMp4s = video.video_files
    .filter((f) => f.file_type === "video/mp4" && f.height >= f.width)
    .sort((a, b) => b.width - a.width);

  return (
    portraitMp4s.find((f) => f.width <= 1080) ??
    portraitMp4s[portraitMp4s.length - 1]
  );
}

export async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}
