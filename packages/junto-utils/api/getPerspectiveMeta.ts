import { findLink } from "../helpers/linkHelpers";
import { getMetaFromLinks, keyedLanguages } from "../helpers/languageHelpers";
import retry from "../helpers/retry";
import { LinkQuery } from "@perspect3vism/ad4m";
import ad4mClient from "./client";

export default async function getPerspectiveMeta(uuid: string) {
  const perspective = await ad4mClient.perspective.byUUID(uuid);
  
  if (!perspective || !perspective.neighbourhood) {
    throw new Error("Could not load meta data from perspective");
  }
  
  const neighbourhood = perspective.neighbourhood;
  
  const expressionLinks = await retry(async () => {
    return await ad4mClient.perspective.queryLinks(
      uuid,
      new LinkQuery({
        source: perspective?.sharedUrl!,
        predicate: "flux://parentCommunity",
      })
  )}, { defaultValue: [] });

  let sourceUuid = uuid;
  if (expressionLinks.length > 0) {
    const all = await ad4mClient.perspective.all();
    const neighbourhood = all.find(e => e.sharedUrl === expressionLinks[0].data.target);
    sourceUuid = neighbourhood.uuid;
  }

  const links = (neighbourhood.meta?.links as Array<any>) || [];
  const languageLinks = links.filter(findLink.language);
  const langs = await getMetaFromLinks(languageLinks);
  
  return {
    name: links.find(findLink.name).data.target,
    description: links.find(findLink.description).data.target,
    languages: keyedLanguages(langs),
    url: perspective?.sharedUrl || "",
    dateCreated: links.find(findLink.dateCreated).data.target,
    sourceUrl: expressionLinks.length > 0 ? expressionLinks[0].data.target : perspective?.sharedUrl || "",
    sourceUuid,
    isHome :expressionLinks.length === 0 
  };
}
