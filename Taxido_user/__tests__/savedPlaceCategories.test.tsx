import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {groupSavedPlaces} from '../src/utils/groupSavedPlaces';
import {usePlaceCategories} from '../src/utils/usePlaceCategories';
import {SaveCategoryIcons} from '../src/components/homeScreen/SaveCategoryIcons';
import {getValue,setValue} from '../src/utils/localstorage';
const mockDispatch=jest.fn(),mockState={account:{self:{id:267}}};
jest.mock('react-redux',()=>({useSelector:(fn:any)=>fn(mockState),useDispatch:()=>mockDispatch}));
jest.mock('@react-navigation/native',()=>({useFocusEffect:(fn:any)=>require('react').useEffect(fn,[fn])}));
jest.mock('../src/utils/localstorage',()=>({getValue:jest.fn(async()=>null),setValue:jest.fn(async()=>{})}));
jest.mock('../src/api/store/actions/saveLocationAction',()=>({userSaveLocation:()=>({type:'refresh'})}));
jest.mock('../src/api/services/saveLocationService',()=>({updateSaveLocation:jest.fn(async()=>({status:200}))}));
let tree:renderer.ReactTestRenderer,result:ReturnType<typeof usePlaceCategories>;
function Harness(){result=usePlaceCategories([],false);return null;}
beforeEach(()=>{jest.clearAllMocks();mockDispatch.mockReturnValue({unwrap:async()=>({data:[]})});(getValue as jest.Mock).mockResolvedValue(null);});
afterEach(()=>{act(()=>tree?.unmount());});
it('groups default and custom saved locations without dropping legacy addresses',()=>{
  const items=[{id:1,title:'Home',type:'home'},{id:2,title:'Shop',type:'other'},{id:3,title:'Godown',type:'other'},{id:4,title:'Parents',type:'other'},{id:5,title:'Old office',type:'work'}];
  const groups=groupSavedPlaces(items);
  expect(groups.map(group=>[group.name,group.items.map(item=>item.id)])).toEqual([['Home',[1]],['Shop',[2]],['Godown',[3]],['Parents',[4]],['Old office',[5]]]);
  expect(groups.flatMap(group=>group.items)).toHaveLength(items.length);
});
it('persists a custom category under the current account and prevents duplicate names',async()=>{
  await act(async()=>{tree=renderer.create(<Harness/>);});
  await act(async()=>{await result.addCategory('Parents');});
  expect(setValue).toHaveBeenCalledWith('placeCategories:267',expect.stringContaining('Parents'));
  expect(result.categories.some(item=>item.name==='Parents')).toBe(true);
  await expect(result.addCategory(' parents ')).rejects.toThrow('already exists');
});
it('restores custom categories when the screen is reopened',async()=>{
  (getValue as jest.Mock).mockResolvedValue(JSON.stringify([{name:'Warehouse 2',icon:'place'}]));
  await act(async()=>{tree=renderer.create(<Harness/>);});
  expect(result.categories.map(item=>item.name)).toContain('Warehouse 2');
});
it('shows category labels and a separate plus action in the scrolling row',()=>{
  const add=jest.fn();
  act(()=>{tree=renderer.create(<SaveCategoryIcons selected={null} onSelect={jest.fn()} onAdd={add}/>);});
  expect(tree.root.findAll(node=>node.props.testID==='save-category-scroll')[0].props.horizontal).toBe(true);
  act(()=>tree.root.findAll(node=>node.props.accessibilityLabel==='Add saved-place category'&&typeof node.props.onPress==='function')[0].props.onPress());
  expect(add).toHaveBeenCalledTimes(1);
  const json=JSON.stringify(tree.toJSON());expect(json).toContain('Home');expect(json).toContain('Shop');expect(json).toContain('Godown');
});
it('removes a custom category from account-scoped storage and keeps the defaults protected',async()=>{
  (getValue as jest.Mock).mockResolvedValue(JSON.stringify([{name:'Parents',icon:'place'}]));
  await act(async()=>{tree=renderer.create(<Harness/>);});
  await act(async()=>{await result.removeCategory('Parents');});
  expect(setValue).toHaveBeenCalledWith('placeCategories:267','[]');
  expect(result.categories.some(item=>item.name==='Parents')).toBe(false);
  await expect(result.removeCategory('Home')).rejects.toThrow('cannot be deleted');
});
it('the delete icon is a separate action beside category creation',()=>{
  const remove=jest.fn(),add=jest.fn();
  act(()=>{tree=renderer.create(<SaveCategoryIcons selected={null} onSelect={jest.fn()} onAdd={add} onDelete={remove}/>);});
  act(()=>tree.root.findAll(node=>node.props.accessibilityLabel==='Delete saved-place category'&&typeof node.props.onPress==='function')[0].props.onPress());
  expect(remove).toHaveBeenCalledTimes(1);expect(add).not.toHaveBeenCalled();
});
