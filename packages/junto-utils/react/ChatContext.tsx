import React, { createContext, useState, useEffect, useRef } from "react";
import { Messages, Message } from "../types";
import getMessages from "../api/getMessages";
import createMessage from "../api/createMessage";
import subscribeToLinks from "../api/subscribeToLinks";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import getMessage from "../api/getMessage";
import { linkIs } from "../helpers/linkHelpers";
import {
  PROFILE_EXPRESSION,
  SHORT_FORM_EXPRESSION,
} from "../constants/languages";
import { sortExpressionsByTimestamp } from "../helpers/expressionHelpers";

type State = {
  keyedMessages: Messages;
};

type ContextProps = {
  state: State;
  methods: {
    sendMessage: (message: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    keyedMessages: {},
  },
  methods: {
    sendMessage: () => null,
  },
};

const ChatContext = createContext(initialState);

export function ChatProvider({ perspectiveUuid, children }: any) {
  const [shortFormHash, setShortFormHash] = useState("");
  const [profileHash, setProfileHash] = useState("");

  const [state, setState] = useState(initialState.state);

  const messages = sortExpressionsByTimestamp(state.keyedMessages, "asc");

  useEffect(() => {
    fetchLanguages();
    fetchMessages();
  }, []);

  useEffect(() => {
    if (profileHash) {
      subscribeToLinks({
        perspectiveUuid,
        added: handleLinkAdded,
        removed: handleLinkRemoved,
      });
    }
  }, [profileHash]);

  async function fetchLanguages() {
    const { languages } = await getPerspectiveMeta(perspectiveUuid);
    setShortFormHash(languages[SHORT_FORM_EXPRESSION]);
    setProfileHash(languages[PROFILE_EXPRESSION]);
  }

  function addMessage(oldState, message) {
    const newMessages = {
      ...oldState.keyedMessages,
      [message.id]: { ...message },
    };
    const newState = {
      ...oldState,
      keyedMessages: newMessages,
    };
    sessionStorage.setItem("messages", JSON.stringify(newMessages));
    return newState;
  }

  async function handleLinkAdded(link) {
    if (linkIs.message(link)) {
      console.log(profileHash);
      const message = await getMessage({
        link,
        perspectiveUuid: perspectiveUuid,
        profileLangAddress: profileHash,
      });

      setState((oldVal) => addMessage(oldVal, message));
    }
  }

  async function handleLinkRemoved(link) {}

  async function fetchMessages() {
    const cachedMessages = sessionStorage.getItem("messages");
    if (cachedMessages) {
      const msgs = JSON.parse(cachedMessages);
      setState({
        ...state,
        keyedMessages: msgs,
      });
    }
    const res = await getMessages({ perspectiveUuid });
    setState({
      ...state,
      keyedMessages: res,
    });
    sessionStorage.setItem("messages", JSON.stringify(res));
  }

  function sendMessage(value) {
    createMessage({
      perspectiveUuid,
      languageAddress: shortFormHash,
      message: { background: [""], body: value },
    });
  }

  return (
    <ChatContext.Provider
      value={{
        state: { ...state, messages },
        methods: {
          sendMessage,
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
