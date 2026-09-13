import {Composition, registerRoot} from 'remotion';
import {QuorumPilot} from './QuorumPilot';
import {DURATION, FPS} from './timeline';
import {QuorumDark} from './QuorumDark';
import {DARK_DURATION} from './dark-timeline';
import {QuorumEditorial} from './QuorumEditorial';
import {EDITORIAL_DURATION} from './editorial-timeline';
import {QuorumFlow, QuorumLesson} from './QuorumFlow';
import {FLOW_DURATION} from './flow-timeline';
import {HaPilot} from './HaPilot';
import {HA_DURATION} from './ha-timeline';
import {HaLesson} from './HaLesson';
import {HA_LESSON_DURATION} from './ha-lesson-timeline';

function Root() {
  return <>
    <Composition id='HaLesson' component={HaLesson} defaultProps={{normal:false}} durationInFrames={HA_LESSON_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='HaPilot' component={HaPilot} defaultProps={{normal:false}} durationInFrames={HA_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumLesson' component={QuorumLesson} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumFlow' component={QuorumFlow} durationInFrames={FLOW_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumEditorial' component={QuorumEditorial} durationInFrames={EDITORIAL_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumPilot' component={QuorumPilot} durationInFrames={DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='QuorumDark' component={QuorumDark} durationInFrames={DARK_DURATION} fps={FPS} width={1920} height={1080}/>
  </>;
}

registerRoot(Root);
