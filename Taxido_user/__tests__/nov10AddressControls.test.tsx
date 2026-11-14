import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {HomeAddressCard} from '../src/components/homeScreen/HomeAddressCard';
import {AddressSuggestionOverlay,AddressSuggestionDismissArea} from '../src/components/homeScreen/AddressSuggestionOverlay';
jest.mock('../src/utils/context',()=>({useValues:()=>({isDark:false})}));
jest.mock('../src/utils/icons',()=>({Close:()=>null,Add:()=>null,Minus:()=>null,Swap:()=>null,AddressMarker:()=>null}));
let tree:renderer.ReactTestRenderer;
afterEach(()=>{act(()=>tree?.unmount());});
it('routes the pickup and destination map shortcuts separately and exposes multistop',()=>{
  const pickupMap=jest.fn(),destinationMap=jest.fn(),add=jest.fn();
  const field={value:'',placeholder:'',onChangeText:jest.fn(),onFocus:jest.fn(),onBlur:jest.fn(),onClear:jest.fn()};
  act(()=>{tree=renderer.create(<HomeAddressCard dark={false} pickup={{...field,onMap:pickupMap}} destination={{...field,onMap:destinationMap}} stops={[]} onAddStop={add} onRemoveStop={jest.fn()} onSwap={jest.fn()} canSwap={false}/>);});
  const press=(label:string)=>act(()=>tree.root.findAll(node=>node.props.accessibilityLabel===label&&typeof node.props.onPress==='function')[0].props.onPress());
  press('Choose pickup on map');press('Choose destination on map');press('Select multistop');
  expect(pickupMap).toHaveBeenCalledTimes(1);expect(destinationMap).toHaveBeenCalledTimes(1);expect(add).toHaveBeenCalledTimes(1);
});
it('saving a suggestion does not select it or change the booking endpoint',()=>{
  const place={id:'p1',shortAddress:'Station',fullAddress:'Station, Jalgaon',lat:21.01,lng:75.57};
  const save=jest.fn(),select=jest.fn(async()=>{});
  act(()=>{tree=renderer.create(<AddressSuggestionOverlay suggestions={[place]} onSelect={select} onSave={save} isSaved={()=>false}/>);});
  act(()=>tree.root.findAll(node=>node.props.accessibilityLabel==='Save address: Station, Jalgaon'&&typeof node.props.onPress==='function')[0].props.onPress());
  expect(save).toHaveBeenCalledWith(place);expect(select).not.toHaveBeenCalled();
});
it('dismisses from outside the card without placing a touch blocker over its search inputs',()=>{
  const dismiss=jest.fn();
  act(()=>{tree=renderer.create(<AddressSuggestionDismissArea frame={{left:16,cardTop:100,top:250,width:368,maxHeight:210}} onDismiss={dismiss}/>);});
  const above=tree.root.findAll(node=>node.props.testID==='dismiss-address-suggestions-above'&&typeof node.props.onPress==='function')[0];
  const below=tree.root.findAll(node=>node.props.testID==='dismiss-address-suggestions-below'&&typeof node.props.onPress==='function')[0];
  expect(above.props.style[1].height).toBe(100);
  expect(below.props.style[1].top).toBe(250);
  act(()=>above.props.onPress());act(()=>below.props.onPress());
  expect(dismiss).toHaveBeenCalledTimes(2);
});
