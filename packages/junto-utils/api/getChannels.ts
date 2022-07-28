import { LinkExpression, LinkQuery } from "@perspect3vism/ad4m";
import retry from "../helpers/retry";
import ad4mClient from "./client";

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
          predicate: "sioc://has_space",
        })
    )}, { defaultValue: [] });


    const channels: {[x: string]: any} = {}

    for (const channel of expressionLinks as LinkExpression[]) {
      const name = channel.data.target;
      channels[name] = {
        id: name,
        name,
        creatorDid: channel.author,
      }
    }


    return channels;
  } catch (e) {
    throw new Error(e);
  }
}
