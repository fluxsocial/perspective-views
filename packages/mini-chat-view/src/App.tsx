import { useState, useContext, useRef, useEffect } from "preact/hooks";
import VirtualList from "react-tiny-virtual-list";

import {
  ChatProvider,
  ChatContext,
  PerspectiveProvider,
  PerspectiveContext,
} from "junto-utils/react";

const headerStyles = {
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid var(--j-border-color)",
  paddingLeft: "var(--j-space-500)",
  paddingRight: "var(--j-space-500)",
  height: "60px",
};

const mainStyles = {
  flex: "1",
  overflowY: "auto",
};

const footerStyles = {
  padding: "var(--j-space-500",
  borderTop: "1px solid var(--j-border-color",
};

const messageStyles = {
  borderBottom: "1px solid var(--j-border-color)",
  paddingTop: "var(--j-space-400)",
  paddingLeft: "var(--j-space-500)",
  paddingBottom: "var(--j-space-400)",
  display: "flex",
  boxSizing: "border-box",
  gap: "var(--j-space-500)",
  height: "100%",
};

function MainComponent() {
  const [inputValue, setInputValue] = useState("");
  const [scrollToIndex, setScrollToIndex] = useState(undefined);

  const scrollRef = useRef(null);

  const {
    state: { name },
  } = useContext(PerspectiveContext);

  const {
    state: { messages },
    methods: { sendMessage },
  } = useContext(ChatContext);

  function getMessageHeight(index) {
    const message = messages[index];
    const el = document.createElement("div");
    el.innerHTML = message.content;
    el.style.visibility = "hidden";
    document.body.appendChild(el);
    const height = el.clientHeight;
    document.body.removeChild(el);
    return height + 90;
  }

  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      sendMessage(e.target.value);
      setInputValue("");
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header style={headerStyles}># {name}</header>
      <main style={mainStyles}>
        <VirtualList
          ref={scrollRef}
          width="100%"
          height="100%"
          scrollToIndex={scrollToIndex}
          scrollToAlignment="end"
          itemCount={messages.length}
          itemSize={getMessageHeight}
          overscanCount={10}
          renderItem={({ index, style, t = messages[index] }) => (
            <div id={t.id} tabIndex={index + 2} key={index} style={style}>
              <div style={messageStyles}>
                <j-flex>
                  <j-avatar size="sm" hash={t.author.did}></j-avatar>
                </j-flex>
                <div>
                  <j-flex gap="300">
                    <j-text>{t.author.username}</j-text>
                    <j-timestamp value={t.timestamp}></j-timestamp>
                  </j-flex>
                  <div dangerouslySetInnerHTML={{ __html: t.content }}></div>
                </div>
              </div>
            </div>
          )}
        />
      </main>
      <footer style={footerStyles}>
        <textarea
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid var(--j-border-color)",
            fontFamily: "var(--j-font-family)",
            fontSize: "inherit",
            paddingTop: "var(--j-space-400)",
            paddingLeft: "var(--j-space-500)",
          }}
          value={inputValue}
          onInput={(e) => setInputValue(e.target.value)}
          placeholder="Write a message"
          onKeydown={handleKeydown}
        ></textarea>
      </footer>
    </div>
  );
}

export default function App({ perspectiveUuid = "" }) {
  return (
    <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
      <ChatProvider perspectiveUuid={perspectiveUuid}>
        <MainComponent></MainComponent>
      </ChatProvider>
    </PerspectiveProvider>
  );
}
