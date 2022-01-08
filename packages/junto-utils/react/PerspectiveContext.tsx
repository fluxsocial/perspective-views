import { useQuery } from "@apollo/client";
import React, { createContext, useState, useEffect, useRef } from "react";
import getMembers from "../api/getMembers";
import getChannels from "../api/getChannels";
import getPerspectiveMeta from "../api/getPerspectiveMeta";

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
  const memberInterval = useRef();
  const channelInterval = useRef();

  useEffect(() => {
    if (perspectiveUuid) {
      fetchMeta();
    }
  }, [perspectiveUuid, sourcePerspectiveUuid]);

  useEffect(() => {
    fetchChannels();
    fetchMembers();
  }, [state.url, state.sourceUrl]);

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
