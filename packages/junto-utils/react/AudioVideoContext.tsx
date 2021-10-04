// @ts-ignore
import React, { createContext, useState, useEffect, useRef, useMemo } from "react";
import { Language, LanguageMeta, Link, LinkExpression } from "@perspect3vism/ad4m";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import subscribeToLinks from "../api/subscribeToLinks";
import getSDP from "../api/getSDP";
import {
  PROFILE_EXPRESSION,
  AUDIO_VIDEO_FORM_EXPRESSION,
} from "../constants/languages";
import { linkIs } from "../helpers/linkHelpers";
import { AudioVideoExpression } from "../types";
import deleteLink from "../api/deleteLink";
import getMe from "../api/getMe";

type State = {
  sdp: {[x: string]: AudioVideoExpression}
}

type ContextProps = {
  state: State,
  methods: {
    leaveChannel: () => Promise<void>;
    toggleVideo: () => Promise<void>;
    toggleAudio: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
    toggleFullScreen: () => Promise<void>;
  }
}

const initialState: ContextProps = {
  state: {
    sdp: {}
  },
  methods: {
    leaveChannel: async () => {},
    toggleAudio: async () => {},
    toggleVideo: async () => {},
    toggleScreenShare: async () => {},
    toggleFullScreen: async () => {},
  }
}

const AudioVideoContext = createContext(initialState);

type AudioVideoProviderProps = {
  perspectiveUuid: string,
  children: any
}

export function AudioVideoProvider({perspectiveUuid, children}: AudioVideoProviderProps) {
  const [state, setState] = useState<State>(initialState.state);
  const [audioVideoHash, setAudioVideoHash] = useState<string>();
  const [profileHash, setprofileHash] = useState<string>()
  
  async function fetchLangs() {
    const { languages } = await getPerspectiveMeta(perspectiveUuid);
    setAudioVideoHash(languages[AUDIO_VIDEO_FORM_EXPRESSION].address);
    setprofileHash(languages[PROFILE_EXPRESSION].address)
  }

  async function fetchSDPExpresions() {}

  async function leaveChannel() {
    const me = await getMe();
    
    const link = Object.values(state.sdp).find((exp) => exp.author.did === me.did);

    if (link) {      
      deleteLink({
        perspectiveUuid,
        linkExpression: link.link
      })
    }
  }

  async function handleLinkAdded(link: LinkExpression) {
    if (linkIs.sdp(link) && profileHash) {
      const sdp = await getSDP({
        link,
        perspectiveUuid,
        profileLangAddress: profileHash,
      });

      setState((oldState: any) => ({...oldState, sdp: {...oldState.sdp, [sdp.id]: sdp}}));
    }
  }

  async function handleLinkRemoved(link: LinkExpression) {
    if (linkIs.sdp(link)) {
      const id = link.data.target;

      const sdps = {
        ...state.sdp
      };

      delete sdps[id];

      setState((oldState: any) => ({
        ...oldState, 
        sdp: sdps
      }));
    }
  }

  // NEED IMPLEMENTATION
  async function toggleAudio() {}

  // NEED IMPLEMENTATION
  async function toggleFullScreen() {}

  // NEED IMPLEMENTATION
  async function toggleScreenShare() {}

  // NEED IMPLEMENTATION
  async function toggleVideo() {}

  useEffect(() => {
    fetchSDPExpresions();
  }, []);

  useEffect(() => {
    if (profileHash) {
      subscribeToLinks({
        perspectiveUuid,
        added: handleLinkAdded,
        removed: handleLinkRemoved,
      })
    }
  }, [profileHash]);

  return (
    <AudioVideoContext.Provider
      value={{
        state: {...state},
        methods: {
          leaveChannel,
          toggleScreenShare,
          toggleAudio,
          toggleVideo,
          toggleFullScreen
        }
      }}
    >
      {children}
    </AudioVideoContext.Provider>
  )
}

export default AudioVideoContext;