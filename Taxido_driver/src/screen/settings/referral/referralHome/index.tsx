import {CardHeading} from '../../../../design/CardHeading';
import {DesignIcon} from '../../../../design/DesignIcon';
import {ReferenceScreen} from '../../../../design/ReferenceChrome';
import {View, TouchableOpacity, ScrollView, Share, Image} from 'react-native';
import {Text} from '../../../../design/Typography';
import React from 'react'
import { fontSizes, windowHeight } from '../../../../theme/appConstant';
import appFonts from '../../../../theme/appFonts';
import appColors from '../../../../theme/appColors';
import Images from '../../../../utils/images/images';
import { useSelector } from 'react-redux';
import { useAppNavigation } from '../../../../utils/navigation';
import { useValues } from '../../../../utils/context';
import Clipboard from '@react-native-clipboard/clipboard';
import Icons from '../../../../utils/icons/icons';
import { Header } from '../../../../commonComponents';
import styles from './styles';

export function ReferralHome() {
    const { viewRtlStyle, isDark, rtl } = useValues();
    const { selfDriver } = useSelector((state: any) => state.account);
    const { taxidoSettingData, translateData } = useSelector((state: any) => state.setting);
    const { navigate }: any = useAppNavigation();


    const Workdata = [
        { data: `${translateData.referralTerm1}` },
        { data: `${translateData.referralEarn} ${taxidoSettingData?.cabbooking_values?.referral?.referrer_bonus_percentage}% ${translateData.referralTerm2}` },
        { data: `${translateData.referralTerm3}` },
    ];

    const gotoList = () => {
        navigate('ReferralList')
    };

    const handleShareReferral = async () => {
        try {
            const referralCode = selfDriver?.referral_code;
            const message = `${translateData.referralShare1} *${referralCode}* ${translateData.referralShare2}\n\n ${translateData.referralShare3}\n👉 https://play.google.com/store/apps/details?id=com.taxidouserui&hl=en_IN`;

            const brandedMessage = message.replace('com.taxidouserui', 'com.dropa2z.rider');

            await Share.share({
                message: brandedMessage,
                title: "Invite to DropA2Z",
            });
        } catch (error) {
            console.error("❌ Error sharing referral:", error);
        }
    };



    const ink=isDark?'#FFFFFF':'#17191C',muted=isDark?'#BBC1CA':'#656C76',line=isDark?'#41464E':'#E5E7EB';
    const card={padding:18,borderRadius:22,borderWidth:1,borderColor:line,backgroundColor:isDark?'#25282D':'#FFFFFF'};
    return <ReferenceScreen><Header title={translateData.referralHeader}/><ScrollView contentContainerStyle={{padding:20,paddingBottom:32,gap:18}}>
      <View style={[card,{backgroundColor:'#17191C',borderColor:'#41464E',padding:22}]}><DesignIcon name="tag" color="#FFBE60" width={34} height={34}/><Text style={{fontSize:24,lineHeight:31,color:'#FFFFFF',fontWeight:'700',marginTop:16}}>{translateData.referralEarn} {taxidoSettingData?.cabbooking_values?.referral?.referral_amount} {translateData.referralFirst}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Copy referral code" activeOpacity={.8} onPress={()=>Clipboard.setString(selfDriver?.referral_code || '')} style={{minHeight:52,padding:14,borderRadius:14,backgroundColor:'#3B2B19',flexDirection:viewRtlStyle,alignItems:'center',gap:12,marginTop:20}}><DesignIcon name="file-text" color="#FFBE60"/><Text style={{color:'#FFBE60',fontSize:19,fontWeight:'700',flex:1}}>{selfDriver?.referral_code}</Text></TouchableOpacity>
      </View>
      <View style={card}><CardHeading icon="shield-check" title={translateData.referralWork}/>{Workdata.map((item,index)=><View key={index} style={{flexDirection:viewRtlStyle,gap:12,marginTop:12}}><View style={{width:28,height:28,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:isDark?'#3B2B19':'#FFF2DF'}}><Text style={{color:isDark?'#FFBE60':'#A64B00',fontWeight:'700'}}>{index+1}</Text></View><Text style={{flex:1,minWidth:0,fontSize:15,lineHeight:22,color:ink}}>{item.data}</Text></View>)}<Text style={{color:muted,fontSize:13,lineHeight:20,marginTop:18}}>{translateData.referralTC}</Text></View>
      <Text style={{color:muted,fontSize:13,lineHeight:20}}>{translateData.referralNote} {translateData.referralNoteData}</Text>
      <View style={card}><CardHeading icon="user-round" title={translateData.referralTitle} subtitle={translateData.referralDescription}/><TouchableOpacity accessibilityRole="button" onPress={gotoList} style={{minHeight:48,flexDirection:viewRtlStyle,alignItems:'center',justifyContent:'space-between'}}><Text style={{color:isDark?'#FFBE60':'#A64B00',fontWeight:'700',fontSize:16}}>{translateData.referralViewAll}</Text><DesignIcon name="arrow-right" color={isDark?'#FFBE60':'#A64B00'}/></TouchableOpacity></View>
      <TouchableOpacity accessibilityRole="button" onPress={handleShareReferral} style={{minHeight:54,backgroundColor:'#FC9F03',borderRadius:16,padding:15,alignItems:'center',justifyContent:'center'}}><Text style={{fontWeight:'700',fontSize:18,color:'#17191C'}}>{translateData.referralShare}</Text></TouchableOpacity>
    </ScrollView></ReferenceScreen>;
}
