import {DriverEmptyState} from '../../../../design/DriverEmptyState';
import {CardHeading} from '../../../../design/CardHeading';
import {Header} from '../../../../commonComponents/header';
import {ReferenceScreen} from '../../../../design/ReferenceChrome';
import {View, TouchableOpacity, TouchableWithoutFeedback, FlatList, Image, BackHandler, RefreshControl} from 'react-native';
import {Text} from '../../../../design/Typography';
import React, { useEffect } from 'react'
import appColors from '../../../../theme/appColors'
import Icons from '../../../../utils/icons/icons'
import { useTheme } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import Images from '../../../../utils/images/images'
import commonStyles from '../../../../style/commanStyles'
import styles from './styles'
import { useValues } from '../../../../utils/context'
import { TicketLoader } from './TicketLoader'
import { useAppNavigation } from '../../../../utils/navigation'
import { AppDispatch } from '../../../../api/store'
import { ticketDataGet } from '../../../../api/store/action'

export function SupportTicket() {
  const { colors } = useTheme()
  const navigation = useAppNavigation()
  const { viewRtlStyle, isDark, textRtlStyle } = useValues()
  const { ticketData, statusCode, loading } = useSelector(
    (state: any) => state.tickets,
  )
  const { translateData } = useSelector((state: any) => state.setting)

  const gotoAdd = () => {
    navigation.navigate('CreateTicket')
  }

  const gotoDetails = (value: any) => {
    navigation.navigate('TicketDetails', { ticketData: value })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack()
        return true
      }
      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    )

    return () => backHandler.remove()
  }, [navigation])
  const dispatch = useDispatch<AppDispatch>()
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = () => {
    setRefreshing(true)
    dispatch(ticketDataGet())
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const renderTicketItem = ({ item }: any) => {
    return (
      <View style={styles.containerMain}>
        <TouchableWithoutFeedback onPress={() => gotoDetails(item)}>
          <View
            style={[
              styles.ticketContainer,
              { backgroundColor: isDark ? colors.card : appColors.white },
              { borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.created_Main_Container,
                { flexDirection: viewRtlStyle },
              ]}
            >
              <View style={styles.created_Container}>
                <Text style={[styles.ticketText, { textAlign: textRtlStyle }]}>
                  {item.ticket_number}
                </Text>
                <Text
                  style={[styles.created_at_Text, { textAlign: textRtlStyle }]}
                >
                  {formatDate(item.created_at)}
                </Text>
              </View>
              <View style={styles.ticket_Container}>
                <View style={styles.ticket_status_Container}>
                  <Text style={styles.ticket_status}>
                    {item?.ticketStatus.name}
                  </Text>
                </View>
              </View>
            </View>
            <Text
              style={[
                styles.subjectText,
                {
                  color: isDark ? appColors.white : appColors.primaryFont,
                  textAlign: textRtlStyle,
                },
              ]}
            >
              {item.subject}
            </Text>
            <Text style={[styles.messageText, { textAlign: textRtlStyle }]}>
              {item.messages[0].message?.length > 80
                ? `${item.messages[0].message.substring(0, 80)}...`
                : item.messages[0].message}
            </Text>
            <View
              style={[
                styles.container,
                {
                  borderColor: colors.border,
                },
              ]}
            />
            <View style={{ flexDirection: viewRtlStyle }}>
              <View style={styles.departmentContainer}>
                <Text style={styles.departmentText}>
                  {item.department.name}
                </Text>
              </View>
              <View style={styles.priorityContainer}>
                <Text style={styles.priorityText}>{item.priority.name}</Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }

  return (
    <ReferenceScreen><View style={[styles.mainContainer, {backgroundColor:'transparent'}]}>
      <Header title={translateData.supportTicket} rightAction={<TouchableOpacity accessibilityRole="button" accessibilityLabel="Create support ticket" onPress={gotoAdd} style={{width:44,height:44,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border,borderRadius:14}}><Icons.Add color={colors.text}/></TouchableOpacity>}/>
      {loading ? (
        [...Array(2)].map((_, index) => <TicketLoader key={index} />)
      ) : ticketData?.data?.length > 0 ? (
        <FlatList
          data={ticketData?.data}
          renderItem={renderTicketItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<CardHeading icon="message-circle" title="Your Support Tickets"/>}
          contentContainerStyle={[styles.contentContainerStyle,{padding:20,paddingBottom:32}]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={appColors.primary}
            />
          }
        />
      ) : (
        <DriverEmptyState icon="message-circle" title={translateData.emptyTicket || "No support tickets"} description={translateData.noTicket}/>
      )}
    </View></ReferenceScreen>
  )
}
