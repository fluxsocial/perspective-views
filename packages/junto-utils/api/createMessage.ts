import { LinkQuery, Link, Ad4mClient } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  languageAddress: string;
  message: Object;
}

export default async function (ad4mClient: Ad4mClient, {
  perspectiveUuid,
  languageAddress,
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
  } catch (e: any) {
    throw new Error(e);
  }
}
