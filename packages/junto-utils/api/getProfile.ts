import { Profile } from "../types";
import { Ad4mClient, LinkExpression } from "@perspect3vism/ad4m";
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

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

export default async function getProfile(ad4mClient: Ad4mClient, did: string): Promise<any | null> {
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

  for (const link of links.filter((e) => e.data.source === "flux://profile")) {
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
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          profile!.profilePicture = image.data.slice(1, -1);
        }
        break;
      case PROFILE_THUMBNNAIL_IMAGE:
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          if (link.data.source === FLUX_PROFILE) {
            profile!.thumbnailPicture = image.data.slice(1, -1);
          }
        }
        break;
      case BG_IMAGE:
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          if (link.data.source === FLUX_PROFILE) {
            profile!.profileBg = image.data.slice(1, -1);
          }
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
