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
  try {
    console.log({ perspectiveUuid, languageAddress, message });
    const expUrl = await ad4mClient.expression.create(message, languageAddress);

    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: "sioc://chatchannel",
        target: expUrl,
        predicate: "sioc://content_of",
      })
    );
  } catch (e: any) {
    throw new Error(e);
  }
}
