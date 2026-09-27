// Optional MediaPipe Pose Landmarker adapter. Particle rendering never depends on it.
const LANDMARK_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm';

export class PoseTracker {
  constructor(video) { this.video=video; this.landmarks=null; this.worldLandmarks=null; this.state='IDLE'; this.lastTimestamp=-1; this.landmarker=null; }
  async initialize() {
    this.state='LOADING';
    try { const {FilesetResolver,PoseLandmarker}=await import(VISION_CDN); const fileset=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'); this.landmarker=await PoseLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:LANDMARK_MODEL},runningMode:'VIDEO',numPoses:1,outputSegmentationMasks:false}); this.state='READY'; return true; }
    catch(error){this.state='ERROR'; this.error=String(error); return false;}
  }
  detect(timestamp){ if(!this.landmarker||!this.video||this.video.readyState<2||timestamp<=this.lastTimestamp)return null; this.lastTimestamp=timestamp; try { const result=this.landmarker.detectForVideo(this.video,timestamp); this.landmarks=result.landmarks?.[0]||null; this.worldLandmarks=result.worldLandmarks?.[0]||null; return result; } catch(error){this.error=String(error);return null;} }
}
