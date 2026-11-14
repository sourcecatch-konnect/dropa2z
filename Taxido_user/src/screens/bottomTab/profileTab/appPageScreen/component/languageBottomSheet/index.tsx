import React, {useEffect} from "react";
import {View, TouchableOpacity, Image, Alert, Modal, Pressable, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CardHeading} from '../../../../../../design/CardHeading';
import {Text} from '../../../../../../design/Typography';
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useValues } from "@src/utils/context/index";;
import { serviceDataGet, translateDataGet } from "@src/api/store/actions";
import { appColors, appFonts, fontSizes, windowHeight } from "@src/themes";
import { CustomRadioButton } from "@src/commonComponent/radioButton/customRadioButton";
import { Button, SolidLine } from "@src/commonComponent";
import { styles } from "../../style";
import { AppDispatch } from "@src/api/store";

interface LanguageBottomSheetProps {
    isVisible: boolean;
    onClose: () => void;
    selectedLanguage: string;
    setSelectedLanguage: (lang: string) => void;
    setSelectedLang: any
}

export function LanguageBottomSheet({ isVisible, onClose, selectedLanguage, setSelectedLanguage, setSelectedLang }: LanguageBottomSheetProps) {
    const { languageData, translateData } = useSelector((state: any) => state.setting);
    const dispatch = useDispatch<AppDispatch>();
    const { isDark, textRTLStyle, viewRTLStyle, bgFullStyle, textColorStyle, setIsRTL } = useValues();
    const insets = useSafeAreaInsets();
    const [tempSelectedLanguage, setTempSelectedLanguage] = React.useState(selectedLanguage);

    useEffect(() => {
        if (isVisible) setTempSelectedLanguage(selectedLanguage);
    }, [isVisible, selectedLanguage]);

    const [saving, setSaving] = React.useState(false);
    const closeLanguage = async () => {
        if (saving || !tempSelectedLanguage) return;
        setSaving(true);
        try {
            await AsyncStorage.setItem("selectedLanguage", tempSelectedLanguage);
            await dispatch(translateDataGet()).unwrap();
            await dispatch(serviceDataGet()).unwrap();
            setSelectedLanguage(tempSelectedLanguage);
            setSelectedLang(tempSelectedLanguage);
            setIsRTL(tempSelectedLanguage === "ar");
            await AsyncStorage.setItem("rtl", JSON.stringify(tempSelectedLanguage === "ar"));
            onClose();
        } catch (error: any) {
            await AsyncStorage.setItem("selectedLanguage", selectedLanguage);
            await dispatch(translateDataGet());
            Alert.alert("Language not changed", error?.message || "Please try again.");
        } finally { setSaving(false); }
    };

    return (
        <Modal visible={isVisible} transparent animationType="slide" onRequestClose={() => {if (!saving) onClose();}}>
            <View style={{flex:1,justifyContent:'flex-end',backgroundColor:'#00000066'}}>
                <Pressable accessibilityRole="button" accessibilityLabel="Close language selector" onPress={() => {if (!saving) onClose();}} style={{flex:1}}/>
                <View style={{backgroundColor:bgFullStyle,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:Math.max(16,insets.bottom+12),maxHeight:'75%'}}>
                    <CardHeading icon="globe" title={translateData.changeLanguage || 'Change Language'}/>
                    <ScrollView keyboardShouldPersistTaps="handled" style={{flexShrink:1}}>
                    {languageData?.data?.map((item: any, index: number) => {
                        const isLast = index === languageData?.data?.length - 1;
                        return (
                            <View key={item.locale} style={styles.languageContainer}>
                                <TouchableOpacity
                                    accessibilityRole="radio" accessibilityLabel={item.name} accessibilityState={{checked:tempSelectedLanguage === item.locale}} disabled={saving}
                                    activeOpacity={0.7}
                                    style={[
                                        { flexDirection: viewRTLStyle, alignItems: "center", minHeight:60, paddingVertical:10 },
                                    ]}
                                    onPress={() => setTempSelectedLanguage(item.locale)}
                                >
                                    {item.flagEmoji ? <Text style={{fontSize:24,width:34,textAlign:'center'}}>{item.flagEmoji}</Text> : <Image style={styles.flagImage} source={{ uri: item.flag }} />}
                                    <Text
                                        style={{
                                            marginHorizontal: 10,
                                            flex: 1,
                                            textAlign: textRTLStyle,
                                            color: isDark ? appColors.whiteColor : appColors.primaryText,
                                            fontSize: fontSizes.FONT17,
                                            fontFamily: appFonts.medium,
                                            fontWeight: tempSelectedLanguage === item.locale ? "500" : "300",
                                        }}
                                    >
                                        {item.name}
                                    </Text>
                                    <View>
                                        <CustomRadioButton
                                            selected={tempSelectedLanguage === item.locale}
                                            onPress={() => setTempSelectedLanguage(item.locale)}
                                        />
                                    </View>
                                </TouchableOpacity>
                                {!isLast && <SolidLine color={isDark ? appColors.darkBorder : appColors.border} />}
                            </View>
                        );
                    })}

                    </ScrollView>
                    <View style={{marginTop:16}}>
                        <Button title={translateData.update || "Update"} onPress={closeLanguage} loading={saving} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
