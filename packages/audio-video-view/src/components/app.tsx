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

const App: FunctionalComponent = ({ perspectiveUuid = "d39f9d7b-2bbd-4444-888d-a8e0c5f2b317" }: any) => {

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
