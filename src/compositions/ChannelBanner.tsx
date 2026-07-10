import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { CAPTION_FONT_FAMILY, CaptionFontStyle } from "../loadCaptionFont";

// YouTube channel art: 2560x1440 upload, but only the centered 1546x423
// "safe area" is guaranteed visible across desktop/mobile/TV — everything
// essential has to live inside that strip. See README for the numbers.
export const BANNER_WIDTH = 2560;
export const BANNER_HEIGHT = 1440;
const SAFE_WIDTH = 1546;
const SAFE_HEIGHT = 423;

export type ChannelBannerProps = {
  tagline: string;
};

export const ChannelBanner: React.FC<ChannelBannerProps> = ({ tagline }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#15140F" }}>
      <CaptionFontStyle />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: SAFE_WIDTH,
            height: SAFE_HEIGHT,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ width: 220, height: 220 }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                fontFamily: CAPTION_FONT_FAMILY,
                fontWeight: 700,
                fontSize: 130,
                color: "#FFFFFF",
                lineHeight: 1,
              }}
            >
              Recalla
            </div>
            <div
              style={{
                fontFamily: CAPTION_FONT_FAMILY,
                fontWeight: 700,
                fontSize: 46,
                color: "#C8A97E",
                marginTop: 14,
              }}
            >
              {tagline}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
