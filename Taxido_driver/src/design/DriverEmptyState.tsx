import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from './Typography';
import {DesignIcon} from './DesignIcon';
import {useValues} from '../utils/context';

export function DriverEmptyState({icon, title, description}: {
  icon: React.ComponentProps<typeof DesignIcon>['name'];
  title: string;
  description?: string;
}) {
  const {isDark} = useValues();
  return <View style={styles.container}>
    <View style={[styles.badge, {backgroundColor: isDark ? '#3B2B19' : '#FFF2DF'}]}>
      <DesignIcon name={icon} width={38} height={38} color={isDark ? '#FFBE60' : '#A64B00'}/>
    </View>
    <Text accessibilityRole="header" style={[styles.title, {color: isDark ? '#FFFFFF' : '#17191C'}]}>{title}</Text>
    {!!description && <Text style={[styles.description, {color: isDark ? '#BBC1CA' : '#656C76'}]}>{description}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  container: {flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48},
  badge: {width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20},
  title: {fontSize: 22, lineHeight: 28, fontWeight: '700', textAlign: 'center'},
  description: {fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10, maxWidth: 340},
});
