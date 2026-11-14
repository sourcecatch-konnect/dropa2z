import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function HomeLight(props: any = {}) {
  return <DesignIcon name="house" color={props.colors || props.color || props.iconColor || props.fill || appColors.regularText} width={props.width || 24} height={props.height || 24}/>;
}
