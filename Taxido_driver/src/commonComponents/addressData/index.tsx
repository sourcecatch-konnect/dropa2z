import {View} from 'react-native';
import {Text} from '../../design/Typography';
import React from 'react'
import Icons from '../../utils/icons/icons'
import styles from './styles'
import commanStyle from '../../style/commanStyles'
import { useTheme } from '@react-navigation/native'
import { useValues } from '../../utils/context'
import appColors from '../../theme/appColors'

interface AddressDataProps {
  color?: string
  locationDetails?: any[]
}

export function AddressData({ locationDetails = [] }: AddressDataProps) {
  const { colors } = useTheme()
  const { viewRtlStyle, textRtlStyle, isDark } = useValues()

  if (locationDetails.length === 0) return null

  const isSingle = locationDetails.length === 1

  if (locationDetails.length > 2) {
    return (
      <View style={{ width: '100%', marginTop: 8 }}>
        {locationDetails.map((location, index) => {
          const lastIndex = locationDetails.length - 1
          const label = index === 0 ? 'P' : index === lastIndex ? 'D' : String(index)

          return (
            <View
              key={`${index}-${location}`}
              style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}
            >
              <View style={{ width: 26, alignItems: 'center' }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 1,
                    borderColor: appColors.primary,
                    backgroundColor: index === lastIndex ? appColors.primary : colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: index === lastIndex ? appColors.white : appColors.primary, fontSize: 11 }}>
                    {label}
                  </Text>
                </View>
                {index < lastIndex && (
                  <View style={{ height: 14, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: colors.border }} />
                )}
              </View>
              <Text
                style={{ flex: 1, color: colors.text, marginLeft: 8 }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {typeof location === 'string' ? location : String(location ?? '')}
              </Text>
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={[styles.address1, { flexDirection: viewRtlStyle }]}>
      <View style={[styles.alignment, { flexDirection: viewRtlStyle }]}>
        <View style={styles.spaceRight}>
          <Icons.location color={colors.text} />
          {!isSingle && (
            <>
              <View style={styles.verticalDot} />
              <Icons.gps color={isDark ? appColors.white : appColors.primaryFont} />
            </>
          )}
        </View>

        <View style={styles.spaceRight}>
          <Text
            style={[
              commanStyle.pickup,
              { color: colors.text, textAlign: textRtlStyle },
            ]}
          >
            {locationDetails[0].length > 40
              ? `${locationDetails[0].slice(0, 40)}...`
              : locationDetails[0]}
          </Text>

          {!isSingle && locationDetails[1] && (
            <>
              <View style={[styles.border, { borderColor: colors.border }]} />
              <Text
                style={[
                  commanStyle.drop,
                  { color: colors.text, textAlign: textRtlStyle },
                ]}
              >
 {locationDetails[1].length > 40
              ? `${locationDetails[1].slice(0, 40)}...`
              : locationDetails[1]}              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  )
}
