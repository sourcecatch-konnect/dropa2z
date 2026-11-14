import {useCallback,useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch,useSelector} from 'react-redux';
import {getValue,setValue} from './localstorage';
import {categoryKey,placeCategories,PlaceCategory} from './placeCategories';
import {userSaveLocation} from '../api/store/actions/saveLocationAction';
import {canDeletePlaceCategory,moveAddressesFromCategory} from './deletePlaceCategory';

/** Empty custom categories are account-scoped locally; populated titles also come from the API. */
export function usePlaceCategories(saved:any[],refresh=true){
  const self=useSelector((state:any)=>state.account?.self),dispatch=useDispatch();
  const scope=self?.id?`placeCategories:${self.id}`:null;
  const [custom,setCustom]=useState<PlaceCategory[]>([]);
  useFocusEffect(useCallback(()=>{
    let mounted=true;setCustom([]);
    if(scope){
      getValue(scope).then(value=>{if(!mounted)return;try{const parsed=JSON.parse(value||'[]');setCustom(Array.isArray(parsed)?parsed:[]);}catch{setCustom([]);}});
      if(refresh)(dispatch as any)(userSaveLocation());
    }
    return()=>{mounted=false;};
  },[scope,dispatch,refresh]));
  const categories=placeCategories(custom,saved);
  const addCategory=async(value:string)=>{
    if(!scope)throw new Error('Sign in to create a saved-place category.');
    const name=value.trim().slice(0,30);
    if(!name)throw new Error('Enter a category name.');
    if(categories.some(category=>categoryKey(category.name)===categoryKey(name)))throw new Error('That category already exists.');
    const next=[...custom,{name,icon:'place' as const}];
    await setValue(scope,JSON.stringify(next));setCustom(next);
    return name;
  };
  const removeCategory=async(value:string)=>{
    if(!scope)throw new Error('Sign in to delete a saved-place category.');
    if(!canDeletePlaceCategory(value))throw new Error('Home, Shop, Godown and Other cannot be deleted.');
    const fresh=await (dispatch as any)(userSaveLocation()).unwrap();
    const rows=Array.isArray(fresh?.data)?fresh.data:Array.isArray(fresh)?fresh:null;
    if(!rows)throw new Error('Could not load saved addresses. Try again.');
    try{
      await moveAddressesFromCategory(value,rows);
      // Require a confirmed refreshed list before removing the category label locally.
      await (dispatch as any)(userSaveLocation()).unwrap();
      const next=custom.filter(item=>categoryKey(item.name)!==categoryKey(value));
      await setValue(scope,JSON.stringify(next));setCustom(next);
    }catch(e:any){
      try{await (dispatch as any)(userSaveLocation()).unwrap();}catch{}
      throw new Error(`${e?.response?.data?.message||e?.message||'Could not remove category.'} Any moved addresses are kept under Other. Try again.`);
    }
  };
  return {categories,addCategory,removeCategory};
}
