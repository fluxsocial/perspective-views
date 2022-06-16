import { Message, Messages } from "../types";
import { Ad4mClient, Expression, LinkExpression } from "@perspect3vism/ad4m";

export async function getExpression(ad4mClient: Ad4mClient, link: LinkExpression): Promise<Expression | null> {
  const expression = await ad4mClient.expression.get(link.data.target);
  if (expression) {
    return { ...expression, data: JSON.parse(expression.data) };
  } else {
    return null
  }
}

export async function getExpressions(ad4mClient: Ad4mClient, expressionLinks: LinkExpression[]) {
  const linkPromises = expressionLinks.map((link) => getExpression(ad4mClient, link));
  return await Promise.all(linkPromises);
}

export function sortExpressionsByTimestamp(
  expressions: Messages,
  order: "asc" | "desc"
): Message[] {
  return Object.values(expressions).sort((a, b) => {
    return order === "asc"
      ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
