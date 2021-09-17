import { ref, watch, onMounted } from "vue";
import { LinkExpression } from "@perspect3vism/ad4m";
import { Messages } from "../types";
import subscribeToLinks from "../api/subscribeToLinks";

import getMembers from "../api/getMembers";

interface Props {
  perspectiveUuid: string;
  neighbourhoodUrl: string;
}

export default function useMembers({
  perspectiveUuid,
  neighbourhoodUrl,
}: Props) {
  const previousMembers = JSON.parse(localStorage.getItem("members") || "{}");
  const members = ref<Messages>(previousMembers);

  watch(
    () => members.value,
    () => {
      localStorage.setItem("members", JSON.stringify(members.value));
    },
    { deep: true }
  );

  onMounted(async () => {
    members.value = await getMembers({
      perspectiveUuid,
      neighbourhoodUrl,
    });
  });

  return { members };
}
