import {SavedPlaceCard} from '../../../../design/SavedPlaceCard';
import {ReferenceScreen,ReferenceLogo} from '../../../../design/ReferenceChrome';
import React, { useState, useCallback, useMemo, useRef } from "react";
import {View, TouchableOpacity, ScrollView} from 'react-native';
import {Text} from '../../../../design/Typography';
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useDispatch, useSelector } from "react-redux";
import {
  userSaveLocation,
  deleteSaveLocation,
} from "@src/api/store/actions/saveLocationAction";
import { Button, notificationHelper, VerticalLine } from "@src/commonComponent";
import { NoInternet } from "@src/components";
import { useValues } from "@src/utils/context/index";
import { styles } from "./style";
import { external } from "../../../../styles/externalStyle";
import { commonStyles } from "../../../../styles/commonStyle";
import { appColors, fontSizes, windowHeight } from "@src/themes";
import {
  Delete,
  Edit,
  Back,
  Add,
  HomeLocation,
  WorkLocation,
  OtherLocation,
  Copy,
  PickLocation,
} from "@utils/icons";
import Images from "@src/utils/images";
import { LocationLoader } from "./locationLoader";
import { deleteValue } from "@src/utils/localstorage";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import appFonts from "@src/themes/appFonts";
import LottieView from "lottie-react-native";

import { indianCoordinates } from "@src/utils/deliveryPlaces";
import {usePlaceCategories} from '../../../../utils/usePlaceCategories';
import {groupSavedPlaces} from '../../../../utils/groupSavedPlaces';

export function SavedLocation() {
  const {
    bgFullStyle,
    linearColorStyle,
    textColorStyle,
    viewRTLStyle,
    textRTLStyle,
    isDark,
    Google_Map_Key,
  } = useValues();
  const { translateData } = useSelector((state: any) => state.setting);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { saveLocationDataGet, statusCode, loading } = useSelector(
    (state: any) => state.saveLocation,
  );
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const {categories}=usePlaceCategories(Array.isArray(saveLocationDataGet?.data)?saveLocationDataGet.data:[],false);
  const {
    selectedLocation,
    savefield,
    service_ID,
    service_name,
    service_category_ID,
    service_category_slug,
    preferredVehicleKind,
    formattedDate,
    formattedTime,
  } = route.params || {};
  const deleteBottomSheetRef = useRef<BottomSheet>(null);
  const deleteSnapPoints = useMemo(() => ["1%", "35%"], []);
  const deleteInFlight = useRef(false);

  useFocusEffect(
    useCallback(() => {
      (dispatch as any)(userSaveLocation());
    }, [dispatch]),
  );
  
  const gotoAdd = useCallback(() => {
    navigation.navigate("LocationSave");
  }, [navigation]);

  const editAddress = useCallback(
    (locationDetails: any) => {
      navigation.navigate("LocationSave", {
        mode: "edit",
        locationID: locationDetails?.id,
        locationDetails: locationDetails,
      });
    },
    [navigation],
  );

  const openDeleteBottomSheet = useCallback((itemId: number) => {
    setSelectedItemId(itemId);
    deleteBottomSheetRef.current?.expand();
  }, []);

  const closeDeleteBottomSheet = useCallback(() => {
    setSelectedItemId(null);
    deleteBottomSheetRef.current?.close();
  }, []);

  const handleBottomSheetChanges = useCallback(
    (index: number) => {
      if (index <= 0 && selectedItemId !== null) {
        closeDeleteBottomSheet();
      }
    },
    [selectedItemId, closeDeleteBottomSheet],
  );

  const deleteAddress = useCallback(() => {
    if (deleteInFlight.current) return;
    if (selectedItemId !== null) {
      deleteInFlight.current = true;
      dispatch(deleteSaveLocation(selectedItemId))
        .unwrap()
        .then((res: any) => {
          if (res.status == 403) {
            notificationHelper("", translateData.loginAgain, "error");
            deleteValue("token").then(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: "SignIn" }],
              });
            });
            return;
          }
          if (res.status === 200) {
            notificationHelper("", translateData.addressDelSuccess, "success");
            dispatch(userSaveLocation());
          }
        })
        .catch(error => {
          console.error("Delete location error:", error);
          notificationHelper("", translateData.failDelAddress, "error");
        })
        .finally(() => {
          deleteInFlight.current = false;
          closeDeleteBottomSheet();
        });
    }
  }, [dispatch, selectedItemId, closeDeleteBottomSheet, navigation]);

  const getCoordinatesFromAddress = async (address: string) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&components=country:IN&key=${Google_Map_Key}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results?.length > 0) {
        const location = data.results[0].geometry.location;
        return indianCoordinates(location.lat, location.lng);
      } else {
        throw new Error("No location found");
      }
    } catch (error) {
      console.error("Geocoding Error:", error);
      return null;
    }
  };

  const selectLocation = useCallback(
    async (item: any) => {
      const location = item.location;
      const coordinates = indianCoordinates(item.location_coordinates?.lat, item.location_coordinates?.lng)
        || await getCoordinatesFromAddress(location);

      if (!coordinates) {
        notificationHelper("", translateData.failedCoordinates, "danger");
        return;
      }

      const { lat, lng } = coordinates;
      const screenName = selectedLocation === "findLocationScreen" ? "FindLocationScreen" : "Ride";

      if (selectedLocation === "homeScreen") {
        navigation.navigate("MyTabs" as never, {
          screen: "HomeScreen",
          params: {
            selectedAddress: location,
            fieldValue: savefield || "destination",
            pinLatitude: lat,
            pinLongitude: lng,
            service_ID,
            service_name,
            service_category_ID,
            service_category_slug,
            preferredVehicleKind,
            formattedDate,
            formattedTime,
          },
        } as never);
        return;
      }

      if (selectedLocation === "locationDrop" || selectedLocation === "findLocationScreen") {
        navigation.navigate(screenName, {
          selectedAddress: location,
          fieldValue: savefield,
          pinLatitude: lat,
          pinLongitude: lng,
          service_ID: service_ID,
          service_name: service_name,
          service_category_ID: service_category_ID,
          service_category_slug: service_category_slug,
          preferredVehicleKind,
          formattedDate: formattedDate,
          formattedTime: formattedTime,
        });
      } else {
        Clipboard.setString(`${location} (Lat: ${lat}, Lng: ${lng})`);
        notificationHelper("", translateData.copyClipboard, "success");
      }
    },
    [navigation, selectedLocation, savefield, translateData, Google_Map_Key, service_ID, service_name, service_category_ID, service_category_slug, preferredVehicleKind, formattedDate, formattedTime]
  );

  const renderLocationIcon = (type: string) => {
    switch (type) {
      case "home":
        return <HomeLocation />;
      case "work":
        return <WorkLocation />;
      default:
        return <OtherLocation />;
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  const renderSavedLocationList = useMemo(() => {
    if (!saveLocationDataGet?.data?.length) {
      return (
        <View style={[styles.noDataContainer, { flexDirection: viewRTLStyle }]}>
          <NoInternet
            btnHide
            title={translateData.noLocation}
            details={translateData.noLocationDes}
            image={isDark ? Images.noLocationDark : Images.noLocation}
            infoIcon
            status={`${translateData.statusCode}: ${statusCode}`}
          />
        </View>
      );
    }

    return (
      <ScrollView
        style={[styles.mainView, external.mh_20]}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{paddingBottom:40}}
      >
        {groupSavedPlaces(saveLocationDataGet.data,categories).map(group=><View key={group.name.toLowerCase()} style={{marginBottom:12}}>
          <Text accessibilityRole="header" style={{color:textColorStyle,fontSize:18,fontWeight:'700',marginBottom:10,marginTop:8}}>{group.name} ({group.items.length})</Text>
          {group.items.length?group.items.map((item:any)=><SavedPlaceCard key={item.id} item={{...item,displayCategory:group.name}} dark={isDark} selecting={!!selectedLocation}
            onOpen={()=>selectedLocation?selectLocation(item):editAddress(item)} onUse={()=>selectLocation(item)} onEdit={()=>editAddress(item)} onDelete={()=>openDeleteBottomSheet(item.id)}/>):<Text style={{color:isDark?'#C5CAD0':'#656C76',marginBottom:12}}>No saved addresses yet.</Text>}
        </View>)}
      </ScrollView>
    );
  }, [
    saveLocationDataGet,
    categories,
    bgFullStyle,
    isDark,
    textColorStyle,
    textRTLStyle,
    viewRTLStyle,
    selectLocation,
    editAddress,
    openDeleteBottomSheet,
    translateData.noLocation,
    translateData.noLocationDes,
    translateData.statusCode,
    statusCode,
  ]);

  return (
    <ReferenceScreen><View style={[[styles.container, { backgroundColor: linearColorStyle }], {backgroundColor:'transparent'}]}>
      <View style={{alignItems:'center',paddingTop:12,paddingBottom:6,backgroundColor:bgFullStyle}}><ReferenceLogo width={130}/></View>
      <View
        style={{
          backgroundColor: isDark ? appColors.darkHeader : appColors.whiteColor,
        }}
      >
        <View
          style={[styles.headerContainers, { flexDirection: viewRTLStyle }]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={navigation.goBack}
            style={[
              styles.backButton,
              { borderColor: isDark ? appColors.darkBorder : appColors.border },
            ]}
          >
            <Back />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: textColorStyle }]}>
            Saved Locations
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add saved location"
            style={[
              styles.backButton,
              { borderColor:appColors.primary, backgroundColor:appColors.primary },
            ]}
            onPress={gotoAdd}
          >
            <Add colors="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{marginHorizontal:20,marginTop:16,marginBottom:4,padding:16,borderRadius:18,backgroundColor:isDark?'#332B1C':'#FFF5E5'}}><Text style={{fontSize:17,fontWeight:'700',color:textColorStyle}}>Keep your everyday places close</Text><Text style={{fontSize:13,lineHeight:19,color:isDark?"#BBC1CA":appColors.regularText,marginTop:5}}>Save an address once. Choose it whenever you book a delivery.</Text></View>
      <View style={styles.locationListView}>
        {loading
          ? Array.from({ length: 10 }).map((_, index) => (
            <View key={index} style={{ marginBottom: windowHeight(12) }}>
              <LocationLoader />
            </View>
          ))
          : renderSavedLocationList}
      </View>

      {!loading && (
        <BottomSheet
          ref={deleteBottomSheetRef}
          index={-1}
          snapPoints={deleteSnapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={handleBottomSheetChanges}
          style={{ zIndex: 5 }}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          backgroundStyle={{ backgroundColor: bgFullStyle }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView>
            <View>
              <View style={{ alignSelf: "center" }}>
                <LottieView
                  source={require("../../../../assets/images/payment/delete.json")}
                  style={{ height: windowHeight(80), width: windowHeight(80) }}
                  resizeMode="center"
                />
              </View>
              <View
                style={{
                  width: "100%",
                  paddingHorizontal: windowHeight(50),
                  marginTop: windowHeight(2),
                }}
              >
                <Text
                  style={[
                    commonStyles.mediumText23,
                    external.ti_center,
                    {
                      color: textColorStyle,
                      fontFamily: appFonts.medium,
                      fontSize: fontSizes.FONT21,
                      textAlign: "center",
                      top: windowHeight(10),
                    },
                  ]}
                >
                  {translateData.deleteAddress}
                </Text>
              </View>

              <View
                style={[
                  external.mt_25,
                  {
                    flexDirection: viewRTLStyle,
                    gap: 10,
                    left: windowHeight(15),
                    top: windowHeight(15),
                  },
                ]}
              >
                <Button
                  backgroundColor={appColors.lightGray}
                  title={translateData.cancel}
                  width="43.5%"
                  onPress={closeDeleteBottomSheet}
                  textColor={appColors.primaryText}
                />
                <Button
                  backgroundColor={appColors.textRed}
                  title={translateData.deleteBtn}
                  width="43.5%"
                  onPress={deleteAddress}
                />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheet>
      )}
    </View></ReferenceScreen>
  );
}
