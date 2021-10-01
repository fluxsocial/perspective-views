import Header from "./components/Header";
import Footer from "./components/Footer";
import MessageList from "./components/MessageList";

import {
  ChatProvider,
  PerspectiveProvider,
  AgentProvider,
} from "junto-utils/react";

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
    <AgentProvider>
      <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
        <ChatProvider perspectiveUuid={perspectiveUuid}>
          <MainComponent></MainComponent>
        </ChatProvider>
      </PerspectiveProvider>
    </AgentProvider>
  );
}
