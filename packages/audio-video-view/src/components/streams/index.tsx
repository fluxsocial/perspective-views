import { AudioVideoContext } from 'junto-utils/react';
import { FunctionalComponent, h } from 'preact';
import { useRef, useEffect, useContext } from "preact/hooks";

type StreamProps = {
  stream: MediaStream
}

function Stream({ stream }: StreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('stream 1', stream)
    videoRef.current!.srcObject = stream;

    videoRef.current!.onloadedmetadata = (e) => {
      videoRef.current?.play()
    }
  }, [videoRef.current, stream])

  return (
    <video ref={videoRef} height={360} width={640} />
  )
}

export default function Streams() {
  const {state: { sdp }, stream, methods: { startLocalStream }} = useContext(AudioVideoContext);
  const streamRefs = useRef(Array(Object.keys(sdp)).map(e => null));

  useEffect(() => {
    startLocalStream();
  }, [])


  console.log('stream', sdp, streamRefs)

  return (
    <div>
      <Stream stream={stream} />
      {Object.values(sdp).map(e => e.stream && <Stream stream={e.stream} />)}
    </div>
  )
}
