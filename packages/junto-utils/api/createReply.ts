import ad4mClient from "./client";
import { LinkQuery, Link } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  languageAddress: string;
  replyUrl: string;
  message: Object;
}

export default async function ({
  perspectiveUuid,
  languageAddress,
  replyUrl,
  message,
}: Payload) {
  try {
    const expUrl = await ad4mClient.expression.create(message, languageAddress);

    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: "sioc://chatchannel",
        target: expUrl,
        predicate: "sioc://content_of",
      })
    );

    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: expUrl,
        target: replyUrl,
        predicate: "sioc://reply_to",
      })
    );
  } catch (e: any) {
    throw new Error(e);
  }
}
