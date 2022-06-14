import Header from "./components/Header";
import Footer from "./components/Footer";
import MessageList from "./components/MessageList";

import {
  ChatProvider,
  PerspectiveProvider,
  AgentProvider,
} from "junto-utils/react";
import { UIProvider } from "./context/UIContext";
import { useState } from "preact/hooks";
import styles from "./index.scss";
import { MainClient } from "junto-utils/api/client";

const MainComponent = ({ perspectiveUuid }) => {
  const [ref, setRef] = useState(null);

  return (
    <div class={styles.container} ref={setRef}>
      <Header />
      <MessageList perspectiveUuid={perspectiveUuid} mainRef={ref} />
      <Footer />
    </div>
  );
};

export default ({ perspectiveUuid = "", port }) => {
  MainClient.setPort(parseInt(port));

  return (
    <UIProvider>
      <AgentProvider>
        <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
          <ChatProvider perspectiveUuid={perspectiveUuid}>
            <MainComponent perspectiveUuid={perspectiveUuid}></MainComponent>
          </ChatProvider>
        </PerspectiveProvider>
      </AgentProvider>
    </UIProvider>
  );
};
