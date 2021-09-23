import register from "./custom-element.js";
import MyComponent from "./App";

export default register.toCustomElement(MyComponent, ["perspective-uuid"]);
