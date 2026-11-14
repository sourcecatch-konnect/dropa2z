const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const backup = path.resolve(root, '../green-orange-ui-backup-20261104');
const apply = process.argv.includes('--apply');
const parser = require(path.join(root, 'Taxido_user/node_modules/@babel/parser'));
if (apply && fs.existsSync(path.join(backup, 'manifest.json'))) throw Error('Swap already applied; refusing to swap it back.');
function swapRgb(r,g,b) {
  const values = [r,g,b].map(v=>v/255), max=Math.max(...values), min=Math.min(...values), delta=max-min;
  if (!delta) return null;
  let hue = max===values[0] ? ((values[1]-values[2])/delta)%6 : max===values[1] ? (values[2]-values[0])/delta+2 : (values[0]-values[1])/delta+4;
  hue=(hue*60+360)%360;
  const light=(max+min)/2, saturation=delta/(1-Math.abs(2*light-1));
  // Keep neutral text and charcoal neutral. Recolour tinted surfaces as well as vivid accents.
  if (saturation<.08 || (light<.2 && saturation<.4)) return null;
  const green=hue>=75 && hue<=175, orange=hue>=10 && hue<=45;
  if (!green&&!orange) return null;
  const h=green?22:156, c=(1-Math.abs(2*light-1))*saturation, x=c*(1-Math.abs((h/60)%2-1)), m=light-c/2;
  const rgb=h<60?[c,x,0]:[0,c,x];
  return rgb.map(v=>Math.round((v+m)*255));
}
const mapping={};
function swapHex(value) {
  const hex=value.slice(1), full=hex.length===3||hex.length===4?hex.split('').map(c=>c+c).join(''):hex;
  const base=full.slice(0,6).toUpperCase();
  const exact={'FC5E02':'157A52','157A52':'FC5E02'};
  const rgb=swapRgb(...[0,2,4].map(i=>parseInt(base.slice(i,i+2),16)));
  if (!rgb) return value;
  const result='#'+(exact[base]||rgb.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase())+full.slice(6);
  mapping[value]=result;
  return result;
}
function transform(source) {
  return source.replace(/#[0-9a-f]{8}\b|#[0-9a-f]{6}\b|#[0-9a-f]{4}\b|#[0-9a-f]{3}\b/gi,swapHex)
    .replace(/\brgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(\s*,\s*[\d.]+)?\s*\)/gi,(all,r,g,b,alpha)=>{
      const rgb=swapRgb(+r,+g,+b);return rgb?`${alpha?'rgba':'rgb'}(${rgb.join(', ')}${alpha||''})`:all;
    })
    .replace(/((?:\bcolor|\bbackgroundColor|\bborderColor|\bfill|\bstroke|\btintColor)\s*[:=]\s*["'])(green|orange)(["'])/gi,(_,before,color,after)=>before+(color.toLowerCase()==='green'?'orange':'green')+after);
}
function files(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
const changed=[];
for (const app of ['Taxido_user','Taxido_driver']) {
  for (const file of files(path.join(root,app,'src'))) {
    const relative=path.relative(root,file);
    if (!/\.(tsx?|jsx?|svg|json)$/.test(file) || /[\\/]api[\\/]|[\\/]localization[\\/]|google|facebook|apple|paypal|razorpay|stripe|flutterwave/i.test(relative)) continue;
    if (file.endsWith('.json') && !relative.includes(path.join('design','assets'))) continue;
    const original=fs.readFileSync(file,'utf8'), updated=transform(original);
    if(updated===original)continue;
    if (/\.[jt]sx?$/.test(file)) parser.parse(updated,{sourceType:'unambiguous',plugins:['typescript','jsx']});
    if(file.endsWith('.json'))JSON.parse(updated);
    changed.push(relative);
    if(apply){const target=path.join(backup,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);fs.writeFileSync(file,updated);}
  }
}
const manifest={date:'2026-11-04',scope:'Native app UI and vector colour literals; no API logic, third-party brand marks or bitmap edits',changed,mapping};
if(apply){fs.mkdirSync(backup,{recursive:true});fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify(manifest,null,2));}
console.log(JSON.stringify({apply,files:changed.length,byApp:Object.fromEntries(['Taxido_user','Taxido_driver'].map(app=>[app,changed.filter(file=>file.startsWith(app)).length])),colours:Object.keys(mapping).length,examples:Object.entries(mapping).slice(0,12)},null,2));
