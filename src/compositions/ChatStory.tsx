import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { FPS, VIDEO_HEIGHT } from "../theme";
import { MESSAGE_FONT_FAMILY, MessageFontStyle } from "../loadMessageFont";
import { NativeTagCard } from "./shared/NativeTagCard";

// The whole video happens inside a messaging app: no footage, no actors, no
// stock clips — just text bubbles, timed like a real conversation getting
// progressively more awkward, then a hard cut to the Recalla reveal. See
// src/data/chatStories/*.json for the actual scripts.
//
// Every episode should follow the same structure, so viewers start
// recognizing the format and watch just to see how it goes wrong:
//   1. Normal conversation (has to read as ordinary within ~2s).
//   2. One innocent mistake (a wrong assumption, not an absurd one).
//   3. The other person reveals you're wrong — in short, matter-of-fact
//      texts, not one long explanatory message. A beat of silence before
//      the reveal (no typing indicator) makes it land like it was already
//      sent, catching you off guard.
//   4. You try to recover with a typing-indicator beat, then a lie.
//   5. The other person reveals it's much worse — one specific, concrete
//      detail ("you helped me move out"), not a vague one ("you were
//      there"). Specificity is what makes it land.
//   6. A dry, understated punchline — owning it beats over-explaining it.
//   7. Recalla reveal, ~1.5-2s. Wordmark + one line. Don't let it become an ad.

const TYPING_DURATION_SECONDS = 0.9;
const HOLD_AFTER_LAST_MESSAGE = 1.5; // seconds to let the punchline sit
const TAG_DURATION = 1.75; // seconds — "don't let it become an advert"
const HEADER_HEIGHT = 160;

export type ChatMessage = {
  sender: "me" | "them";
  text: string;
  delay: number; // seconds after the previous message before this one appears
  typing?: boolean; // show a typing-indicator bubble just before this message
};

// A type alias (not an interface) so it structurally satisfies the
// `Record<string, unknown>` constraint Remotion's <Composition> generics need.
export type ChatStoryProps = {
  contactName: string;
  messages: ChatMessage[];
  revealLine: string;
};

type ScheduledMessage = ChatMessage & {
  appearAtFrame: number;
  typingStartFrame: number | null;
};

function scheduleMessages(messages: ChatMessage[]): ScheduledMessage[] {
  let cursorSeconds = 0;
  return messages.map((message) => {
    cursorSeconds += message.delay;
    const appearAtFrame = Math.round(cursorSeconds * FPS);
    const typingStartFrame = message.typing
      ? Math.round((cursorSeconds - TYPING_DURATION_SECONDS) * FPS)
      : null;
    return { ...message, appearAtFrame, typingStartFrame };
  });
}

export function getChatStoryDurationInFrames(messages: ChatMessage[]): number {
  const schedule = scheduleMessages(messages);
  const lastAppearFrame = schedule[schedule.length - 1]?.appearAtFrame ?? 0;
  const conversationFrames = lastAppearFrame + Math.round(HOLD_AFTER_LAST_MESSAGE * FPS);
  return conversationFrames + Math.round(TAG_DURATION * FPS);
}

export const ChatStory: React.FC<ChatStoryProps> = ({
  contactName,
  messages,
  revealLine,
}) => {
  const schedule = scheduleMessages(messages);
  const lastAppearFrame = schedule[schedule.length - 1]?.appearAtFrame ?? 0;
  const conversationFrames = lastAppearFrame + Math.round(HOLD_AFTER_LAST_MESSAGE * FPS);
  const tagFrames = Math.round(TAG_DURATION * FPS);

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <MessageFontStyle />

      {/* TODO: sync a trending sound in TikTok/Reels at upload time — see
          the same note in ListStory.tsx for why that beats baking one in. */}

      <Sequence durationInFrames={conversationFrames}>
        <ConversationPhase contactName={contactName} schedule={schedule} />
      </Sequence>

      <Sequence from={conversationFrames} durationInFrames={tagFrames}>
        <NativeTagCard text={revealLine} />
      </Sequence>
    </AbsoluteFill>
  );
};

const ConversationPhase: React.FC<{
  contactName: string;
  schedule: ScheduledMessage[];
}> = ({ contactName, schedule }) => {
  const frame = useCurrentFrame();

  const visible = schedule.filter((m) => m.appearAtFrame <= frame);
  const nextHidden = schedule.find((m) => m.appearAtFrame > frame);
  const showTyping =
    nextHidden?.typingStartFrame !== null &&
    nextHidden?.typingStartFrame !== undefined &&
    frame >= nextHidden.typingStartFrame &&
    frame < nextHidden.appearAtFrame;

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <ChatHeader contactName={contactName} />

      <AbsoluteFill
        style={{
          top: HEADER_HEIGHT,
          height: VIDEO_HEIGHT - HEADER_HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          overflow: "hidden",
          padding: "0 32px 48px",
          gap: 14,
        }}
      >
        {visible.map((message, i) => (
          <MessageBubble
            key={i}
            sender={message.sender}
            text={message.text}
            frame={frame}
            appearAtFrame={message.appearAtFrame}
          />
        ))}
        {showTyping && nextHidden && <TypingBubble sender={nextHidden.sender} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ChatHeader: React.FC<{ contactName: string }> = ({ contactName }) => (
  <AbsoluteFill
    style={{
      top: 0,
      height: HEADER_HEIGHT,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 18,
      borderBottom: "1px solid #E5E5E5",
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        backgroundColor: "#C8A97E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MESSAGE_FONT_FAMILY,
        fontWeight: 400,
        fontSize: 26,
        color: "#FFFFFF",
        marginBottom: 8,
      }}
    >
      {contactName.charAt(0).toUpperCase()}
    </div>
    <div
      style={{
        fontFamily: MESSAGE_FONT_FAMILY,
        fontWeight: 400,
        fontSize: 22,
        color: "#8E8E93",
      }}
    >
      {contactName}
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
}> = ({ sender, text, frame, appearAtFrame }) => {
  const localFrame = frame - appearAtFrame;
  const scale = interpolate(localFrame, [0, 5], [0.85, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(localFrame, [0, 4], [0, 1], {
    extrapolateRight: "clamp",
  });
  const isMe = sender === "me";

  return (
    <div
      style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
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
