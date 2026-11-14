// Read-only summary; deliberately excludes tokens, email and phone numbers.
const app=process.argv[2];
if(!['rider','driver'].includes(app))throw Error('Choose rider or driver');
const WS=require('../Taxido_driver/node_modules/ws');
(async()=>{
 const pages=await fetch(`http://127.0.0.1:${app==='rider'?8081:8082}/json/list`).then(r=>r.json());
 const target=pages.find(p=>p.webSocketDebuggerUrl&&(app==='rider'?/A142/.test(p.title):/A009P/.test(p.title)));
 if(!target)throw Error('Requested phone runtime is not connected.');
 const socket=new WS(target.webSocketDebuggerUrl);const timer=setTimeout(()=>socket.close(),7000);
 socket.on('open',()=>socket.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{returnByValue:true,expression:`(()=>{
 const modules=Array.from(__r.getModules().values());
 const m=modules.find(m=>/\\/api\\/store\\/index\\.(tsx?|jsx?)$/.test((m.verboseName||'').replaceAll('\\\\','/')));
 const store=m?.publicModule?.exports?.default||m?.publicModule?.exports?.store;
 if(!store?.getState)return {storeFound:!!m,exports:Object.keys(m?.publicModule?.exports||{})};
 const state=store.getState(), account=state.account||{}, driver=account.selfDriver;
 return {accountKeys:Object.keys(account),driver:driver?{id:driver.id,role:driver.role,verified:driver.is_verified,is_online:driver.is_online,is_on_ride:driver.is_on_ride,wallet_balance:driver.wallet_balance,training:driver.training,minimumWalletBalance:state.setting?.taxidoSettingData?.cabbooking_values?.wallet?.driver_min_wallet_balance,vehicle:driver.vehicle_info?.vehicle_type?.name||driver.vehicle_info?.vehicle_type_name}:null,rideKeys:Object.keys(state.ride||state.allRide||{}),riderId:account.self?.id||account.selfAccount?.id||account.accountData?.id||account.selfUser?.id};
 })()`}})));
 socket.on('message',raw=>{const message=JSON.parse(raw);if(message.id===1){console.log(JSON.stringify(message.result?.result?.value||message.result?.exceptionDetails||message.error));clearTimeout(timer);socket.close();}});
 socket.on('error',e=>{clearTimeout(timer);console.error(e.message)});
})().catch(e=>{console.error(e.message);process.exitCode=1});
