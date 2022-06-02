import { Profile } from "../types";
import ad4mClient from "../api/client";
import { LinkExpression } from "@perspect3vism/ad4m";
import {
  USERNAME,
  GIVEN_NAME,
  FAMILY_NAME,
  EMAIL,
  PROFILE_IMAGE,
  PROFILE_THUMBNNAIL_IMAGE,
  FLUX_PROFILE,
} from "../constants/profile";

export interface Payload {
  url: string;
  perspectiveUuid: string;
}

export default async function getProfile(url: string): Promise<Profile | null> {
  const did = url.includes("://") ? url.split("://")[1] : url;

  const agentPerspective = await ad4mClient.agent.byDID(did);

  const agentLinks = agentPerspective!.perspective!.links;

  let profile: Profile = {
    did,
    url,
    author: did,
    username: "",
    email: "",
    givenName: "",
    familyName: "",
    timestamp: new Date().toISOString(),
    thumbnailPicture: "",
    profilePicture: "",
  };

  const profileLinks = agentLinks.filter((e) => e.data.source === FLUX_PROFILE);

  for (const { data: target, predicate, source } of profileLinks) {
    switch (predicate) {
      case USERNAME:
        profile!.username = target;
        break;
      case GIVEN_NAME:
        profile!.givenName = target;
        break;
      case FAMILY_NAME:
        profile!.familyName = target;
        break;
      case PROFILE_IMAGE:
        var image = await ad4mClient.expression.get(target);
        if (image) {
          profile!.profilePicture = image.data.slice(1, -1);
        }
        break;
      case PROFILE_THUMBNNAIL_IMAGE:
        var image = await ad4mClient.expression.get(target);
        if (image) {
          profile!.thumbnailPicture = image.data.slice(1, -1);
        }
        break;
      case EMAIL:
        profile!.email = target;
        break;
      default:
        break;
    }
  }

  return profile;
}
