import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import getMessage from "./getMessage";
import getPerspectiveMeta from "./getPerspectiveMeta";
import { PROFILE_EXPRESSION } from "../helpers/languageHelpers";

export interface Payload {
  perspectiveUuid: string;
  from?: Date;
  to?: Date;
}

export default async function ({ perspectiveUuid, from, to }: Payload) {
  try {
    const { languages } = await getPerspectiveMeta(perspectiveUuid);

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

    const linkPromises = expressionLinks.map((link) =>
      getMessage({
        link,
        perspectiveUuid,
        profileLangAddress: languages[PROFILE_EXPRESSION],
      })
    );

    const messages = await Promise.all(linkPromises);
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
