import {useKeyboardState} from '../../../utils/useKeyboardState';
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {SafeAreaView, View, BackHandler, StyleSheet, Image, Keyboard} from 'react-native';
import {Text} from '../../../design/Typography';
import { useIsFocused } from "@react-navigation/native";
import { commonStyles } from "../../../styles/commonStyle";
import { TodayOfferContainer } from "../../../components/homeScreen/todaysOffer";
import { HomeSlider } from "../../../components/homeScreen/slider";
import { HeaderContainer } from "../../../components/homeScreen/headerContainer";
import styles from "./styles";
import { useValues } from '@src/utils/context/index';
import { Button } from "@src/commonComponent";
import { external } from "../../../styles/externalStyle";
import { appColors, appFonts, fontSizes, windowHeight } from "@src/themes";
import { useDispatch, useSelector } from "react-redux";
import { vehicleData } from "../../../api/store/actions/vehicleTypeAction";
import { useAppNavigation } from "@src/utils/navigation";
import { BottomTitle } from "@src/components";
import { allRides, homeScreenData, notificationDataGet, paymentsData, serviceDataGet, taxidosettingDataGet, userSaveLocation, walletData } from "@src/api/store/actions";
import { HomeLoader } from "../HomeLoader";
import useStoredLocation from "@src/components/helper/useStoredLocation";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { getValue } from "@src/utils/localstorage";
import { userZone } from "@src/api/store/actions";
import Images from "@src/utils/images";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DynamicIceland from "../../../components/homeScreen/DynamicIceland";
import { LocationDrop } from "@src/screens/locationDrop";
import { getGoodsServiceOptions } from "@src/utils/goodsServiceOptions";
import {FestiveHomeHero} from '../../../design/FestiveHomeHero';
import {ReferenceScreen} from '../../../design/ReferenceChrome';

export function HomeScreen() {
  const dispatch = useDispatch();
  const { textColorStyle, viewRTLStyle, isDark, bgFullStyle, setIsRTL, isRTL } = useValues();
  const isFocused = useIsFocused();
  const {visible:keyboardVisible}=useKeyboardState();
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting);
  const { reset } = useAppNavigation();
  const { self } = useSelector((state: any) => state.account);
  const { homeScreenData: homeScreenDataPrimary, loading } = useSelector((state: any) => state.home);
  const { serviceData } = useSelector((state: any) => state.service);
  const { latitude, longitude } = useStoredLocation();
  const exitBottomSheetRef = useRef<BottomSheet>(null);
  const exitSnapPoints = useMemo(() => ["1%", "22%"], []);
  const [serviceAvilable, setServiceAvailable] = useState<null | boolean>(null);
  const [currentRideReqData, setCurrentRideReqData] = useState<any>(null);

  const getVehicleTypes = useCallback(async () => {
    dispatch(vehicleData() as any);
  }, [dispatch]);
  useEffect(() => {
    const loadLanguageFromStorage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
        if (savedLanguage == "ar") {
          setIsRTL(true);
        } else if (isRTL) {
          setIsRTL(true);
        } else {
          setIsRTL(false);
        }
      } catch (error) {
        console.error("Error loading language from storage:", error);
      }
    };
    loadLanguageFromStorage();
  }, [isRTL, setIsRTL]);

  const [loaderService, setLoaderService] = useState(false);

  useEffect(() => {
    const delay = (ms: number) => new Promise(res => setTimeout(() => res(true), ms));
    if (!isFocused) return;
    const init = async () => {
      await dispatch(allRides() as any);
      await dispatch(serviceDataGet() as any);
      await dispatch(homeScreenData({ service: 'parcel' }) as any);

      await delay(300);
      dispatch(vehicleData() as any);

      await delay(300);
      dispatch(walletData() as any);

      dispatch(paymentsData() as any);
      dispatch(notificationDataGet() as any);
      dispatch(userSaveLocation() as any);

      getVehicleTypes();
    };
    init();
  }, [dispatch, getVehicleTypes, isFocused]);

  useEffect(() => {
    if(!isFocused)return;
    let disposed=false;
    const getAddress = async () => {
      let lat = await getValue("user_latitude_Selected");
      let lng = await getValue("user_longitude_Selected");
      let finalLat = lat ? parseFloat(lat) : latitude;
      let finalLng = lng ? parseFloat(lng) : longitude;

      if (!finalLat || !finalLng) return;

      try {
        setLoaderService(true);
        const zone=await dispatch(
          userZone({ lat: finalLat.toString(), lng: finalLng.toString() }) as any,
        ).unwrap();
        if(!disposed)setServiceAvailable(Boolean(zone?.id));
      } catch (error) {
        console.error("Error fetching address:", error);
        // A failed network request is not an authoritative unavailable zone.
      } finally {
        if(!disposed)setLoaderService(false);
      }
    };

    getAddress();
    return()=>{disposed=true;};
  }, [dispatch, latitude, longitude, taxidoSettingData,isFocused]);



  useEffect(() => {
    const backAction = () => {
      exitBottomSheetRef.current?.expand();
      return true;
    };
    if (isFocused) {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );
      return () => backHandler.remove();
    }
  }, [isFocused]);

  const exitAndRestart = useCallback(() => {
    exitBottomSheetRef.current?.close();
    setTimeout(() => {
      BackHandler.exitApp();
      reset({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    }, 500);
  }, [reset]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  

  const isDataEmpty =
    !homeScreenDataPrimary ||
    Object.keys(homeScreenDataPrimary).length === 0 ||
    homeScreenDataPrimary === null;

  const defaultDelivery = getGoodsServiceOptions(serviceData?.data)[0];
  const rideCategory = defaultDelivery && {
    id: defaultDelivery.categoryId,
    slug: defaultDelivery.categorySlug,
    service_id: defaultDelivery.serviceId,
    service_type: defaultDelivery.serviceType,
  };
  const homeFeed = (
    <>
      <TodayOfferContainer title="Promos & coupons" couponsData={homeScreenDataPrimary?.coupons || []} serviceId={defaultDelivery?.serviceId} />
    </>
  );


  return (
    <ReferenceScreen><View
      style={[
        commonStyles.flexContainer,
        { backgroundColor: isDark ? appColors.bgDark : appColors.lightGray },
      ]}>
      {(!serviceAvilable || !rideCategory || isDataEmpty) && !keyboardVisible && <FestiveHomeHero/>}
      {/* Refresh existing data in the background so returning from the map or
          Saved Locations keeps the mounted booking form and its other stops. */}
      {isDataEmpty ? (
        <HomeLoader />
      ) : serviceAvilable === null ? (
        <HomeLoader />
      ) : serviceAvilable && rideCategory ? (
        <View style={{ flex: 1 }}>
        <LocationDrop
          key={defaultDelivery?.key}
          embedded
          festive
          inlineHeader={editing=><FestiveHomeHero paused={editing}/>}
          serviceParams={{
            service_ID: rideCategory?.service_id,
            service_name: rideCategory?.service_type,
            service_category_ID: rideCategory?.id,
            service_category_slug: rideCategory?.slug,
            preferredVehicleKind: defaultDelivery?.vehicleKind,
            defultAddress: "",
            defultCoords: { lat: latitude, lng: longitude },
          }}
          inlineFooter={homeFeed}
        />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Image
            source={isDark ? Images.noServiceDark : Images.noServices}
            resizeMode="contain"
            style={styles.image}
          />
          <Text
            style={[
              styles.titles,
              {
                color: isDark ? appColors.whiteColor : appColors.primaryText,
              },
            ]}>
            {translateData?.ServiceUnavailableNo}
          </Text>
        </View>
      )}

      {currentRideReqData && <DynamicIceland rideData={currentRideReqData} />}

      <BottomSheet
        ref={exitBottomSheetRef}
        index={-1}
        snapPoints={exitSnapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        style={{ zIndex: 2 }}
        handleIndicatorStyle={{
          backgroundColor: appColors.primary,
          width: "13%",
        }}
        backgroundStyle={{ backgroundColor: bgFullStyle }} android_keyboardInputMode="adjustResize" >
        <BottomSheetView
          style={[
            bottomSheetStyles.contentContainer,
            {
              backgroundColor: isDark
                ? appColors.darkHeader
                : appColors.whiteColor,
            },
          ]}>
          <View style={styles.modelView}>
            <Text
              style={[
                external.ti_center,
                {
                  color: textColorStyle,
                  fontFamily: appFonts.medium,
                  fontSize: fontSizes.FONT22,
                  paddingVertical: windowHeight(10),
                },
              ]}>
              {translateData?.exitTitle}
            </Text>
          </View>
          <View
            style={[
              external.ai_center,
              external.js_space,

              { flexDirection: viewRTLStyle, marginTop: windowHeight(8) },
            ]}>
            <Button
              width={"47%" as any}
              title={translateData?.no}
              onPress={() => exitBottomSheetRef.current?.close()}
            />
            <Button
              width={"47%" as any}
              backgroundColor={
                isDark ? appColors.darkPrimary : appColors.lightGray
              }
              title={translateData?.yes}
              textColor={isDark ? appColors.darkText : appColors.primaryText}
              onPress={exitAndRestart}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View></ReferenceScreen>
  );
}

const bottomSheetStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: windowHeight(15),
    backgroundColor: appColors.whiteColor,
  },
});
