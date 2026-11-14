import {Alert, View} from 'react-native';
import {WeightPresets} from '../../../components/weightPresets';
import {TextInput, Text} from '../../../design/Typography';
import React, { useState } from "react";
import {CardHeading} from "../../../design/CardHeading";
import { Button } from "@src/commonComponent";
import { external } from "../../../styles/externalStyle";

import { PictureCargo } from "./pictureCargo/index";
import { useValues } from "@src/utils/context/index";
import { Asset } from "react-native-image-picker";
import { appColors } from "@src/themes";
import { CountryCodeContainer } from "@src/screens/auth/signIn/signInComponents";
import { useAppNavigation } from "@src/utils/navigation";
import styles from "./styles";
import { useDispatch, useSelector } from "react-redux";
import { vehicleTypeDataGet } from "@src/api/store/actions";
import { AppDispatch } from "@src/api/store";
import { GoodsVehicleKind, matchesGoodsVehicle, goodsWeightLimit } from "@src/utils/goodsServiceOptions";

export function Freight({ pickupLocation, stops, destination, service_ID, zoneValue, service_name, service_category_ID, scheduleDate, filteredLocations,
  pickupCoords, destinationCoords, stopsCoords, preferredVehicleKind }: { pickupLocation: string; stops: string[]; destination: string; service_ID: number | string; zoneValue: any; service_name: string; service_category_ID: number | string; scheduleDate?: any; filteredLocations: any[]; pickupCoords: any; destinationCoords: any; stopsCoords?: any[]; preferredVehicleKind?: GoodsVehicleKind }) {
  const dispatch = useDispatch<AppDispatch>();
  const { navigate } = useAppNavigation();
  const { bgContainer, textColorStyle, textRTLStyle, isDark } = useValues();
  const [selectedImage, setSelectedImage] = useState<Asset[] | null>(null);
  const [parcelWeight, setParcelWeight] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting);
  const [errors, setErrors] = useState<Partial<Record<'receiverName' | 'phoneNumber' | 'parcelWeight', string>>>({});
  const [error, setError] = useState("");
  const [bookloading, setBookLoading] = useState(false);


  const handleImageSelect = (imageUri: Asset[]) => {
    setSelectedImage(imageUri);
  };

  const validateGoods = () => {
    const newErrors: Partial<Record<'receiverName' | 'phoneNumber' | 'parcelWeight', string>> = {};

    if (!receiverName?.trim())
      newErrors.receiverName = 'Enter contact name';
    if (!phoneNumber?.trim())
      newErrors.phoneNumber = translateData.enterPhoneNumber;
    else if (countryCode === '+91' && !/^[6-9]\d{9}$/.test(phoneNumber.replace(/\s/g, '')))
      newErrors.phoneNumber = 'Enter a valid 10-digit Indian mobile number.';
    if (!parcelWeight?.trim()) {
      newErrors.parcelWeight = 'Enter weight';
    } else {
      const weight = Number(parcelWeight);
      const maxWeight = goodsWeightLimit(preferredVehicleKind) || Number(taxidoSettingData?.cabbooking_values?.ride?.parcel_weight_limit);
      if (!Number.isFinite(weight) || weight <= 0) {
        newErrors.parcelWeight = "Enter a weight greater than zero.";
      } else if (Number.isFinite(maxWeight) && maxWeight > 0 && weight > maxWeight) {
        newErrors.parcelWeight = `Maximum ${maxWeight} kg allowed.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const gotoRide = async () => {
    if (!validateGoods()) return;
    setBookLoading(true);

    const payload = {
      locations: filteredLocations,
      service_id: service_ID,
      service_category_id: service_category_ID,
      weight: parcelWeight,
    };

    try {
      const quote = await dispatch(vehicleTypeDataGet(payload)).unwrap();
      const vehicles = Array.isArray(quote) ? quote : quote?.data ?? [];
      const matchingVehicles = preferredVehicleKind
        ? vehicles.filter((vehicle: any) => matchesGoodsVehicle(vehicle, preferredVehicleKind))
        : vehicles;
      if (matchingVehicles.length === 0) {
        Alert.alert("No vehicle available", "This delivery option has no available quote for your route. Please choose another option.");
        return;
      }
      navigate("BookRide", {
        destination,
        stops,
        pickupLocation,
        service_ID,
        zoneValue,
        selectedImage,
        parcelWeight,
        service_name,
        receiverName,
        countryCode,
        phoneNumber,
        service_category_ID,
        preferredVehicleKind,
        scheduleDate,
        filteredLocations,
        pickupCoords,
        destinationCoords,
        stopsCoords,
      });
    } catch (quoteError: any) {
      Alert.alert("Quote unavailable", quoteError?.message || "Please try again in a moment.");
    } finally {
      setBookLoading(false);
    }
  };

  return (
    <View>
      {(service_name === "parcel" || service_name === "freight") && (
        <View style={{padding:18,borderRadius:22,borderWidth:1,borderColor:isDark?appColors.darkBorder:appColors.border,backgroundColor:isDark?"#202422":"#FFFFFF"}}>
          <CardHeading icon="user-round" title="Delivery details"/>
          <Text
            style={[
              styles.weightText,
              { color: textColorStyle, textAlign: textRTLStyle },
            ]}>
            Contact name
          </Text>
          <TextInput
            style={[styles.inputView, {
              backgroundColor: bgContainer,
              borderColor: isDark ? appColors.darkBorder : appColors.border,
              color: isDark ? appColors.darkText : appColors.blackColor,
              textAlign: textRTLStyle,
            }]}
            keyboardType="ascii-capable"
            placeholder="Enter contact name"
            placeholderTextColor={appColors.regularText}
            value={receiverName}
            onChangeText={text => setReceiverName(text)}
          />
          {errors.receiverName && (
            <Text style={styles.errorText}>{errors.receiverName}</Text>
          )}

          <Text
            style={[
              styles.parcelText,
              { color: textColorStyle, textAlign: textRTLStyle },
            ]}>
            Contact number
          </Text>
          <CountryCodeContainer
            countryCode={countryCode}
            setCountryCode={setCountryCode}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            backGroundColor={bgContainer}
            borderColor={isDark ? appColors.darkBorder : appColors.border}
            setError={setError}
            error={error}
          />

          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          )}

          <Text
            style={[
              styles.weightText,
              { color: textColorStyle, textAlign: textRTLStyle },
            ]}>
            {translateData.weightKg} (KG)
          </Text>
          <WeightPresets value={parcelWeight} onChange={setParcelWeight} dark={isDark}/>
          {errors.parcelWeight && (
            <Text style={styles.errorText}>{errors.parcelWeight}</Text>
          )}
        </View>
      )}

      <PictureCargo
        onImageSelect={handleImageSelect}
        service_name={service_name}
      />

      <View style={[external.mv_15]}>
        <Button title="Continue to quote" onPress={gotoRide} loading={bookloading} />
      </View>

    </View>
  );
}
