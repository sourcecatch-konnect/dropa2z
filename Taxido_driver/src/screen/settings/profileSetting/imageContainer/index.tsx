import {Image, View, TouchableOpacity} from 'react-native';
import {Text} from '../../../../design/Typography';
import React from 'react'
import styles from '../styles'
import Icons from '../../../../utils/icons/icons'
import { useTheme } from '@react-navigation/native'
import { windowHeight } from '../../../../theme/appConstant'

export function ImageContainer({ data, openBottomSheet, imageUri }: any) {
  const { colors } = useTheme();
  const userName = data?.name || '';
  const firstLetter = userName.charAt(0).toUpperCase();


  return (
    <View style={{padding:20,alignItems:"center",backgroundColor:"#17191C",borderTopLeftRadius:22,borderTopRightRadius:22}}>
      <View style={[styles.profileImageView, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {imageUri ? (
          <Image style={styles.profileImage} source={{ uri: imageUri }} />
        ) : (
          <View style={styles.charImage}>
            <Text style={styles.firstLetter}>{firstLetter}</Text>
          </View>
        )}

        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel="Change profile photo"
          activeOpacity={0.7}
          style={[styles.editIconContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={openBottomSheet}
        >
          <Icons.Camera />
        </TouchableOpacity>
      </View>
    </View>
  );
}
