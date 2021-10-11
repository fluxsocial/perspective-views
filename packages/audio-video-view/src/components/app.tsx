import { FunctionalComponent, h } from 'preact';
import Overlay from './overlay';
import '../style/app.css'
import { UIProvider } from '../context/UIContext';
import {
    PerspectiveProvider,
    AgentProvider,
    AudioVideoProvider,
} from "junto-utils/react";
import Streams from './streams';

const App: FunctionalComponent = ({ perspectiveUuid = "" }: any) => {

    return (
        <div id="preact_root">
            <UIProvider>
                <AgentProvider>
                    <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
                        <AudioVideoProvider perspectiveUuid={perspectiveUuid}>
                            <Overlay />
                            <Streams />
                        </AudioVideoProvider>
                    </PerspectiveProvider>
                </AgentProvider>
            </UIProvider>
        </div>
    );
};

export default App;
