export class WeatherService { constructor(){this.status='OFF';this.wind={speed:0,direction:0};}
  async load(location){const url=`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=wind_speed_10m,wind_direction_10m`;const r=await fetch(url);if(!r.ok)throw new Error(`Weather HTTP ${r.status}`);const d=await r.json();this.wind={speed:Number(d.current?.wind_speed_10m||0),direction:Number(d.current?.wind_direction_10m||0)};this.status='READY';return this.wind;}
  async locateAndLoad(){const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:8000}));return this.load(position.coords);}
}
