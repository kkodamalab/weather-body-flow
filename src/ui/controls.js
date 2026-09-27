export function setupControls({ resetCloud, resetView, togglePause }) {
  const $ = id => document.getElementById(id);
  const flowSpeed=document.createElement('input'); flowSpeed.id='optical-flow-speed'; flowSpeed.type='range'; flowSpeed.min='0'; flowSpeed.max='200'; flowSpeed.step='10'; flowSpeed.value='30';
  const speedLabel=document.createElement('label'); speedLabel.textContent='Optical Flow Speed '; const speedOut=document.createElement('output'); speedOut.id='optical-flow-speed-value'; speedOut.textContent='30%'; speedLabel.append(speedOut,flowSpeed); document.getElementById('controls').insertBefore(speedLabel,document.getElementById('controls').querySelector('.actions'));
  flowSpeed.addEventListener('input',()=>{speedOut.textContent=`${flowSpeed.value}%`; if(window.__weatherFlow){window.__weatherFlow.baseSpeed=Number(flowSpeed.value)/100;window.__weatherFlow.engine.baseSpeed=Number(flowSpeed.value)/100;}});
  const panel=document.getElementById('tracking-panel'); const flowBox=document.createElement('div'); flowBox.id='flow-debug-controls'; flowBox.innerHTML='<strong>FLOW DEBUG</strong><label><input id="flow-base" type="checkbox" checked> Base Optical Flow</label><label><input id="flow-body" type="checkbox" checked> Body Flow</label><label><input id="flow-left" type="checkbox" checked> Left Hand Flow</label><label><input id="flow-right" type="checkbox" checked> Right Hand Flow</label><label><input id="flow-environment" type="checkbox" checked> Environment Flow</label><select id="flow-test"><option value="E">TEST E: ALL</option><option value="A">TEST A: BASE</option><option value="B">TEST B: BODY</option><option value="C">TEST C: LEFT</option><option value="D">TEST D: RIGHT</option></select>'; panel.insertBefore(flowBox,document.getElementById('debug-toggle'));
  const syncFlow=()=>{if(!window.__weatherFlow)return;window.__weatherFlow.flow={base:document.getElementById('flow-base').checked,body:document.getElementById('flow-body').checked,hand:document.getElementById('flow-left').checked||document.getElementById('flow-right').checked,environment:document.getElementById('flow-environment').checked};}; flowBox.querySelectorAll('input').forEach(i=>i.onchange=syncFlow); document.getElementById('flow-test').onchange=e=>{const v=e.target.value;document.getElementById('flow-base').checked=v==='A'||v==='E';document.getElementById('flow-body').checked=v==='B'||v==='E';document.getElementById('flow-left').checked=v==='C'||v==='E';document.getElementById('flow-right').checked=v==='D'||v==='E';syncFlow();window.__weatherFlow?.engine.setCount(Number(document.getElementById('count').value));};
  const preview = document.getElementById('camera-preview');
  const tracking = document.getElementById('tracking-panel');
  if (preview && tracking && !document.getElementById('preview-size')) {
    const label = document.createElement('label');
    label.textContent = 'Preview Size ';
    const input = document.createElement('input');
    input.id = 'preview-size'; input.type = 'range'; input.min = '120'; input.max = '420'; input.step = '10'; input.value = '220';
    label.append(input); tracking.insertBefore(label, document.getElementById('skeleton-toggle'));
    input.addEventListener('input', () => { preview.style.width = `${input.value}px`; });
  }
  for (const input of document.querySelectorAll('input[type=range]')) {
    const output = document.querySelector(`output[for="${input.id}"]`);
    const show = () => { if (output) output.textContent = input.value; };
    input.addEventListener('input', () => {
      show();
      if (['count', 'near', 'far', 'fov', 'foeX', 'foeY'].includes(input.id)) resetCloud();
    });
    show();
  }
  let paused = false;
  $('pause').onclick = () => {
    paused = !paused;
    $('pause').textContent = paused ? 'RESUME' : 'PAUSE';
    togglePause(paused);
  };
  $('reset').onclick = resetView;
  const hide = () => {
    const hidden = $('controls').classList.toggle('hidden');
    $('hide-ui').textContent = hidden ? 'SHOW UI' : 'HIDE UI';
    $('hide-ui').setAttribute('aria-expanded', String(!hidden));
  };
  $('hide-ui').onclick = hide;
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      $('display-status').textContent = 'Fullscreen unavailable. Try the browser fullscreen command.';
    }
  };
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
  });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input,select,textarea')) return;
    if (e.key.toLowerCase() === 'h') hide();
  });
}
