import React from 'react';
import {DesignIcon} from '../../design/DesignIcon';
import appColors from '../../theme/appColors';
export default function Icon(props: any = {}) {
  return <DesignIcon name="pencil" color={props.color || props.colors || props.iconColor || appColors.secondaryFont} width={props.width || 24} height={props.height || 24}/>;
}
