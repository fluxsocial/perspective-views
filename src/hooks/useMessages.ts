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

interface Props {
  neighbourhoodUuid: string;
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
  neighbourhoodUuid,
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
      neighbourhoodUuid,
    });
    fetchingMessages.value = false;

    subscribeToLinks({
      neighbourhoodUuid,
      callback: async (link: LinkExpression) => {
        const message = await getMessage({ link, neighbourhoodUuid });

        messages.value = {
          ...messages.value,
          [message.id]: { ...message },
        };
        onIncomingMessage(message);
      },
    });
  });

  async function loadMore() {
    fetchingMessages.value = true;
    const oldestMessage = sortedMessages.value[0];
    messages.value = await getMessages({
      neighbourhoodUuid,
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
        neighbourhoodUuid,
        languageAddress,
        message: { background: [""], body: message },
      });
    },
    createReply: (message: Object, replyUrl: string) => {
      return createReply({
        neighbourhoodUuid,
        languageAddress,
        message: { background: [""], body: message },
        replyUrl,
      });
    },
    loadMore,
  };
}
