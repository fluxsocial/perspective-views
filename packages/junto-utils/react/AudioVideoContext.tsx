// @ts-ignore
import React, { createContext, useState, useEffect, useRef, useMemo } from "react";
import { Language, LanguageMeta, Link, LinkExpression, LinkQuery } from "@perspect3vism/ad4m";
import getPerspectiveMeta from "../api/getPerspectiveMeta";
import subscribeToLinks from "../api/subscribeToLinks";
import getSDP from "../api/getSDP";
import {
  PROFILE_EXPRESSION,
  AUDIO_VIDEO_FORM_EXPRESSION,
  ICE_EXPRESSION_OFFICIAL,
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
  const [iceCandidateHash, seticeCandidateHash] = useState<string>()
  const [profile, setProfile] = useState<any>();
  const [links, setLinks] = useState([]);
  
  // Get's all the the required languages
  async function fetchLangs() {
    const { languages } = await getPerspectiveMeta(perspectiveUuid);

    setAudioVideoHash(languages[AUDIO_VIDEO_FORM_EXPRESSION] as any);
    setprofileHash(languages[PROFILE_EXPRESSION] as any);
    seticeCandidateHash(languages[ICE_EXPRESSION_OFFICIAL] as any);

    return {
      sdpHash: languages[AUDIO_VIDEO_FORM_EXPRESSION] as any,
      proHash: languages[PROFILE_EXPRESSION] as any,
      iceHash: languages[ICE_EXPRESSION_OFFICIAL] as any,
    }
  }

  // Fetches all the sdp links & expressions
  async function fetchSDPExpresions() {
    // Get Profile Hash
    const { proHash } = await fetchLangs();

    const expressionLinks = await ad4mClient.perspective.queryLinks(
      perspectiveUuid,
      new LinkQuery({
        source: `sioc://webrtcchannel`,
        predicate: "sioc://content_of",
      })
    );

    console.log('links', expressionLinks)

    setLinks(expressionLinks);

    // Check if there's any sdp links if not create a new offfer sdp
    // else create a new answer sdp
    if (expressionLinks.length === 0) {
      await createOffer();
    } else {
      let sdps: {[x:string]: AudioVideoExpression} = {};
  
      // Fetches all the sdp expressions
      for (const link of expressionLinks) {
        const exp = await getSDP({link, profileLangAddress: proHash, perspectiveUuid});
        
        sdps[exp.author.did] = exp;
      }
      
      setState({...state, sdp: sdps});

      const profile = await getMe();

      for (const sdp of Object.values(sdps)) {
        if (profile.did !== sdp.author.did) {
          await createAnswer(sdp.sdp, sdps);
        }
      }
    }
  }

  // Leave channel - delete all the links for the current user
  async function leaveChannel() {
    const me = await getMe();
    console.log('leaving channel', me)

    for (const link of links) {
      if (link.author === me.did) {
        deleteLink({perspectiveUuid, linkExpression: link})
      }
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
    
    return () => {
      for (const link of links) {
        if (link.author === profile.did) {
          deleteLink({perspectiveUuid, linkExpression: link})
        }
      }
    }
  }, []);

  async function createOffer() {
    // Get's the SDP language hash
    const { sdpHash } = await fetchLangs();

    const profile = await getMe();

    setProfile(profile);

    try {
      const sdps = {...state.sdp};

      // Only create offer sdps if not part of the network
      if (!sdps[profile.did]) {
        const rtcConnection = new RTCPeerConnection(peerConnectionConfig);
        let desc = await rtcConnection.createOffer();
        await rtcConnection.setLocalDescription(desc);

        console.log('tracked 1')

        // Add the stream after the stream has been initialized
        rtcConnection.ontrack = function(event) {
          console.log('tracked')
          sdps[profile.did].stream = event.streams[0];
        };

        // Creates the sdp expression with local descriptions
        const sdpLink = await createSDP({perspectiveUuid, languageAddress: sdpHash, message: desc});

        sdps[profile.did] = {
          id: sdpLink.data.target,
          timestamp: Date.now().toString(),
          url: sdpLink.data.target,
          author: profile as any,
          sdp: desc,
          link: sdpLink,
          connection: rtcConnection
        }

        setState({...state, sdp: sdps})
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function createAnswer(sdp: RTCSessionDescriptionInit, tempSDPs: {[x: string]: AudioVideoExpression}) {
    // Get's the SDP expression hash
    const { sdpHash } = await fetchLangs();

    const profile = await getMe();

    setProfile(profile);

    try {
        const sdps = {...tempSDPs};

        // Create a new RTC connection with remote description/ peer's
        const rtcConnection = new RTCPeerConnection(peerConnectionConfig);
        await rtcConnection.setRemoteDescription(new RTCSessionDescription(sdp))

        // Add the streams when starts receiving one from other peer's
        rtcConnection.ontrack = (event) => {
          const sdps = {...tempSDPs};
          sdps[profile.did] = {...sdps[profile.did], stream: event.streams[0]};
        }

        if (!localStreamRef.current) {
          await startLocalStream();
        }

        // Pass the get current active tracks to the streams for other peer's to view
        for (const track of localStreamRef.current.getTracks()) {
          rtcConnection.addTrack(track);
        }

        // If the sdp type is offer create a answer description and broadcast it to other peer's
        if (sdp.type === 'offer') {
          const desc = await rtcConnection.createAnswer();
          await rtcConnection.setLocalDescription(desc);

          const sdpLink = await createSDP({perspectiveUuid, languageAddress: sdpHash, message: desc});
          
          sdps[profile.did] = {
            id: sdpLink.data.target,
            timestamp: Date.now().toString(),
            url: sdpLink.data.target,
            author: profile as any,
            sdp: desc,
            link: sdpLink,
            connection: rtcConnection
          }
  
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