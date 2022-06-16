import { Ad4mClient, LinkExpression, LinkQuery } from "@perspect3vism/ad4m";
import { getExpression } from "../helpers/expressionHelpers";
import { Message } from "../types";
import retry from "../helpers/retry";

export interface Payload {
  perspectiveUuid: string;
  link: LinkExpression;
}



export default async function (ad4mClient: Ad4mClient, link: LinkExpression): Promise<Message | undefined> {
  try {
    const expression = await retry(async () => {
      return await getExpression(ad4mClient, link);
    }, {});

    if (!expression) {
      return undefined
    }

    const message = {
      id: link.data.target,
      timestamp: expression.timestamp,
      url: link.data.target,
      author: link.author,
      reactions: [],
      replyUrl: undefined,
      content: expression.data.body,
    };

    return message as Message;
  } catch (e: any) {
    throw new Error(e);
  }
}
