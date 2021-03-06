import { Link, LinkExpression } from "@perspect3vism/ad4m";
import { getMetaFromLinks, keyedLanguages } from "./languageHelpers";
import ad4mClient from "../api/client";

export const findLink = {
  name: (link: LinkExpression) => link.data.predicate === "rdf://name",
  description: (link: LinkExpression) =>
    link.data.predicate === "rdf://description",
  language: (link: LinkExpression) => link.data.predicate === "language",
  dateCreated: (link: LinkExpression) => link.data.predicate === "rdf://dateCreated"
};

export const linkIs = {
  message: (link: LinkExpression) =>
    link.data.source === "sioc://chatchannel" &&
    link.data.predicate === "sioc://content_of",
  // TODO: SHould we check if the link is proof.valid?
  reaction: (link: LinkExpression) =>
    link.data.predicate === "sioc://reaction_to",
  channel: (link: LinkExpression) => 
  link.data.predicate === "sioc://has_space",
  member: (link: LinkExpression) => 
  link.data.predicate === "sioc://has_member"

  // TODO: SHould we check if the link is proof.valid?
};
