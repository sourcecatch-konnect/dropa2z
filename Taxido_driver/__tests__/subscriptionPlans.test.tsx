import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {Subscription} from '../src/screen/settings/subscription';
const mockNavigate=jest.fn();
let mockState:any;
jest.mock('@react-navigation/native',()=>({useNavigation:()=>({navigate:mockNavigate}),useRoute:()=>({name:'Subscription'})}));
jest.mock('react-redux',()=>({useSelector:(select:any)=>select(mockState)}));
jest.mock('../src/utils/context',()=>({useValues:()=>({isDark:false,viewRtlStyle:'row'})}));
jest.mock('../src/commonComponents',()=>({Header:()=>null}));
let tree:renderer.ReactTestRenderer;
beforeEach(()=>{jest.clearAllMocks();mockState={setting:{translateData:{},planData:{data:[{id:2,name:'Business',price:240,description:['Priority support']},{id:1,name:'Starter',price:90,description:['Local deliveries']}]}},zoneUpdate:{zoneValue:{currency_symbol:'₹',exchange_rate:1}},account:{selfDriver:{subscription:{is_active:1,plan_id:1}}}};});
afterEach(()=>{if(tree)act(()=>tree.unmount());});
it('uses Admin plan data, sorts by price, and opens payment for the selected plan',async()=>{
 await act(async()=>{tree=renderer.create(<Subscription/>);});
 const buttons=tree.root.findAll(node=>node.props.accessibilityRole==='button' && node.props.onPress);
 expect(buttons[0].props.accessibilityLabel).toBe('Current plan Starter');
 act(()=>buttons.find(node=>node.props.accessibilityLabel==='Select plan Business')!.props.onPress());
 expect(mockNavigate).toHaveBeenCalledWith('PaymentSelect',{planId:2});
 expect(JSON.stringify(tree.toJSON())).toContain('₹240.00');
});
it('disables repurchasing the current plan and a plan with an invalid price',async()=>{
 mockState.setting.planData.data.push({id:3,name:'Invalid',price:'unknown'});
 await act(async()=>{tree=renderer.create(<Subscription/>);});
 const current=tree.root.find(node=>node.props.accessibilityLabel==='Current plan Starter');
 const invalid=tree.root.find(node=>node.props.accessibilityLabel==='Select plan Invalid');
 expect(current.props.disabled).toBe(true);expect(invalid.props.disabled).toBe(true);
});
it('shows an honest empty state instead of fabricated sample plans',async()=>{
 mockState.setting.planData.data=[];
 await act(async()=>{tree=renderer.create(<Subscription/>);});
 expect(JSON.stringify(tree.toJSON())).toContain('No subscription plans are available');
 expect(tree.root.findAll(node=>node.props.accessibilityRole==='button')).toHaveLength(0);
});
