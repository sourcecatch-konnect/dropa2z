// Local debug preview only. Uses the already connected Metro runtime; no account/API writes.
const WS=require('../Taxido_driver/node_modules/ws');
const screen=process.argv[2];
const params=process.argv[3]==='navigation-check'?{title:'Navigation check',destinations:[{lat:20.9948,lng:75.5661,title:'Jalgaon navigation test'}]}:process.argv[3]?JSON.parse(process.argv[3]):null;
const allowed=['DriverTraining','Home','DashBoard','My Delivery','Settings','OnBoarding','AppSettings','MyWallet','TopUp','ProfileSetting','DocumentDetail','LegalDocuments','BankDetails','VehicleDetail','Notification','Subscription','SupportTicket','CreateTicket','DeliveryNavigation'];
if(!allowed.includes(screen))throw Error('Choose a supported read-only preview screen.');
(async()=>{
 const pages=await fetch('http://127.0.0.1:8082/json/list').then(r=>r.json());
 const target=pages.find(p=>p.webSocketDebuggerUrl&&/A009P/i.test(p.deviceName||p.title||''))||pages.find(p=>p.webSocketDebuggerUrl&&/driver/i.test(p.title||''));
 if(!target)throw Error('No connected Driver debug runtime.');
 const ws=new WS(target.webSocketDebuggerUrl);
 const timer=setTimeout(()=>{console.log('Runtime timeout');ws.close();},6000);
 ws.on('error',e=>{clearTimeout(timer);console.log(e.message);});
 ws.on('open',()=>ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{returnByValue:true,expression:`(()=>{
  const module=Array.from(__r.getModules().values()).find(m=>m.verboseName&&m.verboseName.replaceAll('\\\\','/').endsWith('commonComponents/helper/navigationService.tsx'));
  const nav=module?.publicModule?.exports?.navigationRef;
  if(!nav?.isReady())return {ready:false};
  const from=nav.getCurrentRoute()?.name;nav.navigate(${JSON.stringify(['Home','DashBoard','My Delivery'].includes(screen)?'TabNav':screen)}${['Home','DashBoard','My Delivery'].includes(screen)?', '+JSON.stringify({screen}):params?', '+JSON.stringify(params):''});return {from,opened:${JSON.stringify(screen)}};
 })()`}})));
 ws.on('message',raw=>{const m=JSON.parse(raw);if(m.id===1){console.log(JSON.stringify(m.result?.result?.value||m.result?.exceptionDetails||m.error));clearTimeout(timer);ws.close();}});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
