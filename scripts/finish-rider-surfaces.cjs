const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),parser=require('../Taxido_user/node_modules/@babel/parser');
const target=path.join(root,'Taxido_user/src/design/RiderSurfaces.ts');
let total=0;const report=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,item.name);if(item.isDirectory()){walk(file);continue;}
 if(!/^styles?\.tsx?$/.test(item.name))continue;
 const source=fs.readFileSync(file,'utf8');
 if(source.includes('RiderSurfaces'))continue;
 const tree=parser.parse(source,{sourceType:'module',plugins:['typescript','jsx']});
 const edits=[],used=new Set(),names=[];
 function visit(node){
  if(!node||typeof node!=='object')return;
  if(node.type==='CallExpression'&&node.callee?.object?.name==='StyleSheet'&&node.callee?.property?.name==='create'){
   for(const entry of node.arguments[0]?.properties||[]){
    if(entry.type!=='ObjectProperty'||entry.value?.type!=='ObjectExpression')continue;
    const name=entry.key.name||entry.key.value;
    const properties=entry.value.properties;
    const keys=properties.filter(p=>p.type==='ObjectProperty').map(p=>p.key.name||p.key.value);
    if(!keys.includes('borderRadius'))continue;
    let finish;
    if(/(textInputContainer|searchContainer|dropdownContainer|phoneNumberInput)/i.test(name))finish='riderFieldFinish';
    else if(!/(icon|radio|image|avatar|circle|dot|badge|marker|bottom|modal|map|shadow|button|btn|sheet|line|otp|header|input|text)/i.test(name)&&(keys.includes('backgroundColor')||keys.includes('borderWidth')))finish='riderCardFinish';
    if(!finish)continue;
    const last=properties[properties.length-1];
    if(!last)continue;
    const suffix=source.slice(last.end,entry.value.end-1).includes(',')?'':',';
    edits.push({at:entry.value.end-1,text:`${suffix}\n    ...${finish},\n  `});used.add(finish);names.push(name);
   }
  }
  for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}
 }
 visit(tree.program);
 if(!edits.length)continue;
 let next=source;for(const edit of edits.sort((a,b)=>b.at-a.at))next=next.slice(0,edit.at)+edit.text+next.slice(edit.at);
 let relative=path.relative(path.dirname(file),target).replace(/\\/g,'/').replace(/\.ts$/,'');if(!relative.startsWith('.'))relative='./'+relative;
 next=`import {${[...used].join(',')}} from '${relative}';\n`+next;
 parser.parse(next,{sourceType:'module',plugins:['typescript','jsx']});
 fs.writeFileSync(file,next);total+=edits.length;report.push({file:path.relative(root,file).replace(/\\/g,'/'),styles:names});
}}
walk(path.join(root,'Taxido_user/src/screens'));walk(path.join(root,'Taxido_user/src/components'));
fs.writeFileSync(path.join(root,'Taxido_user/src/design/rider-surface-coverage.json'),JSON.stringify(report,null,2));
console.log(`Standardized ${total} card/field surfaces in ${report.length} style files`);
