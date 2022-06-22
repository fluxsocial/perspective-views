import React, { createContext, useState, useEffect,useContext, useRef } from "react";
import getMembers from "../api/getMembers";
import getChannels from "../api/getChannels";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import subscribeToLinks from "../api/subscribeToLinks";
import { findLink, linkIs } from "../helpers/linkHelpers";
import { getMetaFromLinks, keyedLanguages } from "../helpers/languageHelpers";
import getPerspectiveProfile from "../api/getProfile";
import ad4mClient from "../api/client";

type State = {
  name: string;
  description: string;
  languages: Array<any>;
  url: string;
  sourceUrl: string;
  sourceUuid: string;
  members: { [x: string]: any };
  channels: { [x: string]: any };
  isHome: boolean;
};

type ContextProps = {
  state: State;
  methods: {
    getProfile: (did: string) => any
  };
};

const initialState: ContextProps = {
  state: {
    name: "",
    description: "",
    url: "",
    sourceUrl: "",
    sourceUuid: "",
    languages: [],
    members: {},
    channels: {},
    isHome: false
  },
  methods: {
    getProfile: (did: string) => null
  },
};

const PerspectiveContext = createContext(initialState);

export function PerspectiveProvider({ perspectiveUuid, children }: any) {
  const [state, setState] = useState(initialState.state);
  const linkSubscriberRef = useRef();

  useEffect(() => {
    if (perspectiveUuid) {
      fetchMeta();
    }
  }, [perspectiveUuid]);

  useEffect(() => {
      fetchChannels();
      fetchMembers();
  }, [state.url, state.sourceUrl]);

  useEffect(() => {
    if (perspectiveUuid) {
      setupSubscribers();
    }

    return () => {
      linkSubscriberRef.current?.removeListener('link-added', handleLinkAdded);
    };
  }, [perspectiveUuid, state.sourceUuid]);

  async function setupSubscribers() {
    linkSubscriberRef.current = await subscribeToLinks({
      perspectiveUuid: state.sourceUuid || perspectiveUuid,
      added: handleLinkAdded,
    });
  }

  async function handleLinkAdded(link) {
    console.log("handle link added", link);

    if (linkIs.channel(link)) {
      const all = await ad4mClient.perspective.all();
      const neighbourhood = all.find((e) => e.sharedUrl === link.data.target);
      const links =
        ((neighbourhood.neighbourhood as any).meta?.links as Array<any>) || [];
      const languageLinks = links.filter(findLink.language);
      const langs = await getMetaFromLinks(languageLinks);

      const channelObj = {
        name: links.find(findLink.name).data.target,
        description: links.find(findLink.description).data.target,
        languages: keyedLanguages(langs),
        url: neighbourhood.sharedUrl || "",
        id: neighbourhood.uuid,
      };

      setState((oldState) => {
        const isAlreadyPartOf = Object.values(oldState.channels).find(
          (c: any) => c.url === neighbourhood.sharedUrl
        );

        if (isAlreadyPartOf) {
          return oldState;
        }

        return {
          ...oldState,
          channels: {
            ...oldState.channels,
            [channelObj.id]: channelObj,
          },
        };
      });
    }

    if (linkIs.member(link)) {
      await getProfile(link.data.target);
    }
  }

  const fetchMembers = async () => {
    if (state.url) {
      const members = await getMembers({
        perspectiveUuid: state.sourceUuid || perspectiveUuid,
        neighbourhoodUrl: state.sourceUrl || state.url,
        addProfile: (profile: any) => setState((prev) => ({...prev, members: {...prev.members, [profile.did]: profile}}))
      });
    }
  };

  const fetchChannels = async () => {
    if (state.url) {
      const channels = await getChannels({
        perspectiveUuid: state.sourceUuid || perspectiveUuid,
        neighbourhoodUrl: state.sourceUrl || state.url,
      });

      setState((prev, curr) => ({ ...prev, channels }));
    }
  };

  async function fetchMeta() {
    const meta = await getPerspectiveMeta(perspectiveUuid);
    setState({
      ...state,
      name: meta.name,
      description: meta.description,
      url: meta.url,
      sourceUrl: meta.sourceUrl,
      sourceUuid: meta.sourceUuid,
      members: {},
      channels: {},
      isHome: meta.isHome
    });
  }

  async function getProfile(url: string) {
    const did = url.split("://").length > 1 ? url.split("://")[1] : url;

    if (state.members[did]) {
      return state.members[did]
    } else {
      const profile = await getPerspectiveProfile(url);

      if (profile) {
        setState((oldState) => ({...oldState, members: {...oldState.members, [profile.did]: profile}}))
  
        return profile;
      } else {
        return null
      }
    }
  }

  return (
    <PerspectiveContext.Provider
      value={{
        state,
        methods: {
          getProfile
        },
      }}
    >
      {children}
    </PerspectiveContext.Provider>
  );
}

export default PerspectiveContext;
