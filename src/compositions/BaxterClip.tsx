import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { FPS } from "../theme";
import { CAPTION_FONT_FAMILY, CaptionFontStyle } from "../loadCaptionFont";
import baxterClipData from "../data/baxterClip.json";

// A single AI-generated (HeyGen) "creator" clip instead of stock footage or
// an acted-out multi-scene montage: one performer, one location, one joke,
// then a hard cut to the tag line. Native-format captions (see ListStory)
// carry the punchline, not an ornate branded end card.
//
// NOTE: the source clip is a HeyGen free-tier screen recording. The crop
// below removes the *browser/player chrome* (scrubber, controls, dead
// letterbox space) that was captured incidentally in the recording — that's
// just tidying up the screen capture. It does NOT and cannot remove the
// tiled "HeyGen" watermark baked into the actual generated video frames;
// that stays fully visible. This clip previews the format only and isn't
// postable until there's a clean (paid-tier) export.

const FREEZE_HOLD = 40; // extra frames holding the last frame after the line
const TAG_DURATION = 3; // seconds the tag line holds on screen

const trimFrames = baxterClipData.trimEndFrame - baxterClipData.trimStartFrame;
const clipSequenceFrames = trimFrames + FREEZE_HOLD;
const tagFrames = TAG_DURATION * FPS;

export const BAXTER_CLIP_DURATION_IN_FRAMES = clipSequenceFrames + tagFrames;

// A type alias (not an interface) so it structurally satisfies the
// `Record<string, unknown>` constraint Remotion's <Composition> generics need.
export type BaxterClipProps = {
  rawClip: string;
  trimStartFrame: number;
  trimEndFrame: number;
  tagLine: string;
};

export const BaxterClip: React.FC<BaxterClipProps> = ({
  rawClip,
  trimStartFrame,
  trimEndFrame,
  tagLine,
}) => {
  const trimmedFrames = trimEndFrame - trimStartFrame;
  const clipFrames = trimmedFrames + FREEZE_HOLD;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CaptionFontStyle />

      <Sequence durationInFrames={clipFrames}>
        <ClipPhase
          rawClip={rawClip}
          trimStartFrame={trimStartFrame}
          trimEndFrame={trimEndFrame}
        />
      </Sequence>

      <Sequence from={clipFrames} durationInFrames={tagFrames}>
        <TagPhase text={tagLine} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Cropped to chest-up framing (removes the source recording's browser/player
// chrome — see file header). Sequence duration is longer than the trimmed
// video range, so it naturally holds on the last frame for the tail end —
// that's the "freeze frame" beat before the cut to the tag line.
const ClipPhase: React.FC<{
  rawClip: string;
  trimStartFrame: number;
  trimEndFrame: number;
}> = ({ rawClip, trimStartFrame, trimEndFrame }) => (
  <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
    <AbsoluteFill
      style={{
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 854,
        height: 1490,
        overflow: "hidden",
      }}
    >
      <OffthreadVideo
        src={staticFile(rawClip)}
        startFrom={trimStartFrame}
        endAt={trimEndFrame}
        onError={(err) => console.warn(`${rawClip} failed to play:`, err)}
        style={{
          width: 854,
          height: 1920,
          objectFit: "cover",
          transform: "translateY(-260px)",
        }}
      />
    </AbsoluteFill>
  </AbsoluteFill>
);

const TagPhase: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const logoScale = interpolate(frame, [0, 8], [1.2, 1], {
    extrapolateRight: "clamp",
  });
  const logoOpacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 140,
          height: 140,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 32,
        }}
      />
      <div
        style={{
          opacity: textOpacity,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 700,
          fontSize: 56,
          color: "#FFFFFF",
          textAlign: "center",
          lineHeight: 1.2,
          WebkitTextStroke: "2px black",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
