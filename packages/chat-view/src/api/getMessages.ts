import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import { PROFILE_EXPRESSION } from "../constants/languages";
import getMessage from "./getMessage";
import getPerspectiveMeta from "./getPerspectiveMeta";

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
        fromDate: from || new Date("1/12/10"),
        untilDate: to || new Date(),
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

    return messages.reduce((acc, message) => {
      return { ...acc, [message.id]: message };
    }, {});
  } catch (e: any) {
    throw new Error(e);
  }
}
