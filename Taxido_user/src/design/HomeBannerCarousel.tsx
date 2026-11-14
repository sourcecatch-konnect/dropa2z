import React,{useCallback,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo, AppState, FlatList, Image, TouchableOpacity, View} from 'react-native';
import {Text} from './Typography';

export const BANNER_INTERVAL_MS=6000;
const slides=[
  {id:'local-delivery',title:'Local parcels, delivered simply. Book a trusted delivery partner for quick, hassle-free parcel pickup and drop.',image:require('./assets/banners-20261110/local-delivery.jpeg')},
  {id:'shop-godown',title:'Deliver from your Shop or Godown. Schedule a pickup and move your business parcels with ease.',image:require('./assets/banners-20261110/shop-godown.jpeg')},
];
const pages=[slides[slides.length-1],...slides,slides[0]];

/** The timer belongs to this component, never to the booking form or map. */
export function HomeBannerCarousel({width,height,focused,dark=false}:{width:number;height:number;focused:boolean;dark?:boolean}){
  const list=useRef<FlatList>(null),page=useRef(1);
  const [selected,setSelected]=useState(0),[dragging,setDragging]=useState(false);
  const [active,setActive]=useState(AppState.currentState==='active'),[reduced,setReduced]=useState(true);
  useEffect(()=>{
    let mounted=true;
    AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(mounted)setReduced(value);}).catch(()=>{});
    const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
    const state=AppState.addEventListener('change',value=>setActive(value==='active'));
    return()=>{mounted=false;motion.remove();state.remove();};
  },[]);
  useEffect(()=>{page.current=selected+1;list.current?.scrollToOffset({offset:page.current*width,animated:false});},[width]);
  useEffect(()=>{
    if(!focused||!active||reduced||dragging)return;
    const timer=setInterval(()=>{
      page.current=Math.min(page.current+1,pages.length-1);
      list.current?.scrollToOffset({offset:page.current*width,animated:true});
    },BANNER_INTERVAL_MS);
    return()=>clearInterval(timer);
  },[focused,active,reduced,dragging,width]);
  const settle=useCallback((event:any)=>{
    let position=Math.max(0,Math.min(pages.length-1,Math.round(event.nativeEvent.contentOffset.x/width)));
    if(position===0)position=slides.length;
    else if(position===pages.length-1)position=1;
    page.current=position;setSelected(position-1);setDragging(false);
    if(Math.round(event.nativeEvent.contentOffset.x/width)!==position)
      list.current?.scrollToOffset({offset:position*width,animated:false});
  },[width]);
  return <View testID="home-banner-carousel" style={{width,height,overflow:'hidden',backgroundColor:dark?'#17191C':'#FFFFFF'}}>
    <FlatList ref={list} data={pages} horizontal pagingEnabled initialScrollIndex={1}
      keyExtractor={(item,index)=>`${item.id}-${index}`} showsHorizontalScrollIndicator={false}
      getItemLayout={(_,index)=>({length:width,offset:width*index,index})}
      onScrollBeginDrag={()=>setDragging(true)} onScrollEndDrag={()=>setDragging(false)}
      onMomentumScrollEnd={settle} removeClippedSubviews={false} windowSize={3}
      renderItem={({item})=><View accessible accessibilityLabel={item.title} style={{width,height,overflow:'hidden',backgroundColor:dark?'#17191C':'#FFFFFF'}}>
        <Image source={item.image} resizeMode="contain" style={{width,height:height-28}}/>
      </View>}/>
    <View style={{position:'absolute',bottom:0,alignSelf:'center',flexDirection:'row',gap:5,backgroundColor:dark?'#17191CE8':'#FFFFFFE8',borderRadius:14,paddingHorizontal:7,paddingVertical:2}}>
      {slides.map((item,index)=><TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Show banner ${index+1} of ${slides.length}`} accessibilityState={{selected:index===selected}}
        onPress={()=>{page.current=index+1;setSelected(index);list.current?.scrollToOffset({offset:(index+1)*width,animated:!reduced});}}
        style={{minWidth:24,minHeight:24,alignItems:'center',justifyContent:'center'}}><View style={{width:index===selected?17:6,height:6,borderRadius:4,backgroundColor:index===selected?'#D97706':'#CBD0D3'}}/></TouchableOpacity>)}
    </View>
  </View>;
}
