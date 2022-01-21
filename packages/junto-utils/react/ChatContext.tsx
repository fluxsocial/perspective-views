import React, { createContext, useState, useEffect, useRef  } from "react";
import { Messages, Message } from "../types";
import { Link, LinkExpression, LinkQuery } from "@perspect3vism/ad4m";
import getMessages from "../api/getMessages";
import createMessage from "../api/createMessage";
import subscribeToLinks from "../api/subscribeToLinks";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import getMessage from "../api/getMessage";
import { findLink, linkIs } from "../helpers/linkHelpers";
import deleteMessageReaction from "../api/deleteMessageReaction";
import createMessageReaction from "../api/createMessageReaction";
import createReply from "../api/createReply";
import getReactions from "../api/getReactions";
import {
  PROFILE_EXPRESSION,
  SHORT_FORM_EXPRESSION,
} from "../constants/languages";
import { sortExpressionsByTimestamp } from "../helpers/expressionHelpers";
import getProfile from "../api/getProfile";
import retry from "../helpers/retry";
import ad4mClient from "../api/client";
import getMe from "../api/getMe";

type State = {
  isFetchingMessages: boolean;
  keyedMessages: Messages;
  scrollPosition?: number;
  hasNewMessage: boolean;
  isMessageFromSelf: boolean;
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
    getReplyMessage: (url: string) => void;
    getMessageProfile: (did: string) => void;
  };
};

const initialState: ContextProps = {
  state: {
    isFetchingMessages: false,
    keyedMessages: {},
    scrollPosition: 0,
    hasNewMessage: false,
    isMessageFromSelf: false,
  },
  methods: {
    loadMore: () => null,
    sendReply: () => null,
    removeReaction: () => null,
    addReaction: () => null,
    sendMessage: () => null,
    saveScrollPos: () => null,
    setHasNewMessage: () => null,
    getReplyMessage: () => null,
    getMessageProfile: () => null,
  },
};

const ChatContext = createContext(initialState);

export function ChatProvider({ perspectiveUuid, children }: any) {
  const [shortFormHash, setShortFormHash] = useState("");
  const [profileHash, setProfileHash] = useState("");
  const messageInterval = useRef();
  const linkSubscriberRef = useRef();

  const [state, setState] = useState(initialState.state);
  const [agent, setAgent] = useState();

  useEffect(() => {
    fetchAgent();
  }, []);

  async function fetchAgent() {
    const agent = await getMe();

    setAgent({ ...agent });
  }

  const messages = sortExpressionsByTimestamp(state.keyedMessages, "asc");

  useEffect(() => {
    if (perspectiveUuid) {
      fetchLanguages();
      
      const scrollPosition = sessionStorage.getItem(
        `chat-scroll-position-${perspectiveUuid}`,
      ) ?? "0";
      setState((oldState) => ({
        ...oldState,
        scrollPosition: parseInt(scrollPosition)
      }))
    }

    if (perspectiveUuid && profileHash) {
      fetchMessages();
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current?.removeListener('link-added', handleLinkAdded);
      linkSubscriberRef.current?.removeListener('link-removed', handleLinkRemoved);
    };
  }, [perspectiveUuid, profileHash]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid,
      added: handleLinkAdded,
      removed: handleLinkRemoved,
    });
  }

  useEffect(() => {
    if (perspectiveUuid.length > 0) {
      messageInterval.current = fetchMessagesAgain();
    }

    return () => {
      clearInterval(messageInterval.current);
    };
  }, [perspectiveUuid]);

  function fetchMessagesAgain() {
    return setInterval(async () => {
      const oldestMessage = messages[0];

      await fetchMessages({
        from: new Date(),
        to: oldestMessage ? new Date(oldestMessage.timestamp) : new Date(),
      });
    }, 60000);
  }

  useEffect(() => {
    sessionStorage.setItem(
      `chat-messages-${perspectiveUuid}`,
      JSON.stringify(state.keyedMessages)
    );
  }, [JSON.stringify(state.keyedMessages)]);

  useEffect(() => {
    sessionStorage.setItem(
      `chat-scroll-position-${perspectiveUuid}`,
      state.scrollPosition
    );
  }, [state.scrollPosition]);

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

  function addReactionToState(oldState, messageId, reactions) {
    const newState = {
      ...oldState,
      hasNewMessage: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        [messageId]: { ...oldState.keyedMessages[messageId], reactions },
      },
    };
    return newState;
  }

  async function handleLinkAdded(link) {
    console.log("handle link added 1", link);

    if (linkIs.message(link)) {
      const message = await getMessage({
        link,
        perspectiveUuid: perspectiveUuid,
        profileLangAddress: profileHash,
      });

      setState((oldState) => addMessage(oldState, message));

      setState((oldState) => ({...oldState, isMessageFromSelf: link.author === agent.did }));

      const reactions = await getReactions({
        url: link.data.target,
        perspectiveUuid,
      });

      setState((oldState) =>
        addReactionToState(oldState, message.id, reactions)
      );
    }

    if (linkIs.reaction(link)) {
      const id = link.data.source;

      setState((oldState) => {
        const message = oldState.keyedMessages[id];

        if (message) {
          const linkFound = message.reactions.find(
            (e) =>
              e.data.source === link.data.source &&
              e.data.target === link.data.target
          );

          if (linkFound) return oldState;

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
        }

        return oldState;
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

  async function getMessageProfile(did: string) {
    if (profileHash) {      
      const profile = await getProfile({did, languageAddress: profileHash});
  
      return profile;
    }
  }

  async function getReplyMessage(url: string) {
    const replyMessage = state.keyedMessages[url];
    if (!replyMessage && url) {
      try {
        const expression = await retry(async () => {
          const expression = await ad4mClient.expression.get(url);
          return { ...expression, data: JSON.parse(expression.data) };
        }, {});
  
        if (!expression) {
          console.log('No Expression found for the reply');
          return null;
        }
    
        const message = {
          id: url,
          timestamp: expression.timestamp,
          url: url,
          author: expression.author,
          reactions: [],
          replyUrl: null,
          content: expression.data.body,
        };
    
        return message as Message;
      } catch (e) {
        throw new Error(e);
      }
    }

    return replyMessage;
  }

  async function fetchMessages(payload?: { from?: Date; to?: Date }) {
    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: true,
    }));

    const storedMessages = sessionStorage.getItem(
      `chat-messages-${perspectiveUuid}`
    );

    const cachedMessages = storedMessages ? JSON.parse(storedMessages) : [];

    const newMessages = await getMessages({
      perspectiveUuid,
      from: payload?.from,
      to: payload?.to,
    });

    setState((oldState) => ({
      ...oldState,
      keyedMessages: {
        ...cachedMessages,
        ...oldState.keyedMessages,
        ...newMessages,
      },
    }));

    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: false,
    }));

    const messages = {
      ...cachedMessages,
      ...state.keyedMessages,
      ...newMessages,
    };

    for (const message of Object.values(messages)) {
      const url = (message as any).id;
      const reactions = await getReactions({
        url,
        perspectiveUuid,
      });

      setState((oldState) => addReactionToState(oldState, url, reactions));
    }
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
      scrollPosition: pos,
    }));
  }

  function setHasNewMessage(value: boolean) {
    setState((oldState) => ({
      ...oldState,
      hasNewMessage: value,
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
          setHasNewMessage,
          getReplyMessage,
          getMessageProfile
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
