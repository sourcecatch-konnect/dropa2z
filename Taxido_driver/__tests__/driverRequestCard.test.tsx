import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {DriverRequestCard} from '../src/design/DriverRequestCard';
jest.mock('../src/design/VehicleGraphic',()=>({VehicleGraphic:()=>null}));
jest.mock('../src/design/RequestAcceptSlider',()=>({RequestAcceptSlider:(p:any)=>require('react').createElement(require('react-native').View,{...p,testID:'slider'})}));
it('renders actual earnings and every delivery stop and passes acceptance to the real callback',async()=>{
 const accept=jest.fn(async()=>true);let tree:renderer.ReactTestRenderer;
 const offer={id:12,vehicle_type:{name:'Auto'},goods_type:'Documents',driver_commission:42,total:50,locations:['Pickup Jalgaon','Drop 1','Drop 2']};
 act(()=>{tree=renderer.create(<DriverRequestCard offer={offer} onAccept={accept} onDecline={async()=>true} onExpired={()=>{}} onDetails={()=>{}}/>);});
 const content=JSON.stringify(tree!.toJSON());for(const value of ['Pickup Jalgaon','Drop 1','Drop 2','Documents','42.00'])expect(content).toContain(value);
 await act(async()=>{await tree!.root.findByProps({testID:'slider'}).props.onAccept();});expect(accept).toHaveBeenCalledTimes(1);
 act(()=>tree!.unmount());
});
it('retains a decline error for retry rather than reporting success',async()=>{
 let tree:renderer.ReactTestRenderer;const decline=jest.fn(async()=>false);
 act(()=>{tree=renderer.create(<DriverRequestCard offer={{id:3,locations:[]}} onAccept={async()=>false} onDecline={decline} onExpired={()=>{}} onDetails={()=>{}}/>);});
 await act(async()=>{await tree!.root.findAll(n=>n.props.accessibilityLabel==='Decline booking'&&n.props.onPress)[0].props.onPress();});
 expect(JSON.stringify(tree!.toJSON())).toContain('Could not decline. Please try again.');
 act(()=>tree!.unmount());
});
