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
import { REACTION } from "../constants/ad4m";

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
  const ranOnce = useRef(false);

  useEffect(() => {
    fetchAgent();
  }, []);

  useEffect(() => {
    if (channelId) {
      dexieUI = new DexieUI(`${perspectiveUuid}://${channelId}`);
      dexieMessages = new DexieMessages(`${perspectiveUuid}://${channelId}`);
      // Set messages to cached messages
      // so we have something before we load more
    }
  }, [channelId]);

  async function fetchAgent() {
    const agent = await getMe();

    setAgent({ ...agent });
  }

  const messages = sortExpressionsByTimestamp(state.keyedMessages, "asc");

  useEffect(() => {
    if (channelId && !ranOnce.current) {
      dexieUI.get("scroll-position").then((position) => {
        setState((oldState) => ({
          ...oldState,
          scrollPosition: parseInt(position),
        }));
      });

      fetchMessages({ again: false });

      setupSubscribers();

      ranOnce.current = true;

      return () => {
        linkSubscriberRef.current?.removeListener("link-added", handleLinkAdded);
        linkSubscriberRef.current?.removeListener(
          "link-removed",
          handleLinkRemoved
        );
      };
    }
  }, [perspectiveUuid, channelId, agent, ranOnce.current]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid,
      added: handleLinkAdded,
      removed: handleLinkRemoved,
    });
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
    console.log('link', link)
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
              e.reaction === link.data.target &&
              e.author === link.author
          );

          if (linkFound) return oldState;

          return {
            ...oldState,
            keyedMessages: {
              ...oldState.keyedMessages,
              [id]: {
                ...message,
                reactions: [...message.reactions, { author: link.author, reaction: link.data.target, timestamp: link.timestamp }],
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
    if (link.data.predicate === REACTION) {
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
                (e) =>
                e.reaction !== link.data.target &&
                e.author === link.author
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

    const oldMessages = {
      ...state.keyedMessages,
    };

    const {keyedMessages: newMessages, expressionLinkLength} = await getMessages({
      perspectiveUuid,
      channelId,
      from: payload?.from,
      to: payload?.to,
    });

    setState((oldState) => ({
      ...oldState,
      keyedMessages: {
        ...oldState.keyedMessages,
        ...newMessages,
      },
    }));

    setState((oldState) => ({
      ...oldState,
      showLoadMore: expressionLinkLength === 35,
      isFetchingMessages: false,
    }));
  }

  async function sendMessage(value) {
    createMessage({
      perspectiveUuid,
      lastMessage: channelId,
      message: value,
    });
  }

  async function sendReply(message: string, replyUrl: string) {
    return createReply({
      perspectiveUuid: perspectiveUuid,
      message: message,
      replyUrl,
      channelId
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
