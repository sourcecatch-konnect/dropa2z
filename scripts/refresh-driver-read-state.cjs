// Refreshes authenticated GET snapshots only. No booking, availability or payment writes.
const WS=require('../Taxido_driver/node_modules/ws');
(async()=>{
 const pages=await fetch('http://127.0.0.1:8082/json/list').then(response=>response.json());
 const page=pages.find(page=>page.webSocketDebuggerUrl&&/A009P/i.test(page.title||''));
 if(!page)throw Error('Driver runtime disconnected');
 const ws=new WS(page.webSocketDebuggerUrl),timer=setTimeout(()=>ws.close(),15000);
 ws.on('open',()=>ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{awaitPromise:true,returnByValue:true,expression:`(()=>{
 const modules=Array.from(__r.getModules().values()),find=name=>modules.find(module=>(module.verboseName||'').replaceAll('\\\\','/').endsWith(name));
 const exports=module=>module?.publicModule?.exports;
 const entry=exports(find('/api/store/index.tsx'))||exports(find('/api/store/index.ts'));
 const store=entry?.default||entry?.store;
 const settings=exports(find('/api/store/action/settingAction.tsx')),account=exports(find('/api/store/action/accountAction.tsx'));
 if(!store||!settings||!account)return {ready:false};
 return Promise.all([store.dispatch(settings.taxidosettingDataGet()).unwrap(),store.dispatch(account.selfDriverData()).unwrap()]).then(()=>{
 const state=store.getState();return {minimum:state.setting.taxidoSettingData?.cabbooking_values?.wallet?.driver_min_wallet_balance,training:state.account.selfDriver?.training};
 });})()`}})));
 ws.on('message',raw=>{const message=JSON.parse(raw);if(message.id===1){console.log(JSON.stringify(message.result?.result?.value||message.result?.exceptionDetails||message.error));clearTimeout(timer);ws.close();}});
 ws.on('error',error=>{console.error(error.message);clearTimeout(timer);});
})().catch(error=>{console.error(error.message);process.exitCode=1;});
