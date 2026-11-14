import {categoryLocationPayload} from './placeCategories';
import {addSaveLocation} from '../api/services/saveLocationService';
export async function saveCategorizedPlace(place:any,category:string,saved:any[]){
  const payload=categoryLocationPayload({name:category,icon:category==='Home'?'home':category==='Shop'?'shop':category==='Godown'?'warehouse':'place'},place);
  const exists=saved.some(item=>String(item.title||'').trim().toLowerCase()===category.toLowerCase()&&String(item.location||'').trim().toLowerCase()===payload.location.trim().toLowerCase());
  if(!exists)await addSaveLocation(payload);
}
