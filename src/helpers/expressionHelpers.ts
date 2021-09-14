import ad4mClient from "../api/client";
import { Expression, LinkExpression } from "@perspect3vism/ad4m";

export interface Messages {
  [x: string]: Message;
}

export interface Message {
  id: string;
  author: string;
  timestamp: string;
  expression: Expression;
}

export async function getExpression(link: any): Promise<Expression> {
  const address = link.data.target;
  const expression = await ad4mClient.expression.get(address);
  return JSON.parse(expression.data);
}

export async function getExpressionByLink(
  link: LinkExpression
): Promise<Message> {
  return {
    id: link.proof.signature,
    author: link.author,
    timestamp: link.timestamp,
    expression: await getExpression(link),
  };
}

export async function getExpressionsByLinks(expressionLinks: LinkExpression[]) {
  const linkPromises = expressionLinks.map(getExpressionByLink);
  return await Promise.all(linkPromises);
}

export function keyedExpressions(
  expressions: Message[],
  key: string = "id"
): Messages {
  return expressions.reduce((acc, expression) => {
    const id = expression[key as keyof Message];
    return { ...acc, [id]: expression };
  }, {});
}
