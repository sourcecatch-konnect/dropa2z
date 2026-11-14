import { StyleSheet } from 'react-native'
import { windowHeight, fontSizes, windowWidth } from '../../theme/appConstant'
import appFonts from '../../theme/appFonts'

const styles = StyleSheet.create({
  header: {
    minHeight:104,
    justifyContent:'center',
    paddingVertical:10,
    borderBottomWidth:.5,
    borderBottomColor:'#E5E8EB',
    paddingHorizontal: windowWidth(3),
  },
  activeRide: {
    textAlign: 'left',
    fontSize:24,
    fontWeight:'700',
    fontFamily: appFonts.medium,
  },
  headerTitle: {
    justifyContent: 'center',
    flex:1,
    marginHorizontal:12,
  },
})
export default styles
