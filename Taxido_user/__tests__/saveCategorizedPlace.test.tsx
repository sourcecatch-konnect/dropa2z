import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {saveCategorizedPlace} from '../src/utils/saveCategorizedPlace';
import {SaveCategoryIcons} from '../src/components/homeScreen/SaveCategoryIcons';
import {addSaveLocation} from '../src/api/services/saveLocationService';
jest.mock('../src/api/services/saveLocationService',()=>({addSaveLocation:jest.fn(async()=>({status:201}))}));
const place={fullAddress:'Market, Jalgaon',lat:21.01,lng:75.57};
beforeEach(()=>jest.clearAllMocks());
it('saves the chosen search result to the selected Home category with coordinates',async()=>{
  await saveCategorizedPlace(place,'Home',[]);
  expect(addSaveLocation).toHaveBeenCalledWith({title:'Home',type:'home',location:'Market, Jalgaon',location_coordinates:{lat:21.01,lng:75.57}});
});
it('keeps Shop and Godown categories distinct without changing the saved address',async()=>{
  await saveCategorizedPlace(place,'Shop',[]);await saveCategorizedPlace(place,'Godown',[]);
  expect(addSaveLocation).toHaveBeenNthCalledWith(1,expect.objectContaining({title:'Shop',type:'other'}));
  expect(addSaveLocation).toHaveBeenNthCalledWith(2,expect.objectContaining({title:'Godown',type:'other'}));
});
it('does not create a duplicate address already saved to that category',async()=>{
  await saveCategorizedPlace(place,'Home',[{title:'Home',location:place.fullAddress}]);
  expect(addSaveLocation).not.toHaveBeenCalled();
});
it('propagates a server error rather than silently claiming that an address was saved',async()=>{
  (addSaveLocation as jest.Mock).mockRejectedValueOnce(new Error('Network unavailable'));
  await expect(saveCategorizedPlace(place,'Home',[])).rejects.toThrow('Network unavailable');
});
it('the Home, Shop and Godown icon controls select the category for the next address',()=>{
  const select=jest.fn();let tree:renderer.ReactTestRenderer;
  act(()=>{tree=renderer.create(<SaveCategoryIcons selected={null} onSelect={select}/>);});
  for(const category of ['Home','Shop','Godown'])act(()=>tree!.root.findAll(node=>node.props.accessibilityLabel===`Save next selected address to ${category}`&&typeof node.props.onPress==='function')[0].props.onPress());
  expect(select.mock.calls).toEqual([['Home'],['Shop'],['Godown']]);
  act(()=>tree!.unmount());
});
