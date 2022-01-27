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
    let replyLinks = await retry(async () => {
      return await ad4mClient.perspective.queryLinks(
        perspectiveUuid,
        new LinkQuery({
          source: url,
          predicate: "sioc://reply_to",
        })
      );
    }, { defaultValue: [] });

    const filteredReplyLinks = replyLinks.filter(e => e.data.source === url);

    return filteredReplyLinks[0]?.data.target;
  } catch (e: any) {
    throw new Error(e);
  }
}
