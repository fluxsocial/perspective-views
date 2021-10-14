import { h } from 'preact';
import { useContext } from "preact/hooks";
import { AudioVideoContext, PerspectiveContext } from 'junto-utils/react';
import '../../style/overlay.css';
import UIContext from '../../context/UIContext';
import screenfull from 'screenfull'


export default function Overlay() {
  const { state } = useContext(PerspectiveContext);
  const { state: {audio, video}, methods: { toggleAudio, toggleVideo, toggleScreenShare, leaveChannel } } = useContext(AudioVideoContext);

  const { state: { viewType }, methods: {
    changeViewType
  } } = useContext(UIContext);

  const toggleFullScreen = () => {
    if(screenfull.isEnabled) {
      const ele = document.getElementById('preact_root');
      screenfull.toggle(ele!);
    }
  }

  return (
    <div className="overlay">
      <div className="overlay__top">
        <div className="overlay__channelName">
          <j-icon name="megaphone" size="md" slot="end"></j-icon>
          <div>{state.name}</div>
        </div>
        <j-button
            variant="ghost"
            size="xl"
            circle
            square
            className="overlay__btn"
            onClick={() => changeViewType(viewType === 'grid' ? 'focus' : 'grid')}>
          <j-icon name={viewType === 'grid' ? "grid" : 'grid-1x2'} size="md" slot="end"></j-icon>
        </j-button>
      </div>
      <div className="overlay__bottom">
        <div></div>
        <div className="overlay__callOptions">
          <j-button
            variant="primary"
            size="xl"
            circle
            square
            className="overlay__btn"
            onClick={toggleVideo}
            >
            <j-icon name="camera" size="md" slot="end"></j-icon>
          </j-button>
          <j-button
            variant="primary"
            size="xl"
            circle
            square
            className="overlay__btn"
            onClick={toggleAudio}
            >
            <j-icon name="mic" size="md" slot="end"></j-icon>
          </j-button>
          <j-button
            variant="primary"
            size="xl"
            circle
            square
            className="overlay__btn"
            onClick={toggleScreenShare}>
            <j-icon name="display" size="md" slot="end"></j-icon>
          </j-button>
          <j-button
            variant="primary"
            size="xl"
            circle
            square
            className="overlay__btn"
            color="red"
            onClick={leaveChannel}>
            <j-icon name="telephone-x" size="md" slot="end"></j-icon>
          </j-button>
        </div>
        <div>
          <j-button
            variant="ghost"
            size="xl"
            circle
            square
            className="overlay__btn"
            onClick={toggleFullScreen}
            >
            <j-icon name="fullscreen" size="md" slot="end"></j-icon>
          </j-button>
        </div>
      </div>
    </div>
  )
}
