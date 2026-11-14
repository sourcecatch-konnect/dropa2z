import {referenceSurfaces} from '../../../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native'
import { windowHeight, windowWidth } from '../../../../../theme/appConstant'
import appFonts from '../../../../../theme/appFonts'

const styles = StyleSheet.create({
  main: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: windowWidth(3.5),
    paddingVertical: 10,
    minHeight: 64,
    gap: 10,
  },
  alignment: {
    alignItems: 'center',
  },
  iconContain: {
    height: 42,
    width: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  
    ...referenceSurfaces.icon,
  },
  title: {
    marginHorizontal: windowWidth(3),
    fontFamily: appFonts.medium,
    fontSize: 16,
    flexShrink: 1,
    lineHeight: 22,
  },
})
export default styles
