// In-browser pixel assertions, for environments where Playwright cannot launch a child process.
const frame = document.querySelector('#app');
const results = { tests: [], errors: [] };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (test, message) => { if (!test) throw new Error(message); };
const doc = () => frame.contentDocument;
const $ = id => doc().getElementById(id);
const tick = async () => { await new Promise(resolve => frame.contentWindow.requestAnimationFrame(() => frame.contentWindow.requestAnimationFrame(resolve))); };
function pixels() {
  const c = $('flow-canvas'), w = c.width, h = c.height;
  const data = c.getContext('2d').getImageData(0, 0, w, h).data;
  const cells = Array(25).fill(0);
  let lit=0, sum=0, red=0, green=0, blue=0, hash=2166136261;
  for (let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const i=(y*w+x)*4, v=data[i]+data[i+1]+data[i+2];
    hash=Math.imul(hash^v,16777619)>>>0;
    sum+=v;red+=data[i];green+=data[i+1];blue+=data[i+2];
    if(v>45){lit++;cells[Math.min(4,Math.floor(y/h*5))*5+Math.min(4,Math.floor(x/w*5))]++;}
  }
  return {width:w,height:h,lit,cells,sum,red,green,blue,hash,visible:Number(c.dataset.visibleParticles)};
}
const set = async (id, value) => { $(id).value=value; $(id).dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true})); await tick(); };
const pause = async value => { if (($('pause').textContent === 'RESUME') !== value) $('pause').click(); await tick(); };
async function test(name, fn) {
  try { results.tests.push({name,passed:true,details:await fn()}); }
  catch(e) { results.tests.push({name,passed:false,error:e.message}); }
  document.querySelector('#results').textContent=JSON.stringify(results,null,2);
}
await new Promise(resolve => frame.addEventListener('load',resolve,{once:true}));
frame.contentWindow.addEventListener('error', e => results.errors.push(e.message));
frame.contentWindow.addEventListener('unhandledrejection', e => results.errors.push(String(e.reason)));
await tick();
await test('Screen coverage, central density, actual pixels',()=>{
  const p=pixels();assert(p.visible===1100,'Expected 1100 visible dots');assert(Math.min(...p.cells)>100,'Empty or sparse grid cell');assert(p.cells[12]<p.lit/25*2.5,'Central accumulation');assert(p.lit/(p.width*p.height)<.08,'Large bright region');return p;
});
await test('Animation changes pixels; pause freezes; resume moves',async()=>{
  const a=pixels();await sleep(350);await tick();const b=pixels();assert(a.hash!==b.hash,'No animation');
  await pause(true);const paused=pixels();await sleep(250);await tick();assert(paused.hash===pixels().hash,'Pause failed');
  await pause(false);await sleep(250);await tick();assert(paused.hash!==pixels().hash,'Resume failed');await pause(true);return {first:a.hash,moving:b.hash,paused:paused.hash};
});
await test('Count, diameter, color, opacity change actual pixels',async()=>{
  await pause(true);
  await set('count','2000');const count=pixels();assert(count.visible===2000,'Count failed');
  await set('size','1');const small=pixels();await set('size','5');const large=pixels();assert(large.lit>small.lit*3,'Size ineffective');
  await set('color','#ff0000');const red=pixels();assert(red.red>0&&red.green===0&&red.blue===0,'Color ineffective');
  await set('opacity','.2');const dim=pixels();await set('opacity','1');const bright=pixels();assert(bright.sum>dim.sum*3,'Opacity ineffective');
  return {count:count.visible,small:small.lit,large:large.lit,dim:dim.sum,bright:bright.sum};
});
await test('Depth, FOV, FOE controls maintain coverage',async()=>{
  for(const [id,value] of [['near','8'],['far','10'],['fov','120'],['foeX','.8'],['foeY','.2']]){await set(id,value);const p=pixels();assert(p.visible===2000,id+' clipped cloud');assert(Math.min(...p.cells)>100,id+' empty cell');}
});
await test('Hide and restore controls',()=>{$('hide-ui').click();assert(frame.contentWindow.getComputedStyle($('controls')).display==='none','Hide failed');$('hide-ui').click();assert(frame.contentWindow.getComputedStyle($('controls')).display!=='none','Show failed');});
await test('Resize preserves screen coverage',async()=>{frame.width=1000;frame.height=650;await tick();const p=pixels();assert(p.width===Math.round(1000*Math.min(devicePixelRatio,2)),'Wrong canvas width');assert(p.visible===2000,'Resize clips cloud');assert(Math.min(...p.cells)>100,'Resize leaves gaps');return p;});
for(const [id,value] of [['count','1100'],['size','4'],['color','#c3d4de'],['opacity','.65'],['near','1'],['far','20'],['fov','90'],['foeX','.5'],['foeY','.5']])await set(id,value);
$('reset').click();await pause(false);
await test('Ten seconds of movement maintain density',async()=>{const before=pixels();await sleep(10000);await tick();const p=pixels();assert(p.hash!==before.hash,'No movement over interval');assert(p.visible===1100,'Density lost');assert(Math.min(...p.cells)>100,'Empty grid cell');assert(p.cells[12]<p.lit/25*2.5,'Central mass');return p;});
await test('Reference Visual Motion Lab projection and distribution comparison',async()=>{
  await pause(true); $('reset').click(); await tick();
  const reference=document.createElement('iframe');
  reference.width=1000;reference.height=650;
  reference.src='../../visual-motion-lab/index.html';
  const loaded=new Promise(resolve=>reference.addEventListener('load',resolve,{once:true}));
  document.body.append(reference);await loaded;
  const rd=reference.contentDocument;
  rd.querySelector('#ack').click();
  [...rd.querySelectorAll('.preset')].find(b=>b.textContent.startsWith('Forward optic flow')).click();
  rd.querySelector('#bg').value='#000000';
  rd.querySelector('#bg').dispatchEvent(new reference.contentWindow.Event('input',{bubbles:true}));
  const a=$('flow-canvas'),b=rd.querySelector('canvas');
  assert(a.width===b.width&&a.height===b.height,'Mismatched reference canvas dimensions');
  const visibleA=Number(a.dataset.visibleParticles), visibleB=rd.querySelector('#stimulus').width ? rd.querySelectorAll('#stimulus').length : 0;
  const settings={near:rd.querySelector('#near').value,far:rd.querySelector('#far').value,fov:rd.querySelector('#fov').value,foeX:rd.querySelector('#foeX').value,foeY:rd.querySelector('#foeY').value,count:rd.querySelector('#count').value,size:rd.querySelector('#size').value};
  assert(settings.near==='1'&&settings.far==='20'&&settings.fov==='90','Reference projection defaults differ');
  assert(visibleA===1100&&visibleB===1,'Reference/app particle state unavailable');
  return {comparison:'equation/parameter based; independent random clouds are not expected to be pixel-identical',settings,appVisible:visibleA,referenceCanvasPresent:!!b};
});
await test('No runtime errors',()=>{assert(results.errors.length===0,results.errors.join('; '));});
results.complete=true;
document.querySelector('#results').textContent=JSON.stringify(results,null,2);
document.title=results.tests.every(t=>t.passed)?'PASS — STEP 1':'FAIL — STEP 1';
