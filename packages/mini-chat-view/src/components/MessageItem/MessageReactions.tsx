import { AgentContext } from "junto-utils/react";
import { useContext } from "preact/hooks";

function sortReactions(reactions) {
  const mapped = reactions.reduce((acc: any, reaction: any) => {
    const previous = acc[reaction.data.target] || { authors: [], count: 0 };
    return {
      ...acc,
      [reaction.data.target]: {
        authors: [...previous.authors, reaction.author],
        content: reaction.data.target,
        count: previous.count + 1,
      },
    };
  }, {});
  return Object.values(mapped);
}

export default function MessageReactions({ onEmojiClick, reactions = [] }) {
  const sortedReactions = sortReactions(reactions);

  const agent = useContext(AgentContext);

  async function checkIfAgentMadeReaction(unicode: string) {
    return reactions.some(
      (reaction: any) =>
        reaction.author === agent?.did && reaction.data.target === unicode
    );
  }

  return (
    <div style={{ display: "flex", gap: "var(--j-space-200)" }}>
      {sortedReactions.map((reaction: any, i) => {
        return (
          <button
            style={{
              display: "flex",
              gap: "var(--j-space-200)",
              alignItems: "center",
              cursor: "pointer",
              borderRadius: "var(--j-border-radius)",
              border: checkIfAgentMadeReaction(reaction.content)
                ? "1px solid var(--j-color-primary-500)"
                : "",
            }}
            onClick={() => onEmojiClick(reaction.content)}
            key={i}
          >
            <span>{reaction.content}</span>
            <span>{reaction.count}</span>
          </button>
        );
      })}
    </div>
  );
}
