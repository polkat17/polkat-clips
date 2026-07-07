import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { theme, FPS } from "../theme";
import { EndCard } from "./shared/EndCard";

// Phase durations in seconds. The whole clip is Hook + Problem + Reveal + CTA.
const HOOK_DURATION = 2; // 0s -> 2s
const PROBLEM_DURATION = 4; // 2s -> 6s
const REVEAL_DURATION = 12; // 6s -> 18s
const CTA_DURATION = 7; // 18s -> 25s

export const DEMO_CLIP_DURATION_IN_FRAMES =
  (HOOK_DURATION + PROBLEM_DURATION + REVEAL_DURATION + CTA_DURATION) * FPS;

// A type alias (not an interface) so it structurally satisfies the
// `Record<string, unknown>` constraint Remotion's <Composition> generics need.
export type DemoClipProps = {
  hookText: string;
  problemText: string;
  ctaText: string;
  screenRecordingFile: string;
  personName: string;
  personDetail: string;
};

// The top-level composition. It just lays out four <Sequence>s back to back
// in time — each one is a "scene" that only renders during its own window
// and sees its own frame count starting from 0.
export const DemoClip: React.FC<DemoClipProps> = ({
  hookText,
  problemText,
  ctaText,
  screenRecordingFile,
  personName,
  personDetail,
}) => {
  const { fps } = useVideoConfig();

  const hookFrames = HOOK_DURATION * fps;
  const problemFrames = PROBLEM_DURATION * fps;
  const revealFrames = REVEAL_DURATION * fps;
  const ctaFrames = CTA_DURATION * fps;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.darkBackground }}>
      {/* TODO: add background music once public/music/ tracks exist, e.g.
          <Audio src={staticFile("music/upbeat.mp3")} volume={0.6} /> */}

      <Sequence durationInFrames={hookFrames}>
        <HookPhase text={hookText} />
      </Sequence>

      <Sequence from={hookFrames} durationInFrames={problemFrames}>
        <ProblemPhase text={problemText} />
      </Sequence>

      <Sequence
        from={hookFrames + problemFrames}
        durationInFrames={revealFrames}
      >
        <RevealPhase
          screenRecordingFile={screenRecordingFile}
          personName={personName}
          personDetail={personDetail}
        />
      </Sequence>

      <Sequence
        from={hookFrames + problemFrames + revealFrames}
        durationInFrames={ctaFrames}
      >
        <EndCard tagline={ctaText} durationInFrames={ctaFrames} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ─── Phase 1: Hook (0-2s) ───────────────────────────────────────────────
// Big bold text that fades in and slides up from below. `frame` here is
// relative to this Sequence, so it always starts counting at 0.
const HookPhase: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  // interpolate(frame, [inputStart, inputEnd], [outputStart, outputEnd])
  // maps the current frame onto a value range. "clamp" keeps the value
  // pinned at the end value once frame goes past inputEnd.
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 15], [40, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.darkBackground,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily: theme.fontFamily,
          fontSize: theme.hookFontSize,
          fontWeight: "bold",
          color: theme.textColor,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// ─── Phase 2: Problem (2-6s) ────────────────────────────────────────────
// Smaller text with a decaying side-to-side "wobble" to sell the awkward,
// off-balance feeling of forgetting a detail. The shake amplitude decays
// over the first ~1.3s (40 frames) so it settles instead of shaking forever.
const ProblemPhase: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  const shakeDecay = interpolate(frame, [0, 40], [1, 0], {
    extrapolateRight: "clamp",
  });
  const wobbleX = Math.sin(frame * 0.9) * 6 * shakeDecay;
  const wobbleRotate = Math.sin(frame * 0.6) * 1.5 * shakeDecay;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.darkBackground,
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateX(${wobbleX}px) rotate(${wobbleRotate}deg)`,
          fontFamily: theme.fontFamily,
          fontSize: theme.problemFontSize,
          color: theme.textColor,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// ─── Phase 3: Reveal (6-18s) ────────────────────────────────────────────
// Plays the app screen recording full-bleed, with the person's name/detail
// as a small caption pinned near the bottom (safe from TikTok/Shorts UI).
const RevealPhase: React.FC<{
  screenRecordingFile: string;
  personName: string;
  personDetail: string;
}> = ({ screenRecordingFile, personName, personDetail }) => {
  const frame = useCurrentFrame();

  // Caption fades in a beat after the recording starts, not instantly.
  const captionOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile(`screen-recordings/${screenRecordingFile}`)}
        // Don't hard-crash the render if the recording hasn't been added yet.
        onError={(err) =>
          console.warn(`screen-recordings/${screenRecordingFile} failed to play:`, err)
        }
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 140,
        }}
      >
        <div
          style={{
            opacity: captionOpacity,
            backgroundColor: theme.captionBackground,
            borderRadius: 16,
            padding: "16px 28px",
            fontFamily: theme.fontFamily,
            color: theme.textColor,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: theme.captionFontSize, fontWeight: "bold" }}>
            {personName}
          </div>
          <div style={{ fontSize: theme.captionFontSize * 0.7 }}>
            {personDetail}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
