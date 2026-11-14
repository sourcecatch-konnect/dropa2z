import {moveAddressesFromCategory,canDeletePlaceCategory} from '../src/utils/deletePlaceCategory';
import {updateSaveLocation} from '../src/api/services/saveLocationService';
jest.mock('../src/api/services/saveLocationService',()=>({updateSaveLocation:jest.fn(async()=>({status:200}))}));
beforeEach(()=>jest.clearAllMocks());
it('moves saved addresses to Other with the same IDs, address and coordinates',async()=>{
  const rows=[{id:42,title:'Parents',location:'Market, Jalgaon',location_coordinates:{lat:21.01,lng:75.57}},{id:43,title:'Shop',location:'Station, Jalgaon',location_coordinates:{lat:21.02,lng:75.58}}];
  expect(await moveAddressesFromCategory('Parents',rows)).toBe(1);
  expect(updateSaveLocation).toHaveBeenCalledWith({locationID:42,data:{title:'Other',type:'other',location:'Market, Jalgaon',location_coordinates:{lat:21.01,lng:75.57}}});
  expect(updateSaveLocation).toHaveBeenCalledTimes(1);
});
it('protects default and retained-address categories',async()=>{
  for(const name of ['Home','SHOP',' godown ','Other'])expect(canDeletePlaceCategory(name)).toBe(false);
  await expect(moveAddressesFromCategory('Home',[])).rejects.toThrow('cannot be deleted');
  expect(updateSaveLocation).not.toHaveBeenCalled();
});
it('validates every address before moving any of them',async()=>{
  const rows=[{id:42,title:'Parents',location:'Market',location_coordinates:{lat:21,lng:75}},{id:43,title:'Parents',location:'Unknown'}];
  await expect(moveAddressesFromCategory('Parents',rows)).rejects.toThrow('verified address');
  expect(updateSaveLocation).not.toHaveBeenCalled();
});
it('does not claim category deletion when an API update fails',async()=>{
  (updateSaveLocation as jest.Mock).mockRejectedValueOnce(new Error('Network unavailable'));
  await expect(moveAddressesFromCategory('Parents',[{id:42,title:'Parents',location:'Market',location_coordinates:{lat:21,lng:75}}])).rejects.toThrow('Network unavailable');
});
