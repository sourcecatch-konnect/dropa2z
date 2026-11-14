import {BrandLogo, BrandEntrance, BrandMark,BrandSymbol} from '../../../design/BrandLogo';
import React, { useEffect, useState, useCallback } from "react";
import {Alert, Image, View, BackHandler, Linking, TouchableOpacity, Platform} from 'react-native';
import {Text} from '../../../design/Typography';
import { CommonModal } from "../../../commonComponents/commonModal";
import images from "../../../utils/images/images";
import styles from "./styles";
import { getValue, setValue, deleteValue } from "../../../utils/localstorage/index";
import { selfDriverData, settingDataGet, translateDataGet, taxidosettingDataGet, languageDataGet } from "../../../api/store/action";
import { useDispatch, useSelector } from "react-redux";
import { useAppNavigation } from "../../../utils/navigation";
import DeviceInfo from "react-native-device-info";
import { AppDispatch } from "../../../api/store";
import { requestLocationPermission, requestNotificationPermission } from "../../../commonComponents/helper/permissionHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useValues } from "../../../utils/context";
import { resetRateLimit } from "../../../api/rateLimiter";
import { resetThrottler } from "../../../api/requestThrottler";

export function Splash() {
  const { replace } = useAppNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { settingData, taxidoSettingData, translateData } = useSelector((state: any) => state.setting);
  const [splashImage, setSplashImage] = useState<string | null>(null);
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { zoneValue } = useSelector((state: any) => state.zoneUpdate)
  const { setRtl } = useValues()


  useEffect(() => {
    const setDefaultLanguage = async () => {
      if (Array.isArray(settingData) || !settingData?.values?.general?.default_language) return;

      const defaultLang = settingData.values.general.default_language.locale;

      let storedLang = await getValue('selectedLanguage');
      if (storedLang) {
        storedLang = storedLang.replace(/^"|"$/g, '');
      }
console.log();


      if (storedLang != null) {
        const isRTL = storedLang === 'ar';
        setRtl(isRTL);
        AsyncStorage.setItem('rtl', JSON.stringify(isRTL));

      } else {
        const isRTL = defaultLang === 'ar';
        setRtl(isRTL);
        AsyncStorage.setItem('rtl', JSON.stringify(isRTL));
      }
    };

    setDefaultLanguage();
  }, [settingData]);




  useEffect(() => {
    const loadSplashImage = async () => {
      try {
        const cachedImage = await getValue('splashImage')
        if (cachedImage) {
          setSplashImage(cachedImage);
        }
      } catch (error) {

      }
    }
    loadSplashImage()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      // Clear any session-level locks on app start
      resetRateLimit();
      resetThrottler();

      await dispatch(translateDataGet()),
        await dispatch(taxidosettingDataGet()),
        await dispatch(settingDataGet()),
        await dispatch(selfDriverData())
      // await dispatch(languageDataGet())
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    const initializeApp = async () => {
      // Do not hold the entire app on the splash screen while Android shows
      // or resolves a permissions dialog. Location is requested here, while
      // navigation always continues to the appropriate authentication screen.
      requestLocationPermission()
        .then(granted => granted ? requestNotificationPermission() : undefined)
        .catch(() => undefined)

      const navigationTimer = setTimeout(() => {
        proceedToNextScreen()
      }, 800)

      return () => clearTimeout(navigationTimer)
    };

    const cleanup = initializeApp();
    return () => {
      Promise.resolve(cleanup).then(clearup => clearup?.())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);



  useEffect(() => {
    const updateSplashImage = async () => {
      const serverImage = taxidoSettingData?.cabbooking_values?.setting?.driver_splash_screen_url
      try {
        if (serverImage && typeof serverImage === 'string') {
          await setValue('splashImage', serverImage)
        } else {
          await deleteValue('splashImage')
        }
      } catch (error) {
      }
    }
    if (taxidoSettingData) {
      updateSplashImage()
    }
  }, [taxidoSettingData])

  useEffect(() => {
    const activation = settingData?.values?.maintenance;
    const maintenance_mode = activation?.maintenance_mode;

    if (maintenance_mode == '1') {
      setShowNoInternet(true);
    }
  }, [settingData]);


  const proceedToNextScreen = useCallback(async () => {
    try {
      const token = await getValue("token");
      const versionCode = await DeviceInfo.getVersion();
      const requiredVersion = taxidoSettingData?.cabbooking_values?.setting?.driver_app_version;
      const forceUpdate = taxidoSettingData?.cabbooking_values?.activation?.force_update == "1";


      if (forceUpdate && versionCode < requiredVersion) {
        setShowUpdateModal(true);
        return;
      }




      const waitForZone = async () => {
        if (token) {
          dispatch(selfDriverData())
            .unwrap()
            .then(res => {
              if (res?.status == 403 || !res?.id) {
                replace("OnBoarding");
              } else if (res?.is_verified == 0) {
                replace("Verification");
              } else {
                replace("TabNav");
              }
            })
            .catch(err => {
              console.log('er', err);
            });
        } else {
          replace("OnBoarding");
        }
      };
      await waitForZone();
    } catch (error) {
      console.error("Error in proceedToNextScreen:", error);
    }

  }, [dispatch, replace, taxidoSettingData, zoneValue]);

  if (showNoInternet) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }]}>
        <BrandLogo size={92} driver />
        <Text style={{ marginTop: 24, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
          Dropa2z Driver is temporarily unavailable
        </Text>
        <Text style={{ marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: 'center', opacity: 0.7 }}>
          Please check your connection and reopen the app in a moment.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <BrandEntrance><BrandLogo size={100} driver/></BrandEntrance>
        <Text style={styles.brandSubtitle}>Associated with SK Translines</Text>
      </View>
      <CommonModal
        isVisible={showUpdateModal}
        value={
          <View style={styles.modalContent}>
            <View style={styles.modalImageContainer}>
              <BrandMark size={44}/>
            </View>
            <Text style={styles.modalTitle}>{translateData?.updateRequired}</Text>
            <Text style={styles.modalMessage}>{translateData?.newVersions}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.7}
              onPress={() => {
                const url = taxidoSettingData?.cabbooking_values?.setting?.driver_app_url;
                if (url) {
                  Linking.openURL(url);
                } else {
                  const bundleId = DeviceInfo.getBundleId();
                  const storeUrl = Platform.OS === 'ios'
                    ? `https://apps.apple.com/app/id` // Placeholder or try to find it
                    : `market://details?id=${bundleId}`;
                  Linking.openURL(storeUrl).catch(() => { });
                }
              }}
            >
              <Text style={styles.modalButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View >
  )
}
