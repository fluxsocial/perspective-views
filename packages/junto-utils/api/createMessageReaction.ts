import { Link } from "@perspect3vism/ad4m";
import { REACTION } from "../constants/ad4m";
import ad4mClient from "./client";

export interface Payload {
  perspectiveUuid: string;
  reaction: string;
  messageUrl: string;
}

export default async function ({
  perspectiveUuid,
  messageUrl,
  reaction,
}: Payload) {
  try {
    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: messageUrl,
        target: reaction.codePointAt(0).toString(16),
        predicate: REACTION,
      })
    );
  } catch (e: any) {
    throw new Error(e);
  }
}
