import { useContext, useEffect, useRef } from "preact/hooks";
import { ChatContext, useEventEmitter } from "junto-utils/react";
import { Reaction } from "junto-utils/types";
import getMe from "junto-utils/api/getMe";
import styled, { css } from "styled-components";

import MessageToolbar from "./MessageToolbar";
import MessageReactions from "./MessageReactions";
import UIContext from "../../context/UIContext";

const ReplyLine = styled.div`
  display: block;
  position: absolute;
  top: 50%;
  right: 0;
  width: 70%;
  height: 15px;
  border-left: 2px solid var(--j-color-ui-200);
  border-top: 2px solid var(--j-color-ui-200);
  border-top-left-radius: var(--j-border-radius);
`;

const Message = styled.div`
  padding-top: var(--j-space-400);
  padding-left: var(--j-space-500);
  padding-bottom: var(--j-space-400);
  display: grid;
  position: relative;
  grid-template-columns: 60px 1fr;
  column-gap: var(--j-space-500);
  row-gap: var(--j-space-300);

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  ${(props) =>
    props.isReplying &&
    css`
      background: var(--j-color-primary-50);
      &:hover {
        background: var(--j-color-primary-50);
      }
    `}

  & .timestamp-left {
    opacity: 0;
  }

  &:hover .timestamp-left {
    opacity: 1;
  }

  & .chat-view-toolbar {
    position: absolute;
    opacity: 0;
    position: absolute;
    right: 0;
    top: 0;
    height: 40px;
    background: none;
    -webkit-app-region: drag;
  }

  &:hover .chat-view-toolbar {
    opacity: 1;
  }

  & .message-item__content p:first-of-type {
    margin-top: 0;
  }

  & .message-item__content p:last-of-type {
    margin-bottom: 0;
  }
`;

export default function MessageItem({ index, showAvatar }) {
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
        if (mention.innerText.startsWith('#')) {
          bus.current.dispatchEvent("pv-channel-click", {id: mention.dataset.id})
        } else {
          bus.current.dispatchEvent("pv-member-click", {did: message.author.did})
        }
      };
    }
  }, [messageRef])

  return (
    <Message isReplying={keyedMessages[currentReply]?.url === message.url}>
      {replyMessage && (
        <>
          <div style={{ position: "relative" }}>
            <ReplyLine />
          </div>
          <j-flex gap="300" a="center">
            <j-flex a="center" gap="300">
              <j-avatar
                style="--j-avatar-size: 20px"
                hash={replyMessage.author.did}
              ></j-avatar>
              <j-text nomargin>{replyMessage.author.username}</j-text>
            </j-flex>
            <div
              style="font-size: var(--j-font-size-400)"
              dangerouslySetInnerHTML={{ __html: replyMessage.content }}
            ></div>
          </j-flex>
        </>
      )}
      <div>
        {replyMessage || showAvatar ? (
          <j-flex>
            <j-avatar
              src={message.author.profileImage}
              hash={message.author.did}
              onClick={() => {
                bus.current.dispatchEvent("pv-member-click", {did: message.author.did})
              }}
            ></j-avatar>
          </j-flex>
        ) : (
          <j-tooltip>
            <j-timestamp
              slot="title"
              value={message.timestamp}
              dateStyle="medium"
              timeStyle="short"
            ></j-timestamp>
            <j-timestamp
              className="timestamp-left"
              style={{ fontSize: "var(--j-font-size-300)" }}
              hour="numeric"
              minute="numeric"
              value={message.timestamp}
            ></j-timestamp>
          </j-tooltip>
        )}
      </div>
      <div>
        {(replyMessage || showAvatar) && (
          <j-flex gap="300">
            <j-text>{message.author.username}</j-text>
            <j-tooltip>
              <j-timestamp
                slot="title"
                value={message.timestamp}
                dateStyle="medium"
                timeStyle="short"
              ></j-timestamp>
              <j-timestamp
                style={{ fontSize: "var(--j-font-size-300)" }}
                relative
                value={message.timestamp}
              ></j-timestamp>
            </j-tooltip>
          </j-flex>
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
      <div className="chat-view-toolbar">
        <MessageToolbar
          onReplyClick={onReplyClick}
          onEmojiClick={onEmojiClick}
        />
      </div>
    </Message>
  );
}
