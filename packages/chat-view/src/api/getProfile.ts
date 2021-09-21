import { LinkExpression } from "@perspect3vism/ad4m";
import { getExpression } from "../helpers/expressionHelpers";
import { Profile } from "../types";
import ad4mClient from "../api/client";
import { parseProfile } from "../helpers/profileHelpers";
import { TimeoutCache } from "../helpers/timeoutCache";
import { UNREF } from "@vue/compiler-core";

export interface Payload {
  did: string;
  languageAddress: string;
}

export default async function getProfile({ did, languageAddress }: Payload) {
  try {
    const url = `${languageAddress}://${did}`;

    const cache = new TimeoutCache<Profile>(1000 * 60 * 5);

    let cachedProfile = cache.get(url);

    if (cachedProfile) {
      return cachedProfile;
    }

    const expression = await ad4mClient.expression.get(url);

    const data = JSON.parse(expression.data);

    const partialProfile = parseProfile(data.profile);

    const profile = {
      did: did,
      timestamp: expression.timestamp,
      url: `${languageAddress}://${did}`,
      ...partialProfile,
    };

    cache.set(url, profile);

    return profile as Profile;
  } catch (e: any) {
    throw new Error(e);
  }
}