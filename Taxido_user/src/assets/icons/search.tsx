import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Search(props: any = {}) {
  return <DesignIcon name="search" color={props.colors || props.color || props.iconColor || props.fill || appColors.primaryText} width={props.width || 22} height={props.height || 22}/>;
}
