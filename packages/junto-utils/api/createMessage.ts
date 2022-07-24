import { Link } from "@perspect3vism/ad4m";
import ad4mClient from "./client";

export interface Payload {
  perspectiveUuid: string;
  languageAddress: string;
  lastMessage: string;
  message: Object;
}

export default async function ({
  perspectiveUuid,
  lastMessage,
  languageAddress,
  message,
}: Payload) {
  try {
    const expUrl = await ad4mClient.expression.create(message, languageAddress);

    await ad4mClient.perspective.addLink(
      perspectiveUuid,
      new Link({
        source: lastMessage,
        target: expUrl,
        predicate: "temp://succeeded_by",
      })
    );
  } catch (e: any) {
    throw new Error(e);
  }
}
