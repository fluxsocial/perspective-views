import './style/index.css';
import App from './components/app';
import "@junto-foundation/junto-elements";
import "@junto-foundation/junto-elements/dist/main.css";

declare module 'preact/src/jsx' {
  namespace JSXInternal  {
    interface IntrinsicElements {
      'j-icon': React.DetailedHTMLProps<any, any>;
      'j-button': React.DetailedHTMLProps<any, any>;
      'j-text': React.DetailedHTMLProps<any, any>;
    }
  }
}

export default App;
