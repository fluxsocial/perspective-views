import { h } from 'preact';
import '../../style/overlay.css'

export default function Overlay() {
  return (
    <div className="overlay">
      <div className="overlay__top">
        <div className="overlay__channelName">
          <j-icon name="megaphone" size="md" slot="end"></j-icon>
          <div>channelName</div>
        </div>
        <j-button
            variant="ghost"
            size="xl"
            circle
            square
            className="overlay__btn">
          <j-icon name="grid" size="md" slot="end"></j-icon>
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
            className="overlay__btn">
            <j-icon name="camera" size="md" slot="end"></j-icon>
          </j-button>
          <j-button
            variant="primary"
            size="xl"
            circle
            square
            className="overlay__btn">
            <j-icon name="mic" size="md" slot="end"></j-icon>
          </j-button>
          <j-button
            variant="primary"
            size="xl"
            circle
            square
            className="overlay__btn">
            <j-icon name="display" size="md" slot="end"></j-icon>
          </j-button>
          <j-button
            variant="primary"
            size="xl"
            circle
            square
            className="overlay__btn"
            color="red">
            <j-icon name="telephone-x" size="md" slot="end"></j-icon>
          </j-button>
        </div>
        <div>
          <j-button
            variant="ghost"
            size="xl"
            circle
            square
            className="overlay__btn">
            <j-icon name="fullscreen" size="md" slot="end"></j-icon>
          </j-button>
        </div>
      </div>
    </div>
  )
}
