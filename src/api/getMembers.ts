import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import { keyedExpressions, getExpressions } from "../helpers/expressionHelpers";
import getMember from "./getMember";

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

    const linkPromises = expressionLinks.map((link) =>
      getMember({ link, neighbourhoodUuid })
    );

    const members = await Promise.all(linkPromises);

    return members.reduce((acc, member) => {
      return { ...acc, [member.id]: member };
    }, {});
  } catch (e) {
    throw new Error(e);
  }
}
