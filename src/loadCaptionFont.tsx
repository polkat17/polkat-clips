import React from "react";
import { LIBERATION_SANS_BOLD_BASE64 } from "./captionFontData";

// A bundled font, not a system-font name — guarantees identical bold caption
// rendering in the Studio, GitHub Actions, and anywhere else this renders,
// regardless of what fonts happen to be installed on the host.
// (Liberation Sans Bold, SIL Open Font License — freely redistributable.)
//
// Plain CSS @font-face with an embedded data URI, not @remotion/fonts'
// loadFont()/delayRender(). Long renders (Remotion recycles browser pages
// periodically) re-run module-scope code on each fresh page, and a
// delayRender() call made that way intermittently never got cleared —
// reproduced locally with both a networked font URL and a data URI, so it
// wasn't a network issue, it was the async wait itself. A data URI needs no
// fetch, so plain CSS resolves it synchronously with nothing to hang on.
export const CAPTION_FONT_FAMILY = "CaptionFont";

const fontFaceCss = `
@font-face {
  font-family: "${CAPTION_FONT_FAMILY}";
  src: url(data:font/ttf;base64,${LIBERATION_SANS_BOLD_BASE64}) format("truetype");
  font-weight: 700;
  font-style: normal;
}
`;

export const CaptionFontStyle: React.FC = () => (
  <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />
);
