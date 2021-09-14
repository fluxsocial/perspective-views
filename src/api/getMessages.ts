import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import {
  keyedExpressions,
  getExpressionsByLinks,
} from "../helpers/expressionHelpers";

export interface Payload {
  neighbourhoodUuid: string;
  from?: Date;
  to?: Date;
}

export default async function ({ neighbourhoodUuid, from, to }: Payload) {
  try {
    const expressionLinks = await ad4mClient.perspective.queryLinks(
      neighbourhoodUuid,
      new LinkQuery({
        source: "sioc://chatchannel",
        predicate: "sioc://content_of",
        fromDate: new Date("1/12/10"),
        untilDate: new Date(),
      })
    );

    const messages = await getExpressionsByLinks(expressionLinks);

    return keyedExpressions(messages);
  } catch (e) {
    console.log(e);
  }
}
