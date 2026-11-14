import React,{useMemo,useRef,useState} from 'react';
import {Animated,Keyboard,PanResponder,StyleSheet,TouchableOpacity,View} from 'react-native';
import {Text,TextInput} from '../../design/Typography';
import {Close,Add,Minus,Swap} from '../../utils/icons';
import Svg,{Circle,Path} from 'react-native-svg';

type Field={value:string;placeholder:string;onChangeText:(value:string)=>void;onFocus:()=>void;onBlur:()=>void;onClear:()=>void;onMap?:()=>void;inputRef?:React.Ref<TextInput>};
type Props={pickup:Field;destination:Field;stops:Field[];onAddStop:()=>void;onRemoveStop:(index:number)=>void;onSwap:()=>void;canSwap:boolean;dark:boolean;onReorder?:(from:number,to:number)=>void;onDraggingChange?:(dragging:boolean)=>void};
const green='#15834F',orange='#E77B00';
function LocationIcon({pickup=false,color}:{pickup?:boolean;color:string}){
  return <Svg width={20} height={23} viewBox="0 0 24 26" fill="none">{pickup?<><Circle cx={12} cy={12} r={7} stroke={color} strokeWidth={2}/><Circle cx={12} cy={12} r={2.5} fill={color}/><Path d="M12 1v4m0 14v4M1 12h4m14 0h4" stroke={color} strokeWidth={2}/></>:<Path d="M12 25S2 15 2 10a10 10 0 0120 0c0 5-10 15-10 15zm0-19a4 4 0 100 8 4 4 0 000-8z" fill={color} fillRule="evenodd"/>}</Svg>;
}
function DragRow({index,enabled,onStart,onDrop,onEnd,onLayout,children}:{index:number;enabled:boolean;onStart:()=>void;onDrop:(dy:number)=>void;onEnd:()=>void;onLayout:(layout:any)=>void;children:React.ReactNode}){
  const translateY=useRef(new Animated.Value(0)).current,[dragging,setDragging]=useState(false);
  const latest=useRef({onStart,onDrop,onEnd,enabled});latest.current={onStart,onDrop,onEnd,enabled};
  const pan=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>latest.current.enabled,
    onMoveShouldSetPanResponder:()=>latest.current.enabled,
    onPanResponderGrant:()=>{setDragging(true);latest.current.onStart();},
    onPanResponderMove:(_event,gesture)=>translateY.setValue(gesture.dy),
    onPanResponderRelease:(_event,gesture)=>{latest.current.onDrop(gesture.dy);translateY.setValue(0);setDragging(false);latest.current.onEnd();},
    onPanResponderTerminate:()=>{translateY.setValue(0);setDragging(false);latest.current.onEnd();},
    onPanResponderTerminationRequest:()=>false,
  }),[translateY]);
  return <Animated.View onLayout={event=>onLayout(event.nativeEvent.layout)} style={{flexDirection:'row',alignItems:'center',zIndex:dragging?10:0,elevation:dragging?8:0,transform:[{translateY}],opacity:dragging?.9:1}}>
    {enabled&&<View {...pan.panHandlers} accessibilityLabel={`Drag delivery stop ${index+1}`} accessibilityHint="Hold and drag to reorder delivery stops" style={styles.drag}><Text style={{color:'#A65B00',fontSize:22}}>⠿</Text></View>}
    <View style={{flex:1,minWidth:0}}>{children}</View>
  </Animated.View>;
}
export function HomeAddressCard({pickup,destination,stops,onAddStop,onRemoveStop,onSwap,canSwap,dark,onReorder,onDraggingChange}:Props){
  const ink=dark?'#FFFFFF':'#17191C',surface=dark?'#25282D':'#FFFFFF';
  const layouts=useRef<Record<number,{y:number;height:number}>>({});
  const drops=[...stops,destination];
  const row=(field:Field,kind:'pickup'|'destination'|'stop',index=0)=>{
    const color=kind==='pickup'?green:orange;
    const mapColor=dark?(kind==='pickup'?'#71D8A5':'#FFC16A'):color;
    return <View style={[styles.row,{backgroundColor:surface,borderColor:color}]}>
      <View style={styles.marker}><LocationIcon pickup={kind==='pickup'} color={color}/></View>
      <TextInput ref={field.inputRef} accessibilityLabel={kind==='pickup'?'Pickup address':kind==='destination'?'Destination address':`Stop ${index+1} address`} value={field.value} placeholder={field.placeholder} onChangeText={field.onChangeText} onFocus={field.onFocus} onBlur={field.onBlur} style={[styles.input,{color:ink}]} placeholderTextColor={dark?'#B4BAC3':'#777D86'} multiline={false} numberOfLines={1} textAlignVertical="center"/>
      {!!field.value&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={kind==='pickup'?'Clear pickup location':kind==='destination'?'Clear destination':`Clear stop ${index+1}`} onPress={field.onClear} style={styles.action}><Close/></TouchableOpacity>}
      {kind==='stop'&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove stop ${index+1}`} onPress={()=>onRemoveStop(index)} style={styles.action}><Minus colors={ink} width={18} height={18}/></TouchableOpacity>}
      {field.onMap&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={`Choose ${kind==='pickup'?'pickup':kind==='destination'?'destination':`stop ${index+1}`} on map`} onPress={field.onMap} style={[styles.map,{backgroundColor:'transparent',width:88,flexDirection:'row',gap:4,borderWidth:0}]}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none"><Path d="M9 20l-6 2V6l6-2 6 2 6-2v16l-6 2-6-2zm0 0V4m6 18V6" stroke={mapColor} strokeWidth={1.7}/></Svg>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{color:mapColor,fontSize:9,lineHeight:13,fontWeight:'700',flexShrink:1}}>Choose on map</Text>
      </TouchableOpacity>}
    </View>;
  };
  return <View testID="home-address-card" style={[styles.card,{backgroundColor:surface,borderWidth:0}]}>
    <View style={styles.fields}>
      {row(pickup,'pickup')}
      {drops.map((field,index)=><DragRow key={`drop-${index}`} index={index} enabled={stops.length>0&&!!onReorder} onLayout={layout=>{layouts.current[index]=layout;}} onStart={()=>onDraggingChange?.(true)} onEnd={()=>onDraggingChange?.(false)} onDrop={dy=>{
        const origin=layouts.current[index];if(!origin)return;
        const center=origin.y+origin.height/2+dy;
        let target=index,best=Infinity;
        drops.forEach((_drop,i)=>{const layout=layouts.current[i];if(layout){const distance=Math.abs(center-layout.y-layout.height/2);if(distance<best){best=distance;target=i;}}});
        if(target!==index)onReorder?.(index,target);
      }}>{row(field,index===stops.length?'destination':'stop',index)}</DragRow>)}
      {!!stops.length&&<Text style={{color:dark?'#C5CAD0':'#656C76',fontSize:10,paddingTop:4}}>Drag ⠿ to change the delivery order</Text>}
    </View>
    <View style={styles.rail}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Swap pickup and destination" accessibilityState={{disabled:!canSwap}} disabled={!canSwap} onPress={onSwap} style={[styles.swap,{backgroundColor:dark?'#3B2B19':'#EAF5ED',opacity:canSwap?1:.45}]}><View style={{transform:[{scale:.8}]}}><Swap color={ink}/></View><Text style={{color:dark?'#FFBE60':green,fontWeight:'700',fontSize:9,marginTop:2}}>Swap</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Select multistop" disabled={stops.length>=3} onPress={onAddStop} style={[styles.multi,{backgroundColor:dark?'#3B2B19':'#FFF3E3',opacity:stops.length>=3?.45:1}]}><Add colors={orange} width={18} height={18}/><Text style={{color:dark?'#FFBE60':'#A65B00',fontWeight:'700',fontSize:9,lineHeight:11,textAlign:'center'}}>Select multistop</Text></TouchableOpacity>
    </View>
  </View>;
}
const styles=StyleSheet.create({card:{flexDirection:'row',alignItems:'center',gap:6,borderWidth:2,borderRadius:16,padding:8},fields:{flex:1,minWidth:0},row:{flexDirection:'row',alignItems:'center',minHeight:68,borderRadius:12,borderWidth:2,marginVertical:4,paddingHorizontal:4},marker:{width:23,alignItems:'center',justifyContent:'center'},input:{flex:1,minWidth:0,height:54,paddingVertical:0,paddingHorizontal:5,fontSize:13,includeFontPadding:false},action:{width:24,minHeight:44,alignItems:'center',justifyContent:'center'},map:{width:58,minHeight:56,alignItems:'center',justifyContent:'center',paddingHorizontal:2,borderRadius:9},rail:{width:40,gap:5,alignItems:'center'},swap:{width:40,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:12},multi:{width:40,minHeight:48,alignItems:'center',justifyContent:'center',gap:3,borderRadius:12},drag:{width:20,minHeight:68,alignItems:'center',justifyContent:'center'}});
