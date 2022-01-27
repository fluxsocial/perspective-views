import { PerspectiveContext } from "junto-utils/react";
import { useContext } from "preact/hooks";
import styles from "./index.scss";

export default function Header() {
  const { state: { name, isHome } } = useContext(PerspectiveContext);

  return <header class={styles.header}># {isHome ? 'Home' : name}</header>;
}
