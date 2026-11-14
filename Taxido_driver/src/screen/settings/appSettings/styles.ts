import {referenceSurfaces} from '../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native'
import {
  fontSizes,
  windowHeight,
  windowWidth,
} from '../../../theme/appConstant'
import appColors from '../../../theme/appColors'
import appFonts from '../../../theme/appFonts'

const styles = StyleSheet.create({
  main: {
    flex: 1,
    width: '100%',
  },
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  
  },
  listContainer: {
    paddingVertical: 4,
    width: '100%',
    marginVertical: windowHeight(1.5),
    borderRadius: windowHeight(1),
    borderWidth: windowHeight(0.1),
    borderRadius: 22,
  },
  modalAlign: {
    alignItems: 'center',
    marginTop: windowHeight(1.5),
    justifyContent: 'space-between',
    paddingHorizontal: windowHeight(0),
  },
  selection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCountry: {
    height: windowHeight(5.8),
    width: windowWidth(11.6),
    resizeMode: 'contain',
  },
  name: {
    marginHorizontal: windowWidth(3),
  },
  borderBottom: {
    borderBottomWidth: windowHeight(0.1),
    marginVertical: windowHeight(1.3),
    width: '98%',
    top: windowHeight(0.8),
  },
  buttonView: {
    marginVertical: windowHeight(2),
    backgroundColor: appColors.primary,
    paddingVertical: windowHeight(2),
    paddingHorizontal: windowWidth(4),
    borderRadius: windowHeight(0.8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: windowHeight(0.9),
  },
  buttonTitle: {
    color: "#17191C",
    fontSize: fontSizes.FONT4HALF,
    fontFamily: appFonts.medium,
  },
})
export default styles
