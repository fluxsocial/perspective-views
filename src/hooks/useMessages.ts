import { ref, watch, computed, onMounted } from "vue";
import { LinkExpression } from "@perspect3vism/ad4m";
import { Messages } from "../types";
import createMessage from "../api/createMessage";
import subscribeToLinks from "../api/subscribeToLinks";
import {
  sortExpressionsByTimestamp,
  getExpressionByLink,
} from "../helpers/expressionHelpers";
import getMessages from "../api/getMessages";

interface Props {
  neighbourhoodUuid: string;
  languageAddress: string;
  onIncomingMessage: Function;
}

export default function useMessages({
  neighbourhoodUuid,
  languageAddress,
  onIncomingMessage = () => null,
}: Props) {
  const fetchingMessages = ref(false);

  const previousMessages = JSON.parse(localStorage.getItem("messages") || "{}");
  const messages = ref<Messages>(previousMessages);

  const sortedMessages = computed(() => {
    return sortExpressionsByTimestamp(messages.value, "asc");
  });

  watch(
    () => messages.value,
    () => {
      localStorage.setItem("messages", JSON.stringify(messages.value));
    },
    { deep: true }
  );

  onMounted(async () => {
    fetchingMessages.value = true;
    messages.value = await getMessages({
      neighbourhoodUuid,
    });
    fetchingMessages.value = false;

    subscribeToLinks({
      neighbourhoodUuid,
      callback: async (link: LinkExpression) => {
        const message = await getExpressionByLink(link);
        messages.value = { ...messages.value, [message.id]: { ...message } };
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
      return createMessage({ neighbourhoodUuid, languageAddress, message });
    },
    loadMore,
  };
}
