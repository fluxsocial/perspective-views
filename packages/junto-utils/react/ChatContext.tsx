import React, { createContext, useState, useEffect, useRef } from "react";
import { Messages, Message } from "../types";
import { Link, LinkExpression } from "@perspect3vism/ad4m";
import getMessages from "../api/getMessages";
import createMessage from "../api/createMessage";
import subscribeToLinks from "../api/subscribeToLinks";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import getMessage from "../api/getMessage";
import { linkIs } from "../helpers/linkHelpers";
import deleteMessageReaction from "../api/deleteMessageReaction";
import createMessageReaction from "../api/createMessageReaction";
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
    removeReaction: (linkExpression: LinkExpression) => void;
    addReaction: (messageUrl: string, reaction: string) => void;
    sendMessage: (message: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    keyedMessages: {},
  },
  methods: {
    removeReaction: () => null,
    addReaction: () => null,
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

  // Save every change to keyedMessages to localstorage
  // This might be a it slow?
  useEffect(() => {
    console.log("setting new state");
    sessionStorage.setItem("messages", JSON.stringify(state.keyedMessages));
  }, [JSON.stringify(state.keyedMessages)]);

  async function fetchLanguages() {
    const { languages } = await getPerspectiveMeta(perspectiveUuid);
    setShortFormHash(languages[SHORT_FORM_EXPRESSION]);
    setProfileHash(languages[PROFILE_EXPRESSION]);
  }

  function addMessage(oldState, message) {
    const newState = {
      ...oldState,
      keyedMessages: {
        ...oldState.keyedMessages,
        [message.id]: { ...message },
      },
    };
    return newState;
  }

  async function handleLinkAdded(link) {
    console.log("handle link added", link);
    if (linkIs.message(link)) {
      const message = await getMessage({
        link,
        perspectiveUuid: perspectiveUuid,
        profileLangAddress: profileHash,
      });

      setState((oldState) => addMessage(oldState, message));
    }

    if (linkIs.reaction(link)) {
      const id = link.data.source;

      setState((oldState) => {
        const message = oldState.keyedMessages[id];

        return {
          ...oldState,
          keyedMessages: {
            ...oldState.keyedMessages,
            [id]: {
              ...message,
              reactions: [...message.reactions, { ...link }],
            },
          },
        };
      });
    }
  }

  async function handleLinkRemoved(link) {
    console.log("handle link removed", link);
    //TODO: link.proof.valid === false when we recive
    // the remove link somehow. Ad4m bug?
    if (link.data.predicate === "sioc://reaction_to") {
      const id = link.data.source;

      setState((oldState) => {
        const message = oldState.keyedMessages[id];

        return {
          ...oldState,
          keyedMessages: {
            ...oldState.keyedMessages,
            [id]: {
              ...message,
              reactions: message.reactions.filter(
                (reaction) => reaction.data.target !== link.data.target
              ),
            },
          },
        };
      });
    }
  }

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
  }

  async function sendMessage(value) {
    // TODO: Why is sendMessage initialized with old shortformhas value
    const { languages } = await getPerspectiveMeta(perspectiveUuid);

    createMessage({
      perspectiveUuid,
      languageAddress: languages[SHORT_FORM_EXPRESSION],
      message: { background: [""], body: value },
    });
  }

  async function addReaction(messageUrl: string, reaction: string) {
    console.log("addReaction");
    createMessageReaction({
      perspectiveUuid,
      messageUrl,
      reaction,
    });
  }

  async function removeReaction(linkExpression: LinkExpression) {
    console.log("removeReaction", linkExpression);
    return deleteMessageReaction({
      perspectiveUuid,
      linkExpression,
    });
  }

  return (
    <ChatContext.Provider
      value={{
        state: { ...state, messages },
        methods: {
          sendMessage,
          addReaction,
          removeReaction,
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
