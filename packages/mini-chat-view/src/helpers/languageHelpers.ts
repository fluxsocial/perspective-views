import ad4mClient from "../api/client";
import { LinkExpression, LanguageMeta } from "@perspect3vism/ad4m";

export function getLanguageMeta(link: LinkExpression) {
  return ad4mClient.languages.meta(link.data.target);
}

export function getMetaFromLinks(links: LinkExpression[]) {
  const langs = links.map(getLanguageMeta);
  return Promise.all(langs);
}

export function keyedLanguages(languages: LanguageMeta[]) {
  return languages.reduce((acc, lang) => {
    return {
      ...acc,
      // TODO: Security problem, someone could call lang the same name
      [lang.templateSourceLanguageAddress || lang.name]: lang.address,
    };
  }, {});
}
