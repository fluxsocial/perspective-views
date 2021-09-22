import MentionList from "../MentionList.vue";
import { VueRenderer } from "@tiptap/vue-3";
import tippy from "tippy.js";

export default function renderMention() {
  let component = null as any;
  let popup = null as any;

  return {
    onStart: (props) => {
      component = new VueRenderer(MentionList, {
        // using vue 2:
        // parent: this,
        // propsData: props,
        props: props,
        editor: props.editor,
      });

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "top",
        popperOptions: {
          strategy: "absolute",
        },
      });
    },
    onUpdate(props) {
      component.updateProps(props);

      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown(props) {
      if (props.event.key === "Escape") {
        popup[0].hide();

        return true;
      }

      return component.ref.onKeyDown(props);
    },
    onExit() {
      popup[0].destroy();
      component.destroy();
    },
  };
}
