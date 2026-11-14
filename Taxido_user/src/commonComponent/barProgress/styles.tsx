import { StyleSheet } from "react-native"
import { appColors, windowHeight, windowWidth } from "@src/themes";

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: windowWidth(15),
    paddingVertical: windowHeight(2),
    borderRadius: windowHeight(2),
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bar: {
    flex: 1,
    height: windowHeight(4.5),
    borderRadius: windowHeight(2),
    marginHorizontal: windowWidth(5.3),
  },
  filledBar: {
    backgroundColor: appColors.primary,
  },
  emptyBar: {
    backgroundColor: '#F2E9E3',
  },
})
export default styles;