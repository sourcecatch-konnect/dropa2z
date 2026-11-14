import { StyleSheet } from 'react-native'
import { windowHeight, windowWidth } from '../../theme/appConstant'
import appFonts from '../../theme/appFonts'

const styles = StyleSheet.create({
  profile: {
    minHeight: 112,
    width: '100%',
    padding: 12,
    gap: 12,
    borderRadius: windowHeight(1.5),
  },
  profileCompact: {
    minHeight: 0,
    padding: 8,
    gap: 6,
  },
  subProfile: {
    alignItems: 'center',
    marginHorizontal: windowWidth(2.5),
    marginVertical: windowHeight(1.2),
  },
  userImage: {
    height: windowHeight(6.5),
    width: windowHeight(6.5),
    resizeMode: 'cover',
  },
  userName: {
    marginTop: windowWidth(1),
    fontFamily: appFonts.medium,
  },
  starContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: windowWidth(3.3),
  },
})
export default styles
