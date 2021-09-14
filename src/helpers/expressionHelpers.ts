import ad4mClient from "../api/client";
import { Message, Messages } from "../types";
import { Expression, LinkExpression } from "@perspect3vism/ad4m";

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

export function sortExpressionsByTimestamp(
  expressions: Messages,
  order: "asc" | "desc"
): Message[] {
  return Object.values(expressions).sort((a, b) => {
    if (order === "asc") {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
  });
}
