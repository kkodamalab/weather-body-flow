import assert from 'node:assert/strict';
import { BodyAxisTracker } from '../src/tracking/body-axis.js';
import { BodyField } from '../src/fields/body-field.js';
import { HandField } from '../src/fields/hand-field.js';
import { EnvironmentField } from '../src/fields/environment-field.js';
import { WeatherService } from '../src/weather/weather-service.js';

const world = Array.from({length:33},(_,i)=>({x:i===23?-.2:i===24?.2:0,y:i===0?-1:0,z:i===15?2:i===16?2:0,visibility:1}));
const axis = new BodyAxisTracker();
assert(axis.update(world,.016)); axis.calibrate(); world[15].x += .5; world[16].x -= .5;
const relative = axis.update(world,.016); assert(relative && Number.isFinite(relative.velocity.x));
const body = new BodyField(); body.update(axis.relative()); assert(Object.values(body.sample()).every(Number.isFinite));
const hand = new HandField(); hand.update({left:{position:{x:.2,y:0,z:2},velocity:{x:1,y:0,z:0}},right:{position:{x:-.2,y:0,z:2},velocity:{x:-1,y:0,z:0}}});
const local = hand.sample({x:.2,y:0,z:2}); assert(local.x > 0, 'left hand force should move right');
const environment = new EnvironmentField(); environment.enabled=true; environment.vector={x:1,y:0,z:0}; assert(environment.sample().x===1);
const originalFetch=globalThis.fetch; globalThis.fetch=async()=>({ok:true,json:async()=>({current:{wind_speed_10m:4,wind_direction_10m:90}})});
const weather=new WeatherService(); const wind=await weather.load({latitude:35,longitude:139}); assert.deepEqual(wind,{speed:4,direction:90}); globalThis.fetch=originalFetch;
console.log('STEP 2-6 mock checks passed',JSON.stringify({body:body.sample(),local,wind}));
