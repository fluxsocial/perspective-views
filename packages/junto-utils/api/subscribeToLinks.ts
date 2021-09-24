import ad4mClient from "./client";
import { LinkExpression } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  added: Function;
  removed: Function;
}

export default async function ({ perspectiveUuid, added, removed }: Payload) {
  try {
    ad4mClient.perspective.addPerspectiveLinkAddedListener(
      perspectiveUuid,
      (link: LinkExpression) => {
        added(link as LinkExpression);
      }
    );
    ad4mClient.perspective.addPerspectiveLinkRemovedListener(
      perspectiveUuid,
      (link: LinkExpression) => {
        removed(link as LinkExpression);
      }
    );
  } catch (e) {
    throw new Error(e);
  }
}
