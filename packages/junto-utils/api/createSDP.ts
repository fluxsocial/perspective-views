import ad4mClient from "./client";
import { LinkQuery, Link } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  languageAddress: string;
  message: Object;
}

export default async function ({
  perspectiveUuid,
  languageAddress,
  message,
}: Payload) {
  console.log('called')
  try {
    const expUrl = await ad4mClient.expression.create(message, languageAddress);

    const link = await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: "sioc://webrtcchannel",
        target: expUrl,
        predicate: "sioc://content_of",
      })
    );

    return link;
  } catch (e: any) {
    throw new Error(e);
  }
}
