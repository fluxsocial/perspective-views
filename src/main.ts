import { defineCustomElement } from "vue";
import App from "./App.ce.vue";
//import "emoji-picker-element";

// convert into custom element constructor
const AppElement = defineCustomElement(App);

// register
customElements.define("chat-view", AppElement);
