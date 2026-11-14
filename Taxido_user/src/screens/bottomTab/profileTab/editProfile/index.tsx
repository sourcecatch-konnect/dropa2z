import {ReferenceScreen} from '../../../../design/ReferenceChrome';
import {View, BackHandler, ScrollView, TouchableOpacity} from 'react-native';
import {Text} from '../../../../design/Typography';
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Header } from "@src/commonComponent";
import { ImageContainer } from "./imageContainer/index";
import { DataContainer } from "./dataContainer/index";
import { useValues } from "@src/utils/context/index";
import {
  appColors,
  appFonts,
  fontSizes,
  windowHeight,
  windowWidth,
} from "@src/themes";
import { useDispatch, useSelector } from "react-redux";
import {setValue} from "../../../../utils/localstorage/index";
import { selfData } from "../../../../api/store/actions/accountAction";
import { useAppNavigation } from "@src/utils/navigation";
import { notificationHelper } from "@src/commonComponent";
import { AppDispatch } from "@src/api/store";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Camera } from "@src/utils/icons";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { Gallery } from "@src/assets/icons/gallery";
import { Remove } from "@src/assets/icons/remove";
import {saveProfileUpdate} from '../../../../api/services/profileUpdate';
import {apiErrorMessage} from '../../../../api/responseError';

export function EditProfile() {
  const { goBack } = useAppNavigation();
  const { self, loading } = useSelector((state: any) => state.account);
  const { isDark, bgFullStyle, isRTL } = useValues();
  const [profileImg, setProfileImage] = useState<any>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { translateData } = useSelector((state: any) => state.setting);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (show) {
          setShow(false);
          return true;
        }
        return false;
      },
    );
    return () => {
      backHandler.remove();
    };
  }, [show]);

  const [phoneNumberError, setPhoneNumberError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  const update = async (formDataObj: any, removePhoto=false) => {
    if(isUpdating)return;
    if (!formDataObj) {
      notificationHelper("", translateData.fillAllFields, "error");
      return;
    }
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (formDataObj.phoneNumber) {
      if (formDataObj.phoneNumber?.length < 6) {
        setPhoneNumberError("Phone Number must be at least 6 digits");
        return true;
      } else {
        setPhoneNumberError("");
      }
    }

    if (formDataObj?.email) {
      if (!formDataObj.email.trim()) {
        setEmailError("");
      } else if (!emailRegex.test(formDataObj.email.trim())) {
        setEmailError("Please enter a valid email address");
        return true;
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }

    setIsUpdating(true);
    try {
      await saveProfileUpdate(formDataObj,profileImg,removePhoto);
      const response=await dispatch(selfData()).unwrap();
      const updatedProfile=response?.data?.data??response?.data;
      if(response?.status!==200||!updatedProfile?.id)
        throw new Error('Your profile was submitted, but could not be refreshed. Please try again.');
      if(!removePhoto&&profileImg?.uri&&!updatedProfile.profile_image_url)
        throw new Error('Your photo was not saved. Please select it again and retry.');
      if(removePhoto&&updatedProfile.profile_image_url)
        throw new Error('Your photo could not be removed. Please try again.');
      setImageUri(updatedProfile.profile_image_url||'');
      setProfileImage(null);
      await setValue('profile_image_uri',updatedProfile.profile_image_url||'');
      notificationHelper('',translateData.profileSuccessfully,'success');
      goBack();
    } catch (error) {
      notificationHelper('',apiErrorMessage(error,translateData.profileFail||'Could not update your profile.'),'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const RemoveUpdate = (formDataObj: any) => update(formDataObj, true);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["35%"], []);
  const [imageUri, setImageUri] = useState<string | undefined>();

  const handleImageSelection = async (type: "camera" | "gallery") => {
    const options = {
      mediaType: "photo",
      maxWidth: 300,
      maxHeight: 300,
      quality: 1,
    };
    const result =
      type === "gallery"
        ? await launchImageLibrary(options)
        : await launchCamera(options);

    if (result.didCancel || result.errorCode) return;

    const selectedImage = result.assets?.[0];
    setProfileImage(selectedImage);

    if (selectedImage?.uri) {
      setImageUri(selectedImage.uri);
      bottomSheetModalRef.current?.dismiss();
    }
  };

  return (
    <ReferenceScreen><>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          backgroundColor: isDark ? appColors.darkHeader : appColors.lightGray,
        }}>
        <Header
          value={translateData.profileSettings}
          container={
            <View
              style={{
                backgroundColor: isDark ? bgFullStyle : appColors.lightGray,
                paddingBottom: 20,
              }}>
              <View>
                <View
                  style={{
                    backgroundColor: isDark
                      ? appColors.bgDark
                      : appColors.whiteColor,
                    paddingBottom: 22,
                    marginHorizontal: windowWidth(20),
                    marginTop: windowHeight(20),
                    borderWidth: 1,
                    borderColor: isDark
                      ? appColors.darkBorder
                      : appColors.border,
                    borderRadius: 22,
                  }}>
                  <ImageContainer
                    data={self}
                    bottomSheetRef={bottomSheetModalRef}
                    imageUri={imageUri ?? self?.profile_image_url}
                    setImageUri={setImageUri}
                  />

                  <DataContainer
                    data={self}
                    updateProfile={update}
                    loading={loading}
                    showCountryPicker={showCountryPicker}
                    setShowCountryPicker={setShowCountryPicker}
                    show={show}
                    setShow={setShow}
                    Update={isUpdating}
                    setForm={setForm}
                    phoneNumberError={phoneNumberError}
                    emailError={emailError}
                  />
                </View>
              </View>

              <View
                style={{
                  paddingHorizontal: windowWidth(20),
                  paddingBottom: 20,
                  paddingTop:20,
                  backgroundColor: isDark
                    ? appColors.darkHeader
                    : appColors.lightGray,
                }}>
                <Button
                  title={translateData.updateProfile}
                  onPress={() => update(form)}
                  loading={isUpdating}
                />
              </View>
            </View>
          }
        />
      </ScrollView>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          onDismiss={() => bottomSheetModalRef.current?.dismiss()}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          backgroundStyle={{
            backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
          }} android_keyboardInputMode="adjustResize" >
          <BottomSheetView style={{ padding: windowHeight(15) }}>
            <Text
              style={{
                fontFamily: appFonts.medium,
                fontSize: fontSizes.FONT20,
                color: isDark ? appColors.whiteColor : appColors.blackColor,
                marginBottom: windowHeight(15),
              }}>
              {translateData.selectOne}
            </Text>
            <TouchableOpacity
              onPress={() => handleImageSelection("gallery")}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                marginBottom: windowHeight(2),
              }}>
              <View
                style={{
                  backgroundColor: isDark
                    ? appColors.dotDark
                    : appColors.dotLight,
                  height: windowHeight(35),
                  width: windowHeight(35),
                  borderRadius: windowHeight(30),
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Gallery />
              </View>
              <Text
                style={{
                  fontSize: fontSizes.FONT17,
                  fontFamily: appFonts.medium,
                  marginHorizontal: windowWidth(10),
                  color: isDark ? appColors.darkText : appColors.blackColor,
                }}>
                {translateData.chooseFromGallery}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleImageSelection("camera")}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                marginVertical: windowHeight(10),
              }}>
              <View
                style={{
                  backgroundColor: isDark
                    ? appColors.dotDark
                    : appColors.dotLight,
                  height: windowHeight(35),
                  width: windowHeight(35),
                  borderRadius: windowHeight(30),
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Camera />
              </View>
              <Text
                style={{
                  fontSize: fontSizes.FONT17,
                  fontFamily: appFonts.medium,
                  marginHorizontal: windowWidth(10),
                  color: isDark ? appColors.darkText : appColors.blackColor,
                }}>
                {translateData.openCamera}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                RemoveUpdate(form);
                bottomSheetModalRef.current?.dismiss();
              }}
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
              }}>
              <View
                style={{
                  backgroundColor: isDark
                    ? appColors.dotDark
                    : appColors.dotLight,
                  height: windowHeight(35),
                  width: windowHeight(35),
                  borderRadius: windowHeight(30),
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Remove />
              </View>
              <Text
                style={{
                  fontSize: fontSizes.FONT17,
                  fontFamily: appFonts.semiBold,
                  marginHorizontal: windowWidth(10),
                  color: isDark ? appColors.darkText : appColors.blackColor,
                }}>
                {translateData.removeImage}
              </Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </></ReferenceScreen>
  );
}
