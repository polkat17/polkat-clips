// Shared brand theme + video config for every composition in this project.
// Tweak fonts/colors here and every composition updates at once.
export const theme = {
  fontFamily: "Georgia, 'Iowan Old Style', serif",
  textColor: "#FAF8F4",
  darkBackground: "#15140F",
  brandBackground: "#15140F",
  accentGold: "#C8A97E",
  captionBackground: "rgba(0,0,0,0.55)",
  hookFontSize: 88,
  problemFontSize: 56,
  captionFontSize: 34,
  ctaTaglineFontSize: 44,
};

export const FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

// Confirmed by real posted-video feedback (not just guessed from templates):
// TikTok/Reels/Shorts each overlay their own chrome — profile bar, caption +
// sound + engagement rail, like/comment/share column — directly on top of
// the 1080x1920 frame at playback time. Anything essential has to stay
// inside this box or it gets covered. Numbers are the max across all three
// platforms (most conservative wins, since every clip gets posted to all of
// them): TikTok top ~140/bottom ~324/right ~164, YouTube Shorts top ~140/
// bottom ~270/right ~190/left ~70, Instagram Reels top ~220/bottom ~420/
// right ~170.
export const SAFE_ZONE = {
  top: 220,
  bottom: 420,
  left: 70,
  right: 190,
};
