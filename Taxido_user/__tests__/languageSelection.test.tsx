import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Alert, Modal} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LanguageBottomSheet} from '../src/screens/bottomTab/profileTab/appPageScreen/component/languageBottomSheet';

const mockDispatch = jest.fn(), mockRtl = jest.fn();
const mockState = {setting: {languageData: {data: [{locale:'en',name:'English'}, {locale:'mr',name:'Marathi'}]},translateData: {changeLanguage:'Change Language',update:'Update'}}};
jest.mock('react-redux', () => ({useSelector:(fn:any)=>fn(mockState),useDispatch:()=>mockDispatch}));
jest.mock('@react-native-async-storage/async-storage', () => ({getItem:jest.fn(),setItem:jest.fn(async()=>{})}));
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets:()=>({bottom:24})}));
jest.mock('../src/utils/context', () => ({useValues:()=>({isDark:false,viewRTLStyle:'row',bgFullStyle:'#FFF',textColorStyle:'#17191C',setIsRTL:mockRtl})}));
jest.mock('../src/api/store/actions', () => ({translateDataGet:()=>({type:'translate'}),serviceDataGet:()=>({type:'services'})}));
jest.mock('../src/commonComponent', () => ({Button:(p:any)=>require('react').createElement(require('react-native').TouchableOpacity,{...p,accessibilityLabel:'Update language'}),SolidLine:()=>null}));
jest.mock('../src/commonComponent/radioButton/customRadioButton', () => ({CustomRadioButton:()=>null}));
const close=jest.fn(),selected=jest.fn(),selectedLabel=jest.fn();
let tree:renderer.ReactTestRenderer;
async function press(label:string) {await act(async()=>{await tree.root.findAll(n=>n.props.accessibilityLabel===label && n.props.onPress)[0].props.onPress();});}
beforeEach(()=>{jest.clearAllMocks();mockDispatch.mockImplementation(()=>{const result:any=Promise.resolve({});result.unwrap=async()=>({});return result;});});
afterEach(()=>act(()=>tree?.unmount()));
async function render() {await act(async()=>{tree=renderer.create(<LanguageBottomSheet isVisible onClose={close} selectedLanguage="en" setSelectedLanguage={selected} setSelectedLang={selectedLabel}/>);});}
it('opens a visible native dialog and dismisses without changing the current language', async()=>{
  await render();expect(tree.root.findByType(Modal).props.visible).toBe(true);
  await press('Marathi');await press('Close language selector');
  expect(close).toHaveBeenCalled();expect(AsyncStorage.setItem).not.toHaveBeenCalled();expect(selected).not.toHaveBeenCalled();
});
it('loads translated content and services before committing the selected language', async()=>{
  await render();await press('Marathi');await press('Update language');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('selectedLanguage','mr');
  expect(mockDispatch.mock.calls.map(([action])=>action.type)).toEqual(['translate','services']);
  expect(selected).toHaveBeenCalledWith('mr');expect(selectedLabel).toHaveBeenCalledWith('mr');expect(mockRtl).toHaveBeenCalledWith(false);expect(close).toHaveBeenCalled();
});
it('rolls back the language if content cannot be loaded and leaves the dialog available for retry', async()=>{
  const alert=jest.spyOn(Alert,'alert').mockImplementation(()=>{});
  try {
    mockDispatch.mockImplementationOnce(()=>({unwrap:async()=>{throw Error('Network failed');}}));
    await render();await press('Marathi');await press('Update language');
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('selectedLanguage','en');
    expect(selected).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();expect(alert).toHaveBeenCalledWith('Language not changed','Network failed');
  } finally {alert.mockRestore();}
});
