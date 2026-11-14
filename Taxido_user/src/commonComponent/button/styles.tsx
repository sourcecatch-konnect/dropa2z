import { StyleSheet } from 'react-native';
import { windowHeight } from '@src/themes';
import { appColors } from '@src/themes';
import { external } from '../../styles/externalStyle';

const styles = StyleSheet.create({
  container: {
    backgroundColor: appColors.primary,
    height: windowHeight(40),
    borderRadius: 14,
    minHeight: 48,
    ...external.ai_center,
    ...external.js_center,
    paddingVertical: windowHeight(10),
    alignItems: "center",
    justifyContent: "center",
  },
});
export { styles };
