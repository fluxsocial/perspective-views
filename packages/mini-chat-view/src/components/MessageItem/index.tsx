import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { ChatContext } from "junto-utils/react";
import { Reaction } from "junto-utils/types";
import getMe from "junto-utils/api/getMe";

import MessageToolbar from "./MessageToolbar";
import MessageReactions from "./MessageReactions";
import { getRelativeTime } from "./getRelativeTime";
import UIContext from "../../context/UIContext";
import styles from './index.scss';

type timeOptions = {
  dateStyle?: string,
  timeStyle?: string,
  dayPeriod?: string,
  timeZone?: string,
  weekday?: string,
  era?: string,
  year?: string,
  month?: string,
  day?: string,
  second?: string,
  hour?: string,
  minute?: string,
  hourCycle?: string,
  relative?: boolean
}

export default function MessageItem({ index, showAvatar, onOpenEmojiPicker, mainRef }) {
  const [showToolbar, setShowToolbar] = useState(false);
  const messageRef = useRef<any>(null);
  const {
    state: { messages, keyedMessages },
    methods: { addReaction, removeReaction },
  } = useContext(ChatContext);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const message = messages[index];

  if (!message) return null;

  function onReplyClick() {
    setCurrentReply(message.url);
  }

  async function onEmojiClick(unicode: string) {
    const me = await getMe();

    const alreadyMadeReaction = message.reactions.find((reaction: Reaction) => {
      return reaction.author === me.did && reaction.data.target === unicode;
    });

    if (alreadyMadeReaction) {
      removeReaction(alreadyMadeReaction);
    } else {
      addReaction(message.url, unicode);
    }
  }

  const replyMessage = keyedMessages[message?.replyUrl];

  useEffect(() => {
    const mentionElements = (messageRef.current as any).querySelectorAll(
      ".mention"
    );
    const emojiElements = (messageRef.current as any).querySelectorAll(
      ".emoji"
    );

    for (const ele of emojiElements) {
      const emoji = ele as HTMLElement;

      if (emoji.parentNode?.nodeName !== "J-TOOLTIP") {
        var wrapper = document.createElement("j-tooltip");
        wrapper.title = `:${emoji.dataset.id}:`;
        wrapper.classList.add("emojitoolip");
        (wrapper as any).placement = "top";
        emoji.parentNode?.insertBefore(wrapper, emoji);
        wrapper.appendChild(emoji);

        if (emoji.parentNode?.nextSibling?.textContent?.trim().length === 0) {
          emoji.parentNode?.nextSibling.remove();
        }
      }
    }

    for (const ele of mentionElements) {
      const mention = ele as HTMLElement;
      mention.onclick = () => {
        if (mention.innerText.startsWith("#")) {
          const event = new CustomEvent('perspective-click', { detail: mention.dataset['id'], bubbles: true });
          mainRef.current.dispatchEvent(event);
        } else {
          const event = new CustomEvent('agent-click', { detail:mention.dataset['id'], bubbles: true });
          mainRef.current.dispatchEvent(event);
        }
      };
    }
  }, [messageRef]);



  const getDateTimeOptions = (options: timeOptions) => {
    if (options.dateStyle) {
      return {
        dateStyle: options.dateStyle,
        ...(options.timeStyle && { timeStyle: options.timeStyle }),
      };
    }

    return {
      ...(options.dayPeriod && { dayPeriod: options.dayPeriod }),
      ...(options.timeZone && { timeZone: options.timeZone }),
      ...(options.weekday && { weekday: options.weekday }),
      ...(options.era && { era: options.era }),
      ...(options.year && { year: options.year }),
      ...(options.month && { month: options.month }),
      ...(options.day && { day: options.day }),
      ...(options.second && { second: options.second }),
      ...(options.hour && { hour: options.hour }),
      ...(options.minute && { minute: options.minute }),
      ...(options.hourCycle && { hourCycle: options.hourCycle }),
    };
  }

  const getTime = (value: string, timeOptions: timeOptions) => {
    if (timeOptions.relative) {
      const rtf = new Intl.RelativeTimeFormat("en-US", {
        numeric: "auto",
        style: "long",
      });
      return getRelativeTime(new Date(value), new Date(), rtf);
    } else {
      // @ts-ignore
      return new Intl.DateTimeFormat("en-US", getDateTimeOptions(timeOptions)).format(
        new Date(value)
      )
    }
  }

  return (
    <div
      onMouseOver={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      class={styles.message}
      isReplying={keyedMessages[currentReply]?.url === message.url}
    >
      {replyMessage && (
        <>
          <div style={{ position: "relative" }}>
            <div class={styles.replyLine} />
          </div>
          <div class={styles.messageFlex}>
            <div class={styles.messageFlex}>
              <j-avatar
                style="--j-avatar-size: 20px"
                hash={replyMessage.author.did}
              ></j-avatar>
              <div class={styles.messageUsernameNoMargin}>{replyMessage.author.username}</div>
            </div>
            <div
              style={{
                fontSize: "var(--j-font-size-400)",
              }}
              dangerouslySetInnerHTML={{ __html: replyMessage.content }}
            ></div>
          </div>
        </>
      )}
      <div>
        {replyMessage || showAvatar ? (
          <div style={{ display: "flex" }}>
            <j-avatar
              src={message.author.thumbnailPicture}
              hash={message.author.did}
              onClick={() => {
                const event = new CustomEvent('agent-click', { detail: message.author.did, bubbles: true });
                mainRef.current.dispatchEvent(event);
              }}
            ></j-avatar>
          </div>
        ) : (
          <small class={styles.timestampLeft}>
            {getTime(message.timestamp, { hour: 'numeric', minute: 'numeric'})}
          </small>
        )}
      </div>
      <div>
        {(replyMessage || showAvatar) && (
          <div style={{ display: "flex", gap: "var(--j-space-300)" }}>
            <div class={styles.messageUsername}>{message.author.username}</div>
            <small style={{ fontSize: "var(--j-font-size-300)" }}>
              {getTime(message.timestamp, { relative: true })}
            </small>
          </div>
        )}

        <div
          ref={messageRef}
          class={styles.messageItemContent}
          dangerouslySetInnerHTML={{ __html: message.content }}
        ></div>
        {message.reactions.length > 0 && (
          <j-box pt="400">
            <MessageReactions
              onEmojiClick={onEmojiClick}
              reactions={message.reactions}
            />
          </j-box>
        )}
      </div>
      <div>
        {showToolbar && (
          <MessageToolbar
            onReplyClick={onReplyClick}
            onOpenEmojiPicker={onOpenEmojiPicker}
          />
        )}
      </div>
    </div>
  );
}
