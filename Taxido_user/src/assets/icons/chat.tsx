import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import {appColors} from '../../themes/appColors';
export function Chat(props: any = {}) {
  return <DesignIcon name="message-circle" color={props.colors || props.color || props.iconColor || props.fill || appColors.primary} width={props.width || 24} height={props.height || 24}/>;
}
