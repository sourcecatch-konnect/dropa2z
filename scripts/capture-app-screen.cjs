const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const [device,app,name,...tap]=process.argv.slice(2);
if(!device||!['rider','driver'].includes(app)||!name||!/^[a-z0-9_-]+$/i.test(name))throw Error('Usage: node capture-app-screen.cjs DEVICE rider|driver SCREEN_NAME [X Y]');
const adb=args=>execFileSync('adb',['-s',device,...args],{maxBuffer:32*1024*1024});
const current=()=>adb(['shell','dumpsys','activity','activities']).toString().split('\n').find(line=>line.includes('topResumedActivity'))||'';
const expected=`com.dropa2z.${app}/`;
if(!current().includes(expected))throw Error(`The ${app} app is not in the foreground. No action or capture performed.`);
if(tap.length===2)adb(['shell','input','tap',...tap]);
setTimeout(()=>{
  if(!current().includes(expected))throw Error('The foreground app changed; capture skipped.');
  const dir=path.resolve(__dirname,'../../ui-crosscheck-20261104',app);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,name+'.png'),adb(['exec-out','screencap','-p']));
  fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify({device,app,name,time:new Date().toISOString(),foreground:current().trim()},null,2));
  console.log(path.join(dir,name+'.png'));
},800);
