import {riderCardFinish} from '../../design/RiderSurfaces';
import { StyleSheet } from "react-native";
import { commonStyles } from "../../styles/commonStyle";
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from "@src/themes";
import { external } from "../../styles/externalStyle";

const styles = StyleSheet.create({
  main: { flex: 1 },
  container: {
    width: windowHeight(30),
    height: windowHeight(30),
    backgroundColor: appColors.whiteColor,
    borderColor: appColors.primaryGray,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    ...commonStyles.shadowContainer,
  
    ...riderCardFinish,
  },
  viewContainer: {
    backgroundColor: appColors.whiteColor,
    flex: 1,
    paddingTop: windowHeight(20),
  },
  horizontalView: {
    paddingHorizontal: windowHeight(14),
    paddingVertical: windowHeight(15)
  },
  subtitleText: {
    ...commonStyles.regularText,
    fontWeight: "300",
    fontSize: fontSizes.FONT16,
    color: appColors.regularText,
  },
  titleText: {
    ...commonStyles.mediumText23,
    fontSize: fontSizes.FONT19,
    width: windowWidth(250),
  },
  titleTextDetail: {
    fontSize: fontSizes.FONT18,
    width: windowWidth(250),
    color: appColors.gray,
    fontFamily: appFonts.regular,
  },
  iconView: {
    width: windowHeight(27),
    height: windowHeight(27),
    backgroundColor: appColors.lightGray,
    borderRadius: windowHeight(27),
    marginHorizontal: windowHeight(5),
    alignItems: "center",
    justifyContent: "center",
  },
  mapView: {
    backgroundColor: appColors.whiteColor,
    borderRadius: 16,
    marginVertical: windowHeight(12),
    paddingVertical: windowHeight(4),
    borderWidth: windowHeight(1),
  },
  recentView: {
    backgroundColor: appColors.lightGray,
    paddingHorizontal: windowHeight(16),
    paddingTop: windowHeight(16),
  },
  chooseAnotherAccount: {
    ...commonStyles.mediumTextBlack12,
    ...external.mh_5,
    fontSize: fontSizes.FONT19,
    color: appColors.primary,
  },
  spaceing: {
    width: windowWidth(270),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: appColors.modelBg,
  },
  modalContainer: {
    width: 300,
    padding: windowHeight(18),
    backgroundColor: appColors.whiteColor,
    borderRadius: 16,
    alignItems: "center",
  },
  modalText: {
    marginBottom: windowHeight(18),
    textAlign: "center",
    color: appColors.primaryText,
    fontFamily: appFonts.medium,
  },
  bar: {
    height: windowHeight(2),
    width: windowHeight(35),
    backgroundColor: appColors.primary,
    marginTop: windowHeight(-1),
    position: "absolute",
    bottom: 0,
  },
  fareStyle: {
    ...commonStyles.mediumTextBlack12,
    color: appColors.alertRed,
    paddingHorizontal: windowHeight(5),
  },
  viewContainerToll: {
    backgroundColor: appColors.alertBg,
    borderRadius: 16,
    ...external.ai_center,
    ...external.js_center,
    ...external.fd_row,
    paddingVertical: windowHeight(12),
    ...external.mh_20,
  
    ...riderCardFinish,
  },
  dateField: {
    marginTop: windowHeight(12),
    borderRadius: 16,
    borderWidth: windowHeight(1),
    alignItems: "center",
    justifyContent: "space-between",
  
    ...riderCardFinish,
  },
  dateInput: {
    color: appColors.primaryText,
    fontFamily: appFonts.medium,
    width: "80%",
    marginHorizontal: windowWidth(15),
    marginVertical: 50,
  },
  locationBtn: {
    height: windowHeight(45),
    width: "47.8%",
    borderRadius: 16,
    marginVertical: windowWidth(26),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: windowHeight(1),
  },
  locationBtnText: {
    fontFamily: appFonts.medium,
    marginHorizontal: windowWidth(5),
  },
  historyView: {
    height: windowHeight(28),
    width: windowHeight(28),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: windowHeight(15),
  },
  historyBtn: {
    alignItems: "center"
  },
  locationText: {
    color: appColors.primaryText,
    fontFamily: appFonts.medium,
    marginHorizontal: windowWidth(10),
    width: '90%',
    textAlign: 'left',
  },
  bottomLine: {
    borderBottomWidth: windowHeight(0.9),
  },
  addressMArker: {
    backgroundColor: appColors.lightGray,
    height: windowHeight(30),
    width: windowHeight(30),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: windowHeight(40),
  },
  addressItemView: {
    alignItems: "center",
    justifyContent: "center",
    height: windowHeight(50),
  },
  calenderView: {
    marginHorizontal: windowWidth(10),
  },
  suggestionsView: {
    marginHorizontal: windowHeight(8),
    marginVertical: windowHeight(3),
  },
  noAddressText: {
    fontSize: fontSizes.FONT22,
    fontFamily: appFonts.regular,
    textAlign: "center",
  },
  renderItemRecentView: {
    paddingHorizontal: windowWidth(15),
  },








  containers: {
    flex: 1,
    borderWidth: windowHeight(1),
    paddingHorizontal: windowWidth(20),
    paddingTop: windowHeight(5),
    justifyContent: 'flex-end',
    borderRadius: 16,
    borderColor: appColors.border,
  
    ...riderCardFinish,
  },
  scrollContainer: {
    position: 'relative',
  },
  inputContainer: {
    width: '100%',
    minWidth: 0,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: windowWidth(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberContainer: {
    width: windowWidth(27),
    height: windowWidth(27),
    borderRadius: windowWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    textAlign: 'center',
    fontSize: fontSizes.FONT16,
  },
  inputWithIcons: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  inputWidth: {
    flex: 1,
    minWidth: 0,
  },
  inlineInputRow:{flexDirection:'row',alignItems:'center'},
  inlineInputActions:{position:'relative',top:undefined,right:undefined,transform:[],flexDirection:'row',alignItems:'center',flexShrink:0,marginLeft:4},
  addressAction:{minWidth:30,minHeight:44,alignItems:'center',justifyContent:'center'},
  input: {
    flex: 1,
    minWidth: 0,
    height: windowHeight(30),
    borderColor: appColors.border,
    paddingTop: windowHeight(7),
    color: appColors.primaryText,
    fontFamily: appFonts.medium,
    marginHorizontal: windowWidth(10),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  iconSpacing: {
    borderLeftWidth: windowHeight(0.9),
    borderColor: appColors.border,
    height: windowHeight(22),
    marginHorizontal: windowWidth(8),
  },
  addButton: {
    position: 'absolute',
    right: windowHeight(10),
    top: '40%',
    transform: [{ translateY: -10 }],
  },
  line: {
    position: 'absolute',
    left: windowHeight(11),
    top: '50%',
    width: windowHeight(0.9),
    height: '100%',
    zIndex: -1,
    borderRightWidth: windowHeight(0.9),
    borderStyle: 'dashed'
  },
  line2: {
    position: 'absolute',
    left: windowHeight(11),
    top: 20,
    width: windowHeight(0.9),
    height: windowHeight(32),
    zIndex: -1,
    borderRightWidth: windowHeight(0.9),
    borderStyle: 'dashed'
  },
  pickupdetailsView: { marginTop: windowHeight(5) },
});
export { styles };
