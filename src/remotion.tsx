import {Composition, registerRoot} from 'remotion';
import {QuorumPilot} from './QuorumPilot';
import {DURATION, FPS} from './timeline';
import {QuorumDark} from './QuorumDark';
import {DARK_DURATION} from './dark-timeline';
import {QuorumEditorial} from './QuorumEditorial';
import {EDITORIAL_DURATION} from './editorial-timeline';
import {QuorumFlow, QuorumLesson} from './QuorumFlow';
import {FLOW_DURATION} from './flow-timeline';

function Root() {
  return <>
    <Composition id='QuorumLesson' component={QuorumLesson} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumFlow' component={QuorumFlow} durationInFrames={FLOW_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumEditorial' component={QuorumEditorial} durationInFrames={EDITORIAL_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumPilot' component={QuorumPilot} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumDark' component={QuorumDark} durationInFrames={DARK_DURATION} fps={FPS} width={1920} height={1080}/>
  </>;
}

registerRoot(Root);
