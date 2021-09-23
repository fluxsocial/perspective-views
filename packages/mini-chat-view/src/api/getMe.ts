import ad4mClient from "./client";

export default async function getMe() {
  try {
    return await ad4mClient.agent.me();
  } catch (e: any) {
    throw new Error(e);
  }
}
