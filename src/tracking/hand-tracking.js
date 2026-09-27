export class HandTracker {
  constructor(){this.left=null;this.right=null;}
  update(world,dt){if(!world?.length)return;const sample=(index,prev)=>{const p=world[index];if(!p)return null;const velocity=prev?{x:(p.x-prev.position.x)/Math.max(dt,.001),y:(p.y-prev.position.y)/Math.max(dt,.001),z:(p.z-prev.position.z)/Math.max(dt,.001)}:{x:0,y:0,z:0};return{position:p,velocity,history:prev?.history?.slice(-8).concat([p])||[p]}};this.left=sample(15,this.left);this.right=sample(16,this.right);}
}
