import {BrandLoader} from '../../../design/BrandLogo';
import {Image, TouchableOpacity, View, ActivityIndicator} from 'react-native';
import {Text} from '../../../design/Typography';
import React, { useEffect, useState } from "react";
import { styles } from "./styles";
import { appColors, windowHeight } from "@src/themes";
import { Gps, History, Search } from "@src/utils/icons";
import { useValues } from "@src/utils/context/index";
import { useAppNavigation } from "@src/utils/navigation";
import Images from "@src/utils/images";
import { useDispatch, useSelector } from "react-redux";
import { getValue } from "@src/utils/localstorage";
import { useIsFocused } from "@react-navigation/native";
import { vehicleTypeDataGet } from "@src/api/store/actions";
import { AppDispatch } from "@src/api/store";
import useStoredLocation from "@src/components/helper/useStoredLocation";

export function TopCategory({ categoryData }: any) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    null | string | any
  >(null);
  const {
    bgFullStyle,
    isDark,
    viewRTLStyle,
    textRTLStyle,
    Google_Map_Key,
    isRTL,
  } = useValues();
  const { navigate }: any = useAppNavigation();
  const { translateData } = useSelector((state: any) => state.setting);
  const [recentDatas, setRecentDatas] = useState<string[]>([]);
  const isFocused = useIsFocused();
  const dispatch = useDispatch<AppDispatch>();
  const [isLoadingOverlay, setIsLoadingOverlay] = useState<boolean>(false);
  const { latitude, longitude } = useStoredLocation();
  const { taxidoSettingData } = useSelector((state: any) => state.setting);
  const [fullAddress, setFullAddress] = useState<string>("");
  const [addressCoords, setAddressCoords] = useState<any | null>({
    lat: null,
    lng: null,
  });

  useEffect(() => {
    const getAddress = async () => {
      let lat = await getValue("user_latitude_Selected");
      let lng = await getValue("user_longitude_Selected");

      let finalLat = lat ? parseFloat(lat) : latitude;
      let finalLng = lng ? parseFloat(lng) : longitude;
      setAddressCoords({
        lat: finalLat,
        lng: finalLng,
      });
      if (!finalLat || !finalLng || !Google_Map_Key) return;

      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${finalLat},${finalLng}&key=${Google_Map_Key}&result_type=street_address`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK") {
          const fullAddr = data.results[0]?.formatted_address;

          setFullAddress(fullAddr || translateData?.noAddressFound);
        } else {
          setFullAddress(translateData?.noAddressFound);
          console.warn("Geocoding failed:", data.status);
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        setFullAddress(translateData?.noAddressError);
      }
    };
    getAddress();
  }, [latitude, longitude, taxidoSettingData, Google_Map_Key]);

  useEffect(() => {
    if (categoryData?.length > 0) {
      const defaultRide = categoryData.find(
        (item: any) => item?.slug === "ride",
      );
      setSelectedSubcategory(defaultRide || categoryData[0]);
    }
  }, [categoryData]);

  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        const stored = await getValue("locations");
        let parsedLocations = [];
        if (stored) {
          parsedLocations = JSON.parse(stored);
          if (!Array.isArray(parsedLocations)) {
            parsedLocations = [parsedLocations];
          }
        }
        setRecentDatas(parsedLocations);
      } catch (error) {
        console.error("Error parsing recent locations:", error);
        setRecentDatas([]); // fallback
      }
    };
    if (isFocused) {
      fetchRecentData(); // only run when screen is focused
    }
  }, [isFocused]);

  const handlePress = () => {
    const item: any = selectedSubcategory;

    if (!item) return;
    if (
      item?.slug == "intercity" ||
      item?.slug == "ride" ||
      item?.slug == "ride-freight" ||
      item?.slug == "intercity-freight" ||
      item?.slug == "intercity-parcel" ||
      item?.slug == "ride-parcel" ||
      item?.slug == "schedule-freight" ||
      item?.slug == "schedule-parcel"
    ) {
      navigate("Delivery", {
        service_ID: item?.service_id,
        service_name: item?.service_type,
        service_category_ID: item?.id,
        service_category_slug: item?.slug,
        defultAddress: fullAddress,
        defultCoords: addressCoords,
      });
    } else if (item?.slug == "package") {
      navigate("RentalLocation", {
        service_ID: item?.service_id,
        service_name: item?.service_type,
        service_category_ID: item?.id,
        service_category_slug: item?.slug,
      });
    } else if (item?.slug == "schedule") {
      navigate("Delivery", {
        service_ID: item?.service_id,
        service_name: item?.service_type,
        service_category_ID: item?.id,
        service_category_slug: item?.slug,
        defultAddress: fullAddress,
        defultCoords: addressCoords,
      });
    } else if (item?.slug == "rental") {
      navigate("RentalBooking", {
        service_ID: item?.service_id,
        service_name: item?.service_type,
        service_category_ID: item?.id,
        service_category_slug: item?.slug,
      });
    } else if (item?.service_type == 'finddriver') {
      navigate('FindLocationScreen', {
        service_ID: item?.service_id,
        service_name: item?.service_type,
        service_category_ID: item?.id,
        service_category_slug: item?.slug,
        defultAddress: fullAddress,
        defultCoords: addressCoords,
      });
    }
  };

  const convertToCoords = async (address: string) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${Google_Map_Key}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data?.results?.length > 0) {
        const { lat, lng } = data?.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } else {
        console.warn("No results for:", address, data?.status);
        return null;
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  const convertStopsToCoords = async (stopList: any[]) => {
    if (!stopList || stopList.length === 0) return [];

    const promises = stopList.map(async stop => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            stop,
          )}&key=${Google_Map_Key}`,
        );
        const data = await res.json();
        if (data.status === "OK" && data.results?.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          return { latitude: lat, longitude: lng };
        }
        return null;
      } catch (err) {
        console.error("Stop geocoding error:", err);
        return null;
      }
    });

    return Promise.all(promises);
  };

  const gotoBook = async (item: any) => {
    setIsLoadingOverlay(true);

    try {
      // 1. Get Pickup Coords - Use existing if available
      let pickupPromise;
      if (item?.pickupCoords?.lat && item?.pickupCoords?.lng) {
        pickupPromise = Promise.resolve({
          latitude: item.pickupCoords.lat,
          longitude: item.pickupCoords.lng,
        });
      } else {
        pickupPromise = convertToCoords(item?.pickupLocation);
      }

      // 2. Get Destination Coords - Use existing if available
      let destPromise;
      if (item?.destinationCoords?.lat && item?.destinationCoords?.lng) {
        destPromise = Promise.resolve({
          latitude: item.destinationCoords.lat,
          longitude: item.destinationCoords.lng,
        });
      } else {
        destPromise = convertToCoords(
          item?.destinationFullAddress?.shortAddress,
        );
      }

      // 3. Get Stops Coords
      const stopsPromise = convertStopsToCoords(item?.stops || []);

      // Execute all in parallel
      const [pickup, destination, stops] = await Promise.all([
        pickupPromise,
        destPromise,
        stopsPromise,
      ]);

      const rawLocations = [pickup, ...(stops || []), destination];

      const filteredLocations = rawLocations
        .filter(
          coord => coord && coord.latitude != null && coord.longitude != null,
        )
        .map((coord: any) => ({
          lat: coord.latitude,
          lng: coord.longitude,
        }));

      const payload: any = {
        locations: filteredLocations,
        service_id: item?.service_ID,
        service_category_id: item?.service_category_ID,
      };

      dispatch(vehicleTypeDataGet(payload)).then((res: any) => {
        navigate("BookRide", {
          destination: item?.destinationFullAddress?.shortAddress,
          stops: item?.stops,
          pickupLocation: item?.pickupLocation,
          service_ID: item?.service_ID,
          zoneValue: item?.zoneValue,
          scheduleDate: item?.scheduleDate,
          service_category_ID: item?.service_category_ID,
          service_name: item?.service_name,
          filteredLocations: filteredLocations,
          destinationCoords: item?.destinationCoords,
          pickupCoords: item?.pickupCoords,
        });
        setIsLoadingOverlay(false);
      });
    } catch (error) {
      console.error("Error in gotoBook:", error);
      setIsLoadingOverlay(false);
    }
  };

  return (
    <View style={styles.container}>
      {categoryData?.length > 0 && (
        <>
          {selectedSubcategory?.slug != "rental" &&
            selectedSubcategory?.slug != "package" && (
              <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                style={[
                  styles.packageMainView,
                  {
                    backgroundColor: bgFullStyle,
                    borderColor: isDark
                      ? appColors.darkBorder
                      : appColors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={translateData?.whereNext}
              >
                <View
                  style={styles.bookingCardBody}
                >
                  <View
                    style={[
                      styles.bookingFieldRow,
                      {
                        flexDirection: viewRTLStyle,
                        backgroundColor: isDark
                          ? appColors.darkPrimary
                          : appColors.lightGray,
                      },
                    ]}
                  >
                    <View style={styles.bookingFieldIcon}>
                      <Gps width={21} height={21} />
                    </View>
                    <View style={styles.bookingFieldCopy}>
                      <Text
                        style={[
                          styles.bookingFieldLabel,
                          { color: isDark ? appColors.gray : appColors.regularText },
                        ]}
                      >
                        {translateData?.pickupLocationTittle || "Pickup location"}
                      </Text>
                      <Text
                        numberOfLines={2}
                        ellipsizeMode="tail"
                        style={[
                          styles.bookingFieldValue,
                          { color: isDark ? appColors.whiteColor : appColors.primaryText },
                        ]}
                      >
                        {fullAddress || translateData?.currentLocation || "Current location"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.bookingFieldRow,
                      styles.bookingDestinationRow,
                      {
                        flexDirection: viewRTLStyle,
                        backgroundColor: isDark
                          ? appColors.darkPrimary
                          : appColors.lightGray,
                      },
                    ]}
                  >
                    <View style={styles.bookingFieldIcon}>
                      <Search />
                    </View>
                    <View style={styles.bookingFieldCopy}>
                      <Text
                        style={[
                          styles.bookingFieldLabel,
                          { color: isDark ? appColors.gray : appColors.regularText },
                        ]}
                      >
                        {translateData?.to || "To"}
                      </Text>
                      <Text
                        style={[
                          styles.bookingFieldValue,
                          { color: isDark ? appColors.gray : appColors.regularText },
                        ]}
                      >
                        {translateData?.enterDestinationPlaceholderText || "Enter destination"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.bookingProceed,
                      { backgroundColor: appColors.primary },
                    ]}
                  >
                    <Text style={styles.bookingProceedText}>
                      {translateData?.proceed || "Proceed"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          {!isLoadingOverlay &&
            recentDatas
              ?.filter(
                (item: any) =>
                  item?.service_name === selectedSubcategory?.service_type,
              )
              ?.slice(0, 2)
              .map((item: any, index: number) => (
                <React.Fragment key={index}>
                  {selectedSubcategory?.slug != "rental" &&
                    selectedSubcategory?.slug != "package" && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.centerLocation,
                            {
                              flexDirection: viewRTLStyle,
                              backgroundColor: isDark
                                ? appColors.darkPrimary
                                : appColors.whiteColor,
                              borderColor: isDark
                                ? appColors.darkBorder
                                : appColors.border,
                            },
                            index == 0 && { marginTop: windowHeight(12) },
                          ]}
                          onPress={() => gotoBook(item)}
                        >
                          <View
                            style={{
                              backgroundColor: isDark
                                ? appColors.darkHeader
                                : appColors.lightGray,
                              padding: windowHeight(8),
                              borderRadius: windowHeight(20),
                            }}
                          >
                            <History />
                          </View>
                          <View style={styles.recentTextContainer}>
                            <Text
                              style={[
                                styles.adajanText,
                                {
                                  color: isDark
                                    ? appColors.whiteColor
                                    : appColors.primaryText,
                                },
                                { textAlign: isRTL ? "right" : "left" },
                              ]}
                            >
                              {item?.destinationFullAddress?.shortAddress
                                ?.length > 30
                                ? item?.destinationFullAddress?.shortAddress?.slice(
                                  0,
                                  30,
                                ) + "..."
                                : item?.destinationFullAddress?.shortAddress}
                            </Text>
                            <Text
                              style={[
                                styles.titleTextDetail,
                                {
                                  textAlign: textRTLStyle,
                                },
                              ]}
                            >
                              {item?.destinationFullAddress?.detailAddress
                                ?.length > 30
                                ? item?.destinationFullAddress?.detailAddress?.slice(
                                  0,
                                  30,
                                ) + "..."
                                : item?.destinationFullAddress?.detailAddress}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View
                          style={[
                            styles.locationLine,
                            {
                              borderColor: isDark
                                ? appColors.darkBorder
                                : appColors.border,
                            },
                          ]}
                        />
                      </>
                    )}
                </React.Fragment>
              ))}
          {isLoadingOverlay && (
            <View style={styles.loaderAddress}>
              <BrandLoader size="large" color={appColors.primary} />
            </View>
          )}
          {selectedSubcategory?.slug == "rental" && (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
              <Image source={Images.rentalBanner} style={styles.rentalImage} />
            </TouchableOpacity>
          )}
          {selectedSubcategory?.slug == "package" && (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
              <Image source={Images.packagebanner} style={styles.rentalImage} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}
