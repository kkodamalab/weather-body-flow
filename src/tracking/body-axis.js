const avg=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const normalize=v=>{const n=Math.hypot(v.x,v.y,v.z)||1;return{x:v.x/n,y:v.y/n,z:v.z/n}};
export class BodyAxisTracker {
  constructor(){this.current=null;this.previous=null;this.calibration=null;}
  update(world,dt){if(!world?.length)return null;const hip=avg(world[23],world[24]), head=avg(world[0],avg(world[7],world[8])), axis=normalize(sub(head,hip));const center=hip;const velocity=this.current?{x:(center.x-this.current.center.x)/Math.max(dt,.001),y:(center.y-this.current.center.y)/Math.max(dt,.001),z:(center.z-this.current.center.z)/Math.max(dt,.001)}:{x:0,y:0,z:0};this.previous=this.current;this.current={hip,head,center,axis,velocity,timestamp:performance.now()};return this.current;}
  calibrate(){if(this.current)this.calibration=structuredClone(this.current);}
  relative(){if(!this.current)return null;const base=this.calibration||{axis:{x:0,y:0,z:1},center:{x:0,y:0,z:0}};return{tiltX:this.current.axis.x-base.axis.x,tiltY:this.current.axis.y-base.axis.y,velocity:this.current.velocity,axis:this.current.axis,center:this.current.center};}
}
