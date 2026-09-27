// Optional MediaPipe Pose Landmarker adapter. Particle rendering never depends on it.
const LANDMARK_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm';

export class PoseTracker {
  constructor(video) { this.video=video; this.landmarks=null; this.worldLandmarks=null; this.state='IDLE'; this.lastTimestamp=-1; this.landmarker=null; this.initializing=null; this.error=''; this.fps=0; this.frames=0; this.fpsStart=performance.now(); }
  async initialize() {
    if(this.initializing)return this.initializing;
    this.state='LOADING';
    this.initializing=(async()=>{
    try { const {FilesetResolver,PoseLandmarker}=await import(VISION_CDN); const fileset=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'); this.landmarker=await PoseLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:LANDMARK_MODEL},runningMode:'VIDEO',numPoses:1,outputSegmentationMasks:false}); this.state='READY'; return true; }
    catch(error){this.state='ERROR'; this.error=error?.stack||String(error); return false;}
    })();
    return this.initializing;
  }
  detect(timestamp){ if(!this.landmarker||!this.video||this.video.readyState<2||timestamp<=this.lastTimestamp)return null; this.lastTimestamp=timestamp; try { const result=this.landmarker.detectForVideo(this.video,Math.round(timestamp)); this.landmarks=result.landmarks?.[0]||null; this.worldLandmarks=result.worldLandmarks?.[0]||null; this.frames++; if(timestamp-this.fpsStart>1000){this.fps=this.frames*1000/(timestamp-this.fpsStart);this.frames=0;this.fpsStart=timestamp;} return result; } catch(error){this.error=error?.stack||String(error);return null;} }
}
