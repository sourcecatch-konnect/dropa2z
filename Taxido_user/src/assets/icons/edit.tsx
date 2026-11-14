import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Edit(props: any = {}) {
  return <DesignIcon name="pencil" color={props.colors || props.color || props.iconColor || props.fill || appColors.primary} width={props.width || 20} height={props.height || 20}/>;
}
