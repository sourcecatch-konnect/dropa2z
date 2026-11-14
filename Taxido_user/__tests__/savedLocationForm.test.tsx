import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert} from 'react-native';
import {LocationSave} from '../src/screens/bottomTab/profileTab/savedLocation/component/locationSave';

const mockBack = jest.fn();
const mockDispatch = jest.fn();
const mockAdd = jest.fn(payload => ({type:'save', payload}));
const mockUpdate = jest.fn(payload => ({type:'update', payload}));
const mockRefresh = jest.fn(() => ({type:'refresh'}));
let mockParams: any = {};
jest.mock('@react-navigation/native', () => ({useNavigation:()=>({goBack:mockBack}), useRoute:()=>({name:'LocationSave',params:mockParams})}));
jest.mock('react-redux', () => ({useDispatch:()=>mockDispatch, useSelector:()=>({translateData:{save:'Save',cancel:'Cancel',home:'Home',work:'Work',other:'Other'},taxidoSettingData:{}})}));
jest.mock('../src/utils/context', () => ({useValues:()=>({isDark:false,Google_Map_Key:'test-key'})}));
jest.mock('../src/api/store/actions', () => ({addSaveLocation:(p:any)=>mockAdd(p),updateSaveLocation:(p:any)=>mockUpdate(p)}));
jest.mock('../src/api/store/actions/saveLocationAction', () => ({userSaveLocation:()=>mockRefresh()}));
jest.mock('../src/components/helper/useStoredLocation', () => ({__esModule:true,default:()=>({latitude:21.01,longitude:75.56})}));
jest.mock('../src/utils/icons', () => ({Back:()=>null,AddressMarker:()=>null}));
jest.mock('../src/utils/images', () => ({__esModule:true,default:{pin:1}}));
jest.mock('../src/commonComponent', () => ({Button:(props:any)=>require('react').createElement('SaveFormButton',props)}));
jest.mock('react-native-webview', () => ({WebView:'WebView'}));
jest.mock('@gorhom/bottom-sheet', () => {
  const React=require('react');
  return {__esModule:true,default:React.forwardRef((props:any,ref:any)=>{
    React.useImperativeHandle(ref,()=>({expand:jest.fn(),close:jest.fn()}));
    return React.createElement('BottomSheet',props,props.children);
  }),BottomSheetView:'BottomSheetView',BottomSheetTextInput:'TitleInput',BottomSheetBackdrop:()=>null};
});

let tree:renderer.ReactTestRenderer;
const save=()=>tree.root.findAllByType('SaveFormButton' as any).find(node=>node.props.title==='Save')!;
async function openForm(title='Home') {
  await act(async()=>{tree=renderer.create(<LocationSave/>);});
  act(()=>tree.root.findByType('WebView' as any).props.onLoadEnd());
  act(()=>tree.root.findByType('TitleInput' as any).props.onChangeText(title));
}
beforeEach(()=>{
  jest.clearAllMocks();mockParams={};
  jest.spyOn(Alert,'alert').mockImplementation(()=>{});
  global.fetch=jest.fn().mockResolvedValue({json:async()=>({status:'OK',results:[{formatted_address:'Station, Jalgaon',address_components:[{types:['country'],short_name:'IN'}]}]})});
  mockDispatch.mockImplementation(()=>({unwrap:()=>Promise.resolve({id:11})}));
});
afterEach(()=>{if(tree)act(()=>tree.unmount());jest.restoreAllMocks();});

it('Save posts the selected address and pin, refreshes the list and returns after success',async()=>{
  await openForm('  My Home  ');
  await act(async()=>{await save().props.onPress();});
  expect(mockAdd).toHaveBeenCalledWith({title:'My Home',type:'home',location:'Station, Jalgaon',location_coordinates:{lat:21.01,lng:75.56}});
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  expect(mockBack).toHaveBeenCalledTimes(1);
});
it('retains a custom homepage category when saving an address from the map',async()=>{
  mockParams={categoryTitle:'Office',categoryType:'other'};
  await act(async()=>{tree=renderer.create(<LocationSave/>);});
  act(()=>tree.root.findByType('WebView' as any).props.onLoadEnd());
  expect(tree.root.findByType('TitleInput' as any).props.value).toBe('Office');
  await act(async()=>{await save().props.onPress();});
  expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({title:'Office',type:'other'}));
});
it('updates the existing saved location instead of creating a second record',async()=>{
  mockParams={mode:'edit',locationID:12,locationDetails:{title:'Work',type:'work',location_coordinates:{lat:21.02,lng:75.58}}};
  await openForm('Office');
  await act(async()=>{await save().props.onPress();});
  expect(mockAdd).not.toHaveBeenCalled();
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({locationID:12,data:expect.objectContaining({title:'Office',type:'work'})}));
});
it('keeps the form open and shows an error when saving fails',async()=>{
  mockDispatch.mockImplementationOnce(()=>({unwrap:()=>Promise.reject({message:'Cannot save address'})}));
  await openForm();
  await act(async()=>{await save().props.onPress();});
  expect(Alert.alert).toHaveBeenCalledWith('Error','Cannot save address');
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockRefresh).not.toHaveBeenCalled();
  expect(save().props.loading).toBe(false);
});
it('blocks an empty title and ignores repeated taps while one save is pending',async()=>{
  await openForm(' ');
  await act(async()=>{await save().props.onPress();});
  expect(mockAdd).not.toHaveBeenCalled();
  act(()=>tree.root.findByType('TitleInput' as any).props.onChangeText('Home'));
  let resolve:any;
  mockDispatch.mockImplementationOnce(()=>({unwrap:()=>new Promise(done=>{resolve=done;})}));
  let pending:Promise<any>;
  act(()=>{pending=save().props.onPress();});
  await act(async()=>{await save().props.onPress();});
  expect(mockAdd).toHaveBeenCalledTimes(1);
  await act(async()=>{resolve({id:11});await pending;});
  expect(mockBack).toHaveBeenCalledTimes(1);
});
