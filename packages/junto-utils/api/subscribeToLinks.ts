import { Ad4mClient, LinkExpression } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  added?: Function;
  removed?: Function;
}

export default async function (ad4mClient: Ad4mClient, { perspectiveUuid, added, removed }: Payload) {
  try {
    const perspective = await ad4mClient.perspective.byUUID(perspectiveUuid);
    
    if (added) {
      perspective.addListener('link-added', added);
    }

    if (removed) {
      perspective.addListener('link-removed', removed);
    }

    return perspective;
  } catch (e) {
    throw new Error(e);
  }
}
