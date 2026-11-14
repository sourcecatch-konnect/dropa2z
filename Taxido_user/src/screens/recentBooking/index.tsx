import {BrandLoader} from '../../design/BrandLogo';
import {VehicleGraphic} from '../../design/VehicleGraphic';
import {View, Image, FlatList, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Text} from '../../design/Typography';
import React, { useRef, useState } from "react";
import { appColors, windowWidth } from "@src/themes";
import { CalenderSmall, ClockSmall, Gps, PickLocation } from "@src/utils/icons";
import { external } from "@src/styles/externalStyle";
import { styles } from "./styles";
import { useValues } from "@src/utils/context/index";
import {
  Button,
  formatDateTime,
  notificationHelper,
} from "@src/commonComponent";
import { useAppNavigation } from "@src/utils/navigation";
import { useDispatch, useSelector } from "react-redux";
import { userRideLocation, vehicleTypeDataGet } from "@src/api/store/actions";
import { AppDispatch } from "@src/api/store";
import {ReferenceIcon,referenceSurfaces} from '../../design/ReferenceChrome';
import {GET_API} from '../../api/methods';
import {apiErrorMessage,requireApiSuccess} from '../../api/responseError';
import {bookingStatus} from '../../utils/liveBooking';

export function Recentbooking({ recentRideData,compact=false }: any) {
  const {
    bgFullStyle,
    textColorStyle,
    viewRTLStyle,
    isDark,
    textRTLStyle,
    Google_Map_Key,
  } = useValues();
  const dispatch = useDispatch<AppDispatch>();
  const [loadingIndex, setLoadingIndex] = useState(null);
  const detailsOpening=useRef(false);
  const { zoneValue } = useSelector((state: any) => state.zone);
  const { translateData } = useSelector((state: any) => state.setting);
  const { navigate }: any = useAppNavigation();

  const navigateToDelivery=(ride:any,item:any)=>{
      const status=bookingStatus(ride);
      if(status==='accepted'||status==='arrived')navigate('RideActive',{activeRideOTP:ride});
      else if(['started','in_progress','on_going'].includes(status))navigate('Payment',{rideId:Number(ride.id)});
      else {
        const labels:Record<string,string>={completed:'Completed',cancelled:'Cancelled',canceled:'Cancelled',scheduled:'Scheduled',pending:'Pending'};
        navigate('PendingRideScreen',{item:ride,vehicleDetail:ride.vehicle_type??item.vehicle_type,rideStatus:labels[status]||'Delivery'});
      }
  };

  const openDeliveryDetails=async(item:any,index:number)=>{
    if(detailsOpening.current||!item?.id)return;
    detailsOpening.current=true;setLoadingIndex(index);
    let response:any;
    try{
      response=await GET_API(`ride/${item.id}`,{timeout:12000});
      requireApiSuccess(response,'Could not open this delivery. Please try again.');
      const ride=response.data?.data??response.data;
      if(!ride?.id||String(ride.id)!==String(item.id))throw new Error('The delivery details could not be loaded. Please try again.');
      navigateToDelivery(ride,item);
    }catch(error){
      const failure=response??error;
      const networkFailure=!failure?.status&&!failure?.response?.status&&(
        ['ERR_NETWORK','ECONNABORTED','ETIMEDOUT'].includes(failure?.code)||
        /network error|network request failed|timeout/i.test(String(failure?.message||''))
      );
      const canReadHistory=['completed','cancelled','canceled'].includes(bookingStatus(item))&&
        Array.isArray(item.locations)&&item.locations.length>=2&&item.driver&&item.rider;
      if(networkFailure&&canReadHistory)navigateToDelivery(item,item);
      else notificationHelper('',networkFailure?'Could not connect. Check your internet connection and tap the delivery again.':apiErrorMessage(error,'Could not open this delivery. Please try again.'),'error');
    }
    finally{detailsOpening.current=false;setLoadingIndex(null);}
  };

  if ((!recentRideData || recentRideData.length === 0) && !compact) {
    return null;
  }

  const convertToCoords = async (address: any) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${Google_Map_Key}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.results?.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } else {
        console.warn("No results for:", address, data.status);
        return null;
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  const convertStopsToCoords = async (stopList: any) => {
    const coordsArray = [];
    for (const stop of stopList) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            stop,
          )}&key=${Google_Map_Key}`,
        );
        const data = await res.json();
        if (data.status === "OK" && data.results?.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;
          coordsArray.push({ latitude: lat, longitude: lng });
        } else {
          console.warn("No results for stop:", stop, data.status);
          coordsArray.push(null);
        }
      } catch (err) {
        console.error("Stop geocoding error:", err);
        coordsArray.push(null);
      }
    }
    return coordsArray;
  };

  const gotoBook = async (item: any) => {
    const locations = item?.locations || [];
    const pickupLocation = locations[0] || null;
    const destination =
      locations?.length > 1 ? locations[locations?.length - 1] : null;
    const stops =
      locations?.length > 2 ? locations.slice(1, locations?.length - 1) : [];
    try {
      const pickupCoords = await convertToCoords(pickupLocation);
      const destinationCoords = await convertToCoords(destination);
      const stopCoords = await convertStopsToCoords(stops || []);
      const ride_number = item?.id;
      const res = await dispatch(userRideLocation({ ride_number })).unwrap();
      const zoneValue = res?.data?.[0];
      const rawLocations = [
        pickupCoords,
        ...stopCoords,
        destinationCoords,
      ];

      const filteredLocations = rawLocations
        .filter(
          coord => coord && coord.latitude != null && coord.longitude != null,
        )
        .map((coord: any) => ({
          lat: coord.latitude,
          lng: coord.longitude,
        }));

      const serviceType = item?.service?.service_type;
      if (serviceType === 'parcel' || serviceType === 'freight') {
        navigate("BookRide", {
          destination, stops, pickupLocation,
          service_ID: item.service_id,
          service_category_ID: item.service_category_id,
          service_name: serviceType, zoneValue, scheduleDate: null,
          filteredLocations,
          pickupCoords: filteredLocations[0],
          destinationCoords: filteredLocations[filteredLocations.length - 1],
          stopsCoords: filteredLocations.slice(1, -1),
        });
        return;
      }
      const payload: any = {
        locations: filteredLocations,
        service_id: item?.service_id,
        service_category_id: item?.service_category_id,
      };

      dispatch(vehicleTypeDataGet(payload)).then((res: any) => {
        const categoryId = item?.service_id;
        const categoryOptionID = item?.service_category_id;
        const scheduleDate = null;
        const service_name = item?.service?.service_type;

        const slug = item?.service_category?.slug;
        const pickupCoords1 = item?.location_coordinates[0];
        const destinationCoords1 =
          item?.location_coordinates?.length > 1
            ? item?.location_coordinates[item?.location_coordinates?.length - 1]
            : null;
        if (slug === "intercity" || slug === "ride") {
          navigate("BookRide", {
            destination,
            stops,
            pickupLocation,
            service_ID: categoryId,
            zoneValue,
            scheduleDate,
            service_category_ID: categoryOptionID,
            filteredLocations: filteredLocations,
            pickupCoords: pickupCoords1,
            destinationCoords: destinationCoords1,
          });
        } else if (slug === "package") {
          navigate("Rental", {
            pickupLocation,
            service_ID: categoryId,
            service_category_ID: categoryOptionID,
            zoneValue,
          });
        } else if (service_name === "parcel" || service_name === "freight") {
          navigate("BookRide", {
            destination,
            stops,
            pickupLocation,
            service_ID: categoryId,
            zoneValue,
            service_name,
            service_category_ID: categoryOptionID,
            filteredLocations: filteredLocations,
            pickupCoords: pickupCoords1,
            destinationCoords: destinationCoords1,
          });
        } else if (service_name === "finddriver") {
          navigate("FindLocationScreen", {
            defultAddress: pickupLocation,
            destination: destination,
            defultCoords: pickupCoords1,
            destinationCoords: destinationCoords1,
            service_ID: categoryId,
            service_category_ID: categoryOptionID,
            sub_category_name: item?.service_category?.name,
          });
        }
      });
    } catch (error) {
      notificationHelper("", error, "error");
    } finally {
    }
  };

  const renderItem = ({ item, index }: any) => {
    const { date, time } = formatDateTime(item?.created_at);
    return (
      <View
        style={[
          styles.view,
          {
            borderColor: isDark ? appColors.darkBorder : appColors.border,
            backgroundColor: bgFullStyle,
          },
        ]}
      >
        <View style={{ flexDirection: viewRTLStyle }}>
          <View style={styles.viewWidth}>
            <View style={{ flexDirection: viewRTLStyle }}>
              <View
                style={[
                  styles.imageView,
                  {
                    backgroundColor: isDark
                      ? appColors.darkPrimary
                      : appColors.lightGray,
                  },
                ]}
              >
                <VehicleGraphic source={{
  uri: item?.vehicle_type?.vehicle_image_url
}} style={styles.img} vehicle={item?.vehicle_type} />
              </View>
              <View style={styles.textView}>
                <Text
                  style={[
                    styles.textId,
                    {
                      color: isDark
                        ? appColors.whiteColor
                        : appColors.primaryText,
                    },
                  ]}
                >
                  #{item?.ride_number}
                </Text>
                <Text style={styles.price}>
                  {zoneValue?.currency_symbol}
                  {item?.total}
                </Text>
                <Text
                  style={[
                    styles.textId,
                    {
                      color: isDark
                        ? appColors.whiteColor
                        : appColors.primaryText,
                    },
                  ]}
                >
                  {Number(item?.distance).toFixed(1)} {item?.distance_unit}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.viewWidth1}>
            <View
              style={[styles.clockSmallView1, { flexDirection: viewRTLStyle }]}
            >
              <View style={styles.clockSmall}>
                <CalenderSmall />
              </View>
              <Text style={styles.date}>{date}</Text>
            </View>
            <View
              style={[styles.clockSmallView, { flexDirection: viewRTLStyle }]}
            >
              <View style={styles.clockSmall}>
                <ClockSmall />
              </View>
              <Text style={styles.date}>{time}</Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.border,
            { borderColor: isDark ? appColors.darkBorder : appColors.border },
          ]}
        />
        <View
          style={[
            { flexDirection: viewRTLStyle },
            { backgroundColor: bgFullStyle },
          ]}
        >
          <View style={[external.fd_column, external.mh_15, external.mt_8]}>
            <PickLocation
              height={12}
              width={12}
              colors={isDark ? appColors.whiteColor : appColors.primaryText}
            />
            <View style={styles.icon} />
            <Gps
              height={12}
              width={12}
              colors={isDark ? appColors.whiteColor : appColors.primaryText}
            />
          </View>
          <View style={[external.pv_10]}>
            <Text
              style={[
                styles.itemStyle,
                { color: textColorStyle, width: windowWidth(310) },
              ]}
            >
              {item?.locations[0]?.length > 42
                ? `${item.locations[0].slice(0, 42)}...`
                : item?.locations[0]}
            </Text>
            <View
              style={[
                styles.dashedLine,
                {
                  borderColor: isDark ? appColors.darkBorder : appColors.border,
                },
              ]}
            />
            <Text
              style={[styles.pickUpLocationStyles, { color: textColorStyle }]}
            >
              {item?.locations[item?.locations?.length - 1]}
            </Text>
          </View>
        </View>

        <Button
          backgroundColor={appColors.primary}
          onPress={() => {
            setLoadingIndex(index);
            gotoBook(item).finally(() => setLoadingIndex(null));
          }}
          textColor={appColors.whiteColor}
          title={translateData.BookAgainTextttt}
          loading={loadingIndex === index}
        />
      </View>
    );
  };

  if(compact)return <View style={{paddingHorizontal:16,paddingTop:6}}>
    <Text style={{fontSize:17,fontWeight:'800',color:textColorStyle,marginBottom:12}}>Recent Deliveries</Text>
    {(recentRideData||[]).slice(0,1).map((item:any,index:number)=>{
      const {date,time}=formatDateTime(item?.created_at);
      return <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`View delivery ${item.ride_number || item.id}`} disabled={loadingIndex!==null} onPress={()=>void openDeliveryDetails(item,index)} style={[referenceSurfaces.card,{backgroundColor:bgFullStyle,padding:10,marginBottom:10,flexDirection:viewRTLStyle,alignItems:'center',gap:10}]}>
        <View style={{backgroundColor:'#EDF6F0',padding:7,borderRadius:10}}><ReferenceIcon name="package" size={20}/></View>
        <View style={{flex:1}}><Text style={{fontSize:13,fontWeight:'700',color:textColorStyle}}>#{item.ride_number || item.id}</Text><Text style={{fontSize:17,fontWeight:'800',color:'#157A52',marginTop:3}}>{zoneValue?.currency_symbol || '₹'}{Number(item.total || 0).toFixed(2)}</Text></View>
        {loadingIndex===index?<BrandLoader color="#157A52"/>:<View><Text style={{fontSize:11,color:'#68717A'}}>▦ {date}</Text><Text style={{fontSize:11,color:'#68717A',marginTop:6}}>◷ {time}</Text></View>}
      </TouchableOpacity>;
    })}
    {!recentRideData?.length&&<View style={[referenceSurfaces.card,{padding:16,backgroundColor:bgFullStyle}]}><Text style={{color:'#68717A'}}>Your recent deliveries will appear here.</Text></View>}
  </View>;
  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: isDark ? appColors.bgDark : appColors.lightGray },
      ]}
    >
      <Text
        style={[
          styles.recentRides,
          {
            color: isDark ? appColors.whiteColor : appColors.primaryText,
            textAlign: textRTLStyle,
          },
        ]}
      >
        {translateData.homeRecentRides}
      </Text>
      <View style={styles.container}>
        {recentRideData?.map((item: any, index: number) => (
          <React.Fragment key={item?.id || index}>
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
