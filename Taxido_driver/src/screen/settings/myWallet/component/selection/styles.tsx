import {referenceSurfaces} from '../../../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native'
import appFonts from '../../../../../theme/appFonts'
import { windowHeight, windowWidth } from '../../../../../theme/appConstant'
import appColors from '../../../../../theme/appColors';


const styles = StyleSheet.create({
  selection: {
    marginHorizontal: windowWidth(4),
    marginTop: windowHeight(1.5),
  },
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
  
    borderWidth:1,borderColor:'#E5E7EB',borderRadius:16,overflow:'hidden',
  },
  tab: {
   minHeight:48,
    paddingHorizontal:8,
    paddingVertical:12,
    alignItems: 'center',
    justifyContent: 'center',
    width:'50%',
  },
  leftTab: {
    borderTopLeftRadius: windowHeight(1),
    borderBottomLeftRadius: windowHeight(1),
    borderTopRightRadius: windowHeight(1),
    borderBottomRightRadius: windowHeight(1),
  },
  rightTab: {
    borderTopRightRadius: windowHeight(1),
    borderBottomRightRadius: windowHeight(1),
    borderTopLeftRadius: windowHeight(1),
    borderBottomLeftRadius: windowHeight(1),
  },
  activeTab: {
    backgroundColor: '#FC9F03',
  },
  inactiveTab: {
    backgroundColor: appColors.white,

  },
  activeText: {
    color: "#17191C",
    fontFamily: appFonts.medium,

  },
  inactiveText: {
    color: appColors.iconColor,
    fontFamily: appFonts.medium,
  },
});
export default styles
