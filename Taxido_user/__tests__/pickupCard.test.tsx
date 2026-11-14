import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {PickupCard} from '../src/design/PickupCard';
jest.mock('../src/design/BrandLogo',()=>({BrandMark:()=>null}));
it.each(['rider','driver'] as const)('connects the %s card to real contact callbacks and keeps PIN content supplied by the app',role=>{
 const call=jest.fn(),message=jest.fn();let tree:renderer.ReactTestRenderer;
 act(()=>{tree=renderer.create(<PickupCard role={role} name="Actual Account" pickup="Jalgaon" onCall={call} onMessage={message}><></></PickupCard>);});
 expect(JSON.stringify(tree!.toJSON())).toContain('Actual Account');
 const callButton=tree!.root.findAll(n=>n.props.accessibilityLabel===(role==='rider'?'Call driver':'Call sender')&&n.props.onPress)[0];
 const chatButton=tree!.root.findAll(n=>n.props.accessibilityLabel==='Message'&&n.props.onPress)[0];
 act(()=>{callButton.props.onPress();chatButton.props.onPress();});
 expect(call).toHaveBeenCalledTimes(1);expect(message).toHaveBeenCalledTimes(1);
 expect(JSON.stringify(tree!.toJSON())).not.toContain('4826');
 act(()=>tree!.unmount());
});
