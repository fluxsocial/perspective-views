import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import getMember from "./getProfile";
import retry from "../helpers/retry";

export interface Payload {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
  addProfile: (profile: any) => {};
}

export default async function ({ perspectiveUuid, neighbourhoodUrl, addProfile }: Payload) {
  try {
    const expressionLinks = await ad4mClient.perspective.queryLinks(
      perspectiveUuid,
      new LinkQuery({
        source: neighbourhoodUrl!,
        predicate: "sioc://has_member",
      })
    );

    for (const link of expressionLinks) {
      getMember({ url: link.data.target, perspectiveUuid }).then((member) => {
        if (member) {
          addProfile(member)
        }
      });
    }
  } catch (e) {
    throw new Error(e);
  }
}
