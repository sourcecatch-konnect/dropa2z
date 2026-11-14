import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {Text as NativeText,TextInput as NativeInput,StyleSheet} from 'react-native';
import {Text,TextInput,uniformFont} from '../src/design/Typography';
it('uses the same family for default, medium and bold text',()=>{
 expect(uniformFont(undefined)).toBe('GlacialIndifference-Regular');
 expect(uniformFont({fontWeight:'500'})).toBe('GlacialIndifference-Regular');
 expect(uniformFont({fontWeight:'800',fontFamily:'GlacialIndifference-Bold'})).toBe('GlacialIndifference-Bold');
});
it('preserves nested bold text and native input handlers, value and style',()=>{
 const change=jest.fn();let tree:renderer.ReactTestRenderer;
 act(()=>{tree=renderer.create(<><Text style={{fontWeight:'700',fontSize:20}}>Heading<Text> nested</Text></Text><TextInput value="Jalgaon" onChangeText={change} style={{fontSize:14,color:'#17191C'}}/></>);});
 tree!.root.findAllByType(NativeText).forEach(node=>expect(StyleSheet.flatten(node.props.style).fontFamily).toBe('GlacialIndifference-Bold'));
 const input=tree!.root.findByType(NativeInput);
 expect(input.props.value).toBe('Jalgaon');expect(StyleSheet.flatten(input.props.style)).toEqual(expect.objectContaining({fontSize:14,color:'#17191C',fontFamily:'GlacialIndifference-Regular'}));
 input.props.onChangeText('Market');expect(change).toHaveBeenCalledWith('Market');
 act(()=>tree!.unmount());
});
