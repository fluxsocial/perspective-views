import ad4mClient from "./client";
import { LinkQuery, Link } from "@perspect3vism/ad4m";

export interface Payload {
  neighbourhoodUuid: string;
  callback: Function;
}

async function getExpression(link: any) {
  const address = link.data.target;
  const expression = await ad4mClient.expression.get(address);
  return JSON.parse(expression.data);
}

export default async function ({ neighbourhoodUuid, callback }: Payload) {
  try {
    ad4mClient.perspective.addPerspectiveLinkAddedListener(
      neighbourhoodUuid,
      (link: any) => {
        callback(link);
      }
    );
  } catch (e) {
    throw new Error(e);
  }
}
