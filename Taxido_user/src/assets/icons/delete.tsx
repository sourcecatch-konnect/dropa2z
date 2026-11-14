import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Delete(props: any = {}) {
  return <DesignIcon name="trash-2" color={props.colors || props.color || props.iconColor || props.fill || appColors.regularText} width={props.width || 20} height={props.height || 20}/>;
}
