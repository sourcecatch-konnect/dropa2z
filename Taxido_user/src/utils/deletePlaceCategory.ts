import {categoryKey,categoryLocationPayload,defaultPlaceCategories} from './placeCategories';
import {updateSaveLocation} from '../api/services/saveLocationService';
export const canDeletePlaceCategory=(name:string)=>!!name.trim()&&!['other',...defaultPlaceCategories.map(item=>categoryKey(item.name))].includes(categoryKey(name));
/** The existing API stores categories as address titles. Keep addresses when removing a category. */
export async function moveAddressesFromCategory(name:string,saved:any[]){
  if(!canDeletePlaceCategory(name))throw new Error('Home, Shop, Godown and Other cannot be deleted.');
  const items=saved.filter(item=>categoryKey(String(item.title||''))===categoryKey(name));
  // Validate all rows before starting updates, so malformed legacy data cannot cause a partial move.
  const updates=items.map(item=>{
    const locationID=Number(item.id);
    if(!Number.isSafeInteger(locationID)||locationID<=0)throw new Error('This category contains an invalid saved address. Reopen Saved Locations and try again.');
    return {locationID,data:categoryLocationPayload({name:'Other',icon:'place'},item)};
  });
  for(const update of updates)await updateSaveLocation(update);
  return updates.length;
}
