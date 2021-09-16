import { LinkExpression } from "@perspect3vism/ad4m";
import { getExpression } from "../helpers/expressionHelpers";
import { Profile } from "../types";

export interface Payload {
  neighbourhoodUuid: string;
  link: LinkExpression;
}

export default async function ({ link, neighbourhoodUuid }: Payload) {
  try {
    const expression = await getExpression(link);

    return {
      id: expression.author,
      timestamp: link.timestamp,
      username: "Leif",
    } as Profile;
  } catch (e: any) {
    throw new Error(e);
  }
}
