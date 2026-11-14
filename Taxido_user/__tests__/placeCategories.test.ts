import {categoryLocationPayload,placeCategories,placesInCategory} from '../src/utils/placeCategories';

const address={shortAddress:'Station',fullAddress:'Jalgaon Junction, Jalgaon, India',lat:21.018,lng:75.567};
it('keeps default shortcuts, merges persisted titles and deduplicates custom names',()=>{
  expect(placeCategories([{name:' home ',icon:'place'},{name:'Parents',icon:'home'}],[{type:'other',title:'Shop'},{type:'other',title:'parents'}])).toEqual([
    {name:'Home',icon:'home'},{name:'Shop',icon:'shop'},{name:'Godown',icon:'warehouse'},{name:'Parents',icon:'home'},
  ]);
});
it('does not guess categories for unassigned searches and keeps Office separate from Work',()=>{
  const saved=[{id:1,title:'Warehouse',type:'work',location:'Warehouse, Jalgaon',location_coordinates:{lat:21,lng:75}},
    {id:2,title:'Office',type:'other',location:'Office, Jalgaon',location_coordinates:{lat:21.1,lng:75.1}}];
  expect(placesInCategory({name:'Home',icon:'home'},saved)).toEqual([]);
  expect(placesInCategory({name:'Work',icon:'work'},saved).map(p=>p.id)).toEqual(['saved:1']);
  expect(placesInCategory({name:'Office',icon:'office'},saved).map(p=>p.id)).toEqual(['saved:2']);
});
it('saves category title and exact coordinates through existing supported API types',()=>{
  expect(categoryLocationPayload({name:'Office',icon:'office'},address)).toEqual({title:'Office',type:'other',location:address.fullAddress,location_coordinates:{lat:21.018,lng:75.567}});
  expect(categoryLocationPayload({name:'Home',icon:'home'},address).type).toBe('home');
  expect(()=>categoryLocationPayload({name:'Home',icon:'home'},{fullAddress:'Address not found'})).toThrow();
  expect(()=>categoryLocationPayload({name:'Home',icon:'home'},{...address,lat:0,lng:0})).toThrow();
});
