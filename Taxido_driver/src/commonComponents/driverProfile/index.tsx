import {View, Image, TouchableOpacity, Linking} from 'react-native';
import {Text} from '../../design/Typography';
import React from 'react'
import Icons from '../../utils/icons/icons'
import commanStyle from '../../style/commanStyles'
import styles from './styles'
import { useTheme } from '@react-navigation/native'
import { useValues } from '../../utils/context'
import { fontSizes, windowHeight, windowWidth } from '../../theme/appConstant'
import appColors from '../../theme/appColors'
import appFonts from '../../theme/appFonts'
import { useAppNavigation } from '../../utils/navigation'
import { DriverProfileProps } from './type'
import { useSelector } from 'react-redux'
import {rideDataGet} from '../../api/services/rideService'
import {mergeBookingSnapshot, bookingStatus, contactPhone, parcelReceiver, bookingPhoto} from '../../utils/bookingPeople'

export function DriverProfile({ borderRadius, userDetails, rideDetails: initialDetails,istrue, compact=false }: DriverProfileProps | any) {
  const [snapshot, setSnapshot] = React.useState<any>(null)
  const [imageFailed, setImageFailed] = React.useState(false)
  const rideDetails = mergeBookingSnapshot(initialDetails, snapshot)
  const receiver = parcelReceiver(rideDetails)
  const receiverPhone = contactPhone(receiver)
  const goodsLabel = String(rideDetails?.delivery_details?.goods_type || '').replace(/-/g, ' ')
  const goodsTitle = goodsLabel ? goodsLabel.charAt(0).toUpperCase() + goodsLabel.slice(1) : ''
  const needsDetails = Boolean(initialDetails?.id && (!initialDetails?.rider?.name || !initialDetails?.rider?.id || !initialDetails?.ride_status))
  React.useEffect(() => {
    let mounted = true
    setSnapshot(null)
    setImageFailed(false)
    if (needsDetails) rideDataGet(Number(initialDetails.id)).then(response => {
      if (mounted) setSnapshot(response?.data ?? response)
    }).catch(() => undefined)
    return () => { mounted = false }
  }, [initialDetails?.id, needsDetails])

  const navigation: any = useAppNavigation()
  const { colors } = useTheme()
  const { viewRtlStyle, isDark, rtl } = useValues()
  const { translateData } = useSelector((state: any) => state.setting)

  const [status, setStatus] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (rideDetails?.ride_status?.name) {
      setStatus(rideDetails?.ride_status?.name)
    }
  }, [rideDetails])

  if (!rideDetails?.id || (!rideDetails?.rider && !userDetails)) {
    return null
  }

  const gotoChat = () => {
    navigation.navigate('Chat', {
      driverId: rideDetails?.driver?.id,
      riderId: rideDetails?.rider?.id,
      rideId: rideDetails?.id,
      riderName: rideDetails?.rider?.name,
      riderImage: rideDetails?.rider?.profile_image_url || rideDetails?.rider?.profile_image?.original_url,
    })
  }

  const gotoCall = () => {
    const phoneNumber = contactPhone(rideDetails?.rider || userDetails)
    if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`).catch(() => undefined)
  }

  return (
    <View
      style={[
        styles.profile,
        compact && styles.profileCompact,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.subProfile, compact && { marginHorizontal: 4, marginVertical: 3 }, { flexDirection: viewRtlStyle }]}>
        {bookingPhoto(rideDetails?.rider || userDetails) && !imageFailed ? (
          <Image
            source={{ uri: bookingPhoto(rideDetails?.rider || userDetails) }}
            onError={() => setImageFailed(true)}
            style={[styles.userImage, compact && { width: 44, height: 44 }, { borderRadius: borderRadius }]}
          />
        ) : (
          <View
            style={[
              styles.userImage,
              compact && { width: 44, height: 44 },
              {
                borderRadius: borderRadius,
                backgroundColor: appColors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text
              style={{
                fontSize: fontSizes.FONT4HALF,
                fontFamily: appFonts.bold,
                color: appColors.white,
              }}
            >
              {rideDetails?.rider?.name?.charAt(0)?.toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{flex:1,minWidth:0}}>
          <View
            style={[
              commanStyle.directionRow,
              { flexDirection: viewRtlStyle, marginHorizontal: compact ? 4 : windowWidth(2) },
            ]}
          >
            <Text
              style={[
                styles.userName,
                { color: colors.text },
                { flexShrink:1 },
              ]}
            >
              {userDetails?.name || rideDetails?.rider?.name}
            </Text>
          </View>

          <View style={{ flexDirection: viewRtlStyle }}>
              <View style={[styles.starContainer, compact && { marginHorizontal: 4 }, { flexDirection: viewRtlStyle }]}>
              {Array.from({ length: 5 }).map((_, index) => {
                const fullStarThreshold = index + 1
                const halfStarThreshold = index + 0.5
                if (rideDetails?.rider?.rating_count >= fullStarThreshold) {
                  return <Icons.RatingStar key={index} />
                } else if (rideDetails?.rider?.rating_count >= halfStarThreshold) {
                  return <Icons.RatingHalfStar key={index} />
                } else {
                  return <Icons.RatingEmptyStar key={index} />
                }
              })}
              <View style={{ flexDirection: viewRtlStyle }}>
                <Text
                  style={[
                    commanStyle.totalReview,
                    {
                      color: isDark ? appColors.white : appColors.primaryFont,
                      left: windowWidth(0.5),
                      top: windowHeight(0.1),
                    },
                  ]}
                >
                  {Number(rideDetails?.rider?.rating_count || 0).toFixed(1)}
                </Text>
                <Text
                  style={{
                    color: appColors.secondaryFont,
                    left: windowWidth(0.5),
                    top: windowHeight(0.4),
                  }}
                >
                  ({rideDetails?.rider?.review_count || 0})
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {['accepted','arrived','started','ongoing'].includes(bookingStatus(rideDetails)) && !istrue && (
        <View
          style={[
            { flexDirection: viewRtlStyle, alignItems:'center',gap:10 },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              borderWidth: compact ? 1 : 0,
              borderColor: compact ? '#5B5148' : 'transparent',
              minHeight: compact ? 38 : 48,
              backgroundColor: isDark ? appColors.bgDark : appColors.lightGray,
              flex: 1,
              minWidth: 0,
              borderRadius: windowHeight(0.8),
              justifyContent: 'center',
            }}
            onPress={gotoChat}
          >
            <Text
              style={{
                fontFamily: appFonts.regular,
                marginHorizontal: windowWidth(2),
                color: isDark ? appColors.white : appColors.black,
              }}
            >
              {translateData.sendaMsg}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
            { backgroundColor: appColors.primary, width:compact?40:48, height:compact?40:48, borderRadius:12, borderWidth:compact?1:0, borderColor:compact?'#5B5148':'transparent', alignItems:'center',justifyContent:'center' },
            ]}
            activeOpacity={0.7}
            onPress={gotoCall}
            disabled={!contactPhone(rideDetails?.rider || userDetails)}
            accessibilityLabel="Call customer"
          >
            <Icons.Call color={appColors.white} />
          </TouchableOpacity>
        </View>
      )}
      {!!rideDetails?.delivery_details?.goods_type && (
        compact ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }} numberOfLines={1}>Goods: {goodsLabel}</Text>
            <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12, backgroundColor: isDark ? '#3B3024' : '#FFF1DC' }}>
              <Text style={{ color: appColors.primary, fontSize: 11, fontFamily: appFonts.medium }} numberOfLines={1}>{goodsTitle}</Text>
            </View>
          </View>
        ) : <Text style={{ color: colors.text, marginTop: 10 }}>Goods: {goodsLabel}</Text>
      )}
      {!!receiver && (
        <View style={{ paddingTop: compact ? 5 : 10, borderTopWidth: compact ? 1 : .5, borderTopColor: compact ? '#5B5148' : colors.border }}>
          {compact ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: colors.text, fontSize: 11 }}>Parcel receiver</Text>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 12 }} numberOfLines={1}>{receiver.name || receiver.receiver_name || 'Receiver'}{receiverPhone ? ` · ${receiverPhone}` : ''}</Text>
              </View>
              {!!receiverPhone && ['accepted', 'arrived', 'started', 'ongoing'].includes(bookingStatus(rideDetails)) && !istrue &&
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Call parcel receiver" onPress={() => Linking.openURL(`tel:${receiverPhone}`).catch(() => undefined)} style={{ paddingVertical: 5, paddingHorizontal: 8 }}><Text style={{ color: appColors.primary, fontWeight: '600', fontSize: 11 }}>Call receiver</Text></TouchableOpacity>}
            </View>
          ) : (
            <>
              <Text style={{ color: colors.text, fontSize: 12 }}>Parcel receiver</Text>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{receiver.name || receiver.receiver_name || 'Receiver'}{receiverPhone ? ` · ${receiverPhone}` : ''}</Text>
              {!!receiverPhone && ['accepted', 'arrived', 'started', 'ongoing'].includes(bookingStatus(rideDetails)) && !istrue &&
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Call parcel receiver" onPress={() => Linking.openURL(`tel:${receiverPhone}`).catch(() => undefined)} style={{ paddingVertical: 10 }}><Text style={{ color: appColors.primary, fontWeight: '600' }}>Call receiver</Text></TouchableOpacity>}
            </>
          )}
        </View>
      )}
    </View>
  )
}
