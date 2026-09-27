// Run: node tests/browser.cjs --baseline (or without flag for regression tests).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createRequire } = require('node:module');
const localRequire = process.env.PLAYWRIGHT_MODULE_DIR
  ? createRequire(path.join(process.env.PLAYWRIGHT_MODULE_DIR, 'package.json')) : require;
const { chromium } = localRequire('playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.TEST_OUTPUT || path.join(root, 'test-results');
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const reference = url.pathname.startsWith('/reference/');
  const base = reference ? path.resolve(root, '../visual-motion-lab') : root;
  const relative = (reference ? url.pathname.slice(11) : url.pathname.slice(1)) || 'index.html';
  const file = path.resolve(base, relative);
  if (!file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', ({'.js':'text/javascript','.html':'text/html','.css':'text/css'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
async function pixels(page) {
  return page.locator('canvas').evaluate(c => {
    const {width:w,height:h}=c, data=c.getContext('2d').getImageData(0,0,w,h).data;
    const cells=Array(25).fill(0); let lit=0,sum=0,red=0,green=0,blue=0,hash=2166136261;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4, v=data[i]+data[i+1]+data[i+2];
      hash=Math.imul(hash^v,16777619)>>>0;
      if(v>45){lit++;cells[Math.min(4,Math.floor(y/h*5))*5+Math.min(4,Math.floor(x/w*5))]++;}
      sum+=v;red+=data[i];green+=data[i+1];blue+=data[i+2];
    }
    return {width:w,height:h,lit,cells,sum,red,green,blue,hash,visible:Number(c.dataset.visibleParticles)};
  });
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,channel:process.env.TEST_BROWSER || 'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:'block'});
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  const report={url,tests:[],errors};
  async function test(name,fn){try{const details=await fn();report.tests.push({name,passed:true,details});}catch(e){report.tests.push({name,passed:false,error:e.message});}}
  try{
    await page.goto(url);await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.visibleParticles)>0);
    if(process.argv.includes('--baseline')){
      report.initial=await pixels(page);
      await page.mouse.move(950,450);await page.mouse.down();await page.mouse.move(1350,550,{steps:20});await page.mouse.up();
      await page.waitForTimeout(500);report.rotated=await pixels(page);
      await page.screenshot({path:path.join(output,'before-fix.png')});
    }else{
      await test('Initial canvas coverage / no central mass',async()=>{const p=await pixels(page);assert(p.visible>=1000);assert(Math.min(...p.cells)>20);assert(p.cells[12]<p.lit/25*2.5);assert(p.lit/(p.width*p.height)<.08);return p;});
      await test('Real animation and pause/resume',async()=>{const a=await pixels(page);await page.waitForTimeout(400);const b=await pixels(page);assert.notEqual(a.hash,b.hash);await page.click('#pause');const c=await pixels(page);await page.waitForTimeout(200);assert.equal(c.hash,(await pixels(page)).hash);return {first:a.hash,moving:b.hash,paused:c.hash};});
      await test('Left drag rotates; density survives extreme drag',async()=>{const a=await pixels(page);await page.mouse.move(900,450);await page.mouse.down();await page.mouse.move(1350,600,{steps:20});await page.mouse.up();await page.waitForTimeout(2200);const b=await pixels(page);assert.notEqual(a.hash,b.hash);assert(b.visible>=1000);assert(Math.min(...b.cells)>20);return b;});
      await test('Wheel translates while paused',async()=>{const a=await pixels(page);await page.mouse.wheel(0,-200);await page.waitForTimeout(400);const b=await pixels(page);assert.notEqual(a.hash,b.hash);assert(b.visible>=1000);return {before:a.hash,after:b.hash};});
      await test('Right drag pans',async()=>{const a=await pixels(page);await page.mouse.move(950,450);await page.mouse.down({button:'right'});await page.mouse.move(1100,510,{steps:10});await page.mouse.up({button:'right'});assert.notEqual(a.hash,(await pixels(page)).hash);});
      await test('Count, size, color, opacity alter actual pixels',async()=>{
        await page.click('#reset');await page.locator('#count').fill('2000');const count=await pixels(page);assert.equal(count.visible,2000);
        await page.locator('#size').fill('1');const small=await pixels(page);await page.locator('#size').fill('5');const large=await pixels(page);assert(large.lit>small.lit*3);
        await page.locator('#color').fill('#ff0000');const red=await pixels(page);assert(red.red>0&&red.green===0&&red.blue===0);
        await page.locator('#opacity').fill('0.2');const dim=await pixels(page);await page.locator('#opacity').fill('1');const bright=await pixels(page);assert(bright.sum>dim.sum*3);
        return {count:count.visible,small:small.lit,large:large.lit,dim:dim.sum,bright:bright.sum};
      });
      await test('Projection controls preserve distribution',async()=>{for(const [id,value] of [['near','8'],['far','10'],['fov','120'],['foeX','0.8'],['foeY','0.2']]){await page.locator('#'+id).fill(value);const p=await pixels(page);assert.equal(p.visible,2000);assert(Math.min(...p.cells)>20);}});
      await test('Hide UI and restore',async()=>{await page.click('#hide-ui');assert.equal(await page.locator('#controls').isVisible(),false);await page.keyboard.press('h');assert(await page.locator('#controls').isVisible());});
      await test('Fullscreen enter and exit',async()=>{await page.click('#fullscreen');await page.waitForFunction(()=>!!document.fullscreenElement);await page.click('#fullscreen');await page.waitForFunction(()=>!document.fullscreenElement);});
      await page.reload();await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.visibleParticles)>0);
      await page.screenshot({path:path.join(output,'step1-default.png')});await page.click('#hide-ui');await page.screenshot({path:path.join(output,'step1-particles.png')});
      await test('Animation over 10 seconds retains coverage',async()=>{await page.waitForTimeout(10000);const p=await pixels(page);assert(p.visible>=1000);assert(Math.min(...p.cells)>20);assert(p.cells[12]<p.lit/25*2.5);return p;});
      await test('Resize and DPR=2',async()=>{const p2=await browser.newPage({viewport:{width:800,height:600},deviceScaleFactor:2,serviceWorkers:'block'});p2.on('pageerror',e=>errors.push(e.message));await p2.goto(url);await p2.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.visibleParticles)>0);await p2.setViewportSize({width:1100,height:700});await p2.waitForTimeout(150);const p=await pixels(p2);assert.equal(p.width,2200);assert.equal(p.height,1400);assert(p.visible>=1000);assert(Math.min(...p.cells)>20);await p2.close();return p;});
      await test('No JS errors or external dependencies',()=>{assert.deepEqual(errors,[]);assert(requests.every(r=>r.startsWith(url)));});
    }
  }finally{fs.writeFileSync(path.join(output,process.argv.includes('--baseline')?'baseline.json':'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();server.close();}
  if(report.tests.some(t=>!t.passed))process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
