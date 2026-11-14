import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function History(props: any = {}) {
  return <DesignIcon name="history" color={props.colors || props.color || props.iconColor || props.fill || appColors.regularText} width={props.width || 22} height={props.height || 22}/>;
}
