import Header from "./components/Header";
import Footer from "./components/Footer";
import MessageList from "./components/MessageList";
import { forwardRef } from 'preact/compat';

import {
  ChatProvider,
  PerspectiveProvider,
  AgentProvider,
} from "junto-utils/react";
import { UIProvider } from "./context/UIContext";
import { useRef } from "preact/hooks";

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

const MainComponent = forwardRef(({ perspectiveUuid }: {perspectiveUuid: any}, ref) => {
  return (
    <div style={containerStyles} ref={ref}>
      <style>{style}</style>
      <Header />
      <MessageList perspectiveUuid={perspectiveUuid} mainRef={ref} />
      <Footer />
    </div>
  );
})


export default ({ perspectiveUuid = "" }) => {
  const ref = useRef();
  
  return (
    <UIProvider>
      <AgentProvider>
        <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
          <ChatProvider perspectiveUuid={perspectiveUuid}>
            <MainComponent perspectiveUuid={perspectiveUuid} ref={ref}></MainComponent>
          </ChatProvider>
        </PerspectiveProvider>
      </AgentProvider>
    </UIProvider>
  );
}
