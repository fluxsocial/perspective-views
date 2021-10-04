import { FunctionalComponent, h } from 'preact';
import Overlay from './overlay';
import '../style/app.css'

const App: FunctionalComponent = () => {
    return (
        <div id="preact_root">
            <Overlay />
        </div>
    );
};

export default App;
