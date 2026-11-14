import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {Keyboard} from 'react-native';
import {useKeyboardState} from '../src/utils/useKeyboardState';
let state:ReturnType<typeof useKeyboardState>,tree:renderer.ReactTestRenderer,handlers:Record<string,(event?:any)=>void>,visible=false;
function Harness(){state=useKeyboardState();return null;}
beforeEach(()=>{
  jest.useFakeTimers();handlers={};visible=false;
  jest.spyOn(Keyboard,'metrics').mockReturnValue(undefined);
  jest.spyOn(Keyboard,'isVisible').mockImplementation(()=>visible);
  jest.spyOn(Keyboard,'addListener').mockImplementation((event:any,handler:any)=>{handlers[event]=handler;return {remove:jest.fn()} as any;});
  act(()=>{tree=renderer.create(<Harness/>);});
});
afterEach(()=>{act(()=>tree.unmount());jest.restoreAllMocks();jest.useRealTimers();});
it('keeps the layout expanded through a transient keyboard hide/show while switching fields',()=>{
  act(()=>{visible=true;handlers.keyboardDidShow({endCoordinates:{screenY:500}});});
  expect(state.visible).toBe(true);
  act(()=>{visible=false;handlers.keyboardDidHide();jest.advanceTimersByTime(50);visible=true;handlers.keyboardDidShow({endCoordinates:{screenY:500}});jest.advanceTimersByTime(200);});
  expect(state).toEqual({top:500,visible:true});
});
it('restores the layout only after the keyboard has actually closed',()=>{
  act(()=>{visible=true;handlers.keyboardDidShow({endCoordinates:{screenY:450}});visible=false;handlers.keyboardDidHide();});
  expect(state.visible).toBe(true);
  act(()=>jest.advanceTimersByTime(120));
  expect(state).toEqual({top:null,visible:false});
});
it('does not close the layout if Android reports the keyboard is still visible',()=>{
  act(()=>{visible=true;handlers.keyboardDidShow({endCoordinates:{screenY:450}});handlers.keyboardDidHide();jest.advanceTimersByTime(120);});
  expect(state.visible).toBe(true);
});
