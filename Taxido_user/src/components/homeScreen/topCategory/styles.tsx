import {riderCardFinish} from '../../../design/RiderSurfaces';
import { StyleSheet } from "react-native";
import { appFonts, fontSizes, windowHeight, windowWidth } from "@src/themes";
import { commonStyles } from "../../../styles/commonStyle";
import { appColors } from "@src/themes";
import { external } from "../../../styles/externalStyle";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: windowWidth(16),
    marginTop: windowHeight(8),
    marginBottom: windowHeight(8),
  },
  topCategoryTitle: {
    textAlign: "right",
    width: "100%",
    paddingHorizontal: windowWidth(20),
  },
  mainContainer: {
    justifyContent: "space-between",
    flexDirection: "column",
    height: windowHeight(68),
    paddingVertical: windowHeight(9.3),
    marginHorizontal: windowHeight(9),
  },
  itemContainer: {
    width: windowWidth(210),
    borderWidth: windowHeight(1),
    borderColor: appColors.lightGray,
    backgroundColor: appColors.whiteColor,
    borderRadius: windowHeight(5),
    ...commonStyles.shadowContainer,
    height: windowHeight(68),
    marginHorizontal: windowWidth(10),
    marginBottom: windowHeight(15),
  
    ...riderCardFinish,
  },
  itemText: {
    ...commonStyles.mediumTextBlack12,
    color: appColors.primaryText,
    fontSize: fontSizes.FONT19,
  },
  iconContainer: {
    ...external.fd_row,
    ...external.js_space,
    ...external.mt_10,
    ...external.ai_center,
  },
  carImage: {
    width: windowWidth(90),
    resizeMode: "contain",
    height: windowHeight(50),
    position: "absolute",
    bottom: windowHeight(4.8),
  },
  itemSeparator: {
    width: windowWidth(28),
  },
  listContainer: {
    width: "100%",
    alignItems: "center",
    height: windowHeight(75),
  },
  flatListContent: {
    alignItems: "center",
  },
  item: {
    paddingHorizontal: windowWidth(20),
    alignItems: "center",
  },
  highlightLine: {
    height: windowHeight(1.8),
    width: windowWidth(80),
    backgroundColor: appColors.primary,
    marginTop: windowHeight(5),
    position: "absolute",
    bottom: 0,
    zIndex: 1,
    borderRadius: windowHeight(10),
  },
  invisibleLine: {
    height: windowHeight(1.8),
    width: 20,
    backgroundColor: "transparent",
    marginTop: 5,
    position: "absolute",
    bottom: 0,
    zIndex: 1,
  },
  mainLine: {
    height: windowHeight(1.8),
    width: "100%",
    backgroundColor: appColors.sliderLine,
    position: "absolute",
    bottom: 0,
    zIndex: -1,
  },
  selectedText: {
    fontWeight: "bold",
    color: "blue",
  },
  image: {
    height: windowHeight(50),
    width: windowHeight(50),
    resizeMode: "contain",
  },
  image1: {
    height: windowHeight(50),
    width: windowHeight(50),
    resizeMode: "contain",
  },
  text: {
    fontSize: fontSizes.FONT18,
    color: appColors.primaryText,
    fontFamily: appFonts.medium,
    width: windowWidth(100),
    textAlign: "center",
  },
  rentalImage: {
    marginHorizontal: windowHeight(15),
    marginBottom: windowHeight(5),
    marginTop: windowHeight(15),
    width: "90%",
    alignSelf: "center",
    resizeMode: "stretch",
    height: windowHeight(150),
  },
  packageMainView: {
    padding: windowWidth(10),
    borderRadius: windowHeight(8),
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    borderWidth: windowHeight(1),
  
    ...riderCardFinish,
  },
  bookingCardBody: {
    width: "100%",
    paddingHorizontal: windowWidth(4),
    paddingVertical: windowHeight(4),
    borderRadius: windowHeight(6),
  },
  bookingFieldRow: {
    width: "100%",
    minHeight: 64,
    alignItems: "center",
    paddingHorizontal: windowWidth(12),
    borderRadius: windowHeight(6),
  },
  bookingDestinationRow: {
    marginTop: windowHeight(8),
  },
  bookingFieldIcon: {
    width: windowWidth(38),
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: windowWidth(6),
  },
  bookingFieldCopy: {
    flex: 1,
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "100%",
  },
  bookingFieldLabel: {
    fontFamily: appFonts.regular,
    fontSize: fontSizes.FONT14,
    marginBottom: windowHeight(2),
  },
  bookingFieldValue: {
    fontFamily: appFonts.medium,
    fontSize: fontSizes.FONT17,
    flexShrink: 1,
    maxWidth: "100%",
  },
  bookingDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: windowWidth(42),
    marginVertical: windowHeight(4),
  },
  bookingProceed: {
    alignSelf: "flex-end",
    paddingHorizontal: windowWidth(18),
    paddingVertical: windowHeight(7),
    borderRadius: windowHeight(5),
    marginTop: windowHeight(5),
  },
  bookingProceedText: {
    color: appColors.whiteColor,
    fontFamily: appFonts.semiBold,
    fontSize: fontSizes.FONT16,
  },
  homeRecentSearch: {
    color: appColors.gray,
    fontFamily: appFonts.regular,
    marginBottom: windowHeight(8),
    marginTop: windowHeight(12),
  },
  adajanText: {
    fontFamily: appFonts.medium,
    marginHorizontal: windowWidth(8),
    flexShrink: 1,
  },
  recentTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  bottomLocationView: {
    alignItems: "center",
    marginTop: windowHeight(1.5),
  },
  locationLine: {
    marginVertical: windowHeight(3),
  },
  centerLocation: {
    alignItems: "center",
    backgroundColor: appColors.whiteColor,
    marginHorizontal: 0,
    padding: windowWidth(12),
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: windowHeight(5),
  
    ...riderCardFinish,
  },
  emptyContainer: {
    padding: windowHeight(15),
    alignItems: "center",
  },
  backBtnStyle: {
    height: windowHeight(22),
    width: windowHeight(22),
    position: "absolute",
    zIndex: 1,
    top: windowHeight(22),
    borderRadius: windowHeight(22),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: appColors.border,
    right: windowWidth(18),
    marginLeft: windowWidth(18),
  },
  backBtnStyle1: {
    height: windowHeight(22),
    width: windowHeight(22),
    position: "absolute",
    zIndex: 1,
    top: windowHeight(22),
    borderRadius: windowHeight(22),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: appColors.border,
    left: windowWidth(18),
  },
  titleTextDetail: {
    fontSize: fontSizes.FONT18,
    width: "100%",
    flexShrink: 1,
    color: appColors.gray,
    fontFamily: appFonts.regular,
    marginHorizontal: windowWidth(10),
  },
  bottomLine: {
    borderBottomWidth: windowHeight(0.9),
  },
  loaderAddress: {
    marginTop: windowHeight(10),
  },
});

export { styles };
