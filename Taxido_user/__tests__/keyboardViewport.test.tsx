import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {KeyboardViewport} from '../src/design/KeyboardViewport';
let mockTop:number|null=600,mockHeight=700;
jest.mock('react-native',()=>{
 const React=require('react');
 return {Platform:{OS:'android'},StatusBar:{currentHeight:24},useWindowDimensions:()=>({width:400,height:800}),
  View:React.forwardRef((p:any,ref:any)=>{React.useImperativeHandle(ref,()=>({measureInWindow:(cb:any)=>cb(0,120,400,mockHeight)}));return React.createElement('Viewport',p,p.children);})};
});
jest.mock('react-native-safe-area-context',()=>({useSafeAreaInsets:()=>({top:24,bottom:24})}));
jest.mock('../src/utils/useKeyboardState',()=>({useKeyboardState:()=>({top:mockTop})}));
it('keeps the composer viewport above the IME without repeatedly shrinking after native resize',()=>{
 let tree:any;act(()=>{tree=renderer.create(<KeyboardViewport>Draft</KeyboardViewport>);});
 const height=()=>tree.root.findByType('Viewport').props.style.filter(Boolean).find((x:any)=>x.maxHeight!=null)?.maxHeight;
 expect(height()).toBe(456);
 mockHeight=456;act(()=>tree.root.findByType('Viewport').props.onLayout());
 expect(height()).toBe(456);
 mockTop=null;act(()=>tree.update(<KeyboardViewport>Draft</KeyboardViewport>));
 expect(height()).toBeUndefined();act(()=>tree.unmount());
});
