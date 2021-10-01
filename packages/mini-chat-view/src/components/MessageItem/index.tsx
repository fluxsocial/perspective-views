import { useContext } from "preact/hooks";
import { ChatContext } from "junto-utils/react";
import { Reaction } from "junto-utils/types";
import getMe from "junto-utils/api/getMe";
import styled, { css } from "styled-components";

import MessageToolbar from "./MessageToolbar";
import MessageReactions from "./MessageReactions";
import UIContext from "../../context/UIContext";

const Message = styled.div`
  padding-top: var(--j-space-400);
  padding-left: var(--j-space-500);
  padding-bottom: var(--j-space-400);
  display: grid;
  position: relative;
  grid-template-columns: 60px 1fr;
  column-gap: var(--j-space-500);

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

  & .toolbar {
    opacity: 0;
  }

  &:hover .toolbar {
    opacity: 1;
  }
`;

export default function MessageItem({ index, style, showAvatar }) {
  const {
    state: { messages, keyedMessages },
    methods: { addReaction, removeReaction },
  } = useContext(ChatContext);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const message = messages[index];

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

  return (
    <div id={message.id} key={index} style={style}>
      <Message isReplying={keyedMessages[currentReply]?.url === message.url}>
        <div>
          {showAvatar ? (
            <j-flex>
              <j-avatar hash={message.author.did}></j-avatar>
            </j-flex>
          ) : (
            <j-timestamp
              className="timestamp-left"
              style={{ fontSize: "var(--j-font-size-300)" }}
              hour="numeric"
              minute="numeric"
              value={message.timestamp}
            ></j-timestamp>
          )}
        </div>
        <div>
          {showAvatar && (
            <j-flex gap="300">
              <j-text>{message.author.username}</j-text>
              <j-timestamp
                style={{ fontSize: "var(--j-font-size-300)" }}
                relative
                value={message.timestamp}
              ></j-timestamp>
            </j-flex>
          )}
          <div dangerouslySetInnerHTML={{ __html: message.content }}></div>
          {message.reactions.length > 0 && (
            <j-box pt="400">
              <MessageReactions
                onEmojiClick={onEmojiClick}
                reactions={message.reactions}
              />
            </j-box>
          )}
        </div>
        <div className="toolbar">
          <MessageToolbar
            onReplyClick={onReplyClick}
            onEmojiClick={onEmojiClick}
          />
        </div>
      </Message>
    </div>
  );
}
