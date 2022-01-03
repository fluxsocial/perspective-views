export default function MessageToolbar({ onReplyClick, onOpenEmojiPicker }) {
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
      <j-button onClick={onOpenEmojiPicker} variant="ghost" size="sm">
        <j-icon size="sm" name="emoji-smile"></j-icon>
      </j-button>

      <j-button onClick={onReplyClick} variant="ghost" size="sm">
        <j-icon size="sm" name="reply"></j-icon>
      </j-button>
    </div>
  );
}
