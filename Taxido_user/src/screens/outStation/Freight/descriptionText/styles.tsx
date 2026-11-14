import {riderCardFinish} from '../../../../design/RiderSurfaces';
import { StyleSheet } from 'react-native';
import { windowHeight } from '@src/themes';

const styles = StyleSheet.create({
  container: {
    height: windowHeight(85),
    borderRadius: windowHeight(5.8),
    marginTop: windowHeight(5),
    borderWidth: windowHeight(1),
  
    ...riderCardFinish,
  },
});

export { styles };
