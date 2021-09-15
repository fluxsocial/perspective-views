import { generateHTML, JSONContent } from "@tiptap/core";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import LineBreak from "./LineBreak";
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
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "./Mention";
import MentionList from "../MentionList.vue";

export default function createHTML(message: JSONContent) {
  return generateHTML(message, [
    Document,
    Paragraph,
    Text,
    LineBreak,
    Bold,
    Italic,
    Strike,
    CodeBlock,
    Link,
    BulletList,
    ListItem,
    OrderedList,
    Mention("emoji").configure({
      renderLabel({ options, node }) {
        return node.attrs.label;
      },
    }),
    Mention("agent-mention").configure({
      HTMLAttributes: {
        class: "mention",
      },
    }),
    Mention("neighbourhood-mention").configure({
      HTMLAttributes: {
        class: "mention",
      },
    }),
  ]);
}
