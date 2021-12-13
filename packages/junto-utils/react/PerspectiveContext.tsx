import React, { createContext, useState, useEffect, useRef } from "react";
import getPerspectiveMeta from "../api/getPerspectiveMeta";

type State = {
  name: string;
  description: string;
  languages: Array<any>;
};

type ContextProps = {
  state: State;
  methods: {};
};

const initialState: ContextProps = {
  state: {
    name: "",
    description: "",
    languages: [],
  },
  methods: {},
};

const PerspectiveContext = createContext(initialState);

export function PerspectiveProvider({ perspectiveUuid, children }: any) {
  const [state, setState] = useState(initialState.state);

  useEffect(() => {
    fetchMeta();
  }, [perspectiveUuid]);

  async function fetchMeta() {
    const meta = await getPerspectiveMeta(perspectiveUuid);
    setState({ ...state, name: meta.name, description: meta.description });
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
