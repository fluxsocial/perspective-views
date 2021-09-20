<template>
  <div class="chat-view">
    <header class="chat-view__header">
      <j-flex a="center" gap="400">
        <j-icon name="hash"></j-icon>
        {{ name }}
      </j-flex>
    </header>
    <div class="chat-view__load-more">
      <j-button
        variant="primary"
        v-if="showNewMessagesButton"
        @click="markAsRead"
      >
        Show new messages
        <j-icon name="arrow-down-short" size="xs" />
      </j-button>
    </div>
    <main class="chat-view__messages">
      <DynamicScroller
        @scroll="onScroll"
        ref="scrollContainer"
        :items="sortedMessages"
        :min-item-size="1"
        key-field="id"
      >
        <template #before>
          <j-box px="500" py="500">
            <j-flex a="center" j="center" gap="500">
              <j-text color="ui-400" nomargin v-if="fetchingMessages">
                🤫 Shhh.. Listening for gossip.
              </j-text>
              <j-button v-else size="sm" variant="subtle" @click="loadMore">
                Look for older messages
              </j-button>
            </j-flex>
          </j-box>
        </template>
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            v-if="item.content"
            :item="item"
            :active="active"
            :size-dependencies="[item.content]"
            :data-index="index"
          >
            <ChatMessage
              :replyMessage="messages[item.replyUrl]"
              :isReplying="replyMessageId === item.id"
              :message="item"
              showAvatar
              @emojiClick="(unicode) => addReaction(item.url, unicode)"
              @replyClick="replyMessageId = item.id"
            ></ChatMessage>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </main>

    <footer class="chat-view__footer">
      <ChatInput
        :replyMessage="replyMessage"
        :value="editorValue"
        @change="(value) => (editorValue = value)"
        @send="sendMessage"
        @removeReply="replyMessageId = null"
      ></ChatInput>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ChatMessage from "./components/ChatMessage.vue";
import ChatInput from "./components/ChatInput.vue";
import generateHTML from "./components/TipTap/generateHTML";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import { scrollToBottom, isAtBottom } from "./helpers/scrollHelpers";
import useMessages from "./hooks/useMessages";
import { JSONContent } from "@tiptap/core";
import usePerspective from "./hooks/usePerspective";

const props = defineProps({
  perspectiveUuid: {
    required: true,
    type: String,
  },
});

const EMPTY_SCHEMA = {
  type: "doc",
  content: [],
};

const editorValue = ref<JSONContent>(EMPTY_SCHEMA);
const scrollContainer = ref(null);
const replyMessageId = ref<string | null>(null);
const showNewMessagesButton = ref(false);

const replyMessage = computed(() => {
  if (replyMessageId.value) {
    return messages.value[replyMessageId.value];
  } else return null;
});

const { name, description, languages } = usePerspective({
  perspectiveUuid: props.perspectiveUuid.replace("hack-", ""),
});

const {
  messages,
  sortedMessages,
  createMessage,
  addReaction,
  loadMore,
  fetchingMessages,
  createReply,
} = useMessages({
  perspectiveUuid: props.perspectiveUuid.replace("hack-", ""),
  onIncomingMessage: () => {
    const scrolledToBottom = isAtBottom(scrollContainer.value);
    if (scrolledToBottom) {
      setTimeout(() => {
        scrollContainer.value?.scrollToBottom();
      }, 100);
    } else {
      showNewMessagesButton.value = true;
    }
  },
});

function onScroll(e) {
  const scrolledToTop = e.target.scrollTop <= 20;
  if (scrolledToTop) {
    loadMore();
  }
}

function markAsRead() {
  scrollToBottom(scrollContainer.value);
  showNewMessagesButton.value = false;
}

function resetEditor() {
  editorValue.value = EMPTY_SCHEMA;
  replyMessageId.value = null;
}

function sendMessage() {
  const message = generateHTML(editorValue.value);
  if (replyMessage.value) {
    createReply(message, replyMessage.value.url);
  } else {
    createMessage(message);
  }
  resetEditor();
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
  height: 100vh;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}

.chat-view__messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.message-item__reactions {
  margin-top: var(--j-space-300);
}

.scroller {
  overflow-y: scroll;
}

.chat-view__header {
  padding: var(--j-space-500) var(--j-space-500);
  background-color: var(--j-color-white);
  border-bottom: 1px solid var(--j-border-color);
}

.chat-view__load-more {
  position: fixed;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  top: var(--j-space-200);
  left: 0;
  z-index: 100;
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
  position: relative;
  flex-direction: column;
}

.chat-input__reply {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  position: absolute;
  left: 0;
  bottom: 100%;
  margin-bottom: var(--j-space-200);
  background-color: var(--j-color-primary-50);
  color: var(--j-color-primary-600);
  font-size: var(--j-font-size-400);
  padding: var(--j-space-300) var(--j-space-400);
  border-radius: var(--j-border-radius);
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

.message-item__reply {
  margin-top: var(--j-space-400);
  margin-bottom: var(--j-space-200);
  display: flex;
  align-items: flex-start;
  overflow: hidden;
  font-size: var(--j-font-size-300);
  gap: var(--j-space-500);
  padding: 0 var(--j-space-700);
  height: 20px;
}

.message-item__reply div p:first-of-type {
  margin-top: 0;
}

.message-item__reply div p:last-of-type {
  margin-bottom: 0;
}

.message-item:hover {
  background: hsla(var(--j-color-ui-hue), 10%, 50%, 0.06);
}

.message-item__avatar {
  cursor: pointer;
}

.message-item--is-replying {
  background-color: var(--j-color-primary-50) !important;
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
  display: flex;
  visibility: hidden;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: var(--j-space-300);
  top: calc(var(--j-space-400) * -1);
}

.message-item:hover .message-item__toolbar {
  visibility: visible;
}

/* RECYCLE SCROLLER */

.vue-recycle-scroller {
  position: relative;
}
.vue-recycle-scroller.direction-vertical:not(.page-mode) {
  overflow-y: auto;
}
.vue-recycle-scroller.direction-horizontal:not(.page-mode) {
  overflow-x: auto;
}
.vue-recycle-scroller.direction-horizontal {
  display: flex;
}
.vue-recycle-scroller__slot {
  flex: auto 0 0;
}
.vue-recycle-scroller__item-wrapper {
  flex: 1;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}
.vue-recycle-scroller.ready .vue-recycle-scroller__item-view {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}
.vue-recycle-scroller.direction-vertical .vue-recycle-scroller__item-wrapper {
  width: 100%;
}
.vue-recycle-scroller.direction-horizontal .vue-recycle-scroller__item-wrapper {
  height: 100%;
}
.vue-recycle-scroller.ready.direction-vertical
  .vue-recycle-scroller__item-view {
  width: 100%;
}
.vue-recycle-scroller.ready.direction-horizontal
  .vue-recycle-scroller__item-view {
  height: 100%;
}

/* RESIZE OBSERVER */

.resize-observer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  pointer-events: none;
  display: block;
  overflow: hidden;
  opacity: 0;
}
.resize-observer >>> object {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}
</style>
