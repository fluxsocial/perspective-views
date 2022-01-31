import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import getMember from "./getProfile";
import retry from "../helpers/retry";

export interface Payload {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
}

export default async function ({ perspectiveUuid, neighbourhoodUrl }: Payload) {
  try {
    const expressionLinks = await retry(async () => {
      return await ad4mClient.perspective.queryLinks(
        perspectiveUuid,
        new LinkQuery({
          source: neighbourhoodUrl!,
          predicate: "sioc://has_member",
        })
    )}, { defaultValue: [] });

    const linkPromises = expressionLinks.map((link) =>
      getMember({ did: link.author, languageAddress: link.data.target.split("://")[0], perspectiveUuid })
    );

    const members = await Promise.all(linkPromises);
    
    return members.reduce((acc, member) => {
      return { ...acc, [member.did]: member };
    }, {});
  } catch (e) {
    throw new Error(e);
  }
}
