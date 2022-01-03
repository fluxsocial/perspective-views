import { ChatContext, PerspectiveContext } from "junto-utils/react";
import { useContext, useMemo, useState } from "preact/hooks";
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
  const { state: { members, channels, url } } = useContext(PerspectiveContext);
  console.log('test 103', members, channels)
  const [inputValue, setInputValue] = useState("");

  const {
    state: { keyedMessages },
    methods: { sendMessage, sendReply },
  } = useContext(ChatContext);

  const {
    state: { currentReply },
    methods: { setCurrentReply },
  } = useContext(UIContext);

  const currentReplyMessage = keyedMessages[currentReply];

  function handleSendMessage(value) {
    if (currentReplyMessage) {
      sendReply(value, currentReplyMessage.url);
    } else {
      sendMessage(value);
    }

    setInputValue("");
    setCurrentReply("");
  }
  

  const mentionMembers = useMemo(() => {
    return Object.values(members).map((user: any) => {
      return {
        label: user.username,
        id: user.did,
        trigger: "@",
      };
    });
  }, [members]);

  console.log(mentionMembers)

  const mentionChannels = useMemo(() => {
    return Object.values(channels).map((channel: any) => {
      if (channel.url === url) {        
        return {
          label: "Home",
          id: channel.url,
          trigger: "#",
        };
      } else {
        return {
          label: channel.name,
          id: channel.url,
          trigger: "#",
        };
      }
    });
  }, [channels]);

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
        members={mentionMembers} 
        channels={mentionChannels}
      ></TipTap>
    </footer>
  );
}
