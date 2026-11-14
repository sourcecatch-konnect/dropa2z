import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Image} from 'react-native';
import {Onboarding} from '../src/screens/intro/onBoarding';
const mockNavigate=jest.fn(),mockScroll=jest.fn(),mockDispatch=jest.fn(()=>({unwrap:async()=>({})}));
const mockState:any={setting:{settingData:{},languageData:{data:[]},translateData:{},taxidoSettingData:{}}};
jest.mock('react-redux',()=>({useSelector:(fn:any)=>fn(mockState),useDispatch:()=>mockDispatch}));
jest.mock('@react-navigation/native',()=>({useTheme:()=>({colors:{}})}));
jest.mock('../src/utils/context',()=>({useValues:()=>({isDark:false,viewRTLStyle:'row',bgFullStyle:'#FFF',textColorStyle:'#17191C',setIsRTL:jest.fn()})}));
jest.mock('../src/utils/navigation',()=>({useAppNavigation:()=>({navigate:mockNavigate})}));
jest.mock('../src/utils/localstorage',()=>({getValue:jest.fn(async()=>null),setValue:jest.fn(async()=>{})}));
jest.mock('@react-native-async-storage/async-storage',()=>({setItem:jest.fn(async()=>{})}));
jest.mock('react-native-safe-area-context',()=>({useSafeAreaInsets:()=>({top:24,bottom:24})}));
jest.mock('../src/api/store/actions',()=>({languageDataGet:jest.fn(),settingDataGet:jest.fn(),taxidosettingDataGet:jest.fn(),translateDataGet:jest.fn()}));
jest.mock('react-native-dropdown-picker',()=>()=>null);
jest.mock('react-native-swiper',()=>require('react').forwardRef((props:any,ref:any)=>{
  require('react').useImperativeHandle(ref,()=>({scrollBy:mockScroll}));
  return require('react').createElement(require('react-native').View,{...props,testID:'intro-swiper'},props.children);
}));
let tree:renderer.ReactTestRenderer;
const press=(label:string)=>act(()=>tree.root.findAll(n=>n.props.accessibilityLabel===label&&n.props.onPress)[0].props.onPress());
beforeEach(()=>{jest.clearAllMocks();mockState.setting.taxidoSettingData={};});
afterEach(()=>act(()=>tree?.unmount()));
it('keeps all three fallback slides available and only enters sign-in after explicit Skip or Get Started',async()=>{
  await act(async()=>{tree=renderer.create(<Onboarding/>);});
  expect(JSON.stringify(tree.toJSON())).toContain('Send with Dropa2z');
  press('Next introduction');expect(mockScroll).toHaveBeenCalledWith(1);expect(mockNavigate).not.toHaveBeenCalled();
  act(()=>tree.root.findByProps({testID:'intro-swiper'}).props.onIndexChanged(2));
  expect(mockNavigate).not.toHaveBeenCalled();press('Get started');expect(mockNavigate).toHaveBeenCalledWith('SignIn');
});
it('preserves Admin slide text and normalizes a configured image URL for native rendering',async()=>{
  mockState.setting.taxidoSettingData={cabbooking_values:{onboarding:[{title:'Business deliveries',description:'Approved custom copy',image:'https://dropa2z.com/intro.png'}]}};
  await act(async()=>{tree=renderer.create(<Onboarding/>);});
  expect(JSON.stringify(tree.toJSON())).toContain('Approved custom copy');
  expect(tree.root.findAllByType(Image).some(n=>n.props.source?.uri==='https://dropa2z.com/intro.png')).toBe(true);
  press('Skip introduction');expect(mockNavigate).toHaveBeenCalledWith('SignIn');
});
