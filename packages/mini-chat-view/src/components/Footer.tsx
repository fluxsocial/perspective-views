import { ChatContext } from "junto-utils/react";
import { useContext, useState } from "preact/hooks";
import UIContext from "../context/UIContext";
import TipTap from "./TipTap";

const footerStyles = {
  position: "relative",
  background: "var(--j-color-white)",
  borderTop: "1px solid var(--j-border-color)",
  padding:
    "var(--j-space-400) var(--j-space-500) var(--j-space-400) var(--j-space-500)",
};

export default function Footer() {
  const [inputValue, setInputValue] = useState("");

  const {
    state: { keyedMessages },
    methods: { sendMessage },
  } = useContext(ChatContext);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  function handleSendMessage(value) {
    console.log(value);
    sendMessage(value);
    setInputValue("");
  }

  const currentReplyMessage = keyedMessages[currentReply];

  return (
    <footer style={footerStyles}>
      {currentReply && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "var(--j-space-400)",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          <j-text size="400" nomargin>
            Replying to @{currentReplyMessage.author.username}
          </j-text>
          <j-button
            onClick={() => setCurrentReply("")}
            square
            circle
            size="xs"
            variant="subtle"
          >
            <j-icon size="sm" name="x"></j-icon>
          </j-button>
        </div>
      )}
      <TipTap
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
      ></TipTap>
    </footer>
  );
}
