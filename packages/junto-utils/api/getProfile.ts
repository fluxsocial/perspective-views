import { Profile } from "../types";
import ad4mClient from "../api/client";
import { parseProfile } from "../helpers/profileHelpers";
import { DexieProfile } from "../helpers/storageHelpers";
import retry from "../helpers/retry";

export interface Payload {
  url: string;
  perspectiveUuid: string
}

export default async function getProfile({
  url,
  perspectiveUuid
}: Payload): Promise<Profile | null> {
  const dexie = new DexieProfile(perspectiveUuid, 1);

  try {
    //  TODO: How do we handle localstorage
    //  in web components and not create name clashes?
    let cachedProfile = await dexie.get(url);

    if (cachedProfile) {
      return cachedProfile as Profile;
    }

    const expression = await retry(async () => {
      return await ad4mClient.expression.get(url)
    }, { defaultValue: {} });

    if (expression) {
      const data = JSON.parse(expression.data);

      const partialProfile = parseProfile(data.profile);
  
      const profile = {
        did: url.split('://')[1],
        timestamp: expression.timestamp,
        url: url,
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
