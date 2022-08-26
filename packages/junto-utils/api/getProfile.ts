import {
  USERNAME,
  GIVEN_NAME,
  FAMILY_NAME,
  EMAIL,
  PROFILE_IMAGE,
  PROFILE_THUMBNNAIL_IMAGE,
  FLUX_PROFILE,
  BG_IMAGE,
  BIO,
} from "../constants/profile";
import ad4mClient from "./client";

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

async function getImage(expUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => {
      resolve("");
    }, 1000);

    try {
      const image = await ad4mClient.expression.get(expUrl);
      
      if (image) {
        resolve(image.data.slice(1, -1));
      }

      resolve("")
    } catch (e) {
      console.error(e)
      resolve("");
    }
  })
}

export default async function getProfile(did: string): Promise<any | null> {
  const agentPerspective = await ad4mClient.agent.byDID(did);
  const links = agentPerspective!.perspective!.links;

  const profile: any = {
    username: "",
    bio: "",
    email: "",
    profileBg: "",
    profilePicture: "",
    thumbnailPicture: "",
    givenName: "",
    familyName: "",
  };

  for (const link of links.filter((e) => e.data.source === FLUX_PROFILE)) {
    let expUrl;
    let image;

    switch (link.data.predicate) {
      case USERNAME:
        profile!.username = link.data.target;
        break;
      case BIO:
        profile!.username = link.data.target;
        break;
      case GIVEN_NAME:
        profile!.givenName = link.data.target;
        break;
      case FAMILY_NAME:
        profile!.familyName = link.data.target;
        break;
      case PROFILE_IMAGE:
        expUrl = link.data.target;
        profile!.profilePicture = await getImage(expUrl);

        break;
      case PROFILE_THUMBNNAIL_IMAGE:
        expUrl = link.data.target;
        profile!.thumbnailPicture = await getImage(expUrl);

        break;
      case BG_IMAGE:
        expUrl = link.data.target;
        profile!.profileBg = await getImage(expUrl);

        break;
      case EMAIL:
        profile!.email = link.data.target;
        break;
      default:
        break;
    }
  }

  return { ...profile, did };
}
