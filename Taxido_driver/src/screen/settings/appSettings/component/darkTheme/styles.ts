import { StyleSheet } from 'react-native'
import { windowHeight, windowWidth } from '../../../../../theme/appConstant'
import appFonts from '../../../../../theme/appFonts'

const styles = StyleSheet.create({
  main: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: windowWidth(3.8),
    paddingVertical: 14,
    minHeight: 76,
  },
  container: {
    alignItems: 'center',
  },
  border: {
    borderBottomWidth: windowHeight(0.15),
    marginHorizontal: windowWidth(3.8),
    borderStyle: 'dashed',
  },
  iconView: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginHorizontal: windowWidth(3),
    fontFamily: appFonts.medium,
    fontSize: 16,
    flexShrink: 1,
  },
})
export default styles
