import {riderCardFinish} from '../../design/RiderSurfaces';
import {referenceSurfaces} from '../../design/ReferenceChrome';
import { StyleSheet } from "react-native";
import { appFonts, fontSizes, windowHeight, windowWidth } from '@src/themes';

const styles = StyleSheet.create({
  main: {
    flex: 1,
    width: "100%",
  },
  title: {
    marginTop: windowHeight(16),
    marginHorizontal: windowWidth(20),
    fontFamily: appFonts.bold,
    fontSize: fontSizes.FONT21
  ,
    ...referenceSurfaces.section,
  },
  noDataContainer: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginHorizontal: windowWidth(20),
  },
  noInternet: { height: "60%" },
  dataView: {
    maxHeight: windowHeight(379),
    marginHorizontal: windowWidth(20),
    borderRadius: 16,
    marginTop: windowHeight(10),
    overflow: 'hidden',
    borderWidth: windowHeight(1),
    marginBottom: windowHeight(85),
  
    ...riderCardFinish,
  },
  skeltonAppPage: { paddingHorizontal: windowHeight(11), paddingVertical: windowHeight(7) },
});

export default styles