import React,{useCallback,useLayoutEffect,useRef,useState} from 'react';
import {KeyboardAvoidingView,Platform,StatusBar,View,useWindowDimensions} from 'react-native';
import type {StyleProp,ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useKeyboardState} from '../utils/useKeyboardState';
/** Bound the viewport by the actual IME position, even when edge-to-edge prevents adjustResize. */
export function KeyboardViewport({children,style,iosOffset=0}:{children:React.ReactNode;style?:StyleProp<ViewStyle>;iosOffset?:number}){
 const root=useRef<View>(null),[origin,setOrigin]=useState(0);
 const {top}=useKeyboardState(),insets=useSafeAreaInsets(),window=useWindowDimensions();
 const measure=useCallback(()=>{root.current?.measureInWindow((_x,y)=>{if(Number.isFinite(y))setOrigin(previous=>Math.abs(previous-y)>.5?y:previous);});},[]);
 useLayoutEffect(()=>{measure();},[measure,top,window.height,window.width]);
 if(Platform.OS==='ios')return <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={iosOffset} style={[{flex:1},style]}>{children}</KeyboardAvoidingView>;
 // Android measureInWindow can exclude the status-bar area. Reserve its reported inset rather than guessing a fixed offset.
 const inset=Math.max(insets.top,StatusBar.currentHeight??0);
 return <View ref={root} collapsable={false} onLayout={measure} style={[{flex:1},style,top!==null&&{maxHeight:Math.max(0,top-origin-inset)}]}>{children}</View>;
}
