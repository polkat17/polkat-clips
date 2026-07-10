import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { CAPTION_FONT_FAMILY, CaptionFontStyle } from "../../loadCaptionFont";

// The closing beat for every "native-format" composition (ListStory,
// BaxterClip, ChatStory): logo pops in, then the "Recalla" wordmark, then
// the tagline, then "link in bio" — bold instant-pop text throughout, not
// EndCard's slower fade-to-brand-color treatment, which reads as too
// polished/cinematic for this format. Tuned to read clearly even at ~2s
// (ChatStory's reveal is deliberately short — "don't let it become an
// advert"). "link in bio" matters here specifically because Shorts/TikTok
// descriptions don't render clickable links — the channel bio link is the
// only clickable path, so the video has to say so.
export const NativeTagCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();

  const logoScale = interpolate(frame, [0, 5], [1.3, 1], {
    extrapolateRight: "clamp",
  });
  const logoOpacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateRight: "clamp",
  });
  const wordmarkOpacity = interpolate(frame, [5, 9], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [10, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const linkOpacity = interpolate(frame, [20, 26], [0, 1], {
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
      <CaptionFontStyle />
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 100,
          height: 100,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 20,
        }}
      />
      <div
        style={{
          opacity: wordmarkOpacity,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 700,
          fontSize: 52,
          color: "#FFFFFF",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Recalla
      </div>
      <div
        style={{
          opacity: taglineOpacity,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 700,
          fontSize: 32,
          color: "#C8A97E",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {text}
      </div>
      <div
        style={{
          opacity: linkOpacity,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 700,
          fontSize: 22,
          color: "#FFFFFF",
          textAlign: "center",
          marginTop: 22,
        }}
      >
        link in bio
      </div>
    </AbsoluteFill>
  );
};
