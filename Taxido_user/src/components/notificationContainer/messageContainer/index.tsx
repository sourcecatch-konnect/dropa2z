import {FlatList, Image, View, RefreshControl, ActivityIndicator} from 'react-native';
import {Text} from '../../../design/Typography';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { external } from '../../../styles/externalStyle';
import { styles } from './styles';
import { MessageItem } from '../messageItem/index';
import { useDispatch, useSelector } from 'react-redux';
import { notificationDataGet } from '../../../api/store/actions/notificationAction';
import Images from '@src/utils/images';
import { useValues } from '@src/utils/context/index';
import { appColors, windowHeight } from '@src/themes';
import { again_Amazing } from '@src/constant';
import { Button, notificationHelper } from '@src/commonComponent';
import { AppDispatch, RootState } from '@src/api/store';
import {useLiveBookings} from '../../../utils/LiveBookingProvider';
import {BookingActivityCard} from '../../homeScreen/BookingActivityCard';
import {DeliveryNotification} from '../../../design/DeliveryNotification';
import {bookingCopy} from '../../../utils/liveBooking';
import {TouchableOpacity,AppState} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export function TopCategory() {
  const insets=useSafeAreaInsets();
  const {bookings,notices,openBooking,refresh:refreshBookings}=useLiveBookings();
  const dispatch = useDispatch<AppDispatch>();
  const { notificationList }: any = useSelector((state: RootState) => state.notification);
  const { translateData }: any = useSelector((state: RootState) => state.setting);
  const { textColorStyle, isDark } = useValues();
  const [refreshing, setRefreshing] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const lastPressRef = useRef<number>(0);

  useEffect(() => {
    dispatch(notificationDataGet());
    const app=AppState.addEventListener('change',state=>{if(state==='active')dispatch(notificationDataGet());});
    return()=>app.remove();
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refreshBookings();
    dispatch(notificationDataGet()).finally(() => setRefreshing(false));
  }, [dispatch]);

  const handleRefreshPress = useCallback(() => {
    const now = Date.now();
    if (now - lastPressRef.current < 2000) {
      notificationHelper('', 'Too many attempts. Please wait.', 'error');
      return;
    }
    lastPressRef.current = now;
    setBtnLoading(true);
    dispatch(notificationDataGet()).finally(() => setBtnLoading(false));
  }, [dispatch]);

  const ItemSeparatorComponent = () => {
    return <View style={{height:10}} />;
  };

  const renderItem = ({ item }: any) => <MessageItem item={item} />;

  return (
    <View style={{flex:1}}>
      {(notificationList?.data?.length > 0||notices.length>0||bookings.length>0) ? (
        <FlatList
          ListHeaderComponent={<View><BookingActivityCard/>{notices.map(notice=>{const {title,body}=bookingCopy(notice.booking);return <TouchableOpacity key={notice.id} accessibilityRole="button" accessibilityLabel={title} onPress={()=>void openBooking(notice.booking)} style={{marginBottom:10}}><DeliveryNotification compact title={title} description={body} time={new Date(notice.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} dark={isDark}/></TouchableOpacity>;})}</View>}
          ItemSeparatorComponent={ItemSeparatorComponent}
          data={notificationList?.data}
          renderItem={renderItem}
          contentContainerStyle={{paddingHorizontal:14,paddingTop:4,paddingBottom:Math.max(20,insets.bottom+12)}}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[appColors.primary]}
              tintColor={appColors.primary}
            />
          }
        />
      ) : (
        <View
          style={[
            styles.centerContainer,
            {
              backgroundColor: isDark
                ? appColors.bgDark
                : appColors.notificationColor,
            },
          ]}>
          <Image style={styles.image} source={Images.bellNotification} />
          <Text style={[styles.title, { color: textColorStyle }]}>
            {translateData?.nothinghhere}
          </Text>
          <Text style={[styles.text]}>
            {translateData?.clickToRefresh}
            {'\n'} {again_Amazing}
          </Text>
          <View style={styles.refreshButtonContainer}>
            <Button
              title={translateData?.refresh}
              onPress={handleRefreshPress}
              loading={btnLoading}
            />
          </View>
        </View>
      )}
    </View>
  );
}

