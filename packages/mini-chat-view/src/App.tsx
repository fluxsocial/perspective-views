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

const MainComponent = forwardRef(
  ({ perspectiveUuid }: { perspectiveUuid: string }, ref) => {
    return (
      <div class={styles.container} ref={ref}>
        <Header />
        <MessageList perspectiveUuid={perspectiveUuid} mainRef={ref} />
        <Footer />
      </div>
    );
  }
);

export default ({ perspectiveUuid = "", sourcePerspectiveUuid = "" }) => {
  const ref = useRef();

  return (
    <UIProvider>
      <AgentProvider>
        <PerspectiveProvider 
          perspectiveUuid={perspectiveUuid} 
          sourcePerspectiveUuid={sourcePerspectiveUuid}
        >
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
