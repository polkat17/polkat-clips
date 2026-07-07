import React from "react";
import { Composition, type AnyZodObject } from "remotion";
import { FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from "./theme";
import {
  DemoClip,
  DemoClipProps,
  DEMO_CLIP_DURATION_IN_FRAMES,
} from "./compositions/DemoClip";
import scripts from "./data/scripts.json";
import {
  ViralPromo,
  ViralPromoProps,
  VIRAL_PROMO_DURATION_IN_FRAMES,
} from "./compositions/ViralPromo";
import viralPromoData from "./data/viralPromo.json";
import {
  ListStory,
  ListStoryProps,
  LIST_STORY_DURATION_IN_FRAMES,
} from "./compositions/ListStory";
import listStoryData from "./data/listStory.json";
import {
  BaxterClip,
  BaxterClipProps,
  BAXTER_CLIP_DURATION_IN_FRAMES,
} from "./compositions/BaxterClip";
import baxterClipData from "./data/baxterClip.json";

// scripts.json entries carry an extra `id` field that DemoClipProps doesn't
// declare — Composition's generics need an explicit Props type here so
// TypeScript doesn't fall back to a loose `Record<string, unknown>`.
const typedScripts = scripts as (DemoClipProps & { id: string })[];

// Registers every composition Remotion knows about. The Studio (`npm start`)
// and the renderer (`npx remotion render`) both read this file.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* A generic composition you can preview/tweak in the Studio with the
          default props below, without picking a specific script variant. */}
      <Composition<AnyZodObject, DemoClipProps>
        id="DemoClip"
        component={DemoClip}
        durationInFrames={DEMO_CLIP_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={typedScripts[0]}
      />

      {/* One composition per entry in scripts.json, so each variant can be
          rendered individually (`npx remotion render <id>`) or all together
          (`npx remotion render` renders every registered composition). */}
      {typedScripts.map((script) => (
        <Composition<AnyZodObject, DemoClipProps>
          key={script.id}
          id={`DemoClip-${script.id}`}
          component={DemoClip}
          durationInFrames={DEMO_CLIP_DURATION_IN_FRAMES}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          defaultProps={script}
        />
      ))}

      {/* The fast-cut stock-footage viral promo: Hook -> Escalation ->
          Reveal -> Solution -> Ending. It's a single fixed video, not swapped
          per-person, so there's just one composition here. */}
      <Composition<AnyZodObject, ViralPromoProps>
        id="ViralPromo"
        component={ViralPromo}
        durationInFrames={VIRAL_PROMO_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={viralPromoData}
      />

      {/* The reworked native-feeling format: one continuous background shot,
          bold instant-pop captions, text-driven escalating list joke instead
          of a multi-scene montage. See src/data/listStory.json for copy. */}
      <Composition<AnyZodObject, ListStoryProps>
        id="ListStory"
        component={ListStory}
        durationInFrames={LIST_STORY_DURATION_IN_FRAMES}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={listStoryData}
      />

      {/* Single AI-generated-performer clip (HeyGen) instead of stock
          footage: one joke, hard cut to tag line. See file header in
          BaxterClip.tsx re: the watermark. */}
      <Composition<AnyZodObject, BaxterClipProps>
        id="BaxterClip"
        component={BaxterClip}
        durationInFrames={BAXTER_CLIP_DURATION_IN_FRAMES}
        fps={FPS}
        width={854}
        height={1490}
        defaultProps={baxterClipData}
      />
    </>
  );
};
