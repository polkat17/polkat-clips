import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { CAPTION_FONT_FAMILY, CaptionFontStyle } from "../../loadCaptionFont";
import { SAFE_ZONE } from "../../theme";

// The closing beat for every "native-format" composition (ListStory,
// BaxterClip, ChatStory): logo pops in, then the "Recalla" wordmark, then
// the tagline — bold instant-pop text throughout, not EndCard's slower
// fade-to-brand-color treatment, which reads as too polished/cinematic for
// this format. Tuned to read clearly even at ~2s (ChatStory's reveal is
// deliberately short — "don't let it become an advert").
//
// "link in bio" is a separate row pinned near the bottom, not stacked
// tight under the tagline — it needs to read as its own CTA, not a small
// afterthought caption, and it has to clear SAFE_ZONE.bottom the same as
// everything else or it just gets covered by TikTok/Shorts UI chrome.
//
// A one-frame white flash right at the start sells the transition into
// this card as a deliberate hard cut rather than just "the next Sequence
// started" — otherwise the cut itself doesn't read as a choice.
export const NativeTagCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const flashOpacity = interpolate(frame, [0, 1, 2], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CaptionFontStyle />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
        }}
      >
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
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: SAFE_ZONE.bottom + 60,
        }}
      >
        <div
          style={{
            opacity: linkOpacity,
            fontFamily: CAPTION_FONT_FAMILY,
            fontWeight: 700,
            fontSize: 34,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          link in bio
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: flashOpacity, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
