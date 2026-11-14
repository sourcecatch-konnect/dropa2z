import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {Notifier} from 'react-native-notifier';
import {notificationContent,notificationText} from '../src/utils/notificationPresentation';
import {DeliveryNotification} from '../src/design/DeliveryNotification';
jest.mock('react-native-notifier',()=>({Notifier:{hideNotification:jest.fn(),showNotification:jest.fn()}}));
it('uses delivery copy and keeps real push content rather than template text',()=>{
 expect(notificationContent({notification:{title:'Ride accepted',body:'Driver is arriving'}})).toEqual({title:'Delivery accepted',body:'Driver is arriving'});
 expect(notificationContent({data:{title:'Payment received',message:'₹100 collected'}}).body).toBe('₹100 collected');
 expect(notificationText({message:'Try again'})).toBe('Try again');expect(notificationText({token:'private'})).toBe('');
});
it('renders title/body and dismisses a banner without any booking action',()=>{
 let tree:renderer.ReactTestRenderer;
 act(()=>{tree=renderer.create(<DeliveryNotification banner title="Delivery accepted" description="Your driver is arriving"/>);});
 expect(JSON.stringify(tree!.toJSON())).toContain('Your driver is arriving');
 act(()=>tree!.root.findAll(n=>n.props.accessibilityLabel==='Dismiss notification')[0].props.onPress());
 expect(Notifier.hideNotification).toHaveBeenCalled();act(()=>tree!.unmount());
});
