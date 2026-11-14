import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {AccessibilityInfo,AppState,FlatList,Image} from 'react-native';
import {HomeBannerCarousel,BANNER_INTERVAL_MS} from '../src/design/HomeBannerCarousel';
let tree:renderer.ReactTestRenderer;
beforeEach(()=>{jest.useFakeTimers();jest.spyOn(AccessibilityInfo,'isReduceMotionEnabled').mockResolvedValue(false);jest.spyOn(AccessibilityInfo,'addEventListener').mockReturnValue({remove:jest.fn()});jest.spyOn(AppState,'addEventListener').mockReturnValue({remove:jest.fn()});Object.defineProperty(AppState,'currentState',{value:'active',configurable:true});});
afterEach(()=>{act(()=>tree?.unmount());jest.useRealTimers();jest.restoreAllMocks();});
it('uses the two supplied complete banners and advances every six seconds with seamless wraparound',async()=>{
  await act(async()=>{tree=renderer.create(<HomeBannerCarousel width={400} height={140} focused/>);});
  const list=tree.root.findByType(FlatList),scroll=jest.spyOn(list.instance,'scrollToOffset').mockImplementation(()=>{});
  expect(BANNER_INTERVAL_MS).toBe(6000);
  expect(new Set(list.props.data.map((item:any)=>item.id)).size).toBe(2);
  const cards=list.props.data.map((item:any)=>list.props.renderItem({item}));
  const layouts=cards.map((card:any)=>{let render:renderer.ReactTestRenderer;act(()=>{render=renderer.create(card);});const image=render!.root.findByType(Image);const props={resizeMode:image.props.resizeMode,style:image.props.style};act(()=>render!.unmount());return props;});
  layouts.forEach((layout:any)=>expect(layout).toEqual(layouts[0]));
  act(()=>{jest.advanceTimersByTime(BANNER_INTERVAL_MS-1);});expect(scroll).not.toHaveBeenCalled();
  act(()=>{jest.advanceTimersByTime(1);});expect(scroll).toHaveBeenLastCalledWith({offset:800,animated:true});
  act(()=>{list.props.onMomentumScrollEnd({nativeEvent:{contentOffset:{x:1200}}});});
  expect(scroll).toHaveBeenLastCalledWith({offset:400,animated:false});
  scroll.mockClear();act(()=>{tree.update(<HomeBannerCarousel width={400} height={140} focused={false}/>);});act(()=>{jest.advanceTimersByTime(10000);});expect(scroll).not.toHaveBeenCalled();
});
it('does not autoplay when reduced motion is enabled',async()=>{
  (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);
  await act(async()=>{tree=renderer.create(<HomeBannerCarousel width={400} height={140} focused/>);});
  const list=tree.root.findByType(FlatList),scroll=jest.spyOn(list.instance,'scrollToOffset').mockImplementation(()=>{});
  act(()=>{jest.advanceTimersByTime(10000);});expect(scroll).not.toHaveBeenCalled();
});
