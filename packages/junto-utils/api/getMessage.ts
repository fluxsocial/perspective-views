import ad4mClient from "./client";
import { LinkExpression, LinkQuery } from "@perspect3vism/ad4m";
import { getExpression } from "../helpers/expressionHelpers";
import { Message } from "../types";
import getProfile from "./getProfile";
import { session } from "../helpers/storageHelpers";
import retry from "../helpers/retry";

export interface Payload {
  perspectiveUuid: string;
  profileLangAddress: string;
  link: LinkExpression;
}



export default async function ({
  link,
  perspectiveUuid,
  profileLangAddress,
}: Payload): Promise<Message | undefined> {
  try {
    const expression = await retry(async () => {
      return await getExpression(link);
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
