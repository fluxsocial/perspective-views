import { FunctionalComponent, h } from 'preact';
import Overlay from './overlay';
import '../style/app.css'
import { UIProvider } from '../context/UIContext';
import {
    PerspectiveProvider,
    AgentProvider,
    AudioVideoProvider,
} from "junto-utils/react";

const App: FunctionalComponent = ({ perspectiveUuid = "" }: any) => {
    return (
        <div id="preact_root">
            <UIProvider>
                <AgentProvider>
                    <PerspectiveProvider perspectiveUuid={perspectiveUuid}>
                        <AudioVideoProvider perspectiveUuid={perspectiveUuid}>
                            <Overlay />
                        </AudioVideoProvider>
                    </PerspectiveProvider>
                </AgentProvider>
            </UIProvider>
        </div>
    );
};

export default App;
