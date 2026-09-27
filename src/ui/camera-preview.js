export function setupCameraPreview(video, skeleton, tracking) {
  const shell = document.createElement('div');
  shell.id = 'camera-preview-shell';
  shell.style.cssText = 'position:fixed;right:18px;bottom:18px;width:220px;aspect-ratio:4/3;z-index:7;resize:both;overflow:hidden;touch-action:none;background:#07131d;border:1px solid #69e8df;box-sizing:border-box;';
  video.replaceWith(shell); shell.append(video, skeleton);
  video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;background:#07131d;';
  skeleton.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  const label=document.createElement('label'); label.textContent='Preview Size ';
  const size=document.createElement('input'); size.type='range'; size.min='120'; size.max='420'; size.step='10'; size.value='220'; size.id='preview-size';
  label.append(size); tracking.insertBefore(label, document.getElementById('skeleton-toggle'));
  const applySize=()=>{const w=Math.min(Number(size.value),Math.max(120,innerWidth-36)); shell.style.width=`${w}px`;}; size.addEventListener('input',applySize);
  const reset=document.createElement('button'); reset.id='camera-preview-reset'; reset.textContent='RESET PREVIEW POSITION'; tracking.insertBefore(reset, document.getElementById('skeleton-toggle'));
  reset.onclick=()=>{shell.style.right='18px';shell.style.left='auto';shell.style.bottom='18px';shell.style.top='auto';};
  let drag=null;
  shell.addEventListener('pointerdown',e=>{if(e.target===size)return;drag={x:e.clientX,y:e.clientY,left:shell.offsetLeft,top:shell.offsetTop};shell.setPointerCapture(e.pointerId);});
  shell.addEventListener('pointermove',e=>{if(!drag)return;const w=shell.offsetWidth,h=shell.offsetHeight;const left=Math.max(0,Math.min(innerWidth-w,drag.left+e.clientX-drag.x));const top=Math.max(0,Math.min(innerHeight-h,drag.top+e.clientY-drag.y));shell.style.left=`${left}px`;shell.style.top=`${top}px`;shell.style.right='auto';shell.style.bottom='auto';});
  shell.addEventListener('pointerup',()=>{drag=null;});
  return shell;
}
