import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { interpolate } from "remotion";
import { theme } from "../../theme";

// The closing card used by every composition: logo scales/fades in, the
// tagline follows shortly after, then everything fades to a solid
// brand-color card over the last 20 frames so the clip ends cleanly.
export const EndCard: React.FC<{
  tagline: string;
  durationInFrames: number;
}> = ({ tagline, durationInFrames }) => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const logoScale = interpolate(frame, [0, 15], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const endFadeOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.brandBackground,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 220,
          height: 220,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      />
      <div
        style={{
          marginTop: 32,
          opacity: taglineOpacity,
          fontFamily: theme.fontFamily,
          fontStyle: "italic",
          fontSize: theme.ctaTaglineFontSize,
          color: theme.accentGold,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        {tagline}
      </div>

      <AbsoluteFill
        style={{
          backgroundColor: theme.brandBackground,
          opacity: endFadeOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
