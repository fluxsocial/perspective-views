import { Expression } from "@perspect3vism/ad4m";

export interface Messages {
  [x: string]: Message;
}

export interface Message {
  id: string;
  author: string;
  timestamp: string;
  expression: Expression;
}
