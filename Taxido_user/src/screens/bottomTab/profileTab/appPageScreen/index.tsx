import {CardHeading} from "../../../../design/CardHeading";
import {DesignIcon} from "../../../../design/DesignIcon";
import {ReferenceScreen} from '../../../../design/ReferenceChrome';
import {useValues} from "@src/utils/context/index";
import React, {useEffect, useState} from "react";
import {View, TouchableOpacity} from 'react-native';
import {Text} from '../../../../design/Typography';
import {styles} from "./style";
import {BackArrow, ChangeLanguage, DarkTheme} from "@src/utils/icons";
import {external} from "@src/styles/externalStyle";
import {commonStyles} from "@src/styles/commonStyle";
import {LanguageBottomSheet} from "./component/languageBottomSheet";
import {
  HeaderContainer,
  SolidLine,
  SwitchComponent,
} from "@src/commonComponent";
import {useDispatch, useSelector} from "react-redux";
import {appColors, windowHeight} from "@src/themes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {languageDataGet} from "@src/api/store/actions";

export function AppPageScreen() {
  const {
    setIsRTL,
    isDark,
    textRTLStyle,
    viewRTLStyle,
    linearColorStyle,
    textColorStyle,
    imageRTLStyle,
    bgFullStyle,
    setIsDark,
    setNotificationValues,
    notificationValue,
  } = useValues();

  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedLang, setSelectedLang] = useState("en");
  const [languageTitle, setLanguageTitle] = useState("English");

  const {translateData,languageData} = useSelector(state => state.setting);
  const [toggles, setToggles] = useState([]);
  const dispatch = useDispatch();

  const openModal = () => setLanguageSheetVisible(true);
  const closeModal = () => setLanguageSheetVisible(false);

  useEffect(() => {
    dispatch(languageDataGet());
  }, [dispatch]);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const lang = await AsyncStorage.getItem("selectedLanguage");
        if (lang) {
          setSelectedLang(lang);
          setSelectedLanguage(lang);
          setLanguageTitle(
            lang === "ar"
              ? "العربية"
              : lang === "fr"
              ? "Français"
              : lang === "es"
              ? "Español"
              : "English",
          );
          if (lang === "ar") setIsRTL(true);
        }
      } catch (error) {
        console.error("Error loading language:", error);
      }
    };
    loadLanguage();
  }, []);

  useEffect(() => {
    setToggles([
      {
        id: "toggle4",
        title: translateData.appApgeTheme,
        value: isDark,
        onPress: () => handleToggle("toggle4"),
        icon: <DarkTheme />,
      },
    ]);
  }, [translateData, isDark, notificationValue]);

  const handleToggle = async (toggleId: string) => {
    try {
      switch (toggleId) {
        case "toggle4":
          setIsDark(prev => {
            AsyncStorage.setItem("darkTheme", JSON.stringify(!prev));
            return !prev;
          });
          break;
        case "toggle6":
          setNotificationValues(prev => {
            AsyncStorage.setItem("isNotificationOn", JSON.stringify(!prev));
            return !prev;
          });
          break;
      }

      setToggles(prev =>
        prev.map(toggle =>
          toggle.id === toggleId ? {...toggle, value: !toggle.value} : toggle,
        ),
      );
    } catch (error) {
      console.error("Error toggling value:", error);
    }
  };

  return (
    <ReferenceScreen><View style={[[styles.container, {backgroundColor: linearColorStyle}], {backgroundColor:'transparent'}]}>
      <View style={[styles.headerContainer, {backgroundColor: bgFullStyle}]}>
        <HeaderContainer value={translateData.appPages} />
      </View>

      <View style={{marginHorizontal:20,marginTop:20}}><CardHeading icon="settings-2" title={translateData.preferences || "Preferences"}/></View>
      <View style={[styles.appPagesContainer, {marginTop:0,backgroundColor: bgFullStyle,borderColor:isDark?appColors.darkBorder:appColors.border}]}>
        {toggles.map((toggle, index) => (
          <View key={toggle.id}>
            <View
              style={[styles.listItemContainer, {flexDirection: viewRTLStyle}]}>
              <View
                style={[
                  styles.iconContainer,
                  {backgroundColor:isDark ? "#3B2B19" : "#FFF2DF"},
                ]}>
                {toggle.icon}
              </View>
              <Text
                style={[
                  styles.listItemText,
                  {color: textColorStyle, textAlign: textRTLStyle},
                ]}>
                {toggle.title}
              </Text>
              <SwitchComponent Enable={toggle.value} onPress={toggle.onPress} />
            </View>
            {index !== toggles?.length - 1 && (
              <SolidLine
                color={isDark ? appColors.darkBorder : appColors.border}
              />
            )}
          </View>
        ))}

        <SolidLine color={isDark ? appColors.darkBorder : appColors.border} />

        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button" accessibilityLabel="Change language"
          onPress={openModal}
          style={[styles.listItemContainer, {flexDirection: viewRTLStyle}]}>
          <View
            style={[styles.iconContainer, {backgroundColor:isDark ? "#3B2B19" : "#FFF2DF"}]}>
            <DesignIcon name="globe" color={isDark ? "#FFBE60" : "#A64B00"}/>
          </View>
          <View style={{flex:1,minWidth:0,gap:5}}>
            <Text
              style={[
                styles.listItemText,
                {color: textColorStyle, textAlign: textRTLStyle},
              ]}>
              {translateData.changeLanguage}
            </Text>
            <Text
              style={[
                commonStyles.regularText,
                {
                  color:isDark ? "#C5CAD0" : "#656C76",
                  textAlign: textRTLStyle,
                  marginHorizontal: 0,
                },
              ]}>
              {languageData?.data?.find((item:any)=>item.locale===selectedLang)?.name || (selectedLang === "en"
                ? "English"
                : selectedLang === "ar"
                ? "Arabic"
                : selectedLang === "fr"
                ? "French"
                : selectedLang === "es"
                ? "Spanish"
                : "English")}
            </Text>
          </View>
          <View style={{transform: [{scale: imageRTLStyle}]}}>
            <BackArrow />
          </View>
        </TouchableOpacity>
      </View>

      <LanguageBottomSheet
        isVisible={languageSheetVisible}
        onClose={closeModal}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        setSelectedLang={setSelectedLang}
      />
    </View></ReferenceScreen>
  );
}
