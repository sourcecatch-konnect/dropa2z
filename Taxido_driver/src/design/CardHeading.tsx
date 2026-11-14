import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from './Typography';
import {DesignIcon} from './DesignIcon';
import {useValues} from '../utils/context';

/** Shared card hierarchy; decoration never replaces a card's existing action. */
export function CardHeading({icon, title, subtitle, trailing}: {
  icon: React.ComponentProps<typeof DesignIcon>['name'];
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  const {isDark, viewRtlStyle} = useValues();
  return <View style={[styles.row, {flexDirection: viewRtlStyle}]}>
    <View style={[styles.icon, {backgroundColor: isDark ? '#3B2B19' : '#FFF2DF'}]}>
      <DesignIcon name={icon} color={isDark ? '#FFBE60' : '#A64B00'} width={22} height={22}/>
    </View>
    <View style={styles.copy}>
      <Text accessibilityRole="header" style={[styles.title, {color: isDark ? '#FFFFFF' : '#17191C'}]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, {color: isDark ? '#BDC5C0' : '#656C76'}]}>{subtitle}</Text>}
    </View>
    {trailing}
  </View>;
}
const styles = StyleSheet.create({
  row: {alignItems: 'center', gap: 12, marginBottom: 14},
  icon: {width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1, minWidth: 0},
  title: {fontSize: 18, lineHeight: 23, fontWeight: '700'},
  subtitle: {fontSize: 13, lineHeight: 18, marginTop: 3},
});
