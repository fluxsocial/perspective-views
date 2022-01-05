import { useState, useContext, useRef, useEffect } from "preact/hooks";
import { ChatContext, useEventEmitter } from "junto-utils/react";
import MessageItem from "./MessageItem";
import getMe from "junto-utils/api/getMe";
import { differenceInMinutes, parseISO } from "date-fns";
import tippy from "tippy.js";
import { Virtuoso } from "react-virtuoso";
import {h, Component, createRef} from 'preact'

const mainStyles = {
  flex: "1",
  position: "relative",
};

export default function MessageList({perspectiveUuid}) {
  const emojiPicker = useRef(document.createElement("emoji-picker"));
  const [atBottom, setAtBottom] = useState(true);
  const [initialScroll, setinitialScroll] = useState(false);
  const scroller = useRef();
  const bus = useEventEmitter();

  const {
    state: { messages, isFetchingMessages, scrollPosition, hasNewMessage },
    methods: { loadMore, removeReaction, addReaction, saveScrollPos, setHasNewMessage },
  } = useContext(ChatContext);

  useEffect(() => {
    if (scroller.current && messages.length > 0 && !initialScroll) {
      scroller.current.scrollToIndex({
        index: scrollPosition,
      });

      setinitialScroll(true)
    }
  }, [messages, initialScroll, scrollPosition]);

  useEffect(() => {
    if (atBottom && hasNewMessage) {
      scrollToBottom();
      bus.current.dispatchEvent("hide-notification-indicator", perspectiveUuid);
    } 
  }, [hasNewMessage, atBottom])

  useEffect(() => {
    if (atBottom) {
      bus.current.dispatchEvent("hide-notification-indicator", perspectiveUuid);
    }
  }, [atBottom]);

  function scrollToBottom() {
    if (scroller.current) {
      scroller.current.scrollToIndex({
        index: messages.length - 1,
      });
      setHasNewMessage(false);
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

  const rangeChanged = ({startIndex}) => {

    if (typeof startIndex === "number") {
      saveScrollPos(startIndex);
    }
  }

  return (
    <main style={mainStyles}>
      {(hasNewMessage && !atBottom) && (
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
        atBottomStateChange={(atBottom) => {
          if (atBottom) {
            setHasNewMessage(false);
          }
          setAtBottom(atBottom)
        }}
        style={{ height: "100%" }}
        overscan={20}
        totalCount={messages.length}
        rangeChanged={rangeChanged}
        initialTopMostItemIndex={scrollPosition}
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
