import { LinkExpression } from "@perspect3vism/ad4m";

export const findLink = {
  name: (link: LinkExpression) => link.data.predicate === "rdf://name",
  description: (link: LinkExpression) =>
    link.data.predicate === "rdf://description",
  language: (link: LinkExpression) => link.data.predicate === "language",
};

export const linkIs = {
  message: (link: LinkExpression) =>
    link.data.source === "sioc://chatchannel" &&
    link.data.predicate === "sioc://content_of" &&
    link.proof.valid,
  reaction: (link: LinkExpression) =>
    link.data.predicate === "sioc://reaction_to" && link.proof.valid,
  sdp: (link: LinkExpression) => link.data.predicate === 'sioc://sdp' && link.proof.valid,
};