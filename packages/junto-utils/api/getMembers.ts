import { Ad4mClient, LinkQuery } from "@perspect3vism/ad4m";
import getMember from "./getProfile";
import retry from "../helpers/retry";

export interface Payload {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
  addProfile: (profile: any) => {};
}

export default async function (ad4mClient: Ad4mClient, { perspectiveUuid, neighbourhoodUrl, addProfile }: Payload) {
  try {
    const expressionLinks = await ad4mClient.perspective.queryLinks(
      perspectiveUuid,
      new LinkQuery({
        source: neighbourhoodUrl!,
        predicate: "sioc://has_member",
      })
    );

    for (const link of expressionLinks) {
      getMember(ad4mClient, link.data.target).then((member) => {
        if (member) {
          addProfile(member)
        }
      });
    }
  } catch (e) {
    throw new Error(e);
  }
}
