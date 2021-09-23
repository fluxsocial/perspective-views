import ad4mClient from "./client";
import { LinkQuery, Link } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  added: Function;
  removed: Function;
}

export default async function ({ perspectiveUuid, added, removed }: Payload) {
  try {
    ad4mClient.perspective.addPerspectiveLinkAddedListener(
      perspectiveUuid,
      (link: any) => {
        added(link);
      }
    );
    ad4mClient.perspective.addPerspectiveLinkRemovedListener(
      perspectiveUuid,
      (link: any) => {
        removed(link);
      }
    );
  } catch (e) {
    throw new Error(e);
  }
}
