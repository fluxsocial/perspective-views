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
    languages: [],
    members: {},
    channels: {},
  },
  methods: {},
};

const PerspectiveContext = createContext(initialState);

export function PerspectiveProvider({ perspectiveUuid, children }: any) {
  const [state, setState] = useState(initialState.state);
  const memberInterval = useRef();
  const channelInterval = useRef();

  useEffect(() => {
    fetchMeta();
  }, [perspectiveUuid]);

  useEffect(() => {
    channelInterval.current = fetchChannels();
    memberInterval.current = fetchMembers();

    return () => {
      clearInterval(memberInterval.current);
      clearInterval(channelInterval.current);
    };
  }, [state.url]);

  const fetchMembers = async () => {
    if (state.url) {
      const members = await getMembers({
        perspectiveUuid,
        neighbourhoodUrl: state.url,
      });

      setState((prev, curr) => ({ ...prev, members }));

      return setInterval(async () => {
        const members = await getMembers({
          perspectiveUuid,
          neighbourhoodUrl: state.url,
        });

        setState((prev, curr) => ({ ...prev, members }));
      }, 20000);
    }
  };

  const fetchChannels = async () => {
    if (state.url) {
      const channels = await getChannels({
        perspectiveUuid,
        neighbourhoodUrl: state.url,
      });

      setState((prev, curr) => ({ ...prev, channels }));

      return setInterval(async () => {
        const channels = await getChannels({
          perspectiveUuid,
          neighbourhoodUrl: state.url,
        });

        setState((prev, curr) => ({ ...prev, channels }));
      }, 10000);
    }
  };

  async function fetchMeta() {
    const meta = await getPerspectiveMeta(perspectiveUuid);
    setState({
      ...state,
      name: meta.name,
      description: meta.description,
      url: meta.url,
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
