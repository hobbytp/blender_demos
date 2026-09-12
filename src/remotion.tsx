import {Composition, registerRoot} from 'remotion';
import {QuorumPilot} from './QuorumPilot';
import {DURATION, FPS} from './timeline';
import {QuorumDark} from './QuorumDark';
import {DARK_DURATION} from './dark-timeline';
import {QuorumEditorial} from './QuorumEditorial';
import {EDITORIAL_DURATION} from './editorial-timeline';

function Root() {
  return <>
    <Composition id='QuorumEditorial' component={QuorumEditorial} durationInFrames={EDITORIAL_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumPilot' component={QuorumPilot} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumDark' component={QuorumDark} durationInFrames={DARK_DURATION} fps={FPS} width={1920} height={1080}/>
  </>;
}

registerRoot(Root);
