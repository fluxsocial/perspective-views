import { Ad4mClient } from "@perspect3vism/ad4m";

export default async function getMe(ad4mClient: Ad4mClient) {
  try {
    console.log({ ad4mClient });
    const me = await ad4mClient.agent.me();
    const status = await ad4mClient.agent.status();
    return { ...me, ...status };
  } catch (e: any) {
    throw new Error(e);
  }
}
