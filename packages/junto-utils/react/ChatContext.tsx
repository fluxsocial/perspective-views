import React, { createContext, useState, useEffect, useRef } from "react";
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
import { sortExpressionsByTimestamp } from "../helpers/expressionHelpers";
import retry from "../helpers/retry";
import ad4mClient from "../api/client";
import getMe from "../api/getMe";
import {
  PROFILE_EXPRESSION,
  SHORT_FORM_EXPRESSION,
} from "../helpers/languageHelpers";
import getReplyTo from "../api/getReplyTo";
import { DexieMessages, DexieUI } from "../helpers/storageHelpers";

type State = {
  isFetchingMessages: boolean;
  keyedMessages: Messages;
  scrollPosition?: number;
  hasNewMessage: boolean;
  isMessageFromSelf: boolean;
  showLoadMore: boolean;
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
    setIsMessageFromSelf: (value: boolean) => void;
  };
};

const initialState: ContextProps = {
  state: {
    isFetchingMessages: false,
    keyedMessages: {},
    scrollPosition: 0,
    hasNewMessage: false,
    isMessageFromSelf: false,
    showLoadMore: true
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
    setIsMessageFromSelf: () => null,
  },
};

const ChatContext = createContext(initialState);

let dexieUI: DexieUI;
let dexieMessages: DexieMessages;

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

  async function setCachedMessages() {
    const cachedMessages = await dexieMessages.getAll();
    setState({ ...state, keyedMessages: { ...cachedMessages } });
  }

  useEffect(() => {
    if (perspectiveUuid) {
      dexieUI = new DexieUI(perspectiveUuid);
      dexieMessages = new DexieMessages(perspectiveUuid);
      // Set messages to cached messages
      // so we have something before we load more
      setCachedMessages();
    }
  }, [perspectiveUuid]);

  async function fetchAgent() {
    const agent = await getMe();

    setAgent({ ...agent });
  }

  const messages = sortExpressionsByTimestamp(state.keyedMessages, "asc");

  useEffect(() => {
    if (perspectiveUuid) {
      fetchLanguages();

      dexieUI.get("scroll-position").then((position) => {
        setState((oldState) => ({
          ...oldState,
          scrollPosition: parseInt(position),
        }));
      });
    }

    if (perspectiveUuid && profileHash) {
      fetchMessages({ again: false });
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current?.removeListener("link-added", handleLinkAdded);
      linkSubscriberRef.current?.removeListener(
        "link-removed",
        handleLinkRemoved
      );
    };
  }, [perspectiveUuid, profileHash, agent]);

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
  }, [perspectiveUuid, messages]);

  function fetchMessagesAgain() {
    return setInterval(async () => {
      await fetchMessages({
        from: new Date(),
        to: new Date("August 19, 1975 23:15:30"),
        again: true,
      });
    }, 60000);
  }

  useEffect(() => {
    dexieMessages.saveAll(Object.values(state.keyedMessages));
  }, [JSON.stringify(state.keyedMessages)]);

  useEffect(() => {
    dexieUI.save("scroll-position", state.scrollPosition);
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

  function addReplyToState(oldState, messageId, replyUrl) {
    const newState = {
      ...oldState,
      hasNewMessage: false,
      keyedMessages: {
        ...oldState.keyedMessages,
        [messageId]: { ...oldState.keyedMessages[messageId], replyUrl },
      },
    };
    return newState;
  }

  async function handleLinkAdded(link) {
    if (linkIs.message(link)) {
      const message = await getMessage({
        link,
        perspectiveUuid: perspectiveUuid,
        profileLangAddress: profileHash,
      });
      if (message) {
        setState((oldState) => addMessage(oldState, message));

        setState((oldState) => ({
          ...oldState,
          isMessageFromSelf: link.author === agent.did,
        }));

        const replyUrl = await getReplyTo({
          url: message.url,
          perspectiveUuid,
        });

        setState((oldState) =>
          addReplyToState(oldState, link.data.target, replyUrl)
        );

        const reactions = await getReactions({
          url: link.data.target,
          perspectiveUuid,
        });

        setState((oldState) =>
          addReactionToState(oldState, message.id, reactions)
        );
      }
    }

    if (linkIs.reaction(link)) {
      const id = link.data.source;

      setState((oldState) => {
        const message = oldState.keyedMessages[id];

        if (message) {
          const linkFound = message.reactions.find(
            (e) =>
              e.data.source === link.data.source &&
              e.data.target === link.data.target &&
              e.author === link.author
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
                (reaction) => reaction.proof.signature !== link.proof.signature
              ),
            },
          },
        };
      });
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
          console.log("No Expression found for the reply");
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

  async function fetchMessages(payload?: {
    from?: Date;
    to?: Date;
    again: boolean;
  }) {
    console.log("Fetch messages with from: ", payload.from, "and to: ", payload.to);
    setState((oldState) => ({
      ...oldState,
      isFetchingMessages: true,
    }));

    const cachedMessages = await dexieMessages.getAll();
    const oldMessages = { 
      ...state.keyedMessages, 
      ...cachedMessages 
    };

    const {keyedMessages: newMessages, expressionLinkLength} = await getMessages({
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
      showLoadMore: expressionLinkLength === 35,
      isFetchingMessages: false,
    }));

    const messages = {
      ...cachedMessages,
      ...state.keyedMessages,
      ...newMessages,
    };

    if (payload.again) {
      for (const [key, message] of Object.entries(newMessages)) {
        const url = (message as any).id;
        if (!oldMessages[key]) {
          const replyUrl = await getReplyTo({
            url,
            perspectiveUuid,
          });

          setState((oldState) => addReplyToState(oldState, url, replyUrl));

          const reactions = await getReactions({
            url,
            perspectiveUuid,
          });

          setState((oldState) => addReactionToState(oldState, url, reactions));
        } else {
          const reactions = oldMessages[key]["reactions"];
          const replyUrl = oldMessages[key]["replyUrl"];
          setState((oldState) => addReactionToState(oldState, url, reactions));
          setState((oldState) => addReplyToState(oldState, url, replyUrl));
        }
      }
    } else {
      for (const message of Object.values(messages)) {
        const url = (message as any).id;

        const replyUrl = await getReplyTo({
          url,
          perspectiveUuid,
        });

        setState((oldState) => addReplyToState(oldState, url, replyUrl));

        const reactions = await getReactions({
          url,
          perspectiveUuid,
        });

        setState((oldState) => addReactionToState(oldState, url, reactions));
      }
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

  function setIsMessageFromSelf(isMessageFromSelf: boolean) {
    setState((oldState) => ({
      ...oldState,
      isMessageFromSelf,
    }));
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
    console.log("Loading more messages with oldest timestamp", oldestMessage);
    fetchMessages({
      from: oldestMessage ? new Date(oldestMessage.timestamp) : new Date(),
      again: false,
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
          setIsMessageFromSelf,
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
