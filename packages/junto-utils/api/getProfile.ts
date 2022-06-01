import { Profile } from "../types";
import ad4mClient from "../api/client";
import { LinkExpression } from "@perspect3vism/ad4m";

export interface Payload {
  url: string;
  perspectiveUuid: string
}

export default async function getProfile(url: string): Promise<Profile | null> {
  const did =  url.split('://')[1];

  const agentPerspective = await ad4mClient.agent.byDID(did);

  const agentLinks = agentPerspective!.perspective!.links;

  const profile: Profile = {
    did,
    url,
    author: did,
    username: '',
    email: '',
    givenName: '',
    familyName: '',
    timestamp: new Date().toISOString(),
    thumbnailPicture: '',
    profilePicture: ''
  };

  for (const link of agentLinks.filter(e => e.data.source === 'flux://profile')) {
    let expUrl;
    let image;

    switch (link.data.predicate) {
      case "sioc://has_username":
        profile!.username = link.data.target;
        break;
      case "sioc://has_given_name":
        profile!.givenName = link.data.target;
        break;
      case "sioc://has_family_name":
        profile!.familyName = link.data.target;
        break;
      case "sioc://has_profile_image":
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);
    
        if (image) {
          profile!.profilePicture = image.data.slice(1, -1);
        }
        break;
      case "sioc://has_profile_thumbnail_image":
        expUrl = link.data.target;
        image = await ad4mClient.expression.get(expUrl);

        if (image) {
          if (link.data.source === "flux://profile") {
            profile!.thumbnailPicture = image.data.slice(1, -1);
          }
        }
        break;
      case "sioc://has_email":
        profile!.email = link.data.target;
        break;
      default:
        break;
    }
  }

  return profile
}