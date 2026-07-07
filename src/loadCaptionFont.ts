import { continueRender, delayRender, staticFile } from "remotion";

// A bundled font file, not a system-font name — guarantees identical bold
// caption rendering in the Studio, GitHub Actions, and anywhere else this
// renders, regardless of what fonts happen to be installed on the host.
// (Liberation Sans Bold, SIL Open Font License — freely redistributable.)
export const CAPTION_FONT_FAMILY = "CaptionFont";

const waitForFont = delayRender("Loading caption font");

const fontFace = new FontFace(
  CAPTION_FONT_FAMILY,
  `url(${staticFile("fonts/LiberationSans-Bold.ttf")})`
);

fontFace
  .load()
  .then((loaded) => {
    document.fonts.add(loaded);
    continueRender(waitForFont);
  })
  .catch((err) => {
    console.warn("Caption font failed to load, falling back:", err);
    continueRender(waitForFont);
  });
