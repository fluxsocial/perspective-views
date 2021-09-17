import { ref, watch, computed, onMounted } from "vue";
import { LinkExpression } from "@perspect3vism/ad4m";
import { Messages, Message } from "../types";
import createMessage from "../api/createMessage";
import subscribeToLinks from "../api/subscribeToLinks";
import {
  sortExpressionsByTimestamp,
  getExpression,
} from "../helpers/expressionHelpers";
import getMessages from "../api/getMessages";
import createReply from "../api/createReply";
import getMessage from "../api/getMessage";
import createMessageReaction from "../api/createMessageReaction";

interface Props {
  perspectiveUuid: string;
  languageAddress: string;
  onIncomingMessage: Function;
}

export function sortMessages(
  messages: Messages,
  order: "asc" | "desc"
): Message[] {
  return Object.values(messages).sort((a, b) => {
    return order === "asc"
      ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

export default function useMessages({
  perspectiveUuid,
  languageAddress,
  onIncomingMessage = () => null,
}: Props) {
  const fetchingMessages = ref(false);

  const messages = ref<Messages>({});

  const sortedMessages = computed(() => {
    return sortExpressionsByTimestamp(messages.value, "asc");
  });

  onMounted(async () => {
    fetchingMessages.value = true;
    messages.value = await getMessages({
      perspectiveUuid,
    });
    fetchingMessages.value = false;

    subscribeToLinks({
      perspectiveUuid,
      callback: async (link: LinkExpression) => {
        //  TODO: This needs to be handlet less imperative
        if (
          link.data.source === "sioc://chatchannel" &&
          link.data.predicate === "sioc://content_of"
        ) {
          const message = await getMessage({ link, perspectiveUuid });

          messages.value = {
            ...messages.value,
            [message.id]: { ...message },
          };
          onIncomingMessage(message);
        }

        if (link.data.predicate === "sioc://reaction_to") {
          const id = link.data.source;
          const message = messages.value[id];
          messages.value = {
            ...messages.value,
            [id]: {
              ...message,
              reactions: [
                ...message.reactions,
                { content: link.data.target, author: link.author },
              ],
            },
          };
        }
      },
    });
  });

  async function loadMore() {
    fetchingMessages.value = true;
    const oldestMessage = sortedMessages.value[0];
    messages.value = await getMessages({
      perspectiveUuid,
      from: new Date(oldestMessage.timestamp),
    });
    fetchingMessages.value = false;
  }

  return {
    fetchingMessages,
    messages,
    sortedMessages,
    createMessage: (message: Object) => {
      return createMessage({
        perspectiveUuid,
        languageAddress,
        message: { background: [""], body: message },
      });
    },
    createReply: (message: Object, replyUrl: string) => {
      return createReply({
        perspectiveUuid,
        languageAddress,
        message: { background: [""], body: message },
        replyUrl,
      });
    },
    addReaction: (messageUrl: string, reaction: string) => {
      return createMessageReaction({
        perspectiveUuid,
        messageUrl,
        reaction,
      });
    },
    loadMore,
  };
}
