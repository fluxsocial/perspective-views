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
    state: { messages },
  } = useContext(ChatContext);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  function scrollToBottom() {
    if (scroller.current) {
      scroller.current.scrollToIndex({
        index: messages.length - 1,
        behavior: "smooth",
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

  function loadMore() {
    console.log("loadmore");
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
        ref={scroller}
        startReached={loadMore}
        overscan={10}
        endReached={() => setHasUnreadMessages(false)}
        style={{ height: "100%" }}
        totalCount={messages.length}
        itemContent={(index) => (
          <MessageItem index={index} showAvatar={showAvatar(index)} />
        )}
      />
    </main>
  );
}
