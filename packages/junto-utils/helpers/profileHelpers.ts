export const EMAIL = "schema:email";

export const ACCOUNT_NAME = "foaf:AccountName";

export const GIVEN_NAME = "schema:givenName";

export const FAMILY_NAME = "schema:familyName";

export const TYPE = "foaf:OnlineAccount";

export const IMAGE = "schema:image";

export const CONTENT_SIZE = "schema:contentSize";

export const CONTENT_URL = "schema:contentUrl";

export const THUMBNAIL = "schema:thumbnail";

import { Profile } from "../types";

interface Image {
  contentUrl: string;
  contentSize: string;
}

interface ImageWithThumbnail extends Image {
  thumbnail?: Image;
}

function shouldParse(data: any) {
  return data && typeof data === "string";
}

export function parseThumbnail(data: any): Image {
  const thumbnail = shouldParse(data) ? JSON.parse(data) : data;
  return {
    contentUrl: thumbnail[CONTENT_URL],
    contentSize: thumbnail[CONTENT_SIZE],
  };
}

export function parseImage(data: string): ImageWithThumbnail {
  const image = shouldParse(data) ? JSON.parse(data) : data;
  return {
    contentUrl: image[CONTENT_URL],
    contentSize: image[CONTENT_SIZE],
    thumbnail: image[THUMBNAIL] && parseThumbnail(image[THUMBNAIL]),
  };
}

export function parseProfile(data: any): any {
  const profile = shouldParse(data) ? JSON.parse(data) : data;
  const image = profile[IMAGE] && parseImage(profile[IMAGE]);

  return {
    username: profile[ACCOUNT_NAME],
    email: profile[EMAIL],
    givenName: profile[GIVEN_NAME],
    familyName: profile[FAMILY_NAME],
    thumbnailPicture: image?.thumbnail?.contentUrl,
    profilePicture: image?.contentUrl,
  };
}
