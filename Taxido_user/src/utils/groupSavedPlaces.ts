import {PlaceCategory,defaultPlaceCategories,categoryKey} from './placeCategories';
export function groupSavedPlaces(items:any[],categories:PlaceCategory[]=defaultPlaceCategories){
  const groups=categories.map(category=>({name:category.name,items:[] as any[]}));
  for(const item of Array.isArray(items)?items:[]){
    const title=String(item.title||'').trim();
    const known=groups.find(group=>categoryKey(group.name)===categoryKey(title));
    const name=known?.name||(item.type==='home'?'Home':title||(item.type==='work'?'Work':'Other'));
    let group=groups.find(candidate=>categoryKey(candidate.name)===categoryKey(name));
    if(!group){group={name,items:[]};groups.push(group);}
    group.items.push(item);
  }
  return groups;
}
