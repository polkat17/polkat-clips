import React from "react";
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { FPS } from "../theme";
import { CAPTION_FONT_FAMILY } from "../loadCaptionFont";
import listStoryData from "../data/listStory.json";

// A different formula from ViralPromo/DemoClip: one continuous background
// shot (no scene-cutting montage), bold instant-pop captions instead of
// slow cinematic fades, and a text-driven escalating joke instead of
// separate acted-out vignettes. See src/data/listStory.json for the copy.

const HOOK_DURATION = 1.5; // the opening line lands instantly, holds briefly
const LIST_ITEM_DURATION = 1.4; // each escalating line, same background shot
const TWIST_DURATION = 2.5; // hard cut away for the "built an app" beat
const SOLUTION_DURATION = 6; // real app footage, two fast bullets
const ENDING_DURATION = 3; // plain text, no logo card

const NUM_LIST_ITEMS = listStoryData.listItems.length;

export const LIST_STORY_DURATION_IN_FRAMES =
  (HOOK_DURATION +
    LIST_ITEM_DURATION * NUM_LIST_ITEMS +
    TWIST_DURATION +
    SOLUTION_DURATION +
    ENDING_DURATION) *
  FPS;

// A type alias (not an interface) so it structurally satisfies the
// `Record<string, unknown>` constraint Remotion's <Composition> generics need.
export type ListStoryProps = {
  background: {
    pexelsQuery: string;
    broll: string;
  };
  hookLine: string;
  listItems: string[];
  twistLine: string;
  solution: {
    screenRecording: string;
    bullets: string[];
  };
  endingLine: string;
};

export const ListStory: React.FC<ListStoryProps> = ({
  background,
  hookLine,
  listItems,
  twistLine,
  solution,
  endingLine,
}) => {
  const hookFrames = HOOK_DURATION * FPS;
  const itemFrames = LIST_ITEM_DURATION * FPS;
  const listFrames = itemFrames * listItems.length;
  const twistFrames = TWIST_DURATION * FPS;
  const solutionFrames = SOLUTION_DURATION * FPS;
  const endingFrames = ENDING_DURATION * FPS;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* TODO: add a trending sound in TikTok/Reels itself at upload time —
          baking a specific sound into the render defeats the point of
          "trending audio," which only counts when picked in-app. */}

      {/* One continuous shot spans the hook + the whole list — this is the
          single biggest fix for "screams stock footage": no scene cuts
          during the joke, just one background the captions play over. */}
      <Sequence durationInFrames={hookFrames + listFrames}>
        <BackgroundClip broll={background.broll} />
      </Sequence>

      <Sequence durationInFrames={hookFrames}>
        <BigCaption text={hookLine} fontSize={54} />
      </Sequence>

      {listItems.map((item, i) => (
        <Sequence
          key={item}
          from={hookFrames + i * itemFrames}
          durationInFrames={itemFrames}
        >
          <BigCaption text={item} fontSize={64} />
        </Sequence>
      ))}

      <Sequence from={hookFrames + listFrames} durationInFrames={twistFrames}>
        <TwistPhase text={twistLine} />
      </Sequence>

      <Sequence
        from={hookFrames + listFrames + twistFrames}
        durationInFrames={solutionFrames}
      >
        <SolutionPhase
          screenRecording={solution.screenRecording}
          bullets={solution.bullets}
          durationInFrames={solutionFrames}
        />
      </Sequence>

      <Sequence
        from={hookFrames + listFrames + twistFrames + solutionFrames}
        durationInFrames={endingFrames}
      >
        <EndingPhase text={endingLine} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ─── Background shot ────────────────────────────────────────────────────
// Plays for the entire hook+list span as a single Sequence so the video
// never restarts mid-joke. Slow continuous zoom plus a tiny handheld jitter
// (two sine waves at different frequencies) so it doesn't sit dead-still
// like a tripod shot, and a vignette + grain pass so it reads less like a
// clean stock download and more like something shot casually.
const BackgroundClip: React.FC<{ broll: string }> = ({ broll }) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 300], [1, 1.15], {
    extrapolateRight: "clamp",
  });
  const jitterX = Math.sin(frame * 0.4) * 1.5 + Math.sin(frame * 1.3) * 0.7;
  const jitterY = Math.cos(frame * 0.35) * 1.5 + Math.cos(frame * 1.1) * 0.7;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(`broll/${broll}`)}
        muted
        onError={(err) => console.warn(`broll/${broll} failed to play:`, err)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${jitterX}px, ${jitterY}px)`,
        }}
      />
      <Vignette />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
    }}
  />
);

// Cheap film-grain fake: a turbulence-noise SVG at low opacity, nudged a
// couple of pixels each frame so it flickers instead of sitting static.
const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  const dx = (frame % 7) - 3;
  const dy = (frame % 5) - 2;

  return (
    <AbsoluteFill
      style={{
        opacity: 0.05,
        mixBlendMode: "overlay",
        transform: `translate(${dx}px, ${dy}px)`,
      }}
    >
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// ─── Captions ────────────────────────────────────────────────────────────
// Bold sans, hard stroke, instant pop-in (4 frames) instead of a slow fade —
// this is the direct fix for "typography is slow and cinematic."
const BigCaption: React.FC<{ text: string; fontSize: number }> = ({
  text,
  fontSize,
}) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 4], [1.25, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 2], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 70,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 900,
          fontSize,
          color: "#FFFFFF",
          textAlign: "center",
          lineHeight: 1.15,
          WebkitTextStroke: "2px black",
          textShadow: "0 4px 12px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// ─── Twist ───────────────────────────────────────────────────────────────
// Hard cut away from the background shot entirely — the punctuation beat
// before the app shows up. A one-frame white flash sells the "cut," then
// settles on black.
const TwistPhase: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const flash = interpolate(frame, [0, 2, 6], [1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [2, 8], [1.15, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        padding: 70,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 900,
          fontSize: 58,
          color: "#FFFFFF",
          textAlign: "center",
          lineHeight: 1.2,
          WebkitTextStroke: "2px black",
        }}
      >
        {text}
      </div>
      <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ─── Solution ────────────────────────────────────────────────────────────
// The real app, briefly — fast bullet pop-ins, no slow caption-pill fades.
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
  const scale = interpolate(frameWithinBullet, [0, 4], [1.2, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frameWithinBullet, [0, 3], [0, 1], {
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
          paddingBottom: 160,
          paddingLeft: 60,
          paddingRight: 60,
        }}
      >
        <div
          key={bulletIndex}
          style={{
            opacity,
            transform: `scale(${scale})`,
            fontFamily: CAPTION_FONT_FAMILY,
            fontWeight: 900,
            fontSize: 44,
            color: "#FFFFFF",
            textAlign: "center",
            WebkitTextStroke: "1.5px black",
            textShadow: "0 4px 12px rgba(0,0,0,0.6)",
          }}
        >
          {bullets[bulletIndex]}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Ending ──────────────────────────────────────────────────────────────
// Plain fast text, no logo card / fade-to-brand-color treatment — that
// polished-card look was the other half of the "Apple keynote" complaint.
const EndingPhase: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 5], [1.2, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 3], [0, 1], {
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
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 900,
          fontSize: 50,
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
