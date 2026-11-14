import React, {useState} from 'react'
import NetInfo from '@react-native-community/netinfo'
import {ReferenceLogo, referenceSurfaces} from '../../design/ReferenceChrome'
import {Button} from '../button'
import styles from './styles'
import {View, Image} from 'react-native';
import {Text} from '../../design/Typography';
import { useValues } from '../../utils/context'
import appColors from '../../theme/appColors'
import Images from '../../utils/images/images'
import { useSelector } from 'react-redux'

export function NoInternet() {
  const [checking,setChecking]=useState(false)
  const [error,setError]=useState('')
  const retry=async()=>{if(checking)return;setChecking(true);setError('');try{const state=await NetInfo.refresh();if(!state.isConnected||state.isInternetReachable===false)setError('Still offline. Check Wi-Fi or mobile data and try again.')}catch{setError('Unable to check the connection. Please try again.')}finally{setChecking(false)}}
  const { isDark, viewRtlStyle } = useValues()
  const translateData = useSelector(
    (state: any) => state.setting?.translateData,
  ) ?? {}

  return (
    <View style={[styles.mainContainer,{backgroundColor:isDark?'#151719':'#FAFBFC',paddingHorizontal:20}]}>
      <View style={{marginBottom:24}}><ReferenceLogo driver width={150}/></View>
      <View style={[referenceSurfaces.card,{backgroundColor:isDark?'#202422':'#FFFFFF',width:'100%',padding:20,alignItems:'center'}]}>
      <Image source={Images.noInternet} style={styles.image} />
      <View style={[{ flexDirection: viewRtlStyle }]}>
        <Text
          style={[
            styles.title,
            { color: isDark ? appColors.white : appColors.black },
          ]}
        >
          {translateData.noInternetConnectionText ?? 'No internet connection'}
        </Text>
      </View>
      <Text style={styles.details}>
        {translateData.plzzConnectionCheck ?? 'Please check your connection and try again.'}
      </Text>
      {!!error && <Text accessibilityRole="alert" style={{color:isDark?'#FFFFFF':'#68717A',textAlign:'center',marginTop:12}}>{error}</Text>}
      <View style={{width:'100%',marginTop:24}}><Button title="Try again" onPress={retry} loading={checking} backgroundColor="#157A52" color="#FFFFFF" margin={0}/></View>
      </View>
    </View>
  )
}
