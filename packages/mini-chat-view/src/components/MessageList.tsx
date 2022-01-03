import { useState, useContext, useRef, useEffect } from "preact/hooks";
import { ChatContext } from "junto-utils/react";
import MessageItem from "./MessageItem";
import getMe from "junto-utils/api/getMe";
import { differenceInMinutes, parseISO } from "date-fns";
import tippy from "tippy.js";

import { Virtuoso } from "react-virtuoso";

const mainStyles = {
  flex: "1",
  position: "relative",
};

export default function MessageList() {
  const emojiPicker = useRef(document.createElement("emoji-picker"));
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const scroller = useRef();

  const {
    state: { messages, isFetchingMessages },
    methods: { loadMore, removeReaction, addReaction },
  } = useContext(ChatContext);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  function scrollToBottom() {
    if (scroller.current) {
      scroller.current.scrollToIndex({
        index: messages.length - 1,
      });
      setHasUnreadMessages(false);
    }
  }

  function showAvatar(index: number): boolean {
    const previousMessage = messages[index - 1];
    const message = messages[index];

    if (!previousMessage || !message) {
      return true;
    } else {
      return previousMessage.author.did !== message.author.did
        ? true
        : previousMessage.author.did === message.author.did &&
            differenceInMinutes(
              parseISO(message.timestamp),
              parseISO(previousMessage.timestamp)
            ) >= 2;
    }
  }

  function openEmojiPicker(e: any, index: number) {
    emojiPicker.current.setAttribute("message-index", index.toString());
    const instance = tippy(e.target as HTMLElement, {
      content: emojiPicker.current,
      trigger: "click",
      appendTo: document.body,
      interactive: true,
      onShow: () => {
        emojiPicker.current.addEventListener("emoji-click", onEmojiClick);
      },
      onHide: () => {
        emojiPicker.current.removeEventListener("emoji-click", onEmojiClick);
      },
    });
    instance.show();
  }

  async function onEmojiClick(e: any) {
    const unicode = e.detail.unicode;
    const index = e.target.getAttribute("message-index");
    const message = messages[parseInt(index)];

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
    <main style={mainStyles}>
      {hasUnreadMessages && (
        <j-button
          variant="primary"
          onClick={scrollToBottom}
          style={{
            position: "absolute",
            top: "var(--j-space-500)",
            left: "50%",
            zIndex: "10",
            transform: "translateX(-50%)",
          }}
        >
          New messages
        </j-button>
      )}
      <Virtuoso
        components={{
          Header: () => (
            <j-box py="500">
              <j-flex a="center" j="center">
                {isFetchingMessages ? (
                  <j-flex a="center" gap="300">
                    <span>Loading</span>
                    <j-spinner size="xxs"></j-spinner>
                  </j-flex>
                ) : (
                  <j-button size="sm" onClick={loadMore} variant="subtle">
                    Load more
                  </j-button>
                )}
              </j-flex>
            </j-box>
          ),
        }}
        ref={scroller}
        alignToBottom
        startReached={() => console.log("start reached")}
        endReached={() => setHasUnreadMessages(false)}
        style={{ height: "100%" }}
        overscan={20}
        totalCount={messages.length}
        itemContent={(index) => {
          return (
            <MessageItem
              onOpenEmojiPicker={(unicode) => openEmojiPicker(unicode, index)}
              showAvatar={showAvatar(index)}
              index={index}
            />
          );
        }}
      />
    </main>
  );
}
