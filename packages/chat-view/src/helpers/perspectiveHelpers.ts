import { Link, LinkExpression } from "@perspect3vism/ad4m";
import { getMetaFromLinks, keyedLanguages } from "./languageHelpers";
import ad4mClient from "../api/client";

export const findLink = {
  name: (link: LinkExpression) => link.data.predicate === "rdf://name",
  description: (link: LinkExpression) =>
    link.data.predicate === "rdf://description",
  language: (link: LinkExpression) => link.data.predicate === "language",
};
