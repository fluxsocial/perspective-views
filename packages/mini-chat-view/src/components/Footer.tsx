import { ChatContext } from "junto-utils/react";
import { useContext, useState } from "preact/hooks";
import TipTap from "./TipTap";

const footerStyles = {
  background: "var(--j-color-white)",
  padding: "0 var(--j-space-500) var(--j-space-400) var(--j-space-500)",
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
