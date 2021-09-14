import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import {
  keyedExpressions,
  getExpressionsByLinks,
} from "../helpers/expressionHelpers";

export interface Payload {
  neighbourhoodUuid: string;
  neighbourhoodUrl: string;
}

export default async function ({
  neighbourhoodUuid,
  neighbourhoodUrl,
}: Payload) {
  try {
    const expressionLinks = await ad4mClient.perspective.queryLinks(
      neighbourhoodUuid,
      new LinkQuery({
        source: `${neighbourhoodUrl!}://self`,
        predicate: "sioc://has_member",
      })
    );

    const profiles = await getExpressionsByLinks(expressionLinks);

    return keyedExpressions(profiles, "author");
  } catch (e) {
    console.log(e);
  }
}
