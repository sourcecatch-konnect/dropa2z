import {DeliveryNotification} from '../../design/DeliveryNotification';
import {ReferenceScreen} from '../../design/ReferenceChrome';
import {View, FlatList, Image, TouchableOpacity} from 'react-native';
import {Text} from '../../design/Typography';
import React, { useEffect } from 'react'
import { Header } from '../../commonComponents'
import appColors from '../../theme/appColors'
import { useValues } from '../../utils/context'
import { useTheme } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { notificationData } from '../../api/store/action'
import styles from './styles'
import { NotificationLoader } from './notificationLoader'
import Images from '../../utils/images/images'
import Icons from '../../utils/icons/icons'
import { AppDispatch } from '../../api/store'

export function Notification() {
  const dispatch = useDispatch<AppDispatch>()
  const { viewRtlStyle, isDark, textRtlStyle } = useValues()
  const { colors } = useTheme()
  const { notificationList, loading } = useSelector(state => state.notification)
  const { translateData } = useSelector(state => state.setting)

  useEffect(() => {
    dispatch(notificationData())
  }, [])


  const refresh = async () => {
    await dispatch(notificationData()).unwrap()
      .then((res) => {
      })
  }

  const getTimeAgo = timestamp => {
    const createdAt = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now - createdAt) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} ${translateData.secondsago}`
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} ${translateData.minutesago}`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} ${translateData.hoursago}`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays} ${translateData.daysago}`
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) return `${diffInMonths} ${translateData.monthsago}`
    const diffInYears = Math.floor(diffInMonths / 12)
    return `${diffInYears} ${translateData.yearsago}`
  }
  const renderItem = ({item}:any) => <View style={{marginHorizontal:16,marginBottom:12}}><DeliveryNotification title={item?.data?.title} description={item?.data?.message||item?.data?.body} time={getTimeAgo(item?.created_at)} dark={isDark}/></View>;

  return (
    <ReferenceScreen><View style={[styles.container, {backgroundColor:'transparent'}]}>
      <Header
        title={translateData.notification}
        backgroundColor={
          isDark ? appColors.darkThemeSub : appColors.graybackground
        }
      />
      {loading ? (
        [...Array(4)].map((_, index) => <NotificationLoader key={index} />)
      ) : notificationList?.data?.length > 0 ? (
        <FlatList
          data={notificationList.data}
          renderItem={renderItem}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Image source={Images.bell} style={styles.noDataImg} />
          <View
            style={[styles.walletContainer, { flexDirection: viewRtlStyle }]}
          >
            <Text
              style={[
                styles.msg,
                { color: isDark ? colors.text : appColors.primaryFont },
              ]}
            >
              {translateData.nothingHere}
            </Text>
          </View>
          <Text style={styles.detail}>
            {translateData.notificationRefresh}{' '}
          </Text>
          <TouchableOpacity style={styles.refreshContainer} activeOpacity={0.7} onPress={refresh}>
            <Text style={styles.refreshText}>{translateData.refresh}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View></ReferenceScreen>
  )
}
