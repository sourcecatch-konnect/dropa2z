import {indianCoordinates, normalizeDeliveryPlace} from './deliveryPlaces';

export type PlaceCategory = {name:string;icon:'home'|'work'|'office'|'place'|'shop'|'warehouse'};
export const defaultPlaceCategories:PlaceCategory[] = [
  {name:'Home',icon:'home'}, {name:'Shop',icon:'shop'}, {name:'Godown',icon:'warehouse'},
];
export const categoryKey=(name:string)=>name.trim().toLowerCase();

export function placeCategories(custom:unknown,saved:any[]=[]):PlaceCategory[]{
  const result=[...defaultPlaceCategories];
  const add=(value:any)=>{
    if(typeof value?.name!=='string')return;
    const name=value.name.trim().slice(0,30);
    if(!name||result.some(item=>categoryKey(item.name)===categoryKey(name)))return;
    result.push({name,icon:['home','work','office','place','shop','warehouse'].includes(value.icon)?value.icon:'place'});
  };
  if(Array.isArray(custom))custom.forEach(add);
  // Custom address titles are persisted by the existing authenticated saved-location API.
  saved.forEach(item=>{if(item.type!=='home'&&item.type!=='work'&&item.title)add({name:item.title,icon:'place'});});
  return result;
}

export function placesInCategory(category:PlaceCategory,saved:any[]){
  return saved.filter(item=>{
    if(categoryKey(item.title||'')===categoryKey(category.name))return true;
    return ['home','work'].includes(category.icon)&&categoryKey(category.name)===category.icon&&item.type===category.icon;
  }).flatMap(item=>{
    const place=normalizeDeliveryPlace(item);
    return place?[{...place,id:`saved:${item.id}`}]:[];
  });
}

export function categoryLocationPayload(category:PlaceCategory,place:any){
  const normalized=normalizeDeliveryPlace(place);
  const coords=indianCoordinates(normalized?.lat,normalized?.lng);
  if(!normalized||!coords)throw new Error('Select a verified address from search or the map.');
  return {title:category.name, type:categoryKey(category.name)==='home'?'home':categoryKey(category.name)==='work'?'work':'other',
    location:normalized.fullAddress,location_coordinates:coords};
}
