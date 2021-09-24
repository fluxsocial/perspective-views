import ad4mClient from "./client";
import { LinkExpression, LinkQuery } from "@perspect3vism/ad4m";
import { getExpression } from "../helpers/expressionHelpers";
import { Message } from "../types";
import getProfile from "./getProfile";
import { session } from "../helpers/storageHelpers";

export interface Payload {
  perspectiveUuid: string;
  profileLangAddress: string;
  link: LinkExpression;
}

export default async function ({
  link,
  perspectiveUuid,
  profileLangAddress,
}: Payload): Promise<Message> {
  try {
    const expression = await getExpression(link);

    const replyLinks = await ad4mClient.perspective.queryLinks(
      perspectiveUuid,
      new LinkQuery({
        source: link.data.target,
        predicate: "sioc://reply_to",
      })
    );

    const reactionLinks = await ad4mClient.perspective.queryLinks(
      perspectiveUuid,
      new LinkQuery({
        source: link.data.target,
        predicate: "sioc://reaction_to",
      })
    );

    const author = await getProfile({
      did: expression.author,
      languageAddress: profileLangAddress,
    });

    const message = {
      id: link.data.target,
      timestamp: expression.timestamp,
      url: link.data.target,
      author,
      reactions: reactionLinks,
      replyUrl: replyLinks[0]?.data.target,
      content: expression.data.body,
    };

    return message as Message;
  } catch (e: any) {
    throw new Error(e);
  }
}
