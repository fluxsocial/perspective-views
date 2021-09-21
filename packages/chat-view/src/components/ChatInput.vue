<template>
  <div class="chat-input">
    <div v-if="replyMessage" class="chat-input__reply">
      <j-flex gap="400">
        <j-icon size="sm" name="arrow-90deg-right"></j-icon>
        <span>Replying to {{ replyMessage.author.username }}</span>
      </j-flex>
      <j-button variant="ghost" @click="emit('removeReply')"
        ><j-icon name="x"></j-icon
      ></j-button>
    </div>
    <div class="chat-input__wsywig">
      <EditorContent class="chat-input__editor-wrapper" :editor="editor" />
      <div class="chat-input__toolbar">
        <j-popover placement="top">
          <j-button slot="trigger" variant="ghost" size="sm">
            <j-icon size="sm" name="emoji-smile"></j-icon>
          </j-button>
          <div slot="content">
            <emoji-picker @emoji-click="onEmojiClick" />
          </div>
        </j-popover>
        <j-button
          variant="ghost"
          size="sm"
          :class="{
            active: showToolbar,
          }"
          @click="showToolbar = !showToolbar"
        >
          <j-icon size="sm" name="type"></j-icon>
        </j-button>
        <j-button @click="sendMessage" variant="primary" size="sm">
          <j-icon name="arrow-right-short"></j-icon>
        </j-button>
      </div>
    </div>
    <div v-if="editor && showToolbar" class="chat-input__toolbar-extended">
      <j-button
        variant="ghost"
        size="sm"
        :class="{
          active: editor.isActive('bold'),
        }"
        @click="() => editor?.chain().toggleBold().focus().run()"
      >
        <j-icon size="sm" name="type-bold"></j-icon>
      </j-button>
      <j-button
        variant="ghost"
        size="sm"
        :class="{
          active: editor.isActive('italic'),
        }"
        @click="() => editor?.chain().toggleItalic().focus().run()"
      >
        <j-icon size="sm" name="type-italic"></j-icon>
      </j-button>
      <j-button
        variant="ghost"
        size="sm"
        :class="{
          active: editor.isActive('strike'),
        }"
        @click="() => editor?.chain().toggleStrike().focus().run()"
      >
        <j-icon size="sm" name="type-strikethrough"></j-icon>
      </j-button>
      <j-button
        variant="ghost"
        size="sm"
        :class="{
          active: editor.isActive('bulletList'),
        }"
        @click="() => editor?.chain().focus().toggleBulletList().run()"
      >
        <j-icon size="sm" name="list-ul"></j-icon>
      </j-button>
      <j-button
        variant="ghost"
        size="sm"
        :class="{
          active: editor.isActive('orderedList'),
        }"
        @click="() => editor?.chain().focus().toggleOrderedList().run()"
      >
        <j-icon size="sm" name="list-ol"></j-icon>
      </j-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditorContent, JSONContent, useEditor } from "@tiptap/vue-3";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import LineBreak from "./TipTap/LineBreak";
import Text from "@tiptap/extension-text";
import Italic from "@tiptap/extension-italic";
import Bold from "@tiptap/extension-bold";
import Strike from "@tiptap/extension-strike";
import Paragraph from "@tiptap/extension-paragraph";
import Document from "@tiptap/extension-document";
import CodeBlock from "@tiptap/extension-code-block";
import History from "@tiptap/extension-history";
import Link from "@tiptap/extension-link";
import OrderedList from "@tiptap/extension-ordered-list";
import Mention from "./TipTap/Mention";
import MessageExtension from "./TipTap/Message";
import renderMention from "./TipTap/renderMention";
import emojiList from "node-emoji/lib/emoji";
import { watch, PropType, ref } from "vue";
import { Message } from "../types";
import getProfile from "../api/getProfile";

const emit = defineEmits(["change", "send", "removeReply"]);

const props = defineProps({
  value: {
    required: true,
    type: Object,
  },
  replyMessage: Object as PropType<Message>,
});

const replyProfile = ref({});

const showToolbar = ref(false);

async function sendMessage() {
  emit("send");
}

const editor = useEditor({
  content: props.value as any,
  enableInputRules: false,
  editorProps: {
    attributes: {
      class: "chat-input__editor",
    },
  },
  extensions: [
    Document.extend({
      addKeyboardShortcuts: () => {
        return {
          Enter: () => {
            sendMessage();
            // Prevents us from getting a new paragraph if user pressed Enter
            return true;
          },
        };
      },
    }),
    Text,
    Paragraph,
    Link,
    Bold,
    Strike,
    Italic,
    LineBreak,
    ListItem,
    BulletList,
    OrderedList,
    History,
    CodeBlock,
    MessageExtension,
    Mention("emoji").configure({
      HTMLAttributes: {
        class: "emoji",
      },
      renderLabel({ options, node }) {
        return node.attrs.label ?? node.attrs.id;
      },
      suggestion: {
        char: ":",
        items: (query) => {
          const formattedEmojiList = Object.entries(emojiList.emoji).map(
            ([id, label]) => ({ id, label })
          );

          return formattedEmojiList
            .filter((e) => e.id.startsWith(query))
            .slice(0, 10);
        },
        render: renderMention,
      },
    }),
    Mention("neighbourhood-mention").configure({
      HTMLAttributes: {
        class: "mention",
      },
      suggestion: {
        char: "#",

        items: (query) => {
          return [
            { id: "123", label: "Music" },
            { id: "1234", label: "Travel" },
          ]
            .filter((item) =>
              item.label.toLowerCase().startsWith(query.toLowerCase())
            )
            .slice(0, 5);
        },
        render: renderMention,
      },
    }),
    Mention("agent-mention").configure({
      HTMLAttributes: {
        class: "mention",
      },
      suggestion: {
        char: "@",
        items: (query) => {
          return [
            { id: "123", label: "josh" },
            { id: "1234", label: "leif" },
          ]
            .filter((item) =>
              item.label.toLowerCase().startsWith(query.toLowerCase())
            )
            .slice(0, 5);
        },
        render: renderMention,
      },
    }),
  ],
  onUpdate: (props) => {
    const json = props.editor.getJSON() as any;
    emit("change", json);
  },
});

function onEmojiClick(event: CustomEvent) {
  if (editor.value) {
    const anchorPosition = editor.value.view.state.selection;
    editor.value
      .chain()
      .focus()
      .insertContentAt(anchorPosition, [
        {
          type: "emoji",
          attrs: {
            label: event.detail.unicode,
            id: event.detail.emoji.shortcodes[0],
            trigger: ":",
          },
        },
        {
          type: "text",
          text: " ",
        },
      ])
      .run();
  }
}

watch(
  () => props.value,
  (newValue) => {
    /* @ts-ignore */
    editor.value?.commands.setContent(newValue);
  }
);
</script>
