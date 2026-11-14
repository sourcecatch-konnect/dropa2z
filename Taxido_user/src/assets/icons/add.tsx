import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Add(props: any = {}) {
  return <DesignIcon name="plus" color={props.colors || props.color || props.iconColor || props.fill || appColors.primary} width={props.width || 20} height={props.height || 20}/>;
}
