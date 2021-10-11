import { LinkExpression } from "@perspect3vism/ad4m";
import { getExpression } from "../helpers/expressionHelpers";
import { AudioVideoExpression } from "../types";
import getProfile from "./getProfile";

export interface Payload {
  perspectiveUuid: string;
  profileLangAddress: string;
  link: LinkExpression;
}

export default async function ({link, profileLangAddress}: Payload): Promise<AudioVideoExpression> {
  try {
    const expression = await getExpression(link);
    const author = await getProfile({
      did: expression.author,
      languageAddress: profileLangAddress
    });

    return {
      id: link.data.target,
      timestamp: expression.timestamp,
      url: link.data.target,
      author,
      sdp: expression.data,
      link,
    }
  } catch (e) {
    throw new Error(e);
  }
}