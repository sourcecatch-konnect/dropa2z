// Read-only keyboard/focus measurements. Does not type, save, log out or book.
const WS=require('../Taxido_user/node_modules/ws');
const fs=require('fs');
(async()=>{
  const pages=await fetch('http://127.0.0.1:8081/json/list').then(r=>r.json());
  const target=pages.find(p=>/A142/.test(p.title)&&p.webSocketDebuggerUrl);
  if(!target)throw Error('Rider runtime not connected');
  const ws=new WS(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
  const evaluate=expression=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));});
  ws.on('message',raw=>{const message=JSON.parse(raw),task=pending.get(message.id);if(!task)return;pending.delete(message.id);message.error||message.result?.exceptionDetails?task.reject(Error(JSON.stringify(message.error||message.result.exceptionDetails))):task.resolve(message.result?.result?.value);});
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  try{
    console.log(await evaluate(`(()=>{
      const mod=Array.from(__r.getModules().values()).find(m=>(m.verboseName||'').replaceAll('\\\\','/').endsWith('react-native/index.js'));
      const rn=mod?.publicModule?.exports;if(!rn?.Keyboard)return {error:'Native keyboard module unavailable'};
      globalThis.__dropa2zKeyboardCheck={samples:[],events:[],subs:[]};const data=globalThis.__dropa2zKeyboardCheck;
      for(const event of ['keyboardDidShow','keyboardDidHide'])data.subs.push(rn.Keyboard.addListener(event,e=>data.events.push({event,time:Date.now(),top:e.endCoordinates?.screenY})));
      data.timer=setInterval(()=>{const input=rn.TextInput.State.currentlyFocusedInput?.();data.samples.push({time:Date.now(),visible:rn.Keyboard.isVisible(),top:rn.Keyboard.metrics()?.screenY??null,height:rn.Dimensions.get('window').height,input:input?._nativeTag??null});},100);
      return {monitoring:true};
    })()`));
    await new Promise(resolve=>setTimeout(resolve,5000));
    const data=await evaluate(`(()=>{const data=globalThis.__dropa2zKeyboardCheck;if(!data)return null;clearInterval(data.timer);data.subs.forEach(s=>s.remove());const result={samples:data.samples,events:data.events};delete globalThis.__dropa2zKeyboardCheck;return result;})()`);
    const output='D:/DROPA2Z/ui-crosscheck-20261104/rider/keyboard-stability-20261110.json';
    fs.writeFileSync(output,JSON.stringify(data,null,2));
    console.log(JSON.stringify({file:output,samples:data.samples.length,events:data.events,visibleSamples:data.samples.filter(s=>s.visible).length,focusedInputs:[...new Set(data.samples.map(s=>s.input))],windowHeights:[...new Set(data.samples.map(s=>s.height))]}));
  }finally{ws.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
