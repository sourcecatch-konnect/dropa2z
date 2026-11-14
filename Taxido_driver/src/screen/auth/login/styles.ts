import { StyleSheet } from 'react-native'
import appColors from '../../../theme/appColors'
import { windowHeight } from '../../../theme/appConstant'

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  loginView: {
    position: 'absolute',
    top: windowHeight(30),
    bottom: 0,
    borderTopRightRadius: windowHeight(12),
    borderTopLeftRadius: windowHeight(12),
    width: '100%',
    paddingBottom: windowHeight(2),
    backgroundColor: appColors.white,
  },
  loginViewKeyboard: {
    top: windowHeight(7),
    paddingBottom: windowHeight(1),
  },
  loginScrollView: {
    flex: 1,
  },
  loginScrollContent: {
    flexGrow: 1,
  },
})

export default styles
