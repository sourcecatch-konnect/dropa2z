import {BrandLoader} from '../../../../design/BrandLogo';
import {View, Image, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Text} from '../../../../design/Typography';
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useValues } from "@src/utils/context/index";;
import styles from "./styles";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowDown, LocationMarker } from "@src/utils/icons";
import { appColors } from "@src/themes";
import { getValue } from "@src/utils/localstorage";
import useStoredLocation from "@src/components/helper/useStoredLocation";

export function ProfileContainer({compact=false,darkText=false}: {compact?:boolean;darkText?:boolean}) {
  const navigation = useNavigation<any>();
  const { viewRTLStyle, Google_Map_Key, isRTL } = useValues();
  const { self } = useSelector((state: any) => state.account);
  const { taxidoSettingData, translateData } = useSelector((state: any) => state.setting);
  const { latitude, longitude } = useStoredLocation();
  const char = self?.name ? self.name.charAt(0) : "";
  const [city, setCity] = useState<string>('');
  const [fullAddress, setFullAddress] = useState<string>('');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);


  useEffect(() => {
    const getAddress = async () => {
      let lat = await getValue('user_latitude_Selected');
      let lng = await getValue('user_longitude_Selected');

      let finalLat = lat ? parseFloat(lat) : latitude;
      let finalLng = lng ? parseFloat(lng) : longitude;

      if (!finalLat || !finalLng) return;

      try {
        const url = `https://dropa2z.com/api/maps/reverse-geocode?lat=${finalLat}&lng=${finalLng}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
          const components = data.results[0].address_components;

          const foundCity = components.find((c: any) =>
            c.types.includes('locality') || c.types.includes('administrative_area_level_2')
          )?.long_name;

          const fullAddr = data.results[0]?.formatted_address;

          setCity(foundCity || 'City not found');
          setFullAddress(fullAddr || 'Address not found');
        } else {
          setCity(translateData?.npfoundcity);
          setFullAddress(translateData?.addressnot);
          console.warn('Geocoding failed:', data.status);
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setCity(translateData?.cityerror);
        setFullAddress(translateData?.addresserror);
      }
    };
    getAddress();
  }, [latitude, longitude, taxidoSettingData, Google_Map_Key]);

  const handleImagePress = async () => {
    const token = await getValue("token")
    if (token) {
      navigation.navigate("EditProfile")
    }
  }


  useFocusEffect(
    useCallback(() => {
      const fetchStoredImage = async () => {
        const storedImageUri = await getValue("profile_image_uri");
        setLocalImageUri(storedImageUri);
      };
      fetchStoredImage();
    }, [])
  );

  const gotoLocation = () => {
    navigation.navigate("LocationSelect", { screenValue: "HomeScreen",field:'pickupLocation' })
  }
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchStoredImage = async () => {
        const storedImageUri = await getValue("profile_image_uri");
        setLocalImageUri(storedImageUri);
        setTimeout(() => {
          setLoading(false);
        }, 3000);
      };
      fetchStoredImage();
    }, [])
  );
  return (
    <View style={[styles.mainView, { flexDirection: viewRTLStyle },compact&&{height:undefined,minHeight:46,marginTop:0}]}>

      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Change pickup location" onPress={gotoLocation} style={[styles.viewText,compact&&{flex:1}]}>
        <Text numberOfLines={1} style={[styles.selfName, { textAlign: isRTL ? 'right' : 'left' },compact&&{fontSize:16,lineHeight:21,color:darkText?'#17191C':'#FFFFFF'}]}>
          <LocationMarker color={darkText?appColors.primary:'#FFFFFF'}/> {city?.split(" ")[0] || translateData?.fecthing} <ArrowDown color={darkText?'#17191C':appColors.whiteColor} />
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text numberOfLines={1} style={[styles.text,compact&&{fontSize:11,lineHeight:16,flex:1,minWidth:0,marginHorizontal:0,color:darkText?'#656C76':'#FFFFFF'}]}>{compact?fullAddress:fullAddress?.length > 32 ? `${fullAddress.substring(0, 32)}...` : fullAddress}
          </Text>
        </View>
      </TouchableOpacity >

      {!compact&&<TouchableOpacity onPress={handleImagePress} style={styles.imageView} activeOpacity={0.7}>
        {self?.profile_image_url ? (
          <Image
            style={styles.imageStyle}
            source={{ uri: self.profile_image_url }}
          />
        ) : (
          <View style={styles.textView}>
            {loading ? <BrandLoader size="small" color={appColors.primary} /> : <Text style={styles.charText}>{char || translateData?.guestChar}</Text>}
          </View>
        )}
      </TouchableOpacity>}
    </View >
  );
}
