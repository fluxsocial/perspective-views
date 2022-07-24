import { LinkQuery } from "@perspect3vism/ad4m";
import getPerspectiveMeta from "./getPerspectiveMeta";
import { findLink } from "../helpers/linkHelpers";
import { getMetaFromLinks, keyedLanguages } from "../helpers/languageHelpers";
import retry from "../helpers/retry";
import ad4mClient from "./client";

export interface Payload {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
}

export default async function ({ perspectiveUuid, neighbourhoodUrl }: Payload) {
  try {
    const home = await getPerspectiveMeta(perspectiveUuid)
    const expressionLinks = await retry(async () => {
      return await ad4mClient.perspective.queryLinks(
        perspectiveUuid,
        new LinkQuery({
          source: neighbourhoodUrl!,
          predicate: "sioc://has_space",
        })
    )}, { defaultValue: [] });


    const linkPromises = []

    for (const channel of expressionLinks as []) {
      linkPromises.push(new Promise(async (resolve) => {
        const links = await ad4mClient.perspective.queryLinks(
          perspectiveUuid,
          new LinkQuery({
            source: channel.data.target,
            fromDate: new Date(),
            untilDate: new Date("August 19, 1975 23:15:30"),
            limit: 35
          })
        );

        resolve({
          id: links[0].data.source,
          name: links.find(e => e.data.predicate === "flux://name")?.data.target,
          creatorDid: links.find(e => e.data.predicate === "flux://creator_did")?.data.target,
        })
      }))
    }

    const channels = await Promise.all(linkPromises);

    return channels.reduce((acc, channel) => {
      return { ...acc, [channel.id]: channel };
    }, {});
  } catch (e) {
    throw new Error(e);
  }
}
