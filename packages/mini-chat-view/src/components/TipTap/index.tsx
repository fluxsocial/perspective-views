import { useState, useRef, useContext } from "preact/hooks";
import { useEditor, EditorContent } from "@tiptap/react";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
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

import Mention from "./Mention";
import LineBreak from "./LineBreak";
import renderMention from "./renderMention";

import emojiList from "node-emoji/lib/emoji";
import { useEffect } from "preact/hooks";

import styles from "./index.scss";
import UIContext from "../../context/UIContext";

export default function Tiptap({
  value,
  onChange,
  onSend,
  members = [],
  channels = [],
}) {
  const [showToolbar, setShowToolbar] = useState(false);

  const emojiPicker = useRef();

  const {
    state: { currentReply },
  } = useContext(UIContext);

  // This is needed because React ugh.
  const sendCB = useRef(onSend);
  const membersCB = useRef(members);
  const channelsCB = useRef(channels);
  useEffect(() => {
    sendCB.current = onSend;
  }, [onSend]);
  useEffect(() => {
    membersCB.current = members;
  }, [members]);
  useEffect(() => {
    channelsCB.current = channels;
  }, [channels]);

  useEffect(() => {
    if (emojiPicker.current) {
      emojiPicker.current.addEventListener("emoji-click", onEmojiClick);
    }
  }, [emojiPicker.current]);

  const editor = useEditor(
    {
      content: value as any,
      enableInputRules: false,
      editorProps: {
        attributes: {
          style: "outline: 0",
        },
      },
      extensions: [
        Document.extend({
          addKeyboardShortcuts: () => {
            return {
              Enter: (props) => {
                const value = props.editor.getHTML();
                sendCB.current(value);
                // Prevents us from getting a new paragraph if user pressed Enter
                return true;
              },
            };
          },
        }),
        Text,
        Paragraph.configure({
          HTMLAttributes: {
            class: styles.editorParagraph,
          },
        }),
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
        Mention("emoji").configure({
          HTMLAttributes: {
            class: "emoji",
          },
          renderLabel({ options, node }) {
            return node.attrs.label ?? node.attrs.id;
          },
          suggestion: {
            char: ":",
            items: ({ query }) => {
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
            class: styles.editorMentions,
          },
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${
              node.attrs.label ?? node.attrs.id
            }`;
          },
          suggestion: {
            char: "#",
            items: ({ query }) => {
              return channelsCB.current
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
            class: styles.editorMentions,
          },
          renderLabel({ options, node }) {
            return `${options.suggestion.char}${
              node.attrs.label ?? node.attrs.id
            }`;
          },
          suggestion: {
            char: "@",
            items: ({ query }) => {
              return membersCB.current
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
        const value = props.editor.getJSON() as any;
        onChange(value);
      },
    },
    [membersCB, channelsCB]
  );

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(value);
    }
  }, [value]);

  useEffect(() => {
    if (currentReply) {
      editor.commands.focus();
    }
  }, [currentReply])

  function onEmojiClick(event: CustomEvent) {
    if (editor) {
      const anchorPosition = editor.view.state.selection;
      editor
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

  return (
    <div class={styles.editor}>
      <div class={styles.editorWrapper}>
        <EditorContent class={styles.editorContent} editor={editor} />
        <j-flex>
          <j-popover placement="top">
            <j-button slot="trigger" variant="ghost" size="sm">
              <j-icon size="sm" name="emoji-smile"></j-icon>
            </j-button>
            <div slot="content">
              <emoji-picker ref={emojiPicker} onEmojiClick={onEmojiClick} />
            </div>
          </j-popover>
          <j-button
            variant="ghost"
            size="sm"
            onClick={() => setShowToolbar(!showToolbar)}
          >
            <j-icon size="sm" name="type"></j-icon>
          </j-button>
          <j-button
            onClick={() => sendCB.current(editor.getHTML())}
            variant="primary"
            size="sm"
          >
            <j-icon name="arrow-right-short"></j-icon>
          </j-button>
        </j-flex>
      </div>
      {showToolbar && (
        <div>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("bold")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().toggleBold().focus().run()}
          >
            <j-icon size="sm" name="type-bold"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("italic")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().toggleItalic().focus().run()}
          >
            <j-icon size="sm" name="type-italic"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("strike")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().toggleStrike().focus().run()}
          >
            <j-icon size="sm" name="type-strikethrough"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("bulletList")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <j-icon size="sm" name="list-ul"></j-icon>
          </j-button>
          <j-button
            variant="ghost"
            size="sm"
            style={{
              color: editor.isActive("orderedList")
                ? "var(--j-color-primary-500)"
                : "inherit",
            }}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <j-icon size="sm" name="list-ol"></j-icon>
          </j-button>
        </div>
      )}
    </div>
  );
}
