import {DeliveryProgressCard} from '../../components/deliveryProgress';
import {mapVehicleMarker} from '../../design/mapVehicleMarkers';
import {reportBookingRouteEta} from '../../utils/bookingSignals';
import {BrandLoader} from '../../design/BrandLogo';
import {AppState, View, TouchableOpacity, Linking, StyleSheet, Image, Platform, ActivityIndicator} from 'react-native';
import {Text} from '../../design/Typography';
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Map, notificationHelper } from "@src/commonComponent";
import styles from "./styles";
import { useValues } from "@src/utils/context/index";
import { DriverData } from "./component/driverData/index";
import { TotalFare } from "./component/totalFare/index";
import { useRoute } from "@react-navigation/native";
import { CustomBackHandler } from "@src/components";
import { useAppNavigation } from "@src/utils/navigation";
import { external } from "@src/styles/externalStyle";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import {
  appColors,
  appFonts,
  fontSizes,
  windowHeight,
  windowWidth,
} from "@src/themes";
import { useDispatch, useSelector } from "react-redux";
import { allRides, sosData, allRide } from "@src/api/store/actions";
import getEchoInstance from "@src/utils/echo";
import { Edit, Shield } from "@src/utils/icons";
import NativeAdComponent from "@src/commonComponent/ads/google/NativeAdCard";
import RideReviewPrompt from "@src/components/rideReviewPrompt";
import { getValue, setValue } from "@src/utils/localstorage";


export function Payment() {
  const { bgFullStyle } = useValues();
  const { navigate, reset } = useAppNavigation();
  const route = useRoute();
  const { rideId } = route.params as { rideId: string };
  const [rideDatas, setRideData] = useState<any>(null);
  const [reviewPromptVisible, setReviewPromptVisible] = useState(false);
  const reviewPromptRequestedRef = useRef(false);
  const reviewPromptOpenRef = useRef(false);
  const paymentCompleteRef = useRef(false);
  const [duration, setDuration] = useState(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const sosSheetRef = useRef<BottomSheetModal>(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const { taxidoSettingData } = useSelector((state: any) => state.setting);

  const waypoints = useMemo(() => {
    if (
      !rideDatas?.location_coordinates ||
      rideDatas.location_coordinates.length <= 2
    )
      return [];
    const stops = rideDatas.location_coordinates
      .slice(1, -1)
      .map((coord: any) => ({
        lat: parseFloat(coord.lat),
        lng: parseFloat(coord.lng),
      }));
    return stops;
  }, [rideDatas?.location_coordinates]);

  const snapPoints = useMemo(() => {
    const adsEnabled =
      taxidoSettingData?.cabbooking_values?.ads?.native_enable == 1;
    const isIos = Platform.OS === "ios";

    const collapsed = isIos ? "31%" : "29%";
    let expanded;

    if (adsEnabled) {
      expanded = isIos ? "63%" : "65%";
    } else {
      expanded = isIos ? "40%" : "42%";
    }

    return [collapsed, expanded];
  }, [taxidoSettingData?.cabbooking_values?.ads?.native_enable]);
  const sosSnapPoints = useMemo(() => ["35%"], []);
  const dispatch = useDispatch();
  const { zoneValue } = useSelector((state: any) => state.zone);
  const { sosValue } = useSelector((state: any) => state.sos);
  const { isDark, viewRTLStyle } = useValues();
  const { translateData } = useSelector((state: any) => state.setting);

  const maybePromptForRideReview = useCallback(async (ride: any) => {
    const currentRide = ride?.data?.data ?? ride?.data ?? ride;
    if (
      reviewPromptRequestedRef.current ||
      currentRide?.ride_status?.slug !== "completed" ||
      currentRide?.riderReview != null
    ) {
      return;
    }

    const dismissed = await getValue(`dropa2z_review_prompt_dismissed_${rideId}`);
    if (dismissed === "true" || reviewPromptRequestedRef.current) return;

    reviewPromptRequestedRef.current = true;
    reviewPromptOpenRef.current = true;
    setReviewPromptVisible(true);
  }, [rideId]);

  const closeRideReviewPrompt = useCallback(() => {
    reviewPromptOpenRef.current = false;
    setReviewPromptVisible(false);
    void setValue(`dropa2z_review_prompt_dismissed_${rideId}`, "true");
    if (paymentCompleteRef.current) {
      reset({ index: 0, routes: [{ name: "MyTabs" }] });
    }
  }, [reset, rideId]);

  const finishPaymentFlow = useCallback(() => {
    if (paymentCompleteRef.current) return;
    paymentCompleteRef.current = true;
    if (!reviewPromptOpenRef.current) {
      notificationHelper("", "Payment Complete", "success");
      reset({ index: 0, routes: [{ name: "MyTabs" }] });
    }
  }, [reset]);

  useEffect(() => {
    if (!rideId) return;

    let echoInstance: any = null;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let screenActive = true;
    let requestInFlight = false;

    const checkRideStatus = async () => {
      if (!screenActive || requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await dispatch(
          allRide({ ride_id: Number(rideId) }) as any,
        ).unwrap();
        if (!screenActive) return;
        if (response?.status >= 400) {
          throw new Error(response?.data?.message || "Could not refresh this trip.");
        }

        const currentRide = response?.data?.data ?? response?.data ?? response;
        if (!currentRide || String(currentRide.id) !== String(rideId)) return;

        setRideData((previous: any) => {
          if (
            previous &&
            previous?.ride_status?.slug === currentRide?.ride_status?.slug &&
            previous?.payment_status === currentRide?.payment_status &&
            previous?.riderReview?.id === currentRide?.riderReview?.id &&
            previous?.total === currentRide?.total &&
            previous?.total_extra_charge === currentRide?.total_extra_charge &&
            JSON.stringify(previous?.parcel_delivery_progress) === JSON.stringify(currentRide?.parcel_delivery_progress)
          ) {
            return previous;
          }
          return currentRide;
        });

        await maybePromptForRideReview(currentRide);
        if (
          currentRide?.ride_status?.slug === "completed" &&
          currentRide?.payment_status === "COMPLETED"
        ) {
          finishPaymentFlow();
        }
      } catch (err: any) {
        console.error("Failed to poll ride state:", err);
      } finally {
        requestInFlight = false;
      }
    };

    void checkRideStatus();
    pollingInterval = setInterval(() => void checkRideStatus(), 5000);
    const appStateSubscription = AppState.addEventListener("change", state => {
      if (state === "active") void checkRideStatus();
    });

    const setupEchoListener = async () => {
      try {
        echoInstance = await getEchoInstance();
        if (!screenActive || !echoInstance) return;
        echoInstance
          .private(`ride-status.${rideId}`)
          .listen(".ride.status", (e: any) => {
            const data = e.data || e;
            const currentRide = data?.data?.data ?? data?.data ?? data?.ride ?? data;
            if (!currentRide || String(currentRide.id) !== String(rideId)) return;
            setRideData(currentRide);
            void maybePromptForRideReview(currentRide).then(() => {
              if (
                currentRide?.ride_status?.slug === "completed" &&
                currentRide?.payment_status === "COMPLETED"
              ) finishPaymentFlow();
            });
          });
      } catch (error) {
        console.error("Error setting up Echo listener:", error);
      }
    };
    void setupEchoListener();

    return () => {
      screenActive = false;
      if (pollingInterval) clearInterval(pollingInterval);
      appStateSubscription?.remove();
      if (echoInstance && rideId) {
        echoInstance.leave(`ride-status.${rideId}`);
      }
    };
  }, [rideId, dispatch, maybePromptForRideReview, finishPaymentFlow]);

  useEffect(() => {
    bottomSheetRef.current?.present();
    if (zoneValue?.id) {
      // @ts-ignore - sosData accepts zone_id parameter
      dispatch(sosData(zoneValue.id));
    }
  }, [zoneValue, dispatch]);

  const handlePress = (rideDatas: any) => {
    navigate("PaymentMethod" as any, { rideData: rideDatas } as any);
    dispatch(allRides() as any);
  };

  const handleDurationChange = (newDuration: any) => {
    setDuration(newDuration);
    reportBookingRouteEta(rideId,'trip',newDuration);
  };

  const handleSOSPress = () => {
    sosSheetRef.current?.present();
  };

  const handleContactPress = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleAddressChange = (locationIndex: number) => {
    navigate(
      "AddressChange" as any,
      { rideId, rideDatas, locationIndex } as any,
    );
  };

  const renderSosItem = useCallback(
    ({ item }: { item: any }) => (
      <View
        style={{
          marginHorizontal: windowWidth(18),
          borderRadius: windowHeight(5),
        }}
      >
        <TouchableOpacity
          style={[
            componentStyles.sosItem,
            {
              backgroundColor: isDark
                ? appColors.darkHeader
                : appColors.lightGray,
            },
          ]}
          onPress={() => handleContactPress(item.number)}
        >
          <View style={{ flexDirection: viewRTLStyle }}>
            <Image
              source={{ uri: item.sos_image_url }}
              style={styles.sosImage}
            />
            <View
              style={[
                styles.sideLine,
                {
                  backgroundColor: isDark
                    ? appColors.darkBorder
                    : appColors.border,
                },
              ]}
            />
            <Text
              style={[
                componentStyles.sosName,
                { color: isDark ? appColors.darkText : appColors.primaryText },
              ]}
            >
              {item?.title}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    ),
    [isDark, viewRTLStyle],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const destinationCoordinates = rideDatas?.location_coordinates?.length
    ? rideDatas.location_coordinates[rideDatas.location_coordinates.length - 1]
    : null;
  const hasValidMapDestination = Boolean(
    destinationCoordinates &&
    Number.isFinite(parseFloat(destinationCoordinates.lat)) &&
    Number.isFinite(parseFloat(destinationCoordinates.lng)),
  );

  return (
    <BottomSheetModalProvider>
      <View style={external.main}>
        <CustomBackHandler />
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            onPress={handleSOSPress}
            style={{
              position: "absolute",
              zIndex: 1,
              height: windowHeight(30),
              width: windowWidth(110),
              backgroundColor: isDark
                ? appColors.darkHeader
                : appColors.whiteColor,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              top: windowHeight(15),
              right: windowWidth(15),
              borderRadius: windowHeight(5),
              paddingLeft: windowHeight(5),
              borderWidth: 1,
              borderColor: isDark ? appColors.darkBorder : appColors.border,
            }}
          >
            <Shield color={appColors.primary} />
            <Text
              style={{
                fontFamily: appFonts.medium,
                color: isDark ? appColors.whiteColor : appColors.primaryText,
                marginHorizontal: windowWidth(8),
              }}
            >
              Safety
            </Text>
          </TouchableOpacity>

          {hasValidMapDestination ? (
            <Map
              markerImage={mapVehicleMarker(rideDatas?.vehicle_type,rideDatas?.vehicle_type?.vehicle_map_icon_url)}
              userLocation={destinationCoordinates}
              waypoints={waypoints}
              onDurationChange={handleDurationChange}
              driverId={rideDatas?.driver?.id || ""}
              driverLocation={driverLocation}
              setDriverLocation={setDriverLocation}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? appColors.bgDark : appColors.lightGray,
              }}
            >
              <BrandLoader size="large" color={appColors.primary} />
            </View>
          )}
        </View>

        <BottomSheetModal
          ref={bottomSheetRef}
          index={1}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          enableDismissOnClose={false}
          handleComponent={null}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          backgroundStyle={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: isDark
              ? appColors.darkHeader
              : appColors.whiteColor,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView style={{ paddingHorizontal: 16 }}>
            <View style={styles.mainView}>
              <DeliveryProgressCard ride={rideDatas}/><DriverData driverDetails={rideDatas} duration={duration} />
              <View style={{ marginTop: windowHeight(4) }}>
                {rideDatas?.locations?.length > 2 &&
                  rideDatas.locations
                    .slice(1, -1)
                    .map((location: string, index: number) => {
                      const actualIndex = index + 1;
                      return (
                        <View
                          key={`stop-${index}`}
                          style={[
                            external.fd_row,
                            {
                              backgroundColor: isDark
                                ? appColors.bgDark
                                : appColors.lightGray,
                              borderRadius: windowHeight(5),
                              padding: windowHeight(10),
                              marginBottom: windowHeight(6),
                              justifyContent: "space-between",
                              alignItems: "center",
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: appFonts.semiBold,
                                fontSize: fontSizes.FONT18,
                                color: isDark
                                  ? appColors.whiteColor
                                  : appColors.primaryText,
                                marginBottom: windowHeight(4),
                              }}
                            >
                              {translateData.stop} {index + 1}
                            </Text>
                            <Text
                              style={{
                                fontFamily: appFonts.regular,
                                fontSize: fontSizes.FONT13,
                                color: appColors.regularText,
                              }}
                              numberOfLines={1}
                            >
                              {location}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleAddressChange(actualIndex)}
                            style={{
                              marginLeft: windowWidth(10),
                              paddingLeft: windowWidth(10),
                              borderLeftWidth: 1,
                              borderLeftColor: isDark
                                ? appColors.darkBorder
                                : appColors.border,
                            }}
                          >
                            <Edit color={appColors.primary} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}

                {rideDatas?.locations?.[rideDatas?.locations?.length - 1] &&
                  (rideDatas?.service_category?.slug === "ride" ||
                    rideDatas?.service_category?.slug === "intercity" ||
                    rideDatas?.service_category?.slug === "schedule") && (
                    <TouchableOpacity
                      onPress={() =>
                        handleAddressChange(rideDatas.locations?.length - 1)
                      }
                      style={[
                        external.fd_row,
                        {
                          backgroundColor: isDark
                            ? appColors.bgDark
                            : appColors.lightGray,
                          borderRadius: windowHeight(5),
                          padding: windowHeight(10),
                          justifyContent: "space-between",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: appFonts.semiBold,
                            fontSize: fontSizes.FONT18,
                            color: isDark
                              ? appColors.whiteColor
                              : appColors.primaryText,
                            marginBottom: windowHeight(4),
                          }}
                        >
                          {translateData.destination}
                        </Text>
                        <Text
                          style={{
                            fontFamily: appFonts.regular,
                            fontSize: fontSizes.FONT15,
                            color: appColors.regularText,
                          }}
                          numberOfLines={1}
                        >
                          {rideDatas.locations[rideDatas.locations?.length - 1]}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          handleAddressChange(rideDatas.locations?.length - 1)
                        }
                        style={{
                          marginLeft: windowWidth(10),
                          paddingLeft: windowWidth(10),
                          borderLeftWidth: 1,
                          borderLeftColor: isDark
                            ? appColors.darkBorder
                            : appColors.border,
                        }}
                      >
                        <Edit color={appColors.primary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                {rideDatas?.service?.service_type == "freight" && (
                  <View
                    style={[
                      external.fd_row,
                      {
                        backgroundColor: isDark
                          ? appColors.bgDark
                          : appColors.lightGray,
                        borderRadius: windowHeight(5),
                        padding: windowHeight(10),
                        justifyContent: "space-between",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: appFonts.semiBold,
                          fontSize: fontSizes.FONT18,
                          color: isDark
                            ? appColors.whiteColor
                            : appColors.primaryText,
                          marginBottom: 4,
                        }}
                      >
                        {translateData.destination}
                      </Text>
                      <Text
                        style={{
                          fontFamily: appFonts.regular,
                          fontSize: fontSizes.FONT15,
                          color: appColors.regularText,
                        }}
                        numberOfLines={1}
                      >
                        {rideDatas.locations[rideDatas.locations?.length - 1]}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderColor: isDark ? appColors.darkBorder : appColors.border,
                  marginVertical: windowHeight(1.5),
                  marginTop: windowHeight(10),
                }}
              />
              {taxidoSettingData?.cabbooking_values?.ads?.native_enable == 1 && (
                <NativeAdComponent
                  heights={windowHeight(150)}
                  adsHeight={windowHeight(60)}
                />
              )}
              <View style={[styles.card2, { backgroundColor: bgFullStyle }]}>
                <TotalFare
                  handlePress={() => handlePress(rideDatas)}
                  fareAmount={rideDatas?.total || 0}
                  rideStatus={rideDatas?.ride_status?.slug || ""}
                />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={sosSheetRef}
          index={1}
          snapPoints={sosSnapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          backgroundStyle={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView style={componentStyles.contentContainer}>
            <Text
              style={[
                componentStyles.title,
                { color: isDark ? appColors.whiteColor : appColors.blackColor },
              ]}
            >
              {translateData.keepYourselfSafe}
            </Text>
          </BottomSheetView>
          <BottomSheetFlatList
            data={sosValue?.data}
            keyExtractor={item => item.id.toString()}
            renderItem={renderSosItem}
            style={{ marginTop: windowHeight(20) }}
          />
        </BottomSheetModal>
        <RideReviewPrompt
          visible={reviewPromptVisible}
          ride={rideDatas}
          onDismiss={closeRideReviewPrompt}
          onSubmitted={() => dispatch(allRides() as any)}
        />
      </View>
    </BottomSheetModalProvider>
  );
}

const componentStyles = StyleSheet.create({
  contentContainer: {
    width: "100%",
  },
  title: {
    fontSize: fontSizes.FONT22,
    color: appColors.primaryText,
    fontFamily: appFonts.bold,
    textAlign: "center",
  },
  sosItem: {
    marginTop: windowHeight(10),
    padding: windowHeight(10),
  },
  sosName: {
    fontFamily: appFonts.medium,
  },
});

export default Payment;
