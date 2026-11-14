import React, {createContext, useContext} from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from './Typography';
import {SvgXml} from 'react-native-svg';
import {useValues} from '../utils/context';
import artwork from './assets/revamped-icons.json';

import {BrandLogo} from './BrandLogo';
import {brand} from './tokens';

const ReferenceTheme = createContext({active:true, accent:brand.orange});
export const useReferenceTheme = () => useContext(ReferenceTheme);

export const referencePalette = {orange:brand.orange,orangeDark:brand.orangeDeep,orangeSoft:brand.orangeSoft,ink:brand.ink,canvas:brand.canvas,line:brand.border,blue:'#0867D7',green:brand.success} as const;

export function ReferenceLogo({driver=false,width=144}:{driver?:boolean;width?:number}){const {isDark}=useValues();return <BrandLogo width={width} driver={driver} light={isDark}/>;}
export function ReferenceIcon({name, size = 24, color}: {name: keyof typeof artwork; size?: number; color?:string}) {
  const xml=color?artwork[name].replace(/#AB4B13|#D97706|#157A52|#333\b/gi,color):artwork[name];
  return <SvgXml xml={xml} width={size} height={size}/>;
}
export function ReferenceScreen({children}: {children: React.ReactNode}) {
  const {isDark} = useValues();
  const accent = brand.orange;
  return <ReferenceTheme.Provider value={{active:true,accent}}><View style={{flex:1,backgroundColor:isDark?'#17191C':brand.canvas}}>{children}</View></ReferenceTheme.Provider>;
}
export const referenceSurfaces = StyleSheet.create({
 card:{borderRadius:18,borderWidth:.5,borderColor:'#E5E8EB',shadowColor:'#14202B',shadowOffset:{width:0,height:4},shadowOpacity:.08,shadowRadius:10,elevation:3},
 control:{borderRadius:10,minHeight:46},
 icon:{borderRadius:12},
 title:{fontSize:24,fontWeight:'700',letterSpacing:-.4},
 section:{fontSize:19,fontWeight:'700',letterSpacing:-.2},
});

