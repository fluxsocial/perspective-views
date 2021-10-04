import { PerspectiveContext } from "junto-utils/react";
import { useContext } from "preact/hooks";

const headerStyles = {
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid var(--j-border-color)",
  padding: "var(--j-space-500)",
};

export default function Header() {
  const { state } = useContext(PerspectiveContext);

  return <header style={headerStyles}># {state.name}</header>;
}
