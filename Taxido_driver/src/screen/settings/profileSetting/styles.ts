import {referenceSurfaces} from '../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native'
import appColors from '../../../theme/appColors'
import {
  windowHeight,
  windowWidth,
  fontSizes,
} from '../../../theme/appConstant'
import appFonts from '../../../theme/appFonts'

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: windowHeight(6),
    paddingHorizontal: windowWidth(1.5),
    borderRadius: 14,
  },
  codeText: {
    fontSize: fontSizes.FONT3SMALL,
    color: appColors.black,
    top: windowHeight(0),
    paddingHorizontal: windowWidth(2),
  },
  main: {
    flex: 1,
    width: '100%',
  },
  profileView: {
    marginHorizontal: windowWidth(4),
    marginTop: 20,
    borderWidth: windowHeight(0.1),
    borderRadius: 22,
    overflow: "hidden",
  },
  profileImageView: {
    position: "relative",
    width: windowHeight(14),
    height: windowHeight(14),
    borderRadius: windowHeight(15),
    borderWidth: windowHeight(0.1),
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: windowHeight(12.8),
    height: windowHeight(12.8),
    resizeMode: 'cover',
    borderRadius: windowHeight(6),
  },
  charImage: {
    width: windowHeight(10),
    height: windowHeight(10),
    resizeMode: 'cover',
    borderRadius: windowHeight(6),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.primary,
  },
  firstLetter: {
    color: appColors.white,
    fontSize: fontSizes.FONT7,
    fontFamily: appFonts.bold,
  },
  fieldView: {
    marginHorizontal: windowWidth(4),
    marginTop: 20,
    paddingBottom: windowHeight(3.3),
  
  },
  updateBtn: {
    marginBottom: windowHeight(1.5),
  },
  codeComponent: {
    marginRight: windowWidth(2.5),
  
    ...referenceSurfaces.control,
  },
  countryCode: {
    height: windowHeight(6),
    width: windowWidth(15),
    backgroundColor: appColors.graybackground,
    paddingHorizontal: windowWidth(1.5),
    paddingVertical: windowHeight(1),
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: windowHeight(0.1),
  },
  dialCode: {
    color: appColors.secondaryFont,
    fontSize: fontSizes.FONT3HALF,
    fontFamily: appFonts.medium,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginTop: windowHeight(19),
  },
  editIconContainer: {
    width: 44,
    height: 44,
    borderRadius: windowHeight(24),
    position: 'absolute',
    alignSelf: 'flex-end',
    flexGrow: 1,
    top: '70%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: windowHeight(0.1),
  },
  char: {
    fontFamily: appFonts.bold,
    fontSize: fontSizes.FONT5,
    backgroundColor: appColors.primary,
    width: windowHeight(75),
    height: windowHeight(74),
    borderRadius: windowHeight(74),
    textAlign: 'center',
    paddingVertical: windowHeight(25),
  },
  emailContainer: {
    top: windowHeight(0.2),
  
    ...referenceSurfaces.control,
  },
  countryContainer: {
    marginVertical: windowHeight(1),
  
    ...referenceSurfaces.control,
  },
  mobileNumber: {
    marginTop: windowHeight(0.3),
    fontFamily: appFonts.medium,
  },
  errorText: {
    color: appColors.red,
    fontSize: fontSizes.FONT3HALF,
  },
})

export default styles
