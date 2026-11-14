import {ReferenceScreen} from '../../../design/ReferenceChrome';
import React, { useCallback, useEffect, useState } from 'react'
import { AppState, BackHandler, View, ScrollView, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Header } from '../component'
import styles from './styles'
import { RideStatus } from '../rideStatus'
import appColors from '../../../theme/appColors'
import { rideDataGets } from '../../../api/store/action'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '../../../api/store'
import getEchoInstance from '../../../utils/echo'
import { useAppNavigation } from '../../../utils/navigation'

export function MyRide() {
  const dispatch = useDispatch<AppDispatch>()
  const driverId = useSelector((state: any) => state.account.selfDriver?.id)
  const navigation = useAppNavigation()
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(useCallback(() => {
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (!active || pending || AppState.currentState !== 'active') return;
      pending = true;
      try { await dispatch(rideDataGets()).unwrap(); } catch (_) {} finally { pending = false; }
    };
    refresh();
    let channel: any = null;
    const receive = () => { refresh(); };
    if (driverId) getEchoInstance().then(echo => {
      if (!active) return;
      channel = echo.private('driver-ride-request-' + driverId);
      channel.listen('.driver.ride.request', receive);
    }).catch(() => undefined);
    const timer = setInterval(refresh, 5000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { active = false; clearInterval(timer); subscription.remove(); channel?.stopListening?.('.driver.ride.request', receive); };
  }, [dispatch, driverId]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await dispatch(rideDataGets()).unwrap()
    } catch (error) {
    } finally {
      setRefreshing(false)
    }
  }, [dispatch])

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <ReferenceScreen><View style={[styles.main, {backgroundColor:'transparent'}]}>
      <Header />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[appColors.primary]}
          />
        }
      >
        <View
          style={{
            backgroundColor: appColors.graybackground,
            flex: 1
          }}
        >
          <RideStatus />
        </View>
      </ScrollView>
    </View></ReferenceScreen>
  )
}

export default MyRide

