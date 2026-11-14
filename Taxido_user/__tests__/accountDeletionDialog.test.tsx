import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {AccountDeletionDialog} from '../src/design/AccountDeletionDialog';
import {deletionPolicy} from '../src/api/services/accountService';
jest.mock('../src/utils/context', () => ({useValues: () => ({isDark: false})}));
jest.mock('../src/design/DesignIcon', () => ({DesignIcon: () => null}));
jest.mock('../src/design/Typography', () => ({Text: (p: any) => require('react').createElement('Text', p, p.children), TextInput: (p: any) => require('react').createElement('TextInput', p)}));
jest.mock('../src/api/services/accountService', () => ({deletionPolicy: jest.fn()}));
let tree: renderer.ReactTestRenderer;
const confirm = jest.fn(), close = jest.fn();
const props = {visible: true, busy: false, error: '', onClose: close, onConfirm: confirm};
const button = (text: string) => tree.root.findAll(n => n.props.accessibilityRole === 'button' && n.findAll(c => c.type === 'Text' && c.props.children === text).length > 0)[0];
beforeEach(() => {jest.clearAllMocks(); (deletionPolicy as jest.Mock).mockResolvedValue({data: {data: {requires_admin_after_deletion: false}}});});
afterEach(() => act(() => tree?.unmount()));
it('requires two screens, exact confirmation and acknowledgement before sending a deletion', async () => {
  await act(async () => {tree = renderer.create(<AccountDeletionDialog {...props}/>);});
  act(() => button('Continue to confirmation').props.onPress());
  expect(confirm).not.toHaveBeenCalled();
  expect(button('Delete my account').props.disabled).toBe(true);
  act(() => tree.root.findAllByProps({testID: 'delete-confirmation'})[0].props.onChangeText('DELETE'));
  expect(button('Delete my account').props.disabled).toBe(true);
  act(() => tree.root.findAllByProps({testID: 'delete-acknowledgement'})[0].props.onPress());
  expect(button('Delete my account').props.disabled).toBe(false);
  act(() => button('Delete my account').props.onPress());
  expect(confirm).toHaveBeenCalledWith({confirmation: 'DELETE', acknowledged: true});
});
it('cancels without deleting and explains Admin approval on the second deletion', async () => {
  (deletionPolicy as jest.Mock).mockResolvedValue({data: {data: {requires_admin_after_deletion: true}}});
  await act(async () => {tree = renderer.create(<AccountDeletionDialog {...props}/>);});
  expect(JSON.stringify(tree.toJSON())).toContain('deleted and registered an account before');
  act(() => button('Keep my account').props.onPress());
  expect(close).toHaveBeenCalledTimes(1); expect(confirm).not.toHaveBeenCalled();
});
it('keeps deletion unavailable when policy loading fails, and supports retry', async () => {
  (deletionPolicy as jest.Mock).mockRejectedValueOnce(Error('Network failed'));
  await act(async () => {tree = renderer.create(<AccountDeletionDialog {...props}/>);});
  expect(button('Continue to confirmation').props.disabled).toBe(true);
  expect(JSON.stringify(tree.toJSON())).toContain('Please retry');
});


it('does not show a repeat-deletion warning on a first deletion',async()=>{
 await act(async()=>{tree=renderer.create(<AccountDeletionDialog {...props}/>);});
 expect(JSON.stringify(tree.toJSON())).not.toContain('Admin approval');
});
