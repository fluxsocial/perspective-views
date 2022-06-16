import { LinkExpression, LanguageMeta, Ad4mClient } from "@perspect3vism/ad4m";

export const SHORT_FORM_EXPRESSION = "shortform-expression";

export const GROUP_EXPRESSION = "group-expression";


export function getLanguageMeta(ad4mClient: Ad4mClient, link: LinkExpression) {
  return ad4mClient.languages.meta(link.data.target);
}

export function getMetaFromLinks(ad4mClient: Ad4mClient, links: LinkExpression[]) {
  const langs = links.map((link) => getLanguageMeta(ad4mClient, link));
  return Promise.all(langs);
}

export function keyedLanguages(languages: LanguageMeta[]) {
  return languages.reduce((acc, lang) => {
    let langName: string = lang.templateSourceLanguageAddress;

    if (lang.name.endsWith(SHORT_FORM_EXPRESSION)) {
      langName = SHORT_FORM_EXPRESSION;
    } else if (lang.name.endsWith(GROUP_EXPRESSION)) {
      langName = GROUP_EXPRESSION;
    }

    return {
      ...acc,
      // TODO: Security problem, someone could call lang the same name
      [langName]: lang.address,
    };
  }, {});
}
