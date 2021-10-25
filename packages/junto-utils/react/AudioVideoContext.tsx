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
import createIceCandidate from "../api/createIceCandidate";
// @ts-ignore
import io from 'socket.io-client';
import getProfile from "../api/getProfile";

var peerConnectionConfig = {
  'iceServers': [
      {'urls': 'stun:stun.services.mozilla.com'},
      {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

type State = {
  clients: {[x: string]: AudioVideoExpression},
  audio: boolean,
  video: boolean,
  screenshare: boolean,
}

type ContextProps = {
  state: State,
  methods: {
    leaveChannel: () => Promise<void>;
    toggleVideo: () => Promise<void>;
    toggleAudio: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
  }
}

const initialState: ContextProps = {
  state: {
    clients: {},
    audio: true,
    video: false,
    screenshare: false,
  },
  methods: {
    leaveChannel: async () => {},
    toggleAudio: async () => {},
    toggleVideo: async () => {},
    toggleScreenShare: async () => {},
  }
}

const AudioVideoContext = createContext(initialState);

type AudioVideoProviderProps = {
  perspectiveUuid: string,
  children: any
}

let socketId: string;
let socket: any;

export function AudioVideoProvider({perspectiveUuid, children}: AudioVideoProviderProps) {
  const [state, setState] = useState<State>(initialState.state);
  const localSteamRef = useRef<MediaStream>();
  const [audioVideoHash, setAudioVideoHash] = useState<string>();
  const [profileHash, setprofileHash] = useState<string>()
  const [iceCandidateHash, seticeCandidateHash] = useState<string>()
  
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

  async function startCall() {
    const { proHash } = await fetchLangs();
    const me = await getMe();

    let stream = await navigator.mediaDevices.getDisplayMedia();

    localSteamRef.current = stream;

    socket = io.connect('localhost:3000', {
      query: {
        did: me.did
      }
    });

    socket.on('signal', (fromId: string, event: any) => gotMessageFromServer(fromId, event, socket));

    socket.on('connect', function() {
      socketId = socket.id;

      socket.on('user-left', (userId: string) => {
        console.log('deleting', userId);
        delete state.clients[userId];
        setState({...state});
        console.log('User deleted')
      });

      socket.on('user-joined', async (id: string, did: string, count: number, clients: any) => {
        for (const socketIdList of clients) {          
          if (!state.clients[socketIdList]) {
            const author = await getProfile({ did: did, languageAddress: proHash });
  
            state.clients[socketIdList] = {
              id: socketIdList,
              connection: new RTCPeerConnection(peerConnectionConfig),
              stream,
              mute: false,
              timestamp: new Date(Date.now()),
              author
            }
  
            //Wait for their ice candidate       
            state.clients[socketIdList].connection.onicecandidate = function(event){
              if (event.candidate != null) {
                console.log('SENDING ICE');
                socket.emit('signal', socketIdList, JSON.stringify({'ice': event.candidate}));
              }
            }
  
            //Wait for their video stream
            state.clients[socketIdList].connection.ontrack = function(event: any){
              console.log('Got track', event)
              gotRemoteStream(event, socketIdList)
            }    
  
            //Add the local video stream
            stream.getTracks().forEach(s => {
              console.log('adding track', s);
              state.clients[socketIdList].connection.addTrack(s, stream);    
            });
  
            setState({...state});
          }
        }

        if(count >= 2){
          console.log('kkkk', id, state.clients[id]);
          state.clients[id].connection.createOffer().then(function(description: any){
              state.clients[id].connection.setLocalDescription(description).then(function() {
                  socket.emit('signal', id, JSON.stringify({'sdp': state.clients[id].connection.localDescription}));
                }).catch(e => console.log(e));        
          });
        }
      });
    });
  }

  function gotRemoteStream(event: any, id: any) {
    state.clients[id].stream = event.streams[0];
    setState({...state})
  }

function gotMessageFromServer(fromId: string, message: any, socket: any) {
    var signal = JSON.parse(message)

    console.log('signal', signal);

    //Make sure it's not coming from yourself
    if(fromId != socketId) {
        if(signal.sdp){            
            state.clients[fromId].connection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {                
                if(signal.sdp.type == 'offer') {
                    state.clients[fromId].connection.createAnswer().then(function(description: any){
                        state.clients[fromId].connection.setLocalDescription(description).then(function() {
                          socket.emit('signal', fromId, JSON.stringify({'sdp': state.clients[fromId].connection.localDescription}));
                        }).catch((e: any) => console.log(e));        
                    }).catch((e: any) => console.log(e));
                }
            }).catch((e: any) => console.log(e));
        }
    
        if(signal.ice) {
          console.log('log ice', signal.ice)
          state.clients[fromId].connection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch((e: any) => console.log(e));
        }                
    }
}

  // Leave channel - delete all the links for the current user
  async function leaveChannel() {
    console.log(state.clients, socketId)
    state.clients[socketId].connection.getSenders().forEach((s: any) => {
      state.clients[socketId].connection.removeTrack(s);
    });
    state.clients[socketId].connection.close();
    state.clients[socketId].stream.getTracks().forEach(t => t.stop())
    delete state.clients[socketId];

    socket.disconnect();
    
    setState({...state, clients: {}});
  }

  async function toggleAudio() {
    await toggleAudioVideo({ audio: true })
  }

  async function toggleVideo() {
    await toggleAudioVideo({ audio: true, video: true })
  }

  async function toggleAudioVideo({
    audio = true,
    video = false
  }) {
    console.log('Audio Stream recieved');

    try {      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });

      for (const client of Object.values(state.clients)) {
        client.connection.getSenders().forEach((s: any) => {
          client.connection.removeTrack(s);
        });

        stream.getTracks().forEach(t => {
          client.connection.addTrack(t);
        })
      }
    } catch (e) {
      console.log(e);
    }
    setState({...state, audio: !state.audio});
  }

  // NEED IMPLEMENTATION
  async function toggleScreenShare() {
    console.log('Local Stream audio toggle recieved - ', !state.audio);
    
    try {
      let stream = await navigator.mediaDevices.getDisplayMedia();

      for (const client of Object.values(state.clients)) {
        client.connection.getSenders().forEach((s: any) => {
          client.connection.removeTrack(s);
        });

        stream.getTracks().forEach(t => {
          client.connection.addTrack(t);
        })
      }
    } catch (e) {

    }

    setState({...state, screenshare: !state.screenshare});
  }

  useEffect(() => {
    startCall();

    return () => {
      for (const sdp of Object.values(state.clients)) {
        sdp.connection.close();
        sdp.stream.getTracks().forEach(t => t.stop())
      }
      socket.disconnect();
    }
  }, []);

  return (
    <AudioVideoContext.Provider
      value={{
        state: {...state},
        methods: {
          leaveChannel,
          toggleScreenShare,
          toggleAudio,
          toggleVideo
        }
      }}
    >
      {children}
    </AudioVideoContext.Provider>
  )
}

export default AudioVideoContext;