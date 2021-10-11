import { LinkExpression } from "@perspect3vism/ad4m";

export interface NeighbourhoodMeta {
  name: string;
  description: string;
  languages: { [x: string]: string };
}

export interface Reaction {
  author: string;
  content: string;
  linkUrl: string;
}

export interface Message {
  id: string;
  url: string;
  author: Profile;
  reactions: Array<LinkExpression>;
  timestamp: string;
  content: string;
  replyUrl: string;
}
export interface Messages {
  [x: string]: Message;
}

export interface Profile {
  did: string;
  url: string;
  author: string;
  timestamp: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  thumbnailPicture: string;
  profilePicture: string;
}
export interface Profiles {
  [x: string]: Profile;
}

export interface AudioVideoExpression {
  id: string,
  url?: string,
  author: Profile,
  sdp: any,
  timestamp: string,
  link: LinkExpression,
  connection?: RTCPeerConnection
  stream?: readonly MediaStream[]
}