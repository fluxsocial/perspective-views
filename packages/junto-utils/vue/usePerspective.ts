import { watchEffect, ref } from "vue";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
interface Props {
  perspectiveUuid: any;
}

export default function usePerspective({ perspectiveUuid }: Props) {
  const name = ref("");
  const description = ref("");
  const url = ref("");
  const languages = ref({});

  watchEffect(async () => {
    if (perspectiveUuid.value) {
      const meta = await getPerspectiveMeta(perspectiveUuid.value);

      name.value = meta.name;
      description.value = meta.description;
      languages.value = meta.languages;
    }
  });

  return {
    name,
    description,
    url,
    languages,
  };
}
