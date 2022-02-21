import ad4mClient from "./client";
import { LinkQuery, Link } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  messageUrl: string;
}

export default async function ({
  perspectiveUuid,
  messageUrl,
}: Payload) {
  try {
    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: messageUrl,
        target: "-",
        predicate: "sioc://is_hidden",
      })
    );
  } catch (e: any) {
    throw new Error(e);
  }
}
