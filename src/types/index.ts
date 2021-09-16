export interface Message {
  id: string;
  url: string;
  author: string;
  reactions: Array<string>;
  timestamp: string;
  content: string;
  replyUrl: string;
}
export interface Messages {
  [x: string]: Message;
}

export interface Profile {
  id: string;
  url: string;
  author: string;
  timestamp: string;
  username: string;
}
export interface Profiles {
  [x: string]: Profile;
}
