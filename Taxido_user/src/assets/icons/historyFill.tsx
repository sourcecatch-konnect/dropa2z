import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function HistoryFill(props: any = {}) {
  return <DesignIcon name="package" color={props.colors || props.color || props.iconColor || props.fill || appColors.primary} width={props.width || 24} height={props.height || 24}/>;
}
