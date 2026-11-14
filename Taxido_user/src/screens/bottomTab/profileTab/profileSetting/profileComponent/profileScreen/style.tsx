import {riderCardFinish} from '../../../../../../design/RiderSurfaces';
import {referenceSurfaces} from '../../../../../../design/ReferenceChrome';
import { StyleSheet } from 'react-native';
import { external } from '../../../../../../styles/externalStyle';
import { commonStyles } from '../../../../../../styles/commonStyle';
import { windowHeight, windowWidth, fontSizes, appFonts } from '@src/themes';
import { appColors } from '@src/themes';

const styles = StyleSheet.create({
  sectionTitle: {
    ...commonStyles.mediumTextBlack12,
    marginTop: 24,
    fontSize: fontSizes.FONT20,
    marginHorizontal: windowHeight(2),
    marginBottom: 12,
  
    ...referenceSurfaces.section,
  },
  itemContainer: {
    alignItems: 'center',
    width: windowHeight(35),
    height: windowHeight(35),
    borderRadius: windowHeight(35),
    backgroundColor: appColors.lightGray,
    justifyContent: 'center',
  
    ...riderCardFinish,
  },
  lineHeight: {
    marginVertical: 12,
  },
  titleText: {
    ...commonStyles.regularText,
    ...external.ph_8,
    ...external.fg_1,
    color: appColors.primaryText,
    fontSize: fontSizes.FONT18,
  },
  container: {
    backgroundColor: appColors.whiteColor,
    borderRadius: 16,
    paddingHorizontal: windowWidth(15),
    marginTop: windowHeight(9),
    paddingVertical: windowHeight(9),
    width: '98.5%',
    alignSelf: 'center',
    borderWidth: 1,
  
    ...referenceSurfaces.card,
  
    ...riderCardFinish,
  },
  alertManu: {
    height: windowHeight(55),
    marginVertical: windowHeight(8),
    borderRadius: 16,
    alignSelf: "center",
    width: '98%',
    justifyContent: 'center',
    borderWidth: 1,
  
    ...referenceSurfaces.card,
  
    ...riderCardFinish,
  },
  alertTitle: {
    marginHorizontal: windowWidth(17),
    marginVertical: windowHeight(9),
  },
  listView: {
    alignItems: 'center',
    marginHorizontal: windowWidth(17),
    minHeight: 54,
    justifyContent: 'center',
  },
  icon: {
    height: windowHeight(35),
    width: windowHeight(35),
    backgroundColor: appColors.iconRed,
    borderRadius: windowHeight(23),
    alignItems: 'center',
    justifyContent: 'center',
  
    ...referenceSurfaces.icon,
  },
  listTitle: {
    color: appColors.alertRed,
    marginHorizontal: windowWidth(12),
  },
  logoutTitle: {
    color: appColors.primary,
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT23,
  },
  modelButton: {
    justifyContent: "space-between",
  },
  modelTitle: {
    fontFamily: appFonts.regular,
    width: windowWidth(300),
    textAlign: "center",
    marginBottom: windowHeight(20),
  },
  modelView: {
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
  },
  alertBorder: {
    borderBottomWidth: windowHeight(0.9),
    marginHorizontal: windowHeight(13),
    marginVertical: windowHeight(10),
  },
  pressableView: {
    paddingVertical: 8,
    minHeight: 56,
  },
  SkeletonProfiletTittle: {
    marginTop: windowHeight(3),
  },
  skeltonAppPageView: {
    marginBottom: windowHeight(11),
    top: windowHeight(5),
    bottom: windowHeight(18),
  },
  skeletonLine: {
    top: windowHeight(5),
  },
  skeletonProfiletTittle: {
    marginHorizontal: windowHeight(11),
  },
  skeltonAppPage: {
    marginHorizontal: windowHeight(10),
    top: windowHeight(7),
  },
  skeltonAppPage1: {
    marginHorizontal: windowHeight(10),
    top: windowHeight(1),
  },
  alertZone: {
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT20,
    marginTop: windowHeight(20),
    marginHorizontal: windowWidth(5),
    marginBottom: windowHeight(3),
  },
});
export { styles };
