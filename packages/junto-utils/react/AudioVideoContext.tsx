// @ts-ignore
import React, { createContext, useState, useEffect, useRef, useMemo } from "react";
import { Language, LanguageMeta, Link, LinkExpression, LinkQuery } from "@perspect3vism/ad4m";
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
import ad4mClient from "../api/client";
import createSDP from "../api/createSDP";

var peerConnectionConfig = {
  'iceServers': [
      {'urls': 'stun:stun.services.mozilla.com'},
      {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

type State = {
  sdp: {[x: string]: AudioVideoExpression},
  audio: boolean,
  video: boolean,
  screenshare: boolean,
}

type ContextProps = {
  state: State,
  stream: MediaStream,
  methods: {
    leaveChannel: () => Promise<void>;
    toggleVideo: () => Promise<void>;
    toggleAudio: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
    startLocalStream: () => Promise<void>;
  }
}

const initialState: ContextProps = {
  state: {
    sdp: {},
    audio: true,
    video: false,
    screenshare: false,
  },
  stream: null,
  methods: {
    leaveChannel: async () => {},
    toggleAudio: async () => {},
    toggleVideo: async () => {},
    toggleScreenShare: async () => {},
    startLocalStream: async () => {},
  }
}

const AudioVideoContext = createContext(initialState);

type AudioVideoProviderProps = {
  perspectiveUuid: string,
  children: any
}

export function AudioVideoProvider({perspectiveUuid, children}: AudioVideoProviderProps) {
  const [state, setState] = useState<State>(initialState.state);
  const localStreamRef = useRef<MediaStream>();
  const [audioVideoHash, setAudioVideoHash] = useState<string>();
  const [profileHash, setprofileHash] = useState<string>()
  const [profile, setProfile] = useState<any>();
  
  async function fetchLangs() {
    const { languages } = await getPerspectiveMeta(perspectiveUuid);
    console.log('languages', languages);
    setAudioVideoHash(languages[AUDIO_VIDEO_FORM_EXPRESSION] as any);
    setprofileHash(languages[PROFILE_EXPRESSION] as any);
  }

  async function fetchSDPExpresions() {
    await fetchLangs();

    // getSDP();
    const expressionLinks = await ad4mClient.perspective.queryLinks(
      perspectiveUuid,
      new LinkQuery({
        source: `sioc://webrtcchannel`,
        predicate: "sioc://content_of",
      })
    );

    await createOffer();

    console.log('links', expressionLinks)
  }

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

  async function toggleAudio() {
    console.log('Local Stream audio toggle recieved - ', !state.audio);
    let audioTrack = localStreamRef.current.getAudioTracks();
    if (audioTrack.length === 0) {
      await startLocalStream();
      audioTrack = localStreamRef.current.getAudioTracks();
    }
    if(state.audio) {
      localStreamRef.current.removeTrack(audioTrack[0])
    } else {
      localStreamRef.current.addTrack(audioTrack[0])
    }
    setState({...state, audio: !state.audio});
  }

  // NEED IMPLEMENTATION
  async function toggleScreenShare() {
    console.log('Local Stream audio toggle recieved - ', !state.audio);

    if(state.screenshare) {
      localStreamRef.current.getTracks()[0].stop();
      await startLocalStream();
    } else {
      let stream = await navigator.mediaDevices.getDisplayMedia();

      localStreamRef.current = stream;
      // @ts-ignore
      window.localStream = stream;
      localStreamRef.current.addTrack(stream.getTracks()[0])
    }
    setState({...state, screenshare: !state.screenshare});
  }

  async function toggleVideo() {
    console.log('Local Stream video toggle recieved - ', !state.video);
    let videoTrack = localStreamRef.current.getVideoTracks();
    if (videoTrack.length === 0) {
      await startLocalStream(false, true);
      videoTrack = localStreamRef.current.getVideoTracks();
    }
    if(!state.video) {
      localStreamRef.current.removeTrack(videoTrack[0])
    } else {
      localStreamRef.current.addTrack(videoTrack[0])
    }
    setState({...state, video: !state.video});
  }

  async function startLocalStream(audio = true, video = false) {
    console.log('Local Stream recieved');

    try {      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });
  
      localStreamRef.current = stream;
      // @ts-ignore
      window.localStream = stream;
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {

    fetchSDPExpresions();

  }, []);

  async function createOffer() {
    const profile = await getMe();
    setProfile(profile);

    console.log('sdp 1', state.sdp, profile);
    try {
      const sdps = {...state.sdp};
      

      if (!sdps[profile.did]) {
        console.log('sdp 2');
        const rtcConnection = new RTCPeerConnection(peerConnectionConfig);
        let desc: RTCSessionDescriptionInit;
        if (Object.keys(sdps).length === 0) {
          desc = await rtcConnection.createOffer();
        }
        await rtcConnection.setLocalDescription(desc);
        rtcConnection.ontrack = function(event) {
          sdps[profile.did].stream = event.streams;
        };
        console.log('sdp 3', desc, audioVideoHash);

        const sdpLink = await createSDP({perspectiveUuid, languageAddress: audioVideoHash, message: desc});

        console.log('sdp 4', sdpLink);

        sdps[profile.did] = {
          id: sdpLink.data.target,
          timestamp: Date.now().toString(),
          url: sdpLink.data.target,
          author: profile as any,
          sdp: desc,
          link: sdpLink,
        }

        console.log('sdp 5', sdps);

        setState({...state, sdp: sdps})
      }
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    if (profileHash) {
      subscribeToLinks({
        perspectiveUuid,
        added: handleLinkAdded,
        removed: handleLinkRemoved,
      });

      fetchSDPExpresions();
    }
  }, [profileHash]);

  return (
    <AudioVideoContext.Provider
      value={{
        state: {...state},
        stream: localStreamRef.current,
        methods: {
          leaveChannel,
          toggleScreenShare,
          toggleAudio,
          toggleVideo,
          startLocalStream
        }
      }}
    >
      {children}
    </AudioVideoContext.Provider>
  )
}

export default AudioVideoContext;