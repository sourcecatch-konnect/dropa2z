import {referenceSurfaces} from '../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native'
import { windowHeight, fontSizes, windowWidth } from '../../../theme/appConstant'
import appColors from '../../../theme/appColors'
import appFonts from '../../../theme/appFonts'

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  container: {
    width: '100%',
    paddingVertical: windowHeight(1),
    borderRadius: windowHeight(1),
    marginTop: windowHeight(1),
    marginBottom: windowHeight(1),
    borderWidth: windowHeight(0.1),
  },
  listView: {
    flex: 1,
    paddingVertical: windowHeight(2),
    marginHorizontal: windowWidth(4),
  
  },
  amount: {
    color: appColors.secondaryFont,
    marginVertical: windowHeight(1.5),
    fontFamily: appFonts.regular,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'space-between',
  
    ...referenceSurfaces.control,
  },
  textinput: {
    height: windowHeight(6.5),
    flex: 1,
    minWidth: 0,
    fontFamily: appFonts.regular,
    paddingHorizontal: windowWidth(2),
  },
  modalPaymentView: {
    justifyContent: 'space-between',
    paddingHorizontal: windowWidth(10),
    paddingVertical: windowHeight(10),
    backgroundColor: appColors.white,
  },
  imageBg: {
    borderWidth: windowHeight(0.1),
    borderColor: appColors.border,
    borderRadius: windowHeight(1),
    alignItems: 'center',
    justifyContent: 'center',

    width: windowHeight(10),
    height: windowHeight(6),
    backgroundColor: appColors.graybackground,
  },
  paymentImage: {
    width: windowWidth(15),
    height: windowHeight(40),
    resizeMode: 'contain',
  },
  title: {
    marginTop: windowHeight(1.9),
    marginBottom: windowHeight(1),
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT19,
  },
  button: { marginHorizontal: windowWidth(4), paddingTop: 12 },
  inputView: {
    alignItems: 'center',
    borderRadius: windowWidth(1.5),
    borderWidth: windowHeight(0.1),
    paddingHorizontal: windowWidth(4),
  
    ...referenceSurfaces.control,
  },
  mailInfo: {
    justifyContent: 'center',
    left: windowWidth(25),
  },
  mail: {
    fontFamily: appFonts.regular,
  },
  payBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: windowWidth(9),
    borderRadius: windowHeight(7.6),
    marginHorizontal: windowWidth(6),
    height: windowHeight(35),
    right: windowHeight(17),
  },
})

export default styles
