import {riderCardFinish} from '../../../../design/RiderSurfaces';
import {referenceSurfaces} from '../../../../design/ReferenceChrome';
import { StyleSheet } from "react-native";
import { commonStyles } from "../../../../styles/commonStyle";
import { appColors } from "@src/themes";
import { windowHeight, windowWidth } from "@src/themes";
import { external } from "../../../../styles/externalStyle";

const styles = StyleSheet.create({
  container: {
    ...commonStyles.flexContainer,
  },
  headerContainer: {backgroundColor:appColors.whiteColor},
  appPagesContainer: {
    alignSelf:'stretch', margin:20, paddingHorizontal:16, paddingVertical:4,
    borderWidth:1,borderColor:'#E5E7EB',borderRadius:22,
    backgroundColor:appColors.whiteColor,
    shadowColor:'#17191C',shadowOpacity:.04,shadowRadius:10,shadowOffset:{width:0,height:4},
  },
  listItemContainer: {
    flexDirection:'row', alignItems:'center', minHeight:76, gap:12,
    paddingVertical:14,
  },
  iconContainer: {width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},
  listItemText: {...commonStyles.regularText,color:appColors.primaryText,fontSize:16,flex:1,minWidth:0},
  symbolView: {
    width: windowHeight(32),
    height: windowHeight(32),
    alignItems: "center",
    justifyContent: "center",
    borderColor: appColors.blackColor,
    borderWidth: windowHeight(1),
    borderRadius: windowWidth(25),
  
    ...riderCardFinish,
  },
  flagImage: {
    width: windowHeight(30),
    height: windowHeight(30),
    borderRadius: windowHeight(5),
  },
  updateButton: {
    marginBottom: windowHeight(3),
    marginTop: windowHeight(12),
  },
  updateButton1: {
    marginTop: windowHeight(9.5),
    marginBottom: windowHeight(2),
  },
  lineView: {
    marginTop: windowHeight(1.5),
  },
  updateButton2: {
    marginBottom: windowHeight(10),
    top: windowHeight(10),
  },
  symbol: {
    color: appColors.blackColor,
  },
  languageContainer: {
    marginTop: windowHeight(3),
  },
});

export { styles };
