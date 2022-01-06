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
import createReply from "../api/createReply";
import {
  PROFILE_EXPRESSION,
  SHORT_FORM_EXPRESSION,
} from "../constants/languages";
import { sortExpressionsByTimestamp } from "../helpers/expressionHelpers";

type State = {
  isFetchingMessages: boolean;
  keyedMessages: Messages;
  scrollPosition?: number;
  hasNewMessage: boolean;
};

type ContextProps = {
  state: State;
  methods: {
    loadMore: () => void;
    sendReply: (message: string, replyUrl: string) => void;
    removeReaction: (linkExpression: LinkExpression) => void;
    addReaction: (messageUrl: string, reaction: string) => void;
    sendMessage: (message: string) => void;
    saveScrollPos: (pos?: number) => void;
    setHasNewMessage: (value: boolean) => void;
  };
};

const initialState: ContextProps = {
  state: {
    isFetchingMessages: false,
    keyedMessages: {},
    scrollPosition: 0,
    hasNewMessage: false
  },
  methods: {
    loadMore: () => null,
    sendReply: () => null,
    removeReaction: () => null,
    addReaction: () => null,
    sendMessage: () => null,
    saveScrollPos: () => null,
    setHasNewMessage: () => null
  },
};

const ChatContext = createContext(initialState);

export function ChatProvider({ perspectiveUuid, children }: any) {
  const [shortFormHash, setShortFormHash] = useState("");
  const [profileHash, setProfileHash] = useState("");
  const messageInterval = useRef();

  const [state, setState] = useState(initialState.state);

  const messages = sortExpressionsByTimestamp(state.keyedMessages, "asc");

  useEffect(() => {
    if (perspectiveUuid) {    
      fetchLanguages();
      fetchMessages();
    }
  }, [perspectiveUuid]);

  useEffect(() => {
    if (profileHash) {
      subscribeToLinks({
        perspectiveUuid,
        added: handleLinkAdded,
        removed: handleLinkRemoved,
      });
    }
  }, [profileHash]);

  useEffect(() => {
    messageInterval.current = setInterval(async () => {
      const oldestMessage = messages[0];
      const latestMessage = messages[messages.length - 1];
      await fetchMessages({
        from: oldestMessage ? new Date(oldestMessage.timestamp) : new Date(),
        to: latestMessage ? new Date(latestMessage.timestamp) : new Date(),
      });
    }, 60000);

    return () => {
      clearInterval(messageInterval.current);
    }
  }, []);

  // Save every change to keyedMessages to localstorage
  // This might be a it slow?
  useEffect(() => {
    console.log("setting new state");
    const perspective = {
      messages: state.keyedMessages,
      scrollPosition: state.scrollPosition
    }
    sessionStorage.setItem(`chat-perspective-${perspectiveUuid}`, JSON.stringify(perspective));
  }, [JSON.stringify(state.keyedMessages), state.scrollPosition]);

  async function fetchLanguages() {
    const { languages } = await getPerspectiveMeta(perspectiveUuid);
    setShortFormHash(languages[SHORT_FORM_EXPRESSION]);
    setProfileHash(languages[PROFILE_EXPRESSION]);
  }

  function addMessage(oldState, message) {
    const newState = {
      ...oldState,
      hasNewMessage: true,
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

  async function fetchMessages(payload?: { from?: Date, to?: Date }) {
    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: true,
    }));

    const cachedMessages = sessionStorage.getItem(`chat-perspective-${perspectiveUuid}`);
    
    if (cachedMessages && perspectiveUuid) {
      const perspective = JSON.parse(cachedMessages);

      setState((oldState) => ({
        ...oldState,
        keyedMessages: perspective.messages,
        scrollPosition: perspective.scrollPosition
      }));
    }
    const res = await getMessages({
      perspectiveUuid,
      from: payload?.from,
      to: payload?.to
    });

    setState((oldState) => ({
      ...oldState,
      keyedMessages: res,
    }));

    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: false,
    }));
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

  async function sendReply(message: string, replyUrl: string) {
    return createReply({
      perspectiveUuid: perspectiveUuid,
      languageAddress: shortFormHash,
      message: { background: [""], body: message },
      replyUrl,
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

  async function loadMore() {
    const oldestMessage = messages[0];
    fetchMessages({
      from: oldestMessage ? new Date(oldestMessage.timestamp) : new Date(),
    });
  }

  function saveScrollPos(pos?: number) {
    setState((oldState) => ({
      ...oldState,
      scrollPosition: pos
    }))
  }

  function setHasNewMessage(value: boolean) {
    setState((oldState) => ({
      ...oldState,
      hasNewMessage: value
    }));
  }

  return (
    <ChatContext.Provider
      value={{
        state: { ...state, messages },
        methods: {
          loadMore,
          sendMessage,
          addReaction,
          sendReply,
          removeReaction,
          saveScrollPos,
          setHasNewMessage
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
