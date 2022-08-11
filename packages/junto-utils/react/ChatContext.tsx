import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import { Messages, Message } from "../types";
import { Link, LinkExpression, LinkQuery, Literal } from "@perspect3vism/ad4m";
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
import getMe from "../api/getMe";
import {
  SHORT_FORM_EXPRESSION,
} from "../helpers/languageHelpers";
import { DexieMessages, DexieUI } from "../helpers/storageHelpers";
import ad4mClient from "../api/client";

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
    setIsMessageFromSelf: () => null,
  },
};

const ChatContext = createContext(initialState);

let dexieUI: DexieUI;
let dexieMessages: DexieMessages;

export function ChatProvider({ perspectiveUuid, children, channelId }: any) {
  const [shortFormHash, setShortFormHash] = useState("");
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
    if (channelId) {
      dexieUI = new DexieUI(`${perspectiveUuid}://${channelId}`);
      dexieMessages = new DexieMessages(`${perspectiveUuid}://${channelId}`);
      // Set messages to cached messages
      // so we have something before we load more
      setCachedMessages();
    }
  }, [channelId]);

  async function fetchAgent() {
    const agent = await getMe();

    setAgent({ ...agent });
  }

  const messages = sortExpressionsByTimestamp(state.keyedMessages, "asc");

  useEffect(() => {
    if (channelId) {
      fetchLanguages();

      dexieUI.get("scroll-position").then((position) => {
        setState((oldState) => ({
          ...oldState,
          scrollPosition: parseInt(position),
        }));
      });

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
  }, [perspectiveUuid, channelId, agent]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid,
      added: handleLinkAdded,
      removed: handleLinkRemoved,
    });
  }

  useEffect(() => {
    if (perspectiveUuid.length > 0 && channelId.length > 0) {
      messageInterval.current = fetchMessagesAgain();
    }

    return () => {
      clearInterval(messageInterval.current);
    };
  }, [perspectiveUuid, channelId, messages]);

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
    const agent = await getMe();

    if (linkIs.message(link)) {
      const message = getMessage(link)

      if (message) {
        setState((oldState) => addMessage(oldState, message));

        setState((oldState) => ({
          ...oldState,
          isMessageFromSelf: link.author === agent.did,
        }));

        const reactions = await getReactions({
          url: link.data.target,
          perspectiveUuid,
        });

        setState((oldState) =>
          addReactionToState(oldState, message.id, reactions)
        );
      }
    }

    if (linkIs.reply(link)) {
      const message = getMessage(link)

      setState((oldState) => addMessage(oldState, message));

      setState((oldState) => ({
        ...oldState,
        isMessageFromSelf: link.author === agent.did,
      }));
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

    if (payload?.again) {
      for (const [key, message] of Object.entries(newMessages)) {
        const url = (message as any).id;
        if (!oldMessages[key]) {
          const reactions = await getReactions({
            url,
            perspectiveUuid,
          });

          setState((oldState) => addReactionToState(oldState, url, reactions));
        } else {
          const reactions = oldMessages[key]["reactions"];
          setState((oldState) => addReactionToState(oldState, url, reactions));
        }
      }
    } else {
      for (const message of Object.values(messages)) {
        const url = (message as any).id;

        const reactions = await getReactions({
          url,
          perspectiveUuid,
        });

        setState((oldState) => addReactionToState(oldState, url, reactions));
      }
    }
  }

  async function sendMessage(value) {
    createMessage({
      perspectiveUuid,
      lastMessage: messages.length === 0 ? channelId : messages[messages.length - 1].id,
      message: value,
    });
  }

  async function sendReply(message: string, replyUrl: string) {
    return createReply({
      perspectiveUuid: perspectiveUuid,
      message: message,
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
          setIsMessageFromSelf,
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export default ChatContext;
