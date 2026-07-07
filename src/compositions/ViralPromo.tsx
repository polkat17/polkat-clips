import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { theme, FPS } from "../theme";
import { EndCard } from "./shared/EndCard";
import viralPromoData from "../data/viralPromo.json";

// Phase durations in seconds. Total is Hook + Escalation + Reveal + Solution
// + Ending — see viralPromo.json for the beats/copy that fill each phase.
const HOOK_DURATION = 3; // 0s -> 3s: one relatable/awkward stock moment
const ESCALATION_BEAT_DURATION = 2.5; // each "forgot X" beat in the montage
const REVEAL_DURATION = 6; // the "what if you never forgot..." turn
const SOLUTION_DURATION = 8; // the actual app, shown briefly
const ENDING_DURATION = 3; // logo + closing line

const NUM_ESCALATION_BEATS = viralPromoData.escalationBeats.length;

export const VIRAL_PROMO_DURATION_IN_FRAMES =
  (HOOK_DURATION +
    ESCALATION_BEAT_DURATION * NUM_ESCALATION_BEATS +
    REVEAL_DURATION +
    SOLUTION_DURATION +
    ENDING_DURATION) *
  FPS;

export type ViralPromoBeat = {
  pexelsQuery: string;
  broll: string;
  captionText: string;
};

// A type alias (not an interface) so it structurally satisfies the
// `Record<string, unknown>` constraint Remotion's <Composition> generics need.
export type ViralPromoProps = {
  hook: ViralPromoBeat;
  escalationBeats: ViralPromoBeat[];
  revealText: string;
  solution: {
    screenRecording: string;
    bullets: string[];
  };
  endingTagline: string;
};

// This is a single fixed video (not swapped per-person like DemoClip): a
// fast-cut stock-footage montage of relatable "forgot a detail" moments,
// then a short reveal of the real app. Structure:
//   Hook -> Escalation (one Sequence per beat) -> Reveal -> Solution -> Ending
export const ViralPromo: React.FC<ViralPromoProps> = ({
  hook,
  escalationBeats,
  revealText,
  solution,
  endingTagline,
}) => {
  const hookFrames = HOOK_DURATION * FPS;
  const beatFrames = ESCALATION_BEAT_DURATION * FPS;
  const escalationFrames = beatFrames * escalationBeats.length;
  const revealFrames = REVEAL_DURATION * FPS;
  const solutionFrames = SOLUTION_DURATION * FPS;
  const endingFrames = ENDING_DURATION * FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.darkBackground }}>
      {/* TODO: add background music once public/music/ tracks exist, e.g.
          <Audio src={staticFile("music/upbeat.mp3")} volume={0.6} /> */}

      <Sequence durationInFrames={hookFrames}>
        <StockClipWithCaption
          broll={hook.broll}
          captionText={hook.captionText}
          durationInFrames={hookFrames}
          captionFontSize={theme.problemFontSize}
        />
      </Sequence>

      {/* One Sequence per escalation beat, placed back to back after the hook. */}
      {escalationBeats.map((beat, i) => (
        <Sequence
          key={beat.broll}
          from={hookFrames + i * beatFrames}
          durationInFrames={beatFrames}
        >
          <StockClipWithCaption
            broll={beat.broll}
            captionText={beat.captionText}
            durationInFrames={beatFrames}
            captionFontSize={theme.captionFontSize}
          />
        </Sequence>
      ))}

      <Sequence
        from={hookFrames + escalationFrames}
        durationInFrames={revealFrames}
      >
        <RevealCard text={revealText} />
      </Sequence>

      <Sequence
        from={hookFrames + escalationFrames + revealFrames}
        durationInFrames={solutionFrames}
      >
        <SolutionPhase
          screenRecording={solution.screenRecording}
          bullets={solution.bullets}
          durationInFrames={solutionFrames}
        />
      </Sequence>

      <Sequence
        from={hookFrames + escalationFrames + revealFrames + solutionFrames}
        durationInFrames={endingFrames}
      >
        <EndCard tagline={endingTagline} durationInFrames={endingFrames} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ─── Hook & Escalation beats ────────────────────────────────────────────
// Shared by the hook and every escalation beat: full-bleed stock clip with a
// slow continuous zoom (classic "Ken Burns") for energy, plus a caption pill
// that slides/fades in a few frames after the cut so quick cuts still read.
const StockClipWithCaption: React.FC<{
  broll: string;
  captionText: string;
  durationInFrames: number;
  captionFontSize: number;
}> = ({ broll, captionText, durationInFrames, captionFontSize }) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateRight: "clamp",
  });

  const captionOpacity = interpolate(frame, [4, 14], [0, 1], {
    extrapolateRight: "clamp",
  });
  const captionTranslateY = interpolate(frame, [4, 14], [16, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`broll/${broll}`)}
        muted
        // Don't hard-crash the whole render if a clip hasn't been fetched
        // yet (or Pexels returns an unsupported codec) — log and show the
        // caption over black instead.
        onError={(err) => console.warn(`broll/${broll} failed to play:`, err)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 220,
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        <div
          style={{
            opacity: captionOpacity,
            transform: `translateY(${captionTranslateY}px)`,
            backgroundColor: theme.captionBackground,
            borderRadius: 16,
            padding: "16px 28px",
            fontFamily: theme.fontFamily,
            fontWeight: "bold",
            fontSize: captionFontSize,
            color: theme.textColor,
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {captionText}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Reveal ──────────────────────────────────────────────────────────────
// The turn from "relatable pain" to "here's the idea" — an italic line on
// the brand background, same fade/slide-in treatment as DemoClip's Hook.
const RevealCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.darkBackground,
        justifyContent: "center",
        alignItems: "center",
        padding: 90,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily: theme.fontFamily,
          fontStyle: "italic",
          fontSize: 64,
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

// ─── Solution ────────────────────────────────────────────────────────────
// Plays the real app footage full-bleed, cycling one feature bullet at a
// time at the bottom so the "show, don't just tell" beat stays readable.
const SolutionPhase: React.FC<{
  screenRecording: string;
  bullets: string[];
  durationInFrames: number;
}> = ({ screenRecording, bullets, durationInFrames }) => {
  const frame = useCurrentFrame();

  const bulletFrames = Math.floor(durationInFrames / bullets.length);
  const bulletIndex = Math.min(
    Math.floor(frame / bulletFrames),
    bullets.length - 1
  );
  const frameWithinBullet = frame - bulletIndex * bulletFrames;
  const bulletOpacity = interpolate(frameWithinBullet, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile(screenRecording)}
        muted
        onError={(err) =>
          console.warn(`${screenRecording} failed to play:`, err)
        }
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 180,
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        <div
          key={bulletIndex}
          style={{
            opacity: bulletOpacity,
            backgroundColor: theme.captionBackground,
            borderRadius: 16,
            padding: "16px 28px",
            fontFamily: theme.fontFamily,
            fontWeight: "bold",
            fontSize: theme.captionFontSize,
            color: theme.textColor,
            textAlign: "center",
          }}
        >
          {bullets[bulletIndex]}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
