import {View, TouchableOpacity, TouchableWithoutFeedback, FlatList, Image, RefreshControl} from 'react-native';
import {Text} from '../../../design/Typography';
import React, { useCallback, useState } from "react";
import {DesignIcon} from "../../../design/DesignIcon";
import {CardHeading} from "../../../design/CardHeading";
import { Back, Info } from "@src/utils/icons";
import { Add } from "@src/utils/icons";
import { appColors, appFonts, windowHeight } from "@src/themes";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {RiderEmptyState} from '../../../design/RiderEmptyState';
import styles from "./styles";
import { useValues } from "@src/utils/context/index";;
import { external } from "@src/styles/externalStyle";
import { TicketLoader } from "./TicketLoader";
import { ticketDataGet } from "@src/api/store/actions";
import { AppDispatch } from "@src/api/store";

export function SupportTicket() {
  const { navigate, goBack } = useNavigation();
  const { ticketData, loading } = useSelector((state: any) => state.tickets);
  const { textColorStyle, isDark, viewRTLStyle, bgFullStyle } = useValues();
  const { translateData } = useSelector((state) => state.setting);

  const gotoAdd = () => {
    navigate("CreateTicket");
  };

  const gotoDetails = (value) => {
    navigate("TicketDetails", { ticketData: value });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(ticketDataGet())
      .unwrap()
      .finally(() => {
        setRefreshing(false);
      });
  }, [dispatch]);



  const renderTicketItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.renderTicketItemView}>
        <TouchableWithoutFeedback onPress={() => gotoDetails(item)}>
          <View style={[styles.ticketContainer, {
            backgroundColor: bgFullStyle,
            borderColor: isDark ? appColors.darkBorder : appColors.border,
          },]}>
            <View style={[styles.row, { flexDirection: viewRTLStyle }]}>
              <View style={styles.ticketIcon}><DesignIcon name="message-circle" color="#A64B00" width={22} height={22}/></View>
              <View style={styles.formatDateView}>
                <Text style={styles.ticketStyle}>#{item?.ticket_number}</Text>
                <Text style={[styles.createdAt, {color: isDark ? "#BBC1CA" : "#656C76"}]}>
                  {formatDate(item?.created_at)}
                </Text>
              </View>
              <View style={styles.status_Container}>
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>
                    {item?.ticketStatus?.name}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.subjectText, { color: isDark ? appColors.whiteColor : appColors.primaryText, }]}>{item?.subject}</Text>
            <Text style={[styles.desText, {color: isDark ? "#BBC1CA" : "#656C76"}]}>
              {(item?.messages?.[0]?.message || "").length > 80
                ? `${item.messages[0].message.substring(0, 80)}...`
                : item?.messages?.[0]?.message || ""}
            </Text>
            <View style={[styles.departmentView, { borderColor: isDark ? appColors.darkBorder : appColors.border }]} />
            <View style={[{ flexDirection: viewRTLStyle }]}>
              <View style={[styles.departSubView,{flexDirection:viewRTLStyle,gap:6,alignItems:"center"}]}><DesignIcon name="circle-help" color="#656C76" width={15} height={15}/>
                <Text
                  style={{
                    color: appColors.darkPurpal,
                    fontFamily: appFonts.regular,
                  }}
                >
                  {item?.department?.name}
                </Text>
              </View>
              <View style={[styles.priorityView,{flexDirection:viewRTLStyle,gap:6,alignItems:"center"}]}><DesignIcon name="tag" color="#9A3412" width={15} height={15}/>
                <Text style={styles.priorityText}>{item?.priority?.name}</Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  return (
    <View style={external.main}>
      <View
        style={{
          backgroundColor: isDark ? appColors.darkHeader : appColors.whiteColor,
        }}
      >
        <View style={[styles.headerView, { flexDirection: viewRTLStyle }]}>
          <TouchableOpacity
            activeOpacity={0.7}

            style={[
              styles.backButton,
              { borderColor: isDark ? appColors.darkBorder : appColors.border },
            ]}
            accessibilityRole="button" accessibilityLabel="Back from support tickets"
            onPress={() => goBack()}
          >
            <Back />
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColorStyle }]}>
            {translateData.supportTicket}
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}

            style={[
              styles.addBtn,
              { borderColor: isDark ? appColors.darkBorder : appColors.border },
            ]}
            accessibilityRole="button" accessibilityLabel="Create support ticket"
            onPress={gotoAdd}
          >
            <Add colors={textColorStyle} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{
        backgroundColor: isDark ? appColors.primaryText : appColors.lightGray,
        flex: 1
      }}>
        {loading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <View key={index} style={{ marginBottom: windowHeight(1) }}>
              <TicketLoader />
            </View>
          ))
        ) : ticketData?.data?.length > 0 ? (
          <FlatList
            ListHeaderComponent={<CardHeading icon="circle-help" title={translateData.supportTicket || "Support Tickets"} subtitle="Follow your conversations with our support team"/>}
            contentContainerStyle={{padding:16,paddingBottom:32}}
            data={ticketData?.data}
            renderItem={renderTicketItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={appColors.primary}
              />
            }
            keyExtractor={(item) => item?.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View
            style={[
              styles.ticketSubContainer,
              {
                backgroundColor: isDark
                  ? appColors.primaryText
                  : appColors.lightGray,
              },
            ]}
          >
            <RiderEmptyState icon="message-circle" title={translateData.noTicket || "No support tickets"} description={translateData.noTicketDes}/>
          </View>
        )}
      </View>
    </View>
  );
}
