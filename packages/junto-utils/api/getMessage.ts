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

    let replyLinks = await retry(async () => {
      return await ad4mClient.perspective.queryLinks(
        perspectiveUuid,
        new LinkQuery({
          source: link.data.target,
          predicate: "sioc://reply_to",
        })
      );
    }, { defaultValue: [] });

    const filteredReplyLinks = replyLinks.filter(e => e.data.source === link.data.target);

    const message = {
      id: link.data.target,
      timestamp: expression.timestamp,
      url: link.data.target,
      author: link.author,
      reactions: [],
      replyUrl: filteredReplyLinks[0]?.data.target,
      content: expression.data.body,
    };

    return message as Message;
  } catch (e: any) {
    throw new Error(e);
  }
}
