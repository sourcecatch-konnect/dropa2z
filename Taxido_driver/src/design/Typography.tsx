import React,{createContext,forwardRef,useContext} from 'react';
import {Text as NativeText,TextInput as NativeInput,StyleSheet} from 'react-native';
import type {TextProps,TextInputProps,TextStyle} from 'react-native';
import {serviceLabel} from '../utils/serviceLabels';

const regular='GlacialIndifference-Regular',medium='GlacialIndifference-Regular',bold='GlacialIndifference-Bold';
const Family=createContext(regular);
export function uniformFont(style:TextStyle|undefined,inherited=regular){
  const weight=style?.fontWeight;
  if(weight==='bold'||Number(weight)>=600)return bold;
  if(Number(weight)>=500)return medium;
  if(weight==='normal'||(weight&&Number(weight)<500))return regular;
  if(style?.fontFamily)return /bold/i.test(style.fontFamily)?bold:/medium/i.test(style.fontFamily)?medium:regular;
  return inherited;
}
export const Text=forwardRef<React.ComponentRef<typeof NativeText>,TextProps>(({style,...props},ref)=>{
  const inherited=useContext(Family),family=uniformFont(StyleSheet.flatten(style),inherited);
  const wording=(child:React.ReactNode):React.ReactNode=>typeof child==='string'?serviceLabel(child):Array.isArray(child)?child.map(wording):child;
  return <Family.Provider value={family}><NativeText {...props} ref={ref} style={[style,{fontFamily:family,fontWeight:'normal'}]}>{wording(props.children)}</NativeText></Family.Provider>;
});
Text.displayName='Dropa2zText';
export const TextInput=forwardRef<NativeInput,TextInputProps>(({style,...props},ref)=>{
  const family=uniformFont(StyleSheet.flatten(style));
  return <NativeInput {...props} ref={ref} style={[style,{fontFamily:family,fontWeight:'normal'}]}/>;
});
TextInput.displayName='Dropa2zTextInput';
// Keep existing refs and instance type annotations compatible with native TextInput.
export type TextInput=NativeInput;
