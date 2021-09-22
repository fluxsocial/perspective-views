import { Profile } from "../types";
import ad4mClient from "../api/client";
import { parseProfile } from "../helpers/profileHelpers";
import { session } from "../helpers/storageHelpers";

export interface Payload {
  did: string;
  languageAddress: string;
}

export default async function getProfile({
  did,
  languageAddress,
}: Payload): Promise<Profile> {
  try {
    const url = `${languageAddress}://${did}`;

    //  TODO: How do we handle localstorage
    //  in web components and not create name clashes?
    let cachedProfile = session.get(url);

    if (cachedProfile) {
      return cachedProfile as Profile;
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

    session.set(url, profile);

    return profile;
  } catch (e: any) {
    throw new Error(e);
  }
}
