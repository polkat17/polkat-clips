import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { FPS, VIDEO_HEIGHT, SAFE_ZONE } from "../theme";
import { MESSAGE_FONT_FAMILY, MessageFontStyle } from "../loadMessageFont";
import { CAPTION_FONT_FAMILY, CaptionFontStyle } from "../loadCaptionFont";
import { NativeTagCard } from "./shared/NativeTagCard";

// The whole video happens inside a messaging app: no footage, no actors, no
// stock clips — just text bubbles, timed like a real conversation getting
// progressively more awkward, then a hard cut to the Recalla reveal. See
// src/data/chatStories/*.json for the actual scripts.
//
// Every episode should follow the same structure, so viewers start
// recognizing the format and watch just to see how it goes wrong:
//   0. A bold hook line, visible from frame 0 — the chat starts immediately
//      underneath it, no dead pre-roll. Real-world feedback on the first
//      render: the opening "hey stranger" / "heyyy how are you" read as
//      filler with no reason to keep watching — curiosity has to be stated
//      up front, not earned three lines in. It sits in the natural empty
//      space above the conversation (bubbles anchor to the bottom and grow
//      upward, so the top of the screen is blank early on) as plain bold
//      ink-colored text — no dark title-card box. A solid overlay banner
//      was the first attempt and it read as a slapped-on ad slide, not
//      part of the conversation.
//   1. Normal conversation, kept to 1-2 short lines — the first "oh no"
//      moment needs to land by ~3-4s, not 5+. Cut anything a viewer doesn't
//      strictly need to track the joke; the eye reads faster than natural
//      texting rhythm suggests.
//   2. One innocent mistake (a wrong assumption, not an absurd one).
//   3. The other person reveals you're wrong — in short, matter-of-fact
//      texts, not one long explanatory message. A beat of silence before
//      the reveal (no typing indicator) makes it land like it was already
//      sent, catching you off guard.
//   4. You try to recover with a typing-indicator beat, then a lie.
//   5. The other person reveals it's much worse — one specific, concrete
//      detail ("you helped me move out"), not a vague one ("you were
//      there"). Give this one a typing-indicator beat too: the pause is
//      itself "acting" and builds tension before the worse detail lands.
//      Give it the most room of any beat — it's the joke people actually
//      laugh at, everything else is setup or landing.
//   6. A dry, understated punchline — owning it beats over-explaining it.
//      Doesn't have to come from "me" — it can land harder from the other
//      side, e.g. as a dry aside showing the damage is now a running joke
//      in their life too, not just something "me" feels guilty about.
//   7. A real pause before the cut, then the Recalla reveal, ~2s. Wordmark
//      + one line + "link in bio". Don't let it become an ad.
//      `skipReveal: true` drops this phase entirely — for a first batch of
//      format-only test posts, so a new account isn't simultaneously
//      testing a new format AND a product pitch.
//
// All of this has to live inside SAFE_ZONE (src/theme.ts) — confirmed by
// real posted-video feedback that TikTok/Reels/Shorts chrome (profile bar,
// caption/sound/engagement rail, like/comment/share column) genuinely
// covers anything outside it, not just a theoretical template margin.
//
// Timing realism: don't give every message the same `delay`/typing time —
// a uniform rhythm is the thing that reads as generated rather than typed
// by a person. Vary typingSeconds per message (0.6-1.0s), give the
// best-joke line noticeably more room than setup lines, and give a message
// a tiny `delay` (~0.2s) with no `typing` to mimic a real double-send — two
// bubbles from the same sender landing almost on top of each other.
//
// Two deliberately non-native "added in post" elements, distinct from the
// rest of the chat UI on purpose — real creators editing screen recordings
// mix genuine app chrome with obviously-added captions, and that mix reads
// as more authentic than a pristine native mockup:
//   - `headerCaption` (required) replaces the plain contact name with bold
//     editorial framing ("THE FRIEND WHOSE JOB I FORGOT") — sets context
//     the way a creator's own added label would, not a system UI element.
//   - `skip` on a message renders a bold red "10 minutes later"-style
//     jump-cut caption, inline in the message flow directly above that
//     message (not a floating overlay stamped over the bubbles — that read
//     as cluttered and hard to read against the text underneath it). Use it
//     at a point where a real pause would happen (composing an awkward
//     reply), not mid-reveal — splitting a two-part gut-punch line with a
//     time-skip undercuts it. Red is intentional: it's the one color in the
//     format that isn't part of the brand or the native-chat palette,
//     reserved for this.

const TYPING_DURATION_SECONDS = 0.9; // fallback when a message doesn't set typingSeconds
const HOLD_AFTER_LAST_MESSAGE = 2.2; // a real pause before the hard cut to the reveal
const TAG_DURATION = 2.0; // seconds — "don't let it become an advert"
const HEADER_HEIGHT = 130;
const HOOK_VISIBLE_SECONDS = 2.3; // gone before the "oh no" line lands
const DELIVERED_DELAY_SECONDS = 0.5; // "Delivered" appears a beat after the last bubble, not instantly
const SKIP_RED = "#FF3B30"; // the one non-brand, non-native color — reserved for the jump-cut caption

export type ChatMessage = {
  sender: "me" | "them";
  text: string;
  delay: number; // seconds after the previous message before this one appears
  typing?: boolean; // show a typing-indicator bubble just before this message
  typingSeconds?: number; // overrides TYPING_DURATION_SECONDS for this message's typing beat
  skip?: string; // bold red "added in post" jump-cut caption, inline right before this message
};

// A type alias (not an interface) so it structurally satisfies the
// `Record<string, unknown>` constraint Remotion's <Composition> generics need.
export type ChatStoryProps = {
  contactName: string;
  headerCaption: string; // bold editorial label shown in the header instead of the plain name
  hook: string; // bold first-frame line — states the curiosity hook up front
  messages: ChatMessage[];
  revealLine: string;
  skipReveal?: boolean; // omit the Recalla card entirely (format-only test posts)
};

type ScheduledMessage = ChatMessage & {
  appearAtFrame: number;
  typingStartFrame: number | null;
  skipStartFrame: number | null;
};

function scheduleMessages(messages: ChatMessage[]): ScheduledMessage[] {
  let cursorSeconds = 0;
  return messages.map((message) => {
    const gapStartSeconds = cursorSeconds;
    cursorSeconds += message.delay;
    const appearAtFrame = Math.round(cursorSeconds * FPS);
    const typingSeconds = message.typingSeconds ?? TYPING_DURATION_SECONDS;
    const typingStartFrame = message.typing
      ? Math.round((cursorSeconds - typingSeconds) * FPS)
      : null;
    // Fires as soon as the gap before this message begins, and (like a real
    // divider in a chat history) stays part of the flow permanently once
    // shown — it doesn't need to fade back out.
    const skipStartFrame = message.skip ? Math.round(gapStartSeconds * FPS) : null;
    return { ...message, appearAtFrame, typingStartFrame, skipStartFrame };
  });
}

export function getChatStoryDurationInFrames(
  messages: ChatMessage[],
  skipReveal?: boolean
): number {
  const schedule = scheduleMessages(messages);
  const lastAppearFrame = schedule[schedule.length - 1]?.appearAtFrame ?? 0;
  const conversationFrames = lastAppearFrame + Math.round(HOLD_AFTER_LAST_MESSAGE * FPS);
  const tagFrames = skipReveal ? 0 : Math.round(TAG_DURATION * FPS);
  return conversationFrames + tagFrames;
}

export const ChatStory: React.FC<ChatStoryProps> = ({
  contactName,
  headerCaption,
  hook,
  messages,
  revealLine,
  skipReveal,
}) => {
  const schedule = scheduleMessages(messages);
  const lastAppearFrame = schedule[schedule.length - 1]?.appearAtFrame ?? 0;
  const conversationFrames = lastAppearFrame + Math.round(HOLD_AFTER_LAST_MESSAGE * FPS);
  const tagFrames = skipReveal ? 0 : Math.round(TAG_DURATION * FPS);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <MessageFontStyle />

      {/* TODO: sync a trending sound in TikTok/Reels at upload time — see
          the same note in ListStory.tsx for why that beats baking one in. */}

      <Sequence durationInFrames={conversationFrames}>
        <ConversationPhase contactName={contactName} headerCaption={headerCaption} hook={hook} schedule={schedule} />
      </Sequence>

      {!skipReveal && (
        <Sequence from={conversationFrames} durationInFrames={tagFrames}>
          <NativeTagCard text={revealLine} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const ConversationPhase: React.FC<{
  contactName: string;
  headerCaption: string;
  hook: string;
  schedule: ScheduledMessage[];
}> = ({ contactName, headerCaption, hook, schedule }) => {
  const frame = useCurrentFrame();

  const nextHidden = schedule.find((m) => m.appearAtFrame > frame);
  const showTyping =
    nextHidden?.typingStartFrame !== null &&
    nextHidden?.typingStartFrame !== undefined &&
    frame >= nextHidden.typingStartFrame &&
    frame < nextHidden.appearAtFrame;

  const lastMessage = schedule[schedule.length - 1];
  const showDelivered =
    lastMessage.sender === "me" &&
    frame >= lastMessage.appearAtFrame + Math.round(DELIVERED_DELAY_SECONDS * FPS);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <ChatHeader contactName={contactName} headerCaption={headerCaption} />

      <AbsoluteFill
        style={{
          top: SAFE_ZONE.top + HEADER_HEIGHT,
          height: VIDEO_HEIGHT - SAFE_ZONE.top - HEADER_HEIGHT - SAFE_ZONE.bottom,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
          padding: `0 ${SAFE_ZONE.right}px 24px ${SAFE_ZONE.left}px`,
          gap: 14,
        }}
      >
        {schedule.map((message, i) => {
          const appeared = message.appearAtFrame <= frame;
          const skipTriggered = message.skipStartFrame !== null && frame >= message.skipStartFrame;
          const isPendingTyping = message === nextHidden && showTyping;

          return (
            <React.Fragment key={i}>
              {skipTriggered && message.skip && (
                <SkipCaption text={message.skip} frame={frame - message.skipStartFrame!} />
              )}
              {appeared && (
                <MessageBubble
                  sender={message.sender}
                  text={message.text}
                  frame={frame}
                  appearAtFrame={message.appearAtFrame}
                  showDelivered={message === lastMessage && showDelivered}
                />
              )}
              {isPendingTyping && <TypingBubble sender={message.sender} />}
            </React.Fragment>
          );
        })}
      </AbsoluteFill>

      <HookBanner text={hook} frame={frame} />
    </AbsoluteFill>
  );
};

// Sits in the blank space above the conversation (bubbles anchor to the
// bottom and grow upward, so this area is empty for the first couple of
// seconds anyway) as plain bold text — no box, no background — so it reads
// as part of the chat rather than an ad slide stuck on top of it. Full
// opacity from frame 0 (that's often the thumbnail frame) and gone well
// before the first misunderstanding lands.
const HookBanner: React.FC<{ text: string; frame: number }> = ({ text, frame }) => {
  const visibleFrames = Math.round(HOOK_VISIBLE_SECONDS * FPS);
  const fadeStart = visibleFrames - 12;
  const opacity = interpolate(frame, [fadeStart, visibleFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <AbsoluteFill
      style={{
        top: SAFE_ZONE.top + HEADER_HEIGHT + 24,
        height: 220,
        justifyContent: "flex-start",
        alignItems: "center",
        padding: `0 ${SAFE_ZONE.right}px 0 ${SAFE_ZONE.left}px`,
        pointerEvents: "none",
      }}
    >
      <CaptionFontStyle />
      <div
        style={{
          opacity,
          fontFamily: CAPTION_FONT_FAMILY,
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 1.3,
          color: "#1A1A1A",
          textAlign: "center",
          textShadow: "0 2px 10px rgba(0,0,0,0.12)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// A jump-cut caption, inline in the message flow (not floating over the
// bubbles — that made it hard to read against the text underneath).
// Deliberately not trying to look like native UI, the way a creator would
// mark a time skip in their own edit: red, hard black stroke, slight tilt.
const SkipCaption: React.FC<{ text: string; frame: number }> = ({ text, frame }) => {
  const scale = interpolate(frame, [0, 4], [1.15, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        alignSelf: "center",
        opacity,
        transform: `scale(${scale}) rotate(-2deg)`,
        fontFamily: CAPTION_FONT_FAMILY,
        fontWeight: 900,
        fontSize: 26,
        color: SKIP_RED,
        textAlign: "center",
        textTransform: "uppercase",
        WebkitTextStroke: "1.5px black",
        margin: "6px 0",
      }}
    >
      {text}
    </div>
  );
};

const ChatHeader: React.FC<{ contactName: string; headerCaption: string }> = ({
  contactName,
  headerCaption,
}) => (
  <AbsoluteFill
    style={{
      top: SAFE_ZONE.top,
      height: HEADER_HEIGHT,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 18,
      borderBottom: "1px solid #E5E5E5",
    }}
  >
    <CaptionFontStyle />
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        backgroundColor: "#C8A97E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MESSAGE_FONT_FAMILY,
        fontWeight: 400,
        fontSize: 24,
        color: "#FFFFFF",
        marginBottom: 8,
      }}
    >
      {contactName.charAt(0).toUpperCase()}
    </div>
    <div
      style={{
        fontFamily: CAPTION_FONT_FAMILY,
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: 0.5,
        color: "#1A1A1A",
        textTransform: "uppercase",
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      {headerCaption}
    </div>
  </AbsoluteFill>
);

// Quick pop-in (not a slow fade) so the rhythm stays fast even though each
// bubble, once visible, stays put — the flex column + overflow:hidden above
// handles "scrolling" by just clipping older bubbles off the top as new
// ones are appended at the bottom.
const MessageBubble: React.FC<{
  sender: "me" | "them";
  text: string;
  frame: number;
  appearAtFrame: number;
  showDelivered?: boolean;
}> = ({ sender, text, frame, appearAtFrame, showDelivered }) => {
  const localFrame = frame - appearAtFrame;
  const scale = interpolate(localFrame, [0, 5], [0.85, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(localFrame, [0, 4], [0, 1], {
    extrapolateRight: "clamp",
  });
  const isMe = sender === "me";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "78%",
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: isMe ? "bottom right" : "bottom left",
          backgroundColor: isMe ? "#0A84FF" : "#E9E9EB",
          color: isMe ? "#FFFFFF" : "#000000",
          borderRadius: 30,
          padding: "16px 24px",
          fontFamily: MESSAGE_FONT_FAMILY,
          fontWeight: 400,
          fontSize: 32,
          lineHeight: 1.3,
        }}
      >
        {text}
      </div>
      {showDelivered && (
        <div
          style={{
            fontFamily: MESSAGE_FONT_FAMILY,
            fontWeight: 400,
            fontSize: 16,
            color: "#B0B0B5",
            marginTop: 4,
            marginRight: 6,
          }}
        >
          Delivered
        </div>
      )}
    </div>
  );
};

const TypingBubble: React.FC<{ sender: "me" | "them" }> = ({ sender }) => {
  const frame = useCurrentFrame();
  const isMe = sender === "me";

  return (
    <div
      style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
        backgroundColor: isMe ? "#0A84FF" : "#E9E9EB",
        borderRadius: 30,
        padding: "20px 26px",
        display: "flex",
        gap: 8,
      }}
    >
      {[0, 1, 2].map((i) => {
        const bounce = Math.sin((frame - i * 4) * 0.5) * 4;
        return (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: isMe ? "#FFFFFF" : "#8E8E93",
              transform: `translateY(${bounce}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
