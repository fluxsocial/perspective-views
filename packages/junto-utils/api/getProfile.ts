import { Profile } from "../types";
import ad4mClient from "../api/client";
import { parseProfile } from "../helpers/profileHelpers";
import { DexieProfile } from "../helpers/storageHelpers";

export interface Payload {
  did: string;
  languageAddress: string;
  perspectiveUuid: string
}

export default async function getProfile({
  did,
  languageAddress,
  perspectiveUuid
}: Payload): Promise<Profile | null> {
  const dexie = new DexieProfile(perspectiveUuid, 1);

  try {
    const url = `${languageAddress}://${did}`;

    //  TODO: How do we handle localstorage
    //  in web components and not create name clashes?
    let cachedProfile = await dexie.get(url);

    if (cachedProfile) {
      return cachedProfile as Profile;
    }

    const expression = await ad4mClient.expression.get(url);
    if (expression) {
      const data = JSON.parse(expression.data);

      const partialProfile = parseProfile(data.profile);
  
      const profile = {
        did: did,
        timestamp: expression.timestamp,
        url: `${languageAddress}://${did}`,
        profilePicture: null,
        thumbnailPicture: null,
        ...partialProfile,
      } as Profile;
  
      await dexie.save(url, profile);
  
      return profile;
    } else {
      return null
    }
  } catch (e: any) {
    throw new Error(e);
  }
}
