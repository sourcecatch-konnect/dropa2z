import { StyleSheet } from 'react-native'
import { fontSizes, windowHeight, windowWidth } from '../../../../theme/appConstant'
import appFonts from '../../../../theme/appFonts'

const styles = StyleSheet.create({
  main: {
    minHeight: 76,
    paddingHorizontal: windowWidth(4),
  },
  title: {
    fontSize: 28,
    fontFamily: appFonts.bold,
    flex:1,
    marginEnd:12,
  },
  callIcon: {
    height: windowHeight(5),
    width: windowWidth(10),
    borderWidth: windowHeight(0.1),
    borderRadius: windowHeight(0.7),
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default styles
