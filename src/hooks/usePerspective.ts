import { onMounted, ref } from "vue";
import ad4mClient from "../api/client";
import { Link, LinkExpression, LanguageMeta } from "@perspect3vism/ad4m";
import {
  getLanguageMeta,
  getMetaFromLinks,
  keyedLanguages,
} from "../helpers/languageHelpers";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
interface Props {
  perspectiveUuid: string;
}

export default function usePerspective({ perspectiveUuid }: Props) {
  const name = ref("");
  const description = ref("");
  const url = ref("");
  const languages = ref({});

  onMounted(async () => {
    const meta = await getPerspectiveMeta(perspectiveUuid);

    name.value = meta.name;
    description.value = meta.description;
    languages.value = meta.languages;
  });

  return {
    name,
    description,
    url,
    languages,
  };
}
