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

  const links = agentLinks;

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

  const usernameLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_username"
  ) as LinkExpression;

  const givenNameLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_given_name"
  ) as LinkExpression;

  const familyNameLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_family_name"
  ) as LinkExpression;

  const profilePictureLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_profile_image"
  ) as LinkExpression;

  const thumbnailLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_profile_thumbnail_image"
  ) as LinkExpression;

  const emailLink = links.find(
    (e: any) => e.data.predicate === "sioc://has_email"
  ) as LinkExpression;

  if (usernameLink) {
    profile!.username = usernameLink.data.target;
  }

  if (givenNameLink) {
    profile!.givenName = givenNameLink.data.target;
  }

  if (familyNameLink) {
    profile!.familyName = familyNameLink.data.target;
  }
  
  if (profilePictureLink) {
    const expUrl = profilePictureLink.data.target;
    const image = await ad4mClient.expression.get(expUrl);

    if (image) {
      if (profilePictureLink.data.source === "flux://profile") {
        profile!.profilePicture = image.data.slice(1, -1);
      }
    }
  } else {
    profile!.profilePicture = '';
  }

  if (thumbnailLink) {
    const expUrl = thumbnailLink.data.target;
    const image = await ad4mClient.expression.get(expUrl);

    if (image) {
      if (thumbnailLink.data.source === "flux://profile") {
        profile!.thumbnailPicture = image.data.slice(1, -1);
      }
    }
  } else {
    profile!.thumbnailPicture = '';
  }
  
  if (emailLink) {
    profile!.email = emailLink.data.target;
  }

  return profile
}