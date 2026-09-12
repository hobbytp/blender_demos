import {Composition, registerRoot} from 'remotion';
import {QuorumPilot} from './QuorumPilot';
import {DURATION, FPS} from './timeline';
import {QuorumDark} from './QuorumDark';
import {DARK_DURATION} from './dark-timeline';

function Root() {
  return <>
    <Composition id='QuorumPilot' component={QuorumPilot} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumDark' component={QuorumDark} durationInFrames={DARK_DURATION} fps={FPS} width={1920} height={1080}/>
  </>;
}

registerRoot(Root);
