import React from "react";
import { LIBERATION_SANS_REGULAR_BASE64 } from "./messageFontData";

// Regular-weight companion to loadCaptionFont.tsx's bold caption font, for
// chat bubble text that needs to look like a normal message, not a shouty
// caption. Same embedded-data-URI approach — see loadCaptionFont.tsx for why
// (delayRender-based font loading intermittently hung during long renders).
export const MESSAGE_FONT_FAMILY = "MessageFont";

const fontFaceCss = `
@font-face {
  font-family: "${MESSAGE_FONT_FAMILY}";
  src: url(data:font/ttf;base64,${LIBERATION_SANS_REGULAR_BASE64}) format("truetype");
  font-weight: 400;
  font-style: normal;
}
`;

export const MessageFontStyle: React.FC = () => (
  <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />
);
