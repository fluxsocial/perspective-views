import { useState } from "preact/hooks";

export default function MentionList({ items, command }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  function onKeyDown({ event }) {
    console.log("onkeydown");

    if (event.key === "ArrowUp") {
      upHandler();
      return true;
    }

    if (event.key === "ArrowDown") {
      downHandler();
      return true;
    }

    if (event.key === "Enter") {
      enterHandler();
      return true;
    }

    return false;
  }

  function upHandler() {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  }

  function downHandler() {
    setSelectedIndex((selectedIndex + 1) % items.length);
  }

  function enterHandler() {
    selectItem(selectedIndex);
  }

  function selectItem(index) {
    const item = items[index];

    if (item) {
      command({ id: item.id, label: item.label });
    }
  }

  return (
    <div>
      <j-menu>
        {items.map((item, index) => (
          <j-menu-item
            active={index === selectedIndex}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.label}
          </j-menu-item>
        ))}
      </j-menu>
    </div>
  );
}
