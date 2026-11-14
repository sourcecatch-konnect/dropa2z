import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Category(props: any = {}) {
  return <DesignIcon name="layout-grid" color={props.colors || props.color || props.iconColor || props.fill || appColors.regularText} width={props.width || 24} height={props.height || 24}/>;
}
