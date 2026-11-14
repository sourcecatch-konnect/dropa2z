import {referenceSurfaces} from '../../design/ReferenceChrome';
import {StyleSheet} from 'react-native';
import { windowHeight, windowWidth} from '@src/themes';

const styles = StyleSheet.create({
    listView: {
        paddingVertical: windowHeight(2),
        marginHorizontal: windowWidth(4),
      
    ...referenceSurfaces.card,
  },
})

export default styles;
