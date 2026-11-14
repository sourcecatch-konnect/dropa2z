import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {AvailabilityConfirmation} from '../src/screen/home/component/AvailabilityConfirmation';
jest.mock('react-native-safe-area-context',()=>({useSafeAreaInsets:()=>({top:24,bottom:32,left:0,right:0})}));
it('opens above the tab navigator and exposes Cancel and Confirm actions',()=>{
 const cancel=jest.fn(),confirm=jest.fn();let tree:any;
 act(()=>{tree=renderer.create(<AvailabilityConfirmation visible title="Go offline?" cancelLabel="Cancel" confirmLabel="Confirm" onCancel={cancel} onConfirm={confirm}/>);});
 const buttons=tree.root.findAll((node:any)=>node.props.accessibilityRole==='button'&&node.props.onPress);
 act(()=>buttons.find((node:any)=>node.props.accessibilityLabel==='Cancel').props.onPress());
 expect(cancel).toHaveBeenCalledTimes(1);expect(confirm).not.toHaveBeenCalled();
 act(()=>buttons.find((node:any)=>node.props.accessibilityLabel==='Confirm').props.onPress());
 expect(confirm).toHaveBeenCalledTimes(1);
 act(()=>tree.unmount());
});
it('disables both actions while the server updates availability',()=>{
 let tree:any;act(()=>{tree=renderer.create(<AvailabilityConfirmation visible busy title="Go offline?" cancelLabel="Cancel" confirmLabel="Confirm" onCancel={jest.fn()} onConfirm={jest.fn()}/>);});
 const buttons=tree.root.findAll((node:any)=>node.props.accessibilityRole==='button'&&node.props.onPress);
 expect(buttons.every((node:any)=>node.props.disabled)).toBe(true);
 act(()=>tree.unmount());
});
