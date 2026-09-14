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
import {MigrationPilot} from './MigrationPilot';
import {MIGRATION_DURATION} from './migration-timeline';
import {MigrationLesson} from './MigrationLesson';
import {MIGRATION_LESSON_DURATION} from './migration-lesson-timeline';
import {PmxcfsPilot} from './PmxcfsPilot';
import {PMXCFS_DURATION} from './pmxcfs-timeline';
import {PmxcfsLesson} from './PmxcfsLesson';
import {PMXCFS_LESSON_DURATION} from './pmxcfs-lesson-timeline';
import {DurabilityPilot} from './DurabilityPilot';
import {DurabilityLesson} from './DurabilityLesson';
import {VirtqueuePilot} from './VirtqueuePilot';
import {VIRTQUEUE_DURATION} from './virtqueue-timeline';
import {DURABILITY_LESSON_DURATION} from './durability-lesson-timeline';
import {DURABILITY_DURATION} from './durability-timeline';

import {VirtqueueLesson} from './VirtqueueLesson';
import {VIRTQUEUE_LESSON_DURATION} from './virtqueue-lesson-timeline';

function Root() {
  return <>
    <Composition id='VirtqueueLesson' component={VirtqueueLesson} durationInFrames={VIRTQUEUE_LESSON_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='VirtqueuePilot' component={VirtqueuePilot} defaultProps={{poll:false}} durationInFrames={VIRTQUEUE_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='DurabilityLesson' component={DurabilityLesson} durationInFrames={DURABILITY_LESSON_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='DurabilityPilot' component={DurabilityPilot} defaultProps={{powerLoss:false}} durationInFrames={DURABILITY_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='PmxcfsLesson' component={PmxcfsLesson} durationInFrames={PMXCFS_LESSON_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='PmxcfsPilot' component={PmxcfsPilot} defaultProps={{blocked:false}} durationInFrames={PMXCFS_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='MigrationLesson' component={MigrationLesson} durationInFrames={MIGRATION_LESSON_DURATION} fps={FPS} width={1920} height={1080}/>
    <Composition id='MigrationPilot' component={MigrationPilot} defaultProps={{failed:false}} durationInFrames={MIGRATION_DURATION} fps={FPS} width={1920} height={1080}/>
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
