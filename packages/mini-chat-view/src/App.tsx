import Header from "./components/Header";
import Footer from "./components/Footer";
import MessageList from "./components/MessageList";
import { forwardRef } from "preact/compat";

import {
  ChatProvider,
  PerspectiveProvider,
  AgentProvider,
} from "junto-utils/react";
import { UIProvider } from "./context/UIContext";
import { useRef } from "preact/hooks";
import styles from "./index.scss";

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

const MainComponent = forwardRef(
  ({ perspectiveUuid }: { perspectiveUuid: any }, ref) => {
    return (
      <div class={styles.container} ref={ref}>
        <style>{style}</style>
        <Header />
        <MessageList perspectiveUuid={perspectiveUuid} mainRef={ref} />
        <Footer />
      </div>
    );
  }
);

export default ({ perspectiveUuid = "" }) => {
  const ref = useRef();

  return (
    <UIProvider>
      <AgentProvider>
        <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
          <ChatProvider perspectiveUuid={perspectiveUuid}>
            <MainComponent
              perspectiveUuid={perspectiveUuid}
              ref={ref}
            ></MainComponent>
          </ChatProvider>
        </PerspectiveProvider>
      </AgentProvider>
    </UIProvider>
  );
};
