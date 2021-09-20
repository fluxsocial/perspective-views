import { ref, watch, onMounted } from "vue";
import { LinkExpression } from "@perspect3vism/ad4m";
import { Messages } from "../types";
import subscribeToLinks from "../api/subscribeToLinks";
import ad4mClient from "../api/client";

import getMembers from "../api/getMembers";

interface Props {
  perspectiveUuid: string;
}

export default function useMembers({ perspectiveUuid }: Props) {
  const members = ref<Messages>({});

  onMounted(async () => {
    const perspective = await ad4mClient.perspective.byUUID(perspectiveUuid);
    members.value = await getMembers({
      perspectiveUuid,
      neighbourhoodUrl: perspective?.sharedUrl || "",
    });
  });

  return { members };
}
