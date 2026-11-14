import React from 'react';
import {SvgXml} from 'react-native-svg';
import icons from './assets/lucide-icons.json';
export function DesignIcon({name, color = '#656C76', width = 24, height = 24}: {name: keyof typeof icons; color?: string; width?: number | string; height?: number | string}) {
  return <SvgXml xml={icons[name]} color={color} width={width} height={height}/>;
}
