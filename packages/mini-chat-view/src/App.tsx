import Header from "./components/Header";
import Footer from "./components/Footer";
import MessageList from "./components/MessageList";

import {
  ChatProvider,
  PerspectiveProvider,
  AgentProvider,
} from "junto-utils/react";
import { UIProvider } from "./context/UIContext";
import { createRef } from "preact";

const containerStyles = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const style = `
.ProseMirror p:first-of-type {
  padding-top: 0;
  margin-top: 0;
}
.ProseMirror p:last-of-type {
  padding-bottom: 0;
  margin-bottom: 0;
}

emoji-picker {
  --background: var(--j-color-white);
  --border-color: var(--j-border-color);
  --indicator-color: #385ac1;
  --input-border-color: #999;
  --input-font-color: #111;
  --input-placeholder-color: #999;
  --outline-color: #999;
  --category-font-color: #111;
  --button-active-background: #e6e6e6;
  --button-hover-background: #d9d9d9;
}

`;

function MainComponent() {
  return (
    <div style={containerStyles}>
      <style>{style}</style>
      <Header />
      <MessageList />
      <Footer />
    </div>
  );
}

export default function App({ perspectiveUuid = "" }) {
  return (
    <UIProvider>
      <AgentProvider>
        <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
          <ChatProvider perspectiveUuid={perspectiveUuid}>
            <MainComponent ></MainComponent>
          </ChatProvider>
        </PerspectiveProvider>
      </AgentProvider>
    </UIProvider>
  );
}
