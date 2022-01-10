import ad4mClient from "./client";
import { LinkQuery } from "@perspect3vism/ad4m";
import retry from "../helpers/retry";

export interface Payload {
  perspectiveUuid: string;
  url: string;
}

export default async function ({
  url,
  perspectiveUuid,
}: Payload): Promise<any[]> {
  try {
    const reactionLinks = await retry(async () => {
      return await ad4mClient.perspective.queryLinks(
        perspectiveUuid,
        new LinkQuery({
          source: url,
          predicate: "sioc://reaction_to",
        })
    )}, []);

    return reactionLinks;
  } catch (e: any) {
    throw new Error(e);
  }
}
