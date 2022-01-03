import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { ChatContext, useEventEmitter } from "junto-utils/react";
import { Reaction } from "junto-utils/types";
import getMe from "junto-utils/api/getMe";
import styled, { css } from "styled-components";
import tippy from "tippy.js";

import MessageToolbar from "./MessageToolbar";
import MessageReactions from "./MessageReactions";
import UIContext from "../../context/UIContext";

const replyLineStyles = {
  display: "block",
  position: "absolute",
  top: "50%",
  right: "0",
  width: "70%",
  height: "15px",
  borderLeft: "2px solid var(--j-color-ui-200)",
  borderTop: "2px solid var(--j-color-ui-200)",
  borderTopLeftRadius: "var(--j-border-radius)",
};

const messageStyles = {
  paddingTop: "var(--j-space-400)",
  paddingLeft: "var(--j-space-500)",
  paddingBottom: "var(--j-space-400)",
  display: "grid",
  position: "relative",
  gridTemplateColumns: "60px 1fr",
  columnGap: "var(--j-space-500)",
  rowGap: "var(--j-space-300)",
};

export default function MessageItem({ index, showAvatar, onOpenEmojiPicker }) {
  const [showToolbar, setShowToolbar] = useState(false);
  const messageRef = useRef<any>(null);
  const bus = useEventEmitter();
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

  /*
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
          bus.current.dispatchEvent("pv-channel-click", {
            id: mention.dataset.id,
          });
        } else {
          bus.current.dispatchEvent("pv-member-click", {
            did: message.author.did,
          });
        }
      };
    }
  }, [messageRef]);
  */

  return (
    <div
      onMouseOver={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
      style={messageStyles}
      isReplying={keyedMessages[currentReply]?.url === message.url}
    >
      {replyMessage && (
        <>
          <div style={{ position: "relative" }}>
            <div style={{ replyLineStyles }} />
          </div>
          <div
            style={{
              display: "flex",
              gap: "var(--j-space-500)",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "var(--j-space-500)",
                alignItems: "center",
              }}
            >
              <j-avatar
                style="--j-avatar-size: 20px"
                hash={replyMessage.author.did}
              ></j-avatar>
              <div>{replyMessage.author.username}</div>
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
              src={message.author.profileImage}
              hash={message.author.did}
              onClick={() => {
                bus.current.dispatchEvent("pv-member-click", {
                  did: message.author.did,
                });
              }}
            ></j-avatar>
          </div>
        ) : (
          <small>
            {new Intl.DateTimeFormat("en-US").format(
              new Date(message.timestamp)
            )}
          </small>
        )}
      </div>
      <div>
        {(replyMessage || showAvatar) && (
          <div style={{ display: "flex", gap: "var(--j-space-300)" }}>
            <div>{message.author.username}</div>
            <small>
              {new Intl.DateTimeFormat("en-US").format(
                new Date(message.timestamp)
              )}
            </small>
          </div>
        )}

        <div
          ref={messageRef}
          className="message-item__content"
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
