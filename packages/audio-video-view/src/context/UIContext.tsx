import { useState } from "preact/hooks";
import { createContext } from "preact";

type ViewType = 'focus' | 'grid';

type State = {
  viewType: ViewType;
  fullscreen: boolean;
}

type ContextProps = {
  state: State;
  methods: {
    changeViewType: (viewtype: ViewType) => void;
    toggleFullscreen: (fullScreen: boolean) => void;
  }
}

const initialState: ContextProps = {
  state: {
    viewType: "grid",
    fullscreen: false,
  },
  methods: {
    changeViewType: (viewtype: ViewType) => null,
    toggleFullscreen: (fullScreen: boolean) => null,
  }
}

const UIContext = createContext(initialState);

export function UIProvider({ children }: any) {
  const [state, setState] = useState(initialState.state);

  return (
    <UIContext.Provider
      value={{
        state,
        methods: {
          changeViewType(viewType) {
            setState({...state, viewType})
          },
          toggleFullscreen(value) {
            setState({...state, fullscreen: value ? value : !state.fullscreen})
          }
        }
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export default UIContext;