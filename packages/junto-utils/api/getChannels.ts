import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import getMember from "./getProfile";
import getPerspectiveMeta from "./getPerspectiveMeta";
import { findLink } from "../helpers/linkHelpers";
import { getMetaFromLinks, keyedLanguages } from "../helpers/languageHelpers";
import retry from "../helpers/retry";

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
          source: `${neighbourhoodUrl!}://self`,
          predicate: "sioc://has_space",
        })
    )}, []);

    const linkPromises = expressionLinks.map(async (link) => {
      const neighbourhood = await ad4mClient.neighbourhood.joinFromUrl(link.data.target);
      const links = (neighbourhood.neighbourhood.meta?.links as Array<any>) || [];
      const languageLinks = links.filter(findLink.language);
      const langs = await getMetaFromLinks(languageLinks);
    
      return {
        name: links.find(findLink.name).data.target,
        description: links.find(findLink.description).data.target,
        languages: keyedLanguages(langs),
        url: neighbourhood.sharedUrl || "",
        id: neighbourhood.uuid
      };
    });

    const channels = await Promise.all(linkPromises);
    
    return channels.reduce((acc, channel) => {
      return { ...acc, [channel.id]: channel };
    }, {[perspectiveUuid]: home});
  } catch (e) {
    throw new Error(e);
  }
}
