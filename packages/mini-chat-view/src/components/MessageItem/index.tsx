import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { ChatContext, PerspectiveContext } from "junto-utils/react";
import { Reaction } from "junto-utils/types";
import getMe from "junto-utils/api/getMe";

import MessageToolbar from "./MessageToolbar";
import MessageReactions from "./MessageReactions";
import { getRelativeTime } from "./getRelativeTime";
import UIContext from "../../context/UIContext";
import styles from "./index.scss";
import { format, formatRelative } from "date-fns/esm";

type timeOptions = {
  dateStyle?: string;
  timeStyle?: string;
  dayPeriod?: string;
  timeZone?: string;
  weekday?: string;
  era?: string;
  year?: string;
  month?: string;
  day?: string;
  second?: string;
  hour?: string;
  minute?: string;
  hourCycle?: string;
  relative?: boolean;
};

export default function MessageItem({
  index,
  showAvatar,
  onOpenEmojiPicker,
  mainRef,
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const messageRef = useRef<any>(null);
  const {
    state: { members },
  } = useContext(PerspectiveContext);
  const {
    state: { messages, keyedMessages },
    methods: { addReaction, removeReaction, getReplyMessage },
  } = useContext(ChatContext);
  const [replyMessage, setReplyMessage] = useState();

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const message = messages[index] || {
    id: "unknown",
    url: "",
    author: "",
    reactions: [],
    timestamp: "'1995-12-17T03:24:00'",
    content: "",
    replyUrl: "",
  };

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

  useEffect(() => {
    const mentionElements = (messageRef.current as any).querySelectorAll(
      "[data-mention]"
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

      mention.addEventListener("click", () => {
        if (mention.innerText.startsWith("#")) {
          const event = new CustomEvent("perspective-click", {
            detail: {
              uuid: mention.dataset["id"],
            },
            bubbles: true,
          });
          mainRef?.dispatchEvent(event);
        } else if (mention.innerText.startsWith("@")) {
          const event = new CustomEvent("agent-click", {
            detail: {
              did: mention.dataset["id"],
            },
            bubbles: true,
          });
          mainRef?.dispatchEvent(event);
        }
      });
    }
  }, [messageRef]);

  function onProfileClick(did) {
    const event = new CustomEvent("agent-click", {
      detail: {
        did,
      },
      bubbles: true,
    });
    mainRef?.dispatchEvent(event);
  }

  useEffect(() => {
    getReply();
  }, [message]);

  const getReply = async () => {
    const reply = await getReplyMessage(message.replyUrl);

    setReplyMessage(reply);
  };

  const author = members[message.author] || {};
  const replyAuthor = members[replyMessage?.author] || {};

  return (
    <div
      onMouseOver={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      class={styles.message}
      isReplying={keyedMessages[currentReply]?.url === message.url}
    >
      {replyMessage && (
        <>
          <div class={styles.replyLineWrapper}>
            <div class={styles.replyLine} />
          </div>
          <div class={styles.messageFlex}>
            <div
              class={styles.messageFlex}
              onClick={() => onProfileClick(replyAuthor?.did)}
            >
              <j-avatar
                class={styles.messageAvatar}
                style="--j-avatar-size: 20px"
                src={replyAuthor?.thumbnailPicture}
                hash={replyAuthor?.did}
              ></j-avatar>
              <div class={styles.messageUsernameNoMargin}>
                {replyAuthor?.username}
              </div>
            </div>
            <div
              class={styles.replyContent}
              dangerouslySetInnerHTML={{ __html: replyMessage.content }}
            />
          </div>
        </>
      )}
      <div>
        {replyMessage || showAvatar ? (
          <j-flex>
            <j-avatar
              class={styles.messageAvatar}
              src={author?.thumbnailPicture}
              hash={author?.did}
              onClick={() => onProfileClick(author?.did)}
            ></j-avatar>
          </j-flex>
        ) : (
          <small
            class={styles.timestampLeft}
            data-rh
            data-timestamp={format(
              new Date(message.timestamp),
              "EEEE, MMMM d, yyyy, HH:MM"
            )}
          >
            {format(new Date(message.timestamp), "HH:MM ")}
          </small>
        )}
      </div>
      <div>
        {(replyMessage || showAvatar) && (
          <header class={styles.messageItemHeader}>
            <div
              onClick={() => onProfileClick(author?.did)}
              class={styles.messageUsername}
            >
              {author?.username}
            </div>
            <small
              class={styles.timestamp}
              data-rh
              data-timestamp={format(
                new Date(message.timestamp),
                "EEEE, MMMM d, yyyy, HH:MM"
              )}
            >
              {formatRelative(new Date(message.timestamp), new Date())}
            </small>
          </header>
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
