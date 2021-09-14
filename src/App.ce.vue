<template>
  <div class="chat-view" ref="scrollContainer">
    <main class="chat-view__messages" ref="messagesContainer">
      <DynamicScroller
        :items="sortedMessages"
        :min-item-size="1"
        ref="scrollContainer"
      >
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            v-if="item.expression.body"
            :item="item"
            :active="active"
            :size-dependencies="[item.expression.body]"
            :data-index="index"
          >
            <ChatMessage
              :isReplying="replyMessageId === item.id"
              :did="members[item.author]"
              username="123"
              :timestamp="item.timestamp"
              :message="item.expression.body"
              showAvatar
              @replyClick="replyMessageId = item.id"
            ></ChatMessage>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </main>

    <footer class="chat-view__footer">
      <ChatInput
        :replyMessage="replyMessage"
        :value="schema"
        @change="(json) => (schema = json)"
        @send="sendMessage"
        @removeReply="replyMessageId = null"
      ></ChatInput>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import ChatMessage from "./components/ChatMessage.vue";
import ChatInput from "./components/ChatInput.vue";
import getMessages from "./api/getMessages";
import createMessage from "./api/createMessage";
import getMembers from "./api/getMembers";
import { Messages } from "./types";
import subscribeToLinks from "./api/subscribeToLinks";
import generateHTML from "./components/generateHTML";
import {
  getExpressionByLink,
  sortExpressionsByTimestamp,
} from "./helpers/expressionHelpers";
import { LinkExpression } from "@perspect3vism/ad4m";
import { JSONContent } from "@tiptap/core";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

const { neighbourhood } = defineProps({
  neighbourhood: String,
});

const EMPTY_SCHEMA = {
  type: "doc",
  content: [],
};

const schema = ref<any>(EMPTY_SCHEMA);
const scrollContainer = ref(null);
const messagesContainer = ref(null);
const messages = ref<Messages>({});
const members = ref<Messages>({});
const replyMessageId = ref<string | null>(null);

const replyMessage = computed(() => {
  if (replyMessageId.value) {
    return messages.value[replyMessageId.value];
  } else return null;
});

const sortedMessages = computed(() => {
  return sortExpressionsByTimestamp(messages.value, "asc");
});

function scrollToBottom() {
  const el = messagesContainer.value as HTMLElement | null;
  if (el) {
    console.log(el);
    el.scrollTop = el.scrollHeight;
  }
}

onMounted(async () => {
  const membersResult = await getMembers({
    neighbourhoodUuid: "7e8dfe0e-eb4c-4615-a8da-2f150faaef8e",
    neighbourhoodUrl:
      "neighbourhood://QmckHenTt78Hqb77tCtXxk3ke8PPKwNHBjbx4tEqe9Adyx",
  });

  members.value = membersResult as any;

  const messagesResult = await getMessages({
    neighbourhoodUuid: "7e8dfe0e-eb4c-4615-a8da-2f150faaef8e",
  });

  messages.value = messagesResult as any;

  subscribeToLinks({
    neighbourhoodUuid: "7e8dfe0e-eb4c-4615-a8da-2f150faaef8e",
    callback: async (link: LinkExpression) => {
      const message = await getExpressionByLink(link);
      messages.value = { ...messages.value, [message.id]: { ...message } };
      scrollToBottom();
    },
  });
});

function sendMessage() {
  createMessage({
    neighbourhoodUuid: "7e8dfe0e-eb4c-4615-a8da-2f150faaef8e",
    languageAddress: "QmYkgcLtTixVNJw6CLhiqJQeGwyN7rNWY2fC3pHWZ5Ba5x",
    message: { background: [""], body: generateHTML(schema.value) },
  });
  schema.value = EMPTY_SCHEMA;
  replyMessageId.value = null;
}
</script>

<style>
*,
*:before,
*:after {
  box-sizing: border-box;
}

j-button.active {
  color: var(--j-color-primary-500);
}

.chat-view {
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  overflow-y: hidden;
}

.chat-view__messages {
  flex: 1;
  overflow-y: auto;
}

.chat-view__footer {
  background-color: var(--j-color-white);
  padding: var(--j-space-400) var(--j-space-500);
}

.mention {
  border-radius: var(--j-border-radius);
  background-color: var(--j-color-primary-100);
  color: var(--j-color-primary-600);
  padding: var(--j-space-100);
}

.chat-input {
  display: flex;
  flex-direction: column;
}

.chat-input__wsywig {
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: var(--j-space-200);
  border: 1px solid var(--j-border-color);
  border-radius: var(--j-border-radius);
}

.chat-input__editor-wrapper {
  width: 100%;
}

.chat-input__toolbar {
  display: flex;
}

.chat-input__editor {
  width: 100%;
  flex: 1;
  outline: 0;
  min-height: var(--j-size-sm);
  padding: var(--j-space-200) var(--j-space-400);
}

.chat-input__editor *:first-of-type {
  margin-top: 0;
}

.chat-input__editor *:last-of-type {
  margin-bottom: 0;
}

.editor:focus {
  border-color: var(--j-color-focus);
}

.emojitoolip::part(base) {
  display: inline;
}
.emojitoolip::part(content) {
  display: inline;
}

.message-item {
  position: relative;
  padding: var(--j-space-300) 0;
  display: grid;
  gap: var(--j-space-300);
  grid-template-columns: 70px 1fr;
  overflow: visible;
}

.message-item:hover {
  background: hsla(var(--j-color-ui-hue), 10%, 50%, 0.06);
}

.message-item__avatar {
  cursor: pointer;
}

.message-item--is-replying {
  background-color: var(--j-color-primary-100) !important;
  border-left: 3px solid var(--j-color-primary-500);
}

.message-item__left-column {
  text-align: right;
}

.message-item__timestamp {
  opacity: 0.5;
  cursor: pointer;
  font-size: var(--j-font-size-300);
  font-weight: 500;
}

.message-item__timestamp:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.message-item__right-column {
  flex: 1;
  width: 100%;
}

.message-item__left-column .message-item__timestamp {
  visibility: hidden;
}

.message-item:hover .message-item__left-column .message-item__timestamp {
  visibility: visible;
}

.message-item__message-info {
  display: flex;
  align-items: center;
  margin-bottom: var(--j-space-100);
  gap: var(--j-space-300);
}

.message-item__message > :first-of-type {
  margin-top: 0;
}

.message-item__message > :last-of-type {
  margin-bottom: 0;
}

.message-item__message * {
  user-select: text !important;
}

.message-item__message .mention {
  cursor: pointer;
  padding: 2px var(--j-space-200);
  border-radius: var(--j-border-radius);
  background: var(--j-color-primary-100);
  color: var(--j-color-primary-700);
}

.message-item__message a {
  color: var(--j-color-primary-600);
  text-decoration: underline;
}

.message-item__message .mention:hover {
  color: var(--j-color-primary-500);
}

.message-item__username {
  cursor: pointer;
}

.message-item__username:hover {
  cursor: pointer;
  text-decoration: underline;
}

.message-item__toolbar {
  gap: var(--j-space-100);
  border-radius: var(--j-border-radius);
  background-color: var(--j-color-white);
  border: 2px solid var(--j-border-color);
  display: none;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: var(--j-space-300);
  top: calc(var(--j-space-400) * -1);
}

.message-item:hover .message-item__toolbar {
  display: flex;
}
</style>
