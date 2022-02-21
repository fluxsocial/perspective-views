import ad4mClient from "./client";
import retry from "../helpers/retry";
import { LinkQuery, Link } from "@perspect3vism/ad4m";
import { findLink } from "../helpers/linkHelpers";
import { getMetaFromLinks, keyedLanguages } from "../helpers/languageHelpers";
import { fetch as openFetch } from 'fetch-opengraph';
import getOGData from '../helpers/getOGData'


export interface Payload {
  perspectiveUuid: string;
  messageUrl: string;
  message: Object;
  isHidden: boolean;
}

export function findNeighbourhood(str: string) {
  const URIregexp = /(?<=\<span data-neighbourhood=""\>)(.|\n)*?(?=<\/span\>)/gm
  const URLregexp = /<a[^>]+href=\"(.*?)\"[^>]*>(.*)?<\/a>/gm
  const uritokens = str.matchAll(URIregexp)
  const urlTokens = str.matchAll(URLregexp)

  const urifiltered = [];
  const urlfiltered = [];
  
  const urlRex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/
  for (const match of uritokens) {
    if (!urlRex.test(match[0])) {
      urifiltered.push(match[0])
    }
  }
  
  for (const match of urlTokens) {
    urlfiltered.push(match[1])
  }

  return [urifiltered, urlfiltered];
}

export default async function ({
  message,
  isHidden
}: Payload) {
  try {
    // @ts-ignore
    const [neighbourhoods, urls] = findNeighbourhood(message);

    const hoods = []

    if (isHidden) {
      for (const neighbourhood of neighbourhoods) {
        console.log('neighbourhood', neighbourhood)
        const exp = await ad4mClient.expression.get(neighbourhood);
        const links = JSON.parse(exp.data).meta.links;

        const languageLinks = links.filter(findLink.language);
        const langs = await getMetaFromLinks(languageLinks);

        hoods.push({
          type: 'neighbourhood',
          name: links.find(findLink.name).data.target,
          description: links.find(findLink.description).data.target,
          languages: keyedLanguages(langs),
          url: neighbourhood || "",
        })
      }

      for (const url of urls) {
        const response = await fetch(url);
        const html = await response.text();
        const data = await getOGData(url, html)

        console.log(data)
        
        hoods.push({
          type: 'link',
          name: data.title,
          description: data.description,
          image: data.image || data.logo,
          url
        })
      }
    }

    return hoods;
  } catch (e: any) {
    throw new Error(e);
  }
}



export async function getNeighbourhoodCardHidden({
  perspectiveUuid,
  messageUrl,
}) {
  try {
    const isHidden = await retry(async () => {
      return await ad4mClient.perspective.queryLinks(
        perspectiveUuid,
        new LinkQuery({
          source: messageUrl,
          predicate: "sioc://is_hidden",
        })
    )}, { defaultValue: [] });

    return isHidden.length === 0;
  } catch (e: any) {
    throw new Error(e);
  }
}
