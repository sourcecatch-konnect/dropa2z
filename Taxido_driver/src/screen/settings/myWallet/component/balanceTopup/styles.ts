import {referenceSurfaces} from '../../../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native'
import appColors from '../../../../../theme/appColors'
import appFonts from '../../../../../theme/appFonts'
import { fontSizes, windowHeight, windowWidth } from '../../../../../theme/appConstant'

const styles = StyleSheet.create({
  mainBalance: {
    marginTop: windowHeight(2),
    borderRadius: 22,
    overflow: 'hidden',
    marginHorizontal: windowWidth(4),
    minHeight: windowHeight(23.5),
    backgroundColor: "#17191C",
  
    ...referenceSurfaces.card,
  },
  walletImage: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
    borderRadius: windowHeight(1),
    resizeMode: 'stretch',
  },
  subBalance: {
    paddingBottom: windowHeight(1.4),
    width: '100%',
    justifyContent: 'space-between',
  },
  balanceView: {
    borderRadius: windowHeight(1),
    justifyContent: 'center',
    marginVertical: windowHeight(1.4),
  },
  balanceTitle: {
    color: "#FFDEAB",
    fontSize: fontSizes.FONT4,
    marginBottom: windowHeight(0.1),
    fontFamily: appFonts.regular,
  },
  totalBalance: {
    fontSize: 30,
    lineHeight: 37,
    color: appColors.white,
    fontFamily: appFonts.bold,
  },
  topupBtn: {
    minHeight: 44,
    minWidth: windowWidth(20),
    paddingHorizontal: 12,
    backgroundColor: appColors.white,
    borderRadius: windowHeight(1),
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: windowHeight(1),
    marginHorizontal: windowWidth(4),
  
    ...referenceSurfaces.control,
  },
  topupTitle: {
    color: appColors.primary,
    fontFamily: appFonts.medium,
  },
  dashLine: {
    borderBottomWidth: windowHeight(0.1),
    borderStyle: 'dashed',
    borderColor: appColors.secondaryFont,
    marginHorizontal: windowWidth(4),
    bottom: windowHeight(1),
    width: '88%',
    alignSelf: 'center',
  },
})

export default styles
