export function setupControls({ resetCloud, resetView, togglePause }) {
  const $ = id => document.getElementById(id);
  for (const input of document.querySelectorAll('input[type=range]')) {
    const output = document.querySelector(`output[for="${input.id}"]`);
    const show = () => { output.textContent = input.value; };
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
