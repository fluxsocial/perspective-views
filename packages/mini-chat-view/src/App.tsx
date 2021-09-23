import { useEffect, useState } from "preact/hooks";
import createMessage from "./api/createMessage";
import getMessages from "./api/getMessages";
import { sortExpressionsByTimestamp } from "./helpers/expressionHelpers";
import getPerspectiveMeta from "./api/getPerspectiveMeta";
import VirtualList from "react-tiny-virtual-list";

const headerStyles = {
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid var(--j-border-color)",
  paddingLeft: "var(--j-space-500)",
  paddingRight: "var(--j-space-500)",
  height: "60px",
};

const mainStyles = {
  flex: "1",
  overflowY: "auto",
};

const footerStyles = {
  padding: "var(--j-space-500",
  borderTop: "1px solid var(--j-border-color",
};

function usePerspective(id) {
  const [meta, setMeta] = useState({
    name: "",
    description: "",
    languages: {},
  });

  async function getMeta() {
    const res = await getPerspectiveMeta(id);
    setMeta(res);
  }

  useEffect(() => {
    getMeta();
  }, []);

  return meta;
}

export default function MyComponent({ perspectiveUuid = "" }) {
  const [messages, setMessages] = useState({});

  async function fetchMessages() {
    const res = await getMessages({ perspectiveUuid });
    console.log(res);
    setMessages(res);
  }

  const sortedMessages = sortExpressionsByTimestamp(messages, "asc");

  const { name, description, languages } = usePerspective(perspectiveUuid);

  function sendMessage(e) {
    if (e.key === "Enter") {
      const value = e.target.value;
      //createMessage({ perspectiveUuid });
    }
  }

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <header style={headerStyles}># {name}</header>
      <main style={mainStyles}>
        <VirtualList
          width="100%"
          height="100%"
          itemCount={sortedMessages.length}
          itemSize={(i) => {
            const message = sortedMessages[i];
            const el = document.createElement("div");
            el.innerHTML = message.content;
            el.style.visibility = "hidden";
            document.body.appendChild(el);
            const height = el.clientHeight;
            document.body.removeChild(el);
            return height + 90;
          }}
          overscanCount={10}
          renderItem={({ index, style, t = sortedMessages[index] }) => (
            <div id={t.id} tabIndex={index + 2} key={index} style={style}>
              <div
                style={{
                  borderBottom: "1px solid var(--j-border-color)",
                  paddingTop: "var(--j-space-400)",
                  paddingLeft: "var(--j-space-500)",
                  paddingBottom: "var(--j-space-400)",
                  display: "flex",
                  boxSizing: "border-box",
                  gap: "var(--j-space-500)",
                  height: "100%",
                }}
              >
                <j-flex>
                  <j-avatar size="sm" hash={t.author.did}></j-avatar>
                </j-flex>
                <div>
                  <j-flex gap="300">
                    <j-text>{t.author.username}</j-text>
                    <j-timestamp value={t.timestamp}></j-timestamp>
                  </j-flex>
                  <div dangerouslySetInnerHTML={{ __html: t.content }}></div>
                </div>
              </div>
            </div>
          )}
        />
      </main>
      <footer style={footerStyles}>
        <j-input
          placeholder="Write a message"
          onKeydown={sendMessage}
        ></j-input>
      </footer>
    </div>
  );
}
