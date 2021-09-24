import ad4mClient from "./client";
import { LinkQuery, Link, LinkExpression } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  linkExpression: LinkExpression;
}

export default async function ({ perspectiveUuid, linkExpression }: Payload) {
  try {
    await ad4mClient.perspective.removeLink(perspectiveUuid, linkExpression);
  } catch (e: any) {
    throw new Error(e);
  }
}
