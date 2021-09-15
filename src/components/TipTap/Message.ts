import { Node, nodeInputRule, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer, VueRenderer } from "@tiptap/vue-3";

export interface ImageOptions {
  HTMLAttributes: Record<string, any>;
}

export const inputRegex = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export default Node.create<ImageOptions>({
  name: "message",

  defaultOptions: {
    HTMLAttributes: {
      class: "message",
    },
  },

  parseHTML() {
    return [
      {
        tag: "div",
      },
    ];
  },

  addAttributes() {
    return {
      message: {
        default: null,
      },
      username: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
  },

  addCommands() {
    return {
      setMessage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
