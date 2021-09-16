import ad4mClient from "./client";
import { LinkQuery, Link } from "@perspect3vism/ad4m";

export interface Payload {
  neighbourhoodUuid: string;
  reaction: string;
  messageUrl: string;
}

export default async function ({
  neighbourhoodUuid,
  messageUrl,
  reaction,
}: Payload) {
  try {
    await ad4mClient.perspective.addLink(
      neighbourhoodUuid,
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
