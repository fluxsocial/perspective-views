import { onMounted, ref } from "vue";
import ad4mClient from "../api/client";
import { Link, LinkExpression } from "@perspect3vism/ad4m";

interface Props {
  perspectiveUuid: string;
}

const findLink = {
  name: (link: LinkExpression) => link.data.predicate === "rdf://name",
  description: (link: LinkExpression) =>
    link.data.predicate === "rdf://description",
  language: (link: LinkExpression) => link.data.predicate === "language",
};

export default function usePerspective({ perspectiveUuid }: Props) {
  const name = ref("");
  const description = ref("");
  const url = ref("");

  onMounted(async () => {
    const perspective = await ad4mClient.perspective.byUUID(perspectiveUuid);
    url.value = perspective?.sharedUrl || "";

    if (perspective?.neighbourhood) {
      const neighbourhood = perspective.neighbourhood;
      const links = (neighbourhood.meta?.links as Array<any>) || [];

      name.value = links.find(findLink.name).data.target;
      description.value = links.find(findLink.description).data.target;
      const languages = links.filter(findLink.language);
      //  TODO: Get meta info about language.
      //  Need to update ad4m client
      //  const expression = await ad4mClient.languages.meta()
    }
  });

  return {
    name,
    description,
    url,
  };
}
