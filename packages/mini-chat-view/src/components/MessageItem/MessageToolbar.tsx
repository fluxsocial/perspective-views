import { useRef, useEffect, useCallback } from "preact/hooks";
import tippy from "tippy.js";

export default function MessageToolbar({ onEmojiClick }) {
  const emojiButton = useRef();
  const emojiPicker = useRef(document.createElement("emoji-picker"));

  // Make a mutable ref of the handler
  const clickRef = useRef(onEmojiClick);

  // Update handler ref with new function value
  useEffect(() => {
    clickRef.current = onEmojiClick;
  });

  useEffect(() => {
    emojiPicker.current.style.display = "block";
    tippy(emojiButton.current as HTMLElement, {
      content: emojiPicker.current,
      trigger: "click",
      appendTo: document.body,
      interactive: true,
      onShow: () => {
        this.toolbarOpen = true;
      },
      onHide: () => {
        this.toolbarOpen = false;
      },
    });
  }, []);

  useEffect(() => {
    // This is so ugly but ok..
    // https://stackoverflow.com/questions/55565444/how-to-register-event-with-useeffect-hooks

    const cb = (e) => clickRef.current(e.detail.unicode);

    emojiPicker.current.addEventListener("emoji-click", cb);

    return () => {
      emojiPicker.current.removeEventListener("emoji-click", cb);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        zIndex: "100",
        background: "var(--j-color-white)",
        borderRadius: "var(--j-border-radius)",
        boxShadow: "var(--j-depth-100)",
        top: "-10px",
        right: "var(--j-space-500)",
      }}
    >
      <j-tooltip placement="top" title="Add reaction">
        <j-button ref={emojiButton} variant="ghost" size="sm">
          <j-icon size="sm" name="emoji-smile"></j-icon>
        </j-button>
      </j-tooltip>
      <j-tooltip placement="top" title="Reply">
        <j-button onClick="onReplyClick" variant="ghost" size="sm">
          <j-icon size="sm" name="reply"></j-icon>
        </j-button>
      </j-tooltip>
    </div>
  );
}
