import { AudioVideoContext } from 'junto-utils/react';
import { Profile } from 'junto-utils/types';
import { FunctionalComponent, h } from 'preact';
import { useRef, useEffect, useContext } from "preact/hooks";

type StreamProps = {
  stream: MediaStream
  author: Profile | undefined
}

function Stream({ stream, author }: StreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('stream 1', stream)
    videoRef.current!.srcObject = stream;

    videoRef.current!.onloadedmetadata = (e) => {
      videoRef.current?.play()
    }

    return () => {
      videoRef.current?.pause();
    }
  }, [videoRef.current, stream])

  return (
    <div className="stream">
      <video ref={videoRef} height={360} width={630} />
      <div className="stream__lower">
        <j-avatar
          src={author?.thumbnailPicture}
          hash={author?.did}
        ></j-avatar>
        <j-text>{author?.username}</j-text>
      </div>
    </div>
  )
}

export default function Streams() {
  const {state: { clients } } = useContext(AudioVideoContext);

  console.log('stream', clients)

  return (
    <div className="streams">
      {Object.values(clients).map(e => e.stream && <Stream author={e.author} stream={e.stream} />)}
    </div>
  )
}
