import {useEffect,useState} from 'react';
import {Keyboard} from 'react-native';

/** Coalesce transient IME hide/show events while switching input fields. */
export function useKeyboardState(){
  const [top,setTop]=useState<number|null>(()=>Keyboard.metrics?.()?.screenY??null);
  useEffect(()=>{
    let hideTimer:ReturnType<typeof setTimeout>|undefined;
    const show=Keyboard.addListener('keyboardDidShow',event=>{
      if(hideTimer)clearTimeout(hideTimer);
      const next=event.endCoordinates?.screenY;
      if(Number.isFinite(next))setTop(next);
    });
    const hide=Keyboard.addListener('keyboardDidHide',()=>{
      if(hideTimer)clearTimeout(hideTimer);
      hideTimer=setTimeout(()=>{if(!Keyboard.isVisible?.())setTop(null);},120);
    });
    return()=>{if(hideTimer)clearTimeout(hideTimer);show.remove();hide.remove();};
  },[]);
  return {top,visible:top!==null};
}
