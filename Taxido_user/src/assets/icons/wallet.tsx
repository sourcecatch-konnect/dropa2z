import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Wallet(props: any = {}) {
  return <DesignIcon name="wallet" color={props.colors || props.color || props.iconColor || props.fill || appColors.whiteColor} width={props.width || 20} height={props.height || 20}/>;
}
