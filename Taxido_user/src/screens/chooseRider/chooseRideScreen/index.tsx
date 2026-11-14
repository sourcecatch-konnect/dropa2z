import {FlatList, Pressable, View} from 'react-native';
import {Text} from '../../../design/Typography';
import React, { useEffect, useState } from 'react';
import { commonStyles } from '../../../styles/commonStyle';
import { HeaderContainer, SolidLine, IconBackground } from '@src/commonComponent';
import { Correct, ProfileSetting, UserPlus } from '@utils/icons';
import { external } from '../../../styles/externalStyle';
import { styles } from './styles';
import { useValues } from '@src/utils/context/index';
import { appColors } from '@src/themes';
import Contacts from 'react-native-contacts';
import { useAppNavigation } from '@src/utils/navigation';
import { useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { receiverContacts } from '../../../utils/receiverContacts';

export function ChooseRiderScreen() {
  const { bgFullStyle, linearColorStyle, textColorStyle, isDark } = useValues();
  const { navigate, replace } = useAppNavigation();
  const [selected, setSelected] = useState<number | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const { translateData } = useSelector((state) => state.setting);
  const route = useRoute();
  const { destination, stops, pickupLocation, service_ID, zoneValue, scheduleDate, service_category_ID, selectedImage, parcelWeight, pickupCoords, destinationCoords } = route.params || {};
  const { textRTLStyle, viewRTLStyle } = useValues();

  useEffect(() => {
    fetchContacts();
  }, [])

  const fetchContacts = () => {
    Contacts.getAll()
      .then((contactsList) => {
        setContacts(receiverContacts(contactsList));
      })
      .catch((error) => {
      });
  };

  const handleChange = (index: number, item: any) => {
    setSelected(selected === index ? null : index);
    replace("BookRide", {
      ...route.params,
      destination,
      stops,
      pickupLocation,
      service_ID,
      zoneValue,
      scheduleDate,
      service_category_ID,
      otherContect: item.phone,
      otherName: item.name,
      recipientMode: 'other',
      receiverName: item.name,
      phoneNumber: item.phone,
      countryCode: item.countryCode,
      selectedImage,
      parcelWeight,
      pickupCoords,
      destinationCoords
    });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={[external.ph_20]}>
        <Pressable
          onPress={() => handleChange(index, item)}
          style={[external.ai_center, external.pv_10, { flexDirection: viewRTLStyle }]}>
          <View style={[styles.container, { backgroundColor: bgFullStyle, flexDirection: viewRTLStyle }]}>
            <ProfileSetting />
          </View>
          <View style={[external.ai_center, { flexDirection: viewRTLStyle }]}>
              <Text style={[styles.titleStyle, { color: textColorStyle, textAlign: textRTLStyle }]}>
                {item.name}
              </Text>
            {selected === index && <Correct />}
          </View>
        </Pressable>
        <SolidLine color={isDark ? appColors.darkBorder : appColors.border} />
      </View>
    );
  };
  return (
    <View style={[commonStyles.flexContainer, { backgroundColor: bgFullStyle }]}>
      <View style={[styles.viewContainer, { backgroundColor: bgFullStyle }]}>
        <HeaderContainer
          show={true}
          icon={
            <IconBackground
              backgroundColor={linearColorStyle}
              icon={<UserPlus />}
              onPress={() => navigate('AddNewRider', {
                  ...route.params,
                destination,
                stops,
                pickupLocation,
                service_ID,
                zoneValue,
                scheduleDate,
                service_category_ID,
              })}
              borderColor={linearColorStyle}
            />
          }
          value={translateData.chooseaRider}
        />
      </View>
      <View style={[external.main, { backgroundColor: linearColorStyle }]}>
        <FlatList renderItem={renderItem} data={contacts} showsVerticalScrollIndicator={false} removeClippedSubviews={true} />
      </View>
    </View>
  );
};
