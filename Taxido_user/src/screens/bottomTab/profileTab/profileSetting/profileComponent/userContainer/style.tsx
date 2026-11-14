import {riderCardFinish} from '../../../../../../design/RiderSurfaces';
import {referenceSurfaces} from '../../../../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native';
import { commonStyles } from '../../../../../../styles/commonStyle';
import { appFonts, fontSizes, appColors, windowHeight, windowWidth } from '@src/themes';

export const styles = StyleSheet.create({
  container: {
    borderRadius: windowHeight(5.5),
    marginHorizontal: windowWidth(24),
    paddingVertical: 18,
    shadowColor: appColors.blackColor,
    shadowOffset: {
      width: windowHeight(0),
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 0.9,
    marginTop: windowHeight(2),
  
    ...referenceSurfaces.card,
  },
  userImage: {
    width: windowHeight(53),
    height: windowHeight(53),
    marginHorizontal: windowWidth(15),
    resizeMode: 'cover',
    borderRadius: windowHeight(55),
  },
  userName: {
    ...commonStyles.mediumTextBlack,
  },
  walletContainer: {
    backgroundColor: "#17191C",
    marginHorizontal: 14,
    minHeight: 58,
    borderRadius: windowHeight(5.5),
    alignItems: 'center',
    paddingHorizontal: windowWidth(15),
    marginTop: windowHeight(15),
    justifyContent: 'space-between',
    marginBottom: windowHeight(4),
  
    ...referenceSurfaces.control,
  
    ...riderCardFinish,
  },
  walletBalance: {
    ...commonStyles.regularText,
    color: appColors.whiteColor,
    fontSize: fontSizes.FONT18,
  },
  char: {
    fontFamily: appFonts.bold,
    fontSize: fontSizes.FONT25,
  },
  nameTag: {
    alignItems: 'center',
    justifyContent: 'center',
    width: windowHeight(53),
    height: windowHeight(51),
    backgroundColor: appColors.primary,
    borderRadius: windowHeight(74),
    marginHorizontal: windowHeight(10),
  
    ...riderCardFinish,
  },
  userView: {
    paddingRight: 14, flex:1, minWidth:0,
  },
    ratingBox:{
    minHeight:28,
    alignItems:'center',
    borderRadius:windowWidth(55),
    paddingHorizontal:8, gap:4, flexDirection:"row",
    justifyContent:'space-between'
  }
});
