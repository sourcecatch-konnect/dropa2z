import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {TextInput,Alert} from 'react-native';
import {PlaceCategoryShortcuts} from '../src/components/homeScreen/PlaceCategoryShortcuts';
const mockNavigate=jest.fn(),mockDispatch=jest.fn(()=>({unwrap:async()=>({})}));
const mockState:any={account:{self:{id:179}},saveLocation:{saveLocationDataGet:{data:[]}}};
jest.mock('react-redux',()=>({useSelector:(fn:any)=>fn(mockState),useDispatch:()=>mockDispatch}));
jest.mock('@react-navigation/native',()=>({useFocusEffect:(fn:any)=>require('react').useEffect(fn,[fn])}));
jest.mock('../src/utils/navigation',()=>({useAppNavigation:()=>({navigate:mockNavigate})}));
jest.mock('../src/utils/context',()=>({useValues:()=>({isDark:false})}));
jest.mock('../src/utils/icons',()=>({HomeLocation:()=>null,WorkLocation:()=>null,OtherLocation:()=>null,Delete:()=>null}));
jest.mock('../src/utils/localstorage',()=>({getValue:jest.fn(async()=>null),setValue:jest.fn(async()=>{})}));
jest.mock('../src/api/services/saveLocationService',()=>({addSaveLocation:jest.fn(async()=>({status:201}))}));
jest.mock('../src/api/store/actions/saveLocationAction',()=>({userSaveLocation:()=>({type:'refresh'}),deleteSaveLocation:(id:number)=>({type:'deleteSavedLocation',payload:id})}));
import {getValue,setValue} from '../src/utils/localstorage';
import {addSaveLocation} from '../src/api/services/saveLocationService';
let tree:renderer.ReactTestRenderer;
const recent=[{fullAddress:'Market, Jalgaon',shortAddress:'Market',lat:21.01,lng:75.57}];
const press=async(label:string)=>act(async()=>{await tree.root.findAll(node=>node.props.accessibilityLabel===label&&typeof node.props.onPress==='function')[0].props.onPress();});
beforeEach(()=>{jest.clearAllMocks();mockState.account.self={id:179};mockState.saveLocation.saveLocationDataGet.data=[];});
afterEach(()=>{act(()=>tree?.unmount());});
it('creates an account-scoped custom category and saves a searched address to it',async()=>{
  await act(async()=>{tree=renderer.create(<PlaceCategoryShortcuts recent={recent} onSelect={jest.fn()}/>);});
  await press('Create place category');
  act(()=>tree.root.findByType(TextInput).props.onChangeText('Parents'));
  await press('Save new place category');
  expect(setValue).toHaveBeenCalledWith('placeCategories:179',expect.stringContaining('Parents'));
  await press('Save Market, Jalgaon to Parents');
  expect(addSaveLocation).toHaveBeenCalledWith({title:'Parents',type:'other',location:'Market, Jalgaon',location_coordinates:{lat:21.01,lng:75.57}});
  expect(mockDispatch).toHaveBeenCalled();
});
it('selects a saved address and opens map creation with the selected category',async()=>{
  const select=jest.fn(async()=>{});
  mockState.saveLocation.saveLocationDataGet.data=[{id:2,title:'Office',type:'other',location:'Office, Jalgaon',location_coordinates:{lat:21.01,lng:75.57}}];
  await act(async()=>{tree=renderer.create(<PlaceCategoryShortcuts recent={recent} onSelect={select}/>);});
  await press('Office places');await press('Use Office: Office, Jalgaon');
  expect(select).toHaveBeenCalledWith(expect.objectContaining({fullAddress:'Office, Jalgaon',lat:21.01,lng:75.57}));
  await press('Add address to Office');
  await press('Search category address on map');
  expect(mockNavigate).toHaveBeenCalledWith('LocationSave',{categoryTitle:'Office',categoryType:'other'});
  expect(getValue).toHaveBeenCalledWith('placeCategories:179');
});
it('shows a failed save and leaves the address picker open for retry',async()=>{
  (addSaveLocation as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
  await act(async()=>{tree=renderer.create(<PlaceCategoryShortcuts recent={recent} onSelect={jest.fn()}/>);});
  await press('Add address to Home');await press('Save Market, Jalgaon to Home');
  expect(tree.root.findAll(node=>node.props.accessibilityRole==='alert').some(node=>node.props.children==='Connection failed')).toBe(true);
  expect(tree.root.findAll(node=>node.props.accessibilityLabel==='Save Market, Jalgaon to Home'&&node.props.onPress).length).toBeGreaterThan(0);
});
it('requires confirmation before deleting only the selected address, without selecting it for booking',async()=>{
  const alert=jest.spyOn(Alert,'alert').mockImplementation(()=>{}),select=jest.fn();
  mockState.saveLocation.saveLocationDataGet.data=[{id:2,title:'Home',type:'home',location:'Home, Jalgaon',location_coordinates:{lat:21.01,lng:75.57}}];
  try{
    await act(async()=>{tree=renderer.create(<PlaceCategoryShortcuts recent={recent} onSelect={select}/>);});
    mockDispatch.mockClear();await press('Delete Home address: Home, Jalgaon');
    expect(mockDispatch).not.toHaveBeenCalled();expect(select).not.toHaveBeenCalled();
    const buttons=alert.mock.calls[0][2]!;
    await act(async()=>{await buttons.find(button=>button.text==='Delete')!.onPress!();});
    expect(mockDispatch).toHaveBeenCalledWith({type:'deleteSavedLocation',payload:2});
    expect(mockDispatch).toHaveBeenCalledWith({type:'refresh'});
    expect(select).not.toHaveBeenCalled();
  }finally{alert.mockRestore();}
});
