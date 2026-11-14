import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Location(props: any = {}) {
  return <DesignIcon name="map-pin" color={props.colors || props.color || props.iconColor || props.fill || appColors.primary} width={props.width || 18} height={props.height || 18}/>;
}
