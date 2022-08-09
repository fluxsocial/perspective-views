import {  LinkQuery } from "@perspect3vism/ad4m";
import getMember from "./getProfile";
import ad4mClient from "./client";
import { SELF, MEMBER } from "../constants/ad4m";

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
        source: SELF,
        predicate: MEMBER,
      })
    );

    for (const link of expressionLinks) {
      getMember(link.data.target).then((member) => {
        if (member) {
          addProfile(member)
        }
      });
    }
  } catch (e) {
    throw new Error(e);
  }
}
