const WS=require('../Taxido_user/node_modules/ws');
(async()=>{
  const list=await fetch('http://127.0.0.1:8081/json/list').then(r=>r.json());
  const target=list.find(item=>item.webSocketDebuggerUrl&&/rider/i.test(item.title||''))||list.find(item=>item.webSocketDebuggerUrl);
  if(!target){console.log('No connected runtime');return;}
  const ws=new WS(target.webSocketDebuggerUrl);
  const timer=setTimeout(()=>{console.log('Runtime unavailable');ws.close();},6000);
  ws.on('error',error=>{console.log(error.message);clearTimeout(timer);});
  ws.on('open',()=>ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{returnByValue:true,expression:`(()=>{
    const modules=Array.from(__r.getModules().values());
    const module=modules.find(item=>item.verboseName&&item.verboseName.replaceAll('\\\\','/').endsWith('screens/locationDrop/index.tsx'));
    const fn=module?.publicModule?.exports?.LocationDrop;
    const styles=modules.find(item=>item.verboseName==='src/screens/locationDrop/styles.tsx')?.publicModule?.exports?.styles;
    const card=modules.find(item=>item.verboseName==='src/components/homeScreen/HomeAddressCard.tsx');
    return {locationScreenLoaded:!!fn,addressCardLoaded:!!card?.isInitialized,inlineAddressStyle:styles?.inlineInputRow};
  })()`}})));
  ws.on('message',buffer=>{const message=JSON.parse(buffer);if(message.id===1){console.log(JSON.stringify(message.result?.result?.value||message.result?.exceptionDetails||message.error));clearTimeout(timer);ws.close();}});
})().catch(error=>console.log(error.message));
