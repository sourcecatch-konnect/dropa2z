import {View, TouchableOpacity, Image} from 'react-native';
import {Text} from '../../../../design/Typography';
import React, { useState } from 'react';
import {CardHeading} from '../../../../design/CardHeading';
import {Asset,ImageLibraryOptions,launchImageLibrary} from 'react-native-image-picker';
import { Download } from '@utils/icons';
import { styles } from './styles';
import { useValues } from "@src/utils/context/index";
import { appColors } from '@src/themes';
import { useSelector } from 'react-redux';

export function PictureCargo({ onImageSelect, service_name, imageUri = undefined }: {onImageSelect:(assets:Asset[])=>void;service_name?:string;imageUri?:string}) {
  const { textColorStyle, isDark, bgContainer, textRTLStyle } = useValues();
  const [image, setimage] = useState<string|undefined>(undefined);
  const { translateData } = useSelector((state:any) => state.setting);


  const openImagePicker = () => {
    const options:ImageLibraryOptions = {
      mediaType: 'photo',
      maxWidth: 300,
      maxHeight: 300,
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
      } else if (response.errorMessage) {
      } else if (response.assets && response.assets?.length > 0) {
        const source = { uri: response.assets[0].uri };
        setimage(source.uri)
        onImageSelect(response.assets);
      } else {
      }
    });
  };


  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose parcel photo" activeOpacity={0.7}
      onPress={openImagePicker}>
      <View style={{marginTop:16}}><CardHeading icon="package" title="Photo of packed items (Optional)"/></View>

      <View style={[styles.cargoView, { backgroundColor: bgContainer, borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
        {(imageUri || image) ? (
          <Image source={{ uri: imageUri || image }} style={styles.selectedImage} />
        ) : (
          <>
            <View style={styles.dashedBorder}>
              <Download />
              <Text style={styles.uploadText}>{translateData.updateTextBottom}</Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};
