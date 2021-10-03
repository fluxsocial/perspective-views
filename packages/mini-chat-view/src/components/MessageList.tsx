import { useState, useContext, useRef, useEffect } from "preact/hooks";
import { ChatContext } from "junto-utils/react";
import MessageItem from "./MessageItem";
import { differenceInMinutes, parseISO } from "date-fns";

import { Virtuoso } from "react-virtuoso";

const mainStyles = {
  flex: "1",
  position: "relative",
};

export default function MessageList() {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const scroller = useRef();

  const {
    state: { messages, isFetchingMessages },
    methods: { loadMore },
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
        overscan={10}
        totalCount={messages.length}
        itemContent={(index) => (
          <MessageItem
            showAvatar={showAvatar(index)}
            index={index}
          ></MessageItem>
        )}
      />
    </main>
  );
}
