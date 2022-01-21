
import { useState, useContext, useRef, useEffect } from "preact/hooks";
import { ChatContext } from "junto-utils/react";
import MessageItem from "../MessageItem";
import getMe from "junto-utils/api/getMe";
import { differenceInMinutes, parseISO } from "date-fns";
import tippy from "tippy.js";
import { Virtuoso } from "react-virtuoso";
import { h, Component, createRef } from "preact";
import ReactHintFactory from "react-hint";
const ReactHint = ReactHintFactory({ createElement: h, Component, createRef });
import "react-hint/css/index.css";
import styles from "./index.scss";

export default function MessageList({ perspectiveUuid, mainRef }) {
  const emojiPicker = useRef(document.createElement("emoji-picker"));
  const [atBottom, setAtBottom] = useState(true);
  const [initialScroll, setinitialScroll] = useState(false);
  const scroller = useRef();

  const {
    state: { messages, isFetchingMessages, scrollPosition, hasNewMessage, isMessageFromSelf },
    methods: {
      loadMore,
      removeReaction,
      addReaction,
      saveScrollPos,
      setHasNewMessage,
    },
  } = useContext(ChatContext);

  useEffect(() => {
    if (scroller.current && messages.length > 0 && !initialScroll) {
      if (!scrollPosition) {
        scroller.current.scrollToIndex({
          index: messages.length,
        });
      } else {
        scroller.current.scrollToIndex({
          index: scrollPosition,
        });
      }

      setinitialScroll(true);
    }
  }, [messages, initialScroll, scrollPosition]);

  useEffect(() => {
    if (atBottom && hasNewMessage) {
      scrollToBottom();
      const event = new CustomEvent("hide-notification-indicator", {
        detail: { uuid: perspectiveUuid },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
    }
  }, [hasNewMessage, atBottom]);

  useEffect(() => {
    if (isMessageFromSelf) {
      scrollToBottom();
      const event = new CustomEvent("hide-notification-indicator", {
        detail: { uuid: perspectiveUuid },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
    }
  }, [isMessageFromSelf]);

  useEffect(() => {
    if (atBottom) {
      const event = new CustomEvent("hide-notification-indicator", {
        detail: { uuid: perspectiveUuid },
        bubbles: true,
      });
      mainRef?.dispatchEvent(event);
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
      return previousMessage.author !== message.author
        ? true
        : previousMessage.author === message.author &&
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

  const rangeChanged = ({ startIndex }) => {
    if (typeof startIndex === "number" && initialScroll) {
      saveScrollPos(startIndex);
    }
  };

  return (
    <main class={styles.main}>
      {hasNewMessage && !atBottom && (
        <j-button
          class={styles.newMessagesButton}
          variant="primary"
          onClick={scrollToBottom}
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
          setAtBottom(atBottom);
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
              mainRef={mainRef}
            />
          );
        }}
      />
      <ReactHint
        position="right"
        className={styles.reactHint}
        events={{ hover: true }}
        onRenderContent={(target) => (
          <div>
            <span>{target.dataset["timestamp"]}</span>
            <div class={styles.arrow}></div>
          </div>
        )}
      />
    </main>
  );
}
