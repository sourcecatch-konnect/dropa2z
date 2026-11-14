import React from 'react';
import {Keyboard, TouchableOpacity, View} from 'react-native';
import {Text} from '../../design/Typography';

const weights = [1, 2, 5, 10, 15, 20];

export function WeightPresets({value, onChange, dark = false, disabled = false}: {
  value: string;
  onChange: (value: string) => void;
  dark?: boolean;
  disabled?: boolean;
}) {
  return <View accessibilityLabel="Select weight in kilograms" style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:10}}>
    {weights.map(weight => {
      const selected = Number(value) === weight;
      return <TouchableOpacity key={weight} accessibilityRole="radio" accessibilityLabel={`${weight} kg`} accessibilityState={{selected,disabled}} disabled={disabled} onPress={() => {Keyboard.dismiss();onChange(String(weight));}} style={{flexBasis:'30%',flexGrow:1,minHeight:46,alignItems:'center',justifyContent:'center',borderRadius:10,borderWidth:selected?2:1,borderColor:selected?'#E77B00':dark?'#737B86':'#9DA4AE',backgroundColor:selected?(dark?'#443018':'#FFF2DC'):dark?'#25282D':'#FFFFFF',opacity:disabled?0.5:1}}>
        <Text style={{fontSize:14,fontWeight:selected?'700':'500',color:selected?(dark?'#FFC16A':'#945000'):dark?'#FFFFFF':'#202329'}}>{weight} kg</Text>
      </TouchableOpacity>;
    })}
  </View>;
}
