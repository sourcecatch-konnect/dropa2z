import {Image, View, TouchableOpacity} from 'react-native';
import {Text} from '../../../../../design/Typography';
import React from "react";
import { appColors, windowHeight } from "@src/themes";
import { useValues } from "@src/utils/context";
import Images from "@src/utils/images";
import { Camera } from "@utils/icons";
import { styles } from "../style";

export function ImageContainer({ data, imageUri, bottomSheetRef }: any) {
  const { bgFullStyle, isDark } = useValues();


  return (
    <>
      <View style={{ position: 'absolute', width: '100%', height: windowHeight(50) }}>
        <View pointerEvents="none" style={{width:'100%',height:windowHeight(78),borderTopLeftRadius:20,borderTopRightRadius:20,backgroundColor:'#17191C',overflow:'hidden'}}><View style={{position:'absolute',right:-25,top:-45,width:170,height:170,borderRadius:85,borderWidth:24,borderColor:'#FC9F0333'}}/><View style={{position:'absolute',left:22,top:22,width:30,height:5,borderRadius:3,backgroundColor:'#FC9F03'}}/></View>
      </View>
      <View style={styles.profileImageContainer}>
        <View style={[styles.profileImageWrapper, { borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
          {imageUri ? (
            <Image style={styles.profileImage} source={{ uri: imageUri }} />
          ) : (
            <Text style={[styles.char, { color: appColors.primary }]}>
              {data?.name?.charAt(0) || ""}
            </Text>
          )}
          <View style={[styles.editIconContainer, { backgroundColor: bgFullStyle }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}
              onPress={() => bottomSheetRef.current?.present()}
              activeOpacity={0.7}
            >
              <Camera />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}
