import { ChatContext } from "junto-utils/react";
import { useContext, useState } from "preact/hooks";
import TipTap from "./TipTap";

const footerStyles = {
  background: "var(--j-color-white)",
  padding: "var(--j-space-500)",
  borderTop: "1px solid var(--j-border-color)",
};

export default function Footer() {
  const [inputValue, setInputValue] = useState("");

  const {
    methods: { sendMessage },
  } = useContext(ChatContext);

  function handleSendMessage() {
    sendMessage("Heisann");
    setInputValue("");
  }

  return (
    <footer style={footerStyles}>
      <TipTap
        value={inputValue}
        onChange={(val) => setInputValue(val)}
        onSend={handleSendMessage}
      ></TipTap>
    </footer>
  );
}
