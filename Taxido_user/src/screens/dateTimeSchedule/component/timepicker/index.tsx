import {View, TouchableOpacity} from 'react-native';
import {Text} from '../../../../design/Typography';
import React from 'react';
import { styles } from './styles';
import { LeftArrow } from '@utils/icons';
import { useValues } from '@src/utils/context/index';


export default function TimePicker({
    value,
    incrementTimeValue,
    decrementTimeValue,
}: {
    value: number;
    incrementTimeValue: () => void;
    decrementTimeValue: () => void;
}) {

    const { viewRTLStyle } = useValues()

    return (
        <View style={[styles.row, { flexDirection: viewRTLStyle }]}>
            <View style={[styles.rowContainer, { flexDirection: viewRTLStyle }]}>
                <Text style={styles.textStyle}>{value}</Text>
                <View>
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={incrementTimeValue}
                        activeOpacity={0.7}
                    >
                        <LeftArrow />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={decrementTimeValue}
                        activeOpacity={0.7}
                        style={styles.dropdown}>
                        <LeftArrow />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
