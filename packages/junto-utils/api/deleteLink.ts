import ad4mClient from "./client";
import { LinkQuery, Link, LinkExpression } from "@perspect3vism/ad4m";

export interface Payload {
  perspectiveUuid: string;
  linkExpression: LinkExpression;
}

export default async function ({ perspectiveUuid, linkExpression }: Payload) {
  try {
    const test = await ad4mClient.perspective.removeLink(perspectiveUuid, linkExpression);
    console.log('err 0', test)
  } catch (e) {
    console.log('err', e)
    // @ts-ignore
    throw new Error(e);
  }
}
