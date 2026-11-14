// Route app-owned native text through one font adapter. Does not modify libraries or SVG text.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const parser=require(path.join(root,'Taxido_user/node_modules/@babel/parser'));
for(const app of ['Taxido_user','Taxido_driver']){
  const target=path.join(root,app,'src/design/Typography.tsx');
  if(app==='Taxido_driver')fs.copyFileSync(path.join(root,'Taxido_user/src/design/Typography.tsx'),target);
  let changed=0;
  function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,item.name);
    if(item.isDirectory()){walk(file);continue;}
    if(!/\.[jt]sx?$/.test(file)||file===target)continue;
    const source=fs.readFileSync(file,'utf8');
    const ast=parser.parse(source,{sourceType:'module',plugins:['typescript','jsx']});
    const edits=[];
    for(const node of ast.program.body){
      if(node.type!=='ImportDeclaration'||node.source.value!=='react-native')continue;
      const moved=node.specifiers.filter(spec=>spec.type==='ImportSpecifier'&&['Text','TextInput'].includes(spec.imported.name));
      if(!moved.length)continue;
      const kept=node.specifiers.filter(spec=>!moved.includes(spec));
      const named=kept.filter(spec=>spec.type==='ImportSpecifier').map(spec=>source.slice(spec.start,spec.end));
      const other=kept.filter(spec=>spec.type!=='ImportSpecifier').map(spec=>source.slice(spec.start,spec.end));
      const native=[...other,...(named.length?['{'+named.join(', ')+'}']:[])].join(', ');
      let relative=path.relative(path.dirname(file),target).replace(/\\/g,'/').replace(/\.tsx$/,'');
      if(!relative.startsWith('.'))relative='./'+relative;
      const kind=node.importKind==='type'?'type ':'';
      const text=(native?`import ${kind}${native} from 'react-native';\n`:'')+`import ${kind}{${moved.map(spec=>source.slice(spec.start,spec.end)).join(', ')}} from '${relative}';`;
      edits.push({start:node.start,end:node.end,text});
    }
    if(edits.length){let next=source;for(const edit of edits.reverse())next=next.slice(0,edit.start)+edit.text+next.slice(edit.end);fs.writeFileSync(file,next);changed++;}
  }}
  walk(path.join(root,app,'src'));
  console.log(`${app}: ${changed} app text imports unified`);
}
