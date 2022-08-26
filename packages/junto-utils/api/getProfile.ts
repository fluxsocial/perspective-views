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
        try {
          expUrl = link.data.target;
          image = await ad4mClient.expression.get(expUrl);

          if (image) {
            profile!.profilePicture = image.data.slice(1, -1);
          }
        } catch (e) {
          console.error(e)
        }

        break;
      case PROFILE_THUMBNNAIL_IMAGE:
        try {
          expUrl = link.data.target;
          image = await ad4mClient.expression.get(expUrl);
  
          if (image) {
            if (link.data.source === FLUX_PROFILE) {
              profile!.thumbnailPicture = image.data.slice(1, -1);
            }
          }
        } catch (e) {
          console.error(e);
        }
        break;
      case BG_IMAGE:
        try {
          expUrl = link.data.target;
          image = await ad4mClient.expression.get(expUrl);
  
          if (image) {
            if (link.data.source === FLUX_PROFILE) {
              profile!.profileBg = image.data.slice(1, -1);
            }
          }
        } catch (e) {
          console.error(e);
        }
        
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
