import { useContext, useEffect, useRef } from "preact/hooks";
import { ChatContext } from "junto-utils/react";
import { Reaction } from "junto-utils/types";
import getMe from "junto-utils/api/getMe";
import styled from "styled-components";
import tippy from "tippy.js";

const Message = styled.div`
  padding-top: var(--j-space-400);
  padding-left: var(--j-space-500);
  padding-bottom: var(--j-space-400);
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: var(--j-space-500);

  &:hover {
    background: var(--j-color-ui-50);
  }

  & .timestamp-left {
    opacity: 0;
  }

  &:hover .timestamp-left {
    opacity: 1;
  }
`;

function sortReactions(reactions) {
  const mapped = reactions.reduce((acc: any, reaction: any) => {
    const previous = acc[reaction.data.target] || { authors: [], count: 0 };
    return {
      ...acc,
      [reaction.data.target]: {
        authors: [...previous.authors, reaction.author],
        content: reaction.data.target,
        count: previous.count + 1,
      },
    };
  }, {});
  return Object.values(mapped);
}

export default function MessageItem({ index, style, showAvatar }) {
  const {
    state: { messages },
    methods: { addReaction, removeReaction },
  } = useContext(ChatContext);

  const message = messages[index];

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
      <Message>
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
        </div>
        <MessageToolbar onEmojiClick={onEmojiClick} />
        <MessageReactions
          onEmojiClick={onEmojiClick}
          reactions={message.reactions}
        />
      </Message>
    </div>
  );
}

function MessageToolbar({ onEmojiClick }) {
  const emojiButton = useRef();
  const emojiPicker = useRef(document.createElement("emoji-picker"));

  useEffect(() => {
    emojiPicker.current.style.display = "block";
    tippy(emojiButton.current as HTMLElement, {
      content: emojiPicker.current,
      trigger: "click",
      appendTo: document.body,
      interactive: true,
      onShow: () => {
        this.toolbarOpen = true;
      },
      onHide: () => {
        this.toolbarOpen = false;
      },
    });
  }, []);

  function handleEmojiClick(e) {
    console.log("what the fuck");
    console.log(e.detail.unicode);
    onEmojiClick(e.detail.unicode);
  }

  useEffect(() => {
    emojiPicker.current.addEventListener("emoji-click", (e) =>
      handleEmojiClick(e)
    );
    return emojiPicker.current.removeEventListener(
      "emoji-click",
      handleEmojiClick
    );
  }, []);

  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        right: "var(--j-space-500)",
      }}
    >
      <j-tooltip placement="top" title="Add reaction">
        <j-button ref={emojiButton} variant="ghost" size="sm">
          😀
        </j-button>
      </j-tooltip>
      <j-tooltip placement="top" title="Reply">
        <j-button onClick="onReplyClick" variant="ghost" size="sm">
          ⤵️
        </j-button>
      </j-tooltip>
    </div>
  );
}

function MessageReactions({ onEmojiClick, reactions = [] }) {
  const sortedReactions = sortReactions(reactions);

  return (
    <div>
      {sortedReactions.map((reaction: any, i) => {
        return (
          <button onClick={() => onEmojiClick(reaction.content)} key={i}>
            <span>{reaction.content}</span>
            <span>{reaction.count}</span>
          </button>
        );
      })}
    </div>
  );
}
