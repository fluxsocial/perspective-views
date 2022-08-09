import { LinkQuery, Literal } from "@perspect3vism/ad4m";
import ad4mClient from "./client";
import getMessage from "./getMessage";

export interface Payload {
  perspectiveUuid: string;
  from?: Date;
  to?: Date;
}

export default async function ({ perspectiveUuid, from, to }: Payload) {
  try {
    const expressionLinks = await ad4mClient.perspective.queryLinks(
        perspectiveUuid,
        new LinkQuery({
          source: "sioc://chatchannel",
          predicate: "sioc://content_of",
          fromDate: from || new Date(),
          untilDate: to || new Date("August 19, 1975 23:15:30"),
          limit: 35
        })
    );

    const messages = expressionLinks.map((link) =>
      Literal.fromUrl(link.data.target).get()
    );

    const keyedMessages = messages.filter((message) => { 
      if (message){
        return true
      } else {
        return false
      }
    }).reduce((acc, message) => {
      //@ts-ignore
      return { ...acc, [message.id]: message };
    }, {});

    return {keyedMessages: keyedMessages, expressionLinkLength: expressionLinks.length};
  } catch (e: any) {
    throw new Error(e);
  }
}
