import "emoji-picker-element";
import register from "./custom-element.js";
import MyComponent from "./App";

const CustomElement = register.toCustomElement(
  MyComponent,
  ["perspective-uuid"],
  { shadow: false }
);

export default CustomElement;
