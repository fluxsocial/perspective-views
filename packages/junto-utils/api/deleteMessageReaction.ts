import { LinkQuery, Link, LinkExpression, Ad4mClient } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  linkExpression: LinkExpression;
}

export default async function (ad4mClient: Ad4mClient, { perspectiveUuid, linkExpression }: Payload) {
  try {
    await ad4mClient.perspective.removeLink(perspectiveUuid, linkExpression);
  } catch (e: any) {
    throw new Error(e);
  }
}
