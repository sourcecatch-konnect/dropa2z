import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Home(props: any = {}) {
  return <DesignIcon name="house" color={props.colors || props.color || props.iconColor || props.fill || appColors.whiteColor} width={props.width || 14} height={props.height || 14}/>;
}
