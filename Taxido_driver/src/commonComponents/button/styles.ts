import { StyleSheet } from 'react-native'
import { windowHeight } from '../../theme/appConstant'
import appFonts from '../../theme/appFonts'

const styles = StyleSheet.create({
  button: {
    height: windowHeight(6),
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: appFonts.medium,
    fontSize: 16,
    letterSpacing: 0.2,
  },
})

export default styles
