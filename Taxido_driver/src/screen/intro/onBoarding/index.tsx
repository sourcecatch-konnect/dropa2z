import {BrandLogo,BrandLoader} from '../../../design/BrandLogo';
import React, { useState, useEffect, useRef } from "react";
import {Image, ScrollView, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DesignIcon} from '../../../design/DesignIcon';
import {Text} from '../../../design/Typography';
import Swiper from "react-native-swiper";
import DropDownPicker from "react-native-dropdown-picker";
import { useDispatch, useSelector } from "react-redux";
import { getValue, setValue } from "../../../utils/localstorage";
import {
  languageDataGet,
  settingDataGet,
  taxidosettingDataGet,
  translateDataGet,
} from "../../../api/store/action";
import { useAppNavigation } from "../../../utils/navigation";

import { styles } from "./styles";
import { useValues } from "../../../utils/context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppDispatch } from "../../../api/store";

export function OnBoarding() {
  const dispatch = useDispatch<AppDispatch>();
  const { navigate } = useAppNavigation();
  const swiperRef = useRef<Swiper | null>(null);
  const insets=useSafeAreaInsets(),{width}=useWindowDimensions();
  const [activeIndex,setActiveIndex]=useState(0);

  const { settingData, languageData, translateData, taxidoSettingData } =
    useSelector((state: any) => state.setting);

  const { isDark, viewRtlStyle, setRtl } =
    useValues();
  const bgFullStyle=isDark?"#25282D":"#FFFFFF";

  const configuredSlides = taxidoSettingData?.cabbooking_values?.onboarding;
  const slides = Array.isArray(configuredSlides) && configuredSlides.length ? configuredSlides : [
    {title:'Deliver with Dropa2z',description:'Join local parcel delivery as a driver or eligible fleet partner.'},
    {title:'Your delivery, step by step',description:'Review requests, reach pickup and use the pickup code to start each delivery.'},
    {title:'Stay in control',description:'Follow your delivery stops and manage earnings, documents and support in one place.'},
  ];

  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<
    { label: string; value: string; icon: () => JSX.Element }[]
  >([]);


  useEffect(() => {
    const setDefaultLanguage = async () => {
      const defaultLang =
        settingData?.values?.general?.default_language?.locale;
      if (defaultLang) {
        await setValue("defaultLanguage", defaultLang);
      }
    };
    setDefaultLanguage();
  }, [settingData]);

  useEffect(() => {
    if (languageData?.data?.length) {
      const formattedItems = languageData.data.map((lang: any) => ({
        label: lang.name,
        value: lang.locale,
        icon: () => lang.flagEmoji ? <Text style={{fontSize:20,width:28,textAlign:'center'}}>{lang.flagEmoji}</Text> : <Image source={{ uri: lang.flag }} style={styles.flagImage} />,
      }));

      setItems(formattedItems);
      getValue("selectedLanguage").then(saved => {
        const locale = formattedItems.some((item: any) => item.value === saved)
          ? saved : settingData?.values?.general?.default_language?.locale || formattedItems[0]?.value;
        setSelectedLanguage(locale);
      });
    }
  }, [languageData]);

  const handleLanguageChange = async (value: string | null) => {
    if (!value) return;

    // Show loading while we switch everything
    setLoading(true);

    try {
      // Step 1: Update persistent storage for the selected language
      await setValue("selectedLanguage", value);

      // Step 2: Fetch all necessary data for the new language
      // We do this BEFORE updating the RTL state to avoid a "blink" with old data
      await Promise.all([
        dispatch(settingDataGet()).unwrap(),
        dispatch(translateDataGet()).unwrap(),
        dispatch(taxidosettingDataGet()).unwrap()
      ]);

      // Step 3: Once data is in store, update UI direction and selected state
      if (value === "ar") {
        setRtl(true);
        await AsyncStorage.setItem("rtl", JSON.stringify(true));
      } else {
        setRtl(false);
        await AsyncStorage.setItem("rtl", JSON.stringify(false));
      }
      setSelectedLanguage(value);

    } catch (error) {
      console.log("Error changing language:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDropdown = async () => {
    if (!languageData?.data?.length) {
      setLoading(true);
      try {
        await dispatch(languageDataGet());
      } catch (error) {
        console.log("Error fetching language data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNavigation = () => {
    navigate("Login");
  };

  const handleIndexChanged = (index: number) => {
    setActiveIndex(index);
  };

  const handleNext = (index: number) => {
    if (index < slides.length - 1) {
      swiperRef.current?.scrollBy(1);
    } else {
      handleNavigation();
    }
  };

  const ink=isDark?'#FFFFFF':'#17191C',muted=isDark?'#C5CAD0':'#656C76';
  const illustrations=[require('../../../design/assets/brand-20261105/delivery-partner.png'),require('../../../design/assets/brand-20261105/banner-handoff.png'),require('../../../design/assets/brand-20261105/banner-packed-parcel.png')];
  const slideImage=(slide:any,index:number)=>{
    if(Array.isArray(configuredSlides)&&configuredSlides.length){
      const image=slide.image || slide.onboarding_image_url;
      if(typeof image==='string' && image.trim())return {uri:image};
      if(typeof image==='number' || (image && typeof image.uri==='string'))return image;
    }
    return illustrations[index%illustrations.length];
  };
  return <View style={[styles.page,{backgroundColor:isDark?'#17191C':'#FAFAF9',paddingTop:insets.top,paddingBottom:Math.max(insets.bottom,12)}]}>
    <View style={[styles.brandRow,{flexDirection:viewRtlStyle}]}>
      <BrandLogo driver light={isDark} width={150}/>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Skip introduction" onPress={handleNavigation} style={styles.skipButton}><Text style={{color:ink,fontSize:15,fontWeight:'700'}}>{translateData?.skip || 'Skip'}</Text></TouchableOpacity>
    </View>
    <View style={[styles.languageContainer,{zIndex:20}]}>
      <DropDownPicker open={open} value={selectedLanguage} items={items} setOpen={setOpen} setValue={setSelectedLanguage} setItems={setItems}
        placeholder="Select Language" onChangeValue={handleLanguageChange} onOpen={handleOpenDropdown} loading={loading} listMode="SCROLLVIEW"
        dropDownContainerStyle={[styles.dropdownManu,{backgroundColor:bgFullStyle,borderColor:isDark?'#444A46':'#E5E7EB'}]}
        labelStyle={[styles.labelStyle,{color:ink}]} containerStyle={styles.dropdownContainer} style={[styles.dropdown,{backgroundColor:bgFullStyle,borderColor:isDark?'#444A46':'#E5E7EB'}]}
        textStyle={{color:ink,fontFamily:'GlacialIndifference-Regular'}} theme={isDark?'DARK':'LIGHT'}
        ActivityIndicatorComponent={({color})=><BrandLoader color={color} size="small"/>}/>
    </View>
    <Swiper ref={swiperRef} loop={false} onIndexChanged={handleIndexChanged} showsPagination={false} removeClippedSubviews={false}>
      {slides.map((slide:any,index:number)=><ScrollView key={index} contentContainerStyle={styles.slideContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.artwork,{height:Math.min(300,Math.max(190,width*.64)),backgroundColor:isDark?'#33291E':'#FFF2DF'}]}>
          <View pointerEvents="none" style={styles.orbit}/>
          <Image accessible={false} source={slideImage(slide,index)} resizeMode="contain" style={{width:'100%',height:'100%'}}/>
          <View style={styles.artBadge}><DesignIcon name={index%3===0?'package':index%3===1?'navigation':'shield-check'} color="#A64B00" width={26} height={26}/></View>
        </View>
        <View style={[styles.copyCard,{backgroundColor:isDark?'#202422':'#FFFFFF',borderColor:isDark?'#444A46':'#E5E7EB'}]}>
          <Text style={[styles.eyebrow,{color:isDark ? "#FFBE60" : "#A65B00"}]}>DROPA2Z DRIVER</Text>
          <Text accessibilityRole="header" style={[styles.title,{color:ink}]}>{slide.title}</Text>
          <Text style={[styles.description,{color:muted}]}>{slide.description}</Text>
        </View>
      </ScrollView>)}
    </Swiper>
    <View style={styles.footer}>
      <View accessibilityLabel={'Introduction '+(activeIndex+1)+' of '+slides.length} style={styles.progress}>
        {slides.map((_:any,index:number)=><View key={index} style={{width:index===activeIndex?26:7,height:7,borderRadius:4,backgroundColor:index===activeIndex?'#FC9F03':isDark?'#555C58':'#D7DCD8'}}/>) }
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={activeIndex===slides.length-1?'Get started':'Next introduction'} onPress={()=>handleNext(activeIndex)} style={styles.nextButton} activeOpacity={.8}>
        <Text style={styles.nextText}>{activeIndex===slides.length-1 ? translateData?.getStarted || 'Get Started' : translateData?.next || 'Next'}</Text><DesignIcon name="arrow-right" color="#17191C" width={23} height={23}/>
      </TouchableOpacity>
    </View>
  </View>;
}
