import React from "react";
import { Composition, type AnyZodObject } from "remotion";
import {
  DemoClip,
  DemoClipProps,
  DEMO_CLIP_DURATION_IN_FRAMES,
  DEMO_CLIP_WIDTH,
  DEMO_CLIP_HEIGHT,
  FPS,
} from "./compositions/DemoClip";
import scripts from "./data/scripts.json";

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
        width={DEMO_CLIP_WIDTH}
        height={DEMO_CLIP_HEIGHT}
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
          width={DEMO_CLIP_WIDTH}
          height={DEMO_CLIP_HEIGHT}
          defaultProps={script}
        />
      ))}
    </>
  );
};
