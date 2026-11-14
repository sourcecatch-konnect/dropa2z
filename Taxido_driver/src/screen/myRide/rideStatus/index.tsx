import React, { useEffect, useState, useMemo, memo } from 'react'
import {FlatList, Pressable, ScrollView, View} from 'react-native';
import {Text} from '../../../design/Typography';
import appColors from '../../../theme/appColors'
import { styles } from './styles'
import RideContainer from '../rideContainer/index'
import { useValues } from '../../../utils/context'
import { useTheme } from '@react-navigation/native'
import { useLoadingContext } from '../../../utils/loadingContext'
import { LoaderStatus } from './loaderStatus'
import { windowHeight } from '../../../theme/appConstant'
export function RideStatus() {
  const { rtl, isDark } = useValues()
  const [selected, setSelected] = useState(0)
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const loadingContext: any = useLoadingContext()
  const { addressLoaded, setAddressLoaded } = loadingContext || {}
  const rideStatusData = useMemo(
    () => [
      {
        id: 0,
        title: 'Upcoming',
      },
      {
        id: 1,
        title: 'Active',
      },
      {
        id: 2,
        title: 'Past',
      },
    ],
    [],
  )

  useEffect(() => {
    if (!addressLoaded) {
      setLoading(true)
      setLoading(false)
      setAddressLoaded && setAddressLoaded(true)
    }
  }, [addressLoaded, setAddressLoaded])

  const renderItem = useMemo(() => {
    return ({ item }: { item: any }) => (
      <View style={{flex:1,minWidth:0}}>
        <Pressable
          onPress={() => setSelected(item?.id)}
          accessibilityRole="tab"
          accessibilityState={{selected:item?.id===selected}}
          style={[
            styles.container,
            {
              backgroundColor:
                item?.id === selected
                  ? '#FC9F03'
                  : isDark
                    ? appColors.bgDark
                    : appColors.white,
              borderColor: colors.border,
            },
            item?.id === selected ? { borderColor: '#FC9F03' } : null,
          ]}
        >
          <Text
            style={[
              styles.mediumTextBlack12,
              item?.id === selected
                ? { color: '#17191C' }
                : { color: isDark ? appColors.white : '#111111' },
            ]}
          >
            {item?.title}
          </Text>
        </Pressable>
      </View>
    )
  }, [selected, isDark, colors, rtl])

  const renderRideComponents = useMemo(() => {
    switch (selected) {
      case 0:
        return <RideContainer status={'schedule'} />
      case 1:
        return <RideContainer status={'accepted'} />
      case 2:
        return <RideContainer status={'past'} />
      default:
        return <RideContainer status={'schedule'} />
    }
  }, [selected])

  return (
    <View
      style={{
        backgroundColor: isDark ? colors.background : appColors.graybackground,
        flex: 1,
      }}
    >
      {loading ? (
        <LoaderStatus />
      ) : (
        <View
          style={[
            styles.listContainer,
            { backgroundColor: isDark ? '#25282D' : '#F0F1F3', borderColor:isDark?'#41464E':'#E5E7EB' },
          ]}
        >
          <View accessibilityRole="tablist" style={{flexDirection:rtl?'row-reverse':'row',padding:4,gap:4}}>{rideStatusData.map(item=><React.Fragment key={item.id}>{renderItem({item})}</React.Fragment>)}</View>
        </View>
      )}

      <View style={{ flex: 1 }}>{renderRideComponents}</View>
    </View>
  )
}

export default memo(RideStatus)
