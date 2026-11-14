import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {PanResponder} from 'react-native';
import {RequestAcceptSlider} from '../src/design/RequestAcceptSlider';
let tree:renderer.ReactTestRenderer;
beforeAll(()=>jest.spyOn(PanResponder,'create').mockImplementation((config:any)=>({panHandlers:{onResponderRelease:(_e:any,gesture:any)=>config.onPanResponderRelease({},gesture)}} as any)));
afterAll(()=>jest.restoreAllMocks());
afterEach(()=>{if(tree)act(()=>tree.unmount());});
const handle=()=>tree.root.findAll(n=>n.props.testID==='request-accept-handle'&&n.props.onResponderRelease)[0];
it('submits only after a complete swipe and blocks repeated swipes while the server is pending',async()=>{
 let resolve:any;const accept=jest.fn(()=>new Promise<boolean>(r=>{resolve=r;}));
 act(()=>{tree=renderer.create(<RequestAcceptSlider offerId={1} onAccept={accept}/>);});
 act(()=>handle().props.onResponderRelease(null,{dx:50}));expect(accept).not.toHaveBeenCalled();
 act(()=>handle().props.onResponderRelease(null,{dx:280}));expect(accept).toHaveBeenCalledTimes(1);
 act(()=>handle().props.onResponderRelease(null,{dx:280}));expect(accept).toHaveBeenCalledTimes(1);
 await act(async()=>resolve(true));
 act(()=>handle().props.onResponderRelease(null,{dx:280}));expect(accept).toHaveBeenCalledTimes(1);
});
it('resets after a server rejection, permits retry, and never accepts an unavailable offer',async()=>{
 const accept=jest.fn(async()=>false);
 act(()=>{tree=renderer.create(<RequestAcceptSlider offerId={1} onAccept={accept}/>);});
 await act(async()=>handle().props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 await act(async()=>handle().props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 expect(accept).toHaveBeenCalledTimes(2);
 act(()=>tree.update(<RequestAcceptSlider offerId={1} disabled onAccept={accept}/>));
 await act(async()=>handle().props.onAccessibilityAction({nativeEvent:{actionName:'activate'}}));
 expect(accept).toHaveBeenCalledTimes(2);
});
it('retains the gesture responder through countdown-driven rerenders',()=>{
 const accept=jest.fn(async()=>true);
 act(()=>{tree=renderer.create(<RequestAcceptSlider offerId={1} onAccept={accept}/>);});
 const release=handle().props.onResponderRelease;
 act(()=>tree.update(<RequestAcceptSlider offerId={1} onAccept={accept}/>));
 expect(handle().props.onResponderRelease).toBe(release);
});
