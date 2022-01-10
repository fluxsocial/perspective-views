import { useQuery } from "@apollo/client";
import React, { createContext, useState, useEffect, useRef } from "react";
import getMembers from "../api/getMembers";
import getChannels from "../api/getChannels";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import subscribeToLinks from "../api/subscribeToLinks";
import { PROFILE_EXPRESSION } from "../constants/languages";
import { findLink, linkIs } from "../helpers/linkHelpers";
import ad4mClient from "../api/client";
import { getMetaFromLinks, keyedLanguages } from "../helpers/languageHelpers";
import getProfile from "../api/getProfile";

type State = {
  name: string;
  description: string;
  languages: Array<any>;
  url: string;
  sourceUrl: string;
  members: { [x: string]: any };
  channels: { [x: string]: any };
};

type ContextProps = {
  state: State;
  methods: {};
};

const initialState: ContextProps = {
  state: {
    name: "",
    description: "",
    url: "",
    sourceUrl: "",
    languages: [],
    members: {},
    channels: {},
  },
  methods: {},
};

const PerspectiveContext = createContext(initialState);

export function PerspectiveProvider({ perspectiveUuid, sourcePerspectiveUuid, children }: any) {
  const [state, setState] = useState(initialState.state);
  const [profileHash, setProfileHash] = useState("");
  const memberInterval = useRef();
  const channelInterval = useRef();
  const linkSubscriberRef = useRef();

  useEffect(() => {
    if (perspectiveUuid) {
      fetchMeta();
    }
  }, [perspectiveUuid, sourcePerspectiveUuid]);

  useEffect(() => {
    fetchChannels();
    fetchMembers();
  }, [state.url, state.sourceUrl]);

  useEffect(() => {
    if (perspectiveUuid) {
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current();
    }
  }, [perspectiveUuid]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid,
      added: handleLinkAdded,
      removed: () => {},
    });
  }

  async function handleLinkAdded(link) {
    console.log("handle link added", link);

    if (linkIs.channel(link)) {
      const neighbourhood = await ad4mClient.neighbourhood.joinFromUrl(link.data.target);
      const links = (neighbourhood.neighbourhood.meta?.links as Array<any>) || [];
      const languageLinks = links.filter(findLink.language);
      const langs = await getMetaFromLinks(languageLinks);

      const channelObj = {
        name: links.find(findLink.name).data.target,
        description: links.find(findLink.description).data.target,
        languages: keyedLanguages(langs),
        url: neighbourhood.sharedUrl || "",
        id: neighbourhood.uuid
      };

      setState((oldState) => {
        const isAlreadyPartOf = Object.values(oldState.channels).find(
          (c: any) => c.url === neighbourhood.sharedUrl
        );

        if (isAlreadyPartOf) {
          return oldState
        }

        return {
          ...oldState,
          channels: {
            ...oldState.channels,
            [channelObj.id]: channelObj
          }
        }
      })
    }

    if (linkIs.member(link)) {
      const member = await getProfile(link.data.target);

      setState((oldState) => ({
        ...oldState,
        members: {
          ...oldState.members,
          [member.did]: member
        }
      }))
    }
  }

  const fetchMembers = async () => {
    if (state.url) {
      const members = await getMembers({
        perspectiveUuid: sourcePerspectiveUuid || perspectiveUuid,
        neighbourhoodUrl: state.sourceUrl || state.url,
      });

      setState((prev, curr) => ({ ...prev, members }));
    }
  };

  const fetchChannels = async () => {
    if (state.url) {
      const channels = await getChannels({
        perspectiveUuid: sourcePerspectiveUuid || perspectiveUuid,
        neighbourhoodUrl: state.sourceUrl || state.url,
      });

      setState((prev, curr) => ({ ...prev, channels }));
    }
  };

  async function fetchMeta() {
    const meta = await getPerspectiveMeta(perspectiveUuid);
    const source = sourcePerspectiveUuid ? await (await getPerspectiveMeta(sourcePerspectiveUuid)).url : undefined;
    setProfileHash(meta.languages[PROFILE_EXPRESSION])
    setState({
      ...state,
      name: meta.name,
      description: meta.description,
      url: meta.url,
      sourceUrl: source, 
      members: {},
      channels: {},
    });
  }

  return (
    <PerspectiveContext.Provider
      value={{
        state,
        methods: {},
      }}
    >
      {children}
    </PerspectiveContext.Provider>
  );
}

export default PerspectiveContext;
