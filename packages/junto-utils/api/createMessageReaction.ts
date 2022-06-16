import { LinkQuery, Link, Ad4mClient } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  reaction: string;
  messageUrl: string;
}

export default async function (ad4mClient: Ad4mClient, {
  perspectiveUuid,
  messageUrl,
  reaction,
}: Payload) {
  try {
    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: messageUrl,
        target: reaction,
        predicate: "sioc://reaction_to",
      })
    );
  } catch (e: any) {
    throw new Error(e);
  }
}
