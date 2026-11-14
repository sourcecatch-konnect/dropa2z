import { StyleSheet } from 'react-native';
import { windowHeight } from '@src/themes';
import { commonStyles } from '../../styles/commonStyle';
import { external } from '../../styles/externalStyle';
import { appColors } from '@src/themes';

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    backgroundColor: appColors.whiteColor,
    borderWidth: windowHeight(1),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  textContainer: {
    ...external.as_center,
    ...commonStyles.mediumText23,
    textAlign: 'justify',
  },
  viewContainer: {
    ...external.fd_row,
    ...external.ai_center,
    ...external.mh_20,
  },
});
export { styles };
