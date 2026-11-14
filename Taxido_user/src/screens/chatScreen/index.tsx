import {KeyboardViewport} from '../../design/KeyboardViewport';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BrandLoader} from '../../design/BrandLogo';
import {ReferenceScreen,ReferenceLogo} from '../../design/ReferenceChrome';
import React, { useState, useEffect, useRef } from "react";
import {View, TouchableOpacity, FlatList, Image, BackHandler, ScrollView, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform} from 'react-native';
import {Text, TextInput} from '../../design/Typography';
import { commonStyles } from "../../styles/commonStyle";
import { external } from "../../styles/externalStyle";
import { Back, Send, Clip } from "@utils/icons";
import { appColors, windowHeight } from "@src/themes";
import { useValues } from "@src/utils/context/index";
import { styles } from "./styles";
import Images from "@utils/images";
import { useAppNavigation } from "@src/utils/navigation";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { launchImageLibrary } from "react-native-image-picker";
import getEchoInstance from "@src/utils/echo";
import { api } from "@src/api/apiClient";
import { getValue } from "@src/utils/localstorage";
import { URL } from "@src/api/config";

export function ChatScreen() {
  const { goBack } = useAppNavigation();
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const { driverId, riderId, rideId, driverName, driverImage, from: requestedFrom }: any =
    route.params || {};
  const from=requestedFrom==='help'||!Number(rideId)||!Number(driverId)?'help':requestedFrom;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [supportAdminId, setSupportAdminId] = useState<string | null>(null);
  const [supportLoadFailed, setSupportLoadFailed] = useState(false);
  const {
    bgFullStyle,
    isDark,
    textRTLStyle,
    textColorStyle,
    viewRTLStyle,
    bgContainer,
  } = useValues();
  const { translateData } = useSelector((state: any) => state.setting);
  const { self } = useSelector((state: any) => state.account);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const lastMessageIdRef = useRef<number>(0);
  const insets=useSafeAreaInsets();
  const sending=React.useRef(false);
  const [sendError,setSendError]=useState('');

  useEffect(() => {
    if (from !== "help") return;

    let isMounted = true;
    api
      .get("chat/support")
      .then(response => {
        const adminId = response.data?.data?.admin_id;
        if (isMounted && adminId) {
          setSupportAdminId(String(adminId));
          setSupportLoadFailed(false);
        } else if (isMounted) {
          setSupportLoadFailed(true);
        }
      })
      .catch(error => {
        console.log("Unable to load chat support account", error);
        if (isMounted) setSupportLoadFailed(true);
      });

    return () => {
      isMounted = false;
    };
  }, [from]);

  const currentUserId = String(riderId ?? self?.id ?? '');
  const adminId = supportAdminId;
  const chatWithUserId = from === "help" ? adminId ?? "" : `${driverId}`;

  // roomId convention for the backend
  const roomId =
    from === "help"
      ? adminId && currentUserId
        ? [parseInt(adminId), parseInt(currentUserId)]
          .sort((a, b) => a - b)
          .join("_")
        : ""
      : [parseInt(rideId), parseInt(currentUserId), parseInt(chatWithUserId)]
          .sort((a, b) => a - b)
          .join("_");

  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const focusListener = navigation.addListener("focus", () => {
      scrollToBottom();
    });
    return focusListener;
  }, [navigation]);

  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Real-time Chat Listener
  useEffect(() => {
    if (!roomId || roomId.includes("NaN")) {
      return;
    }

    let echo: any;
    let isMounted = true;

    const setupEcho = async () => {
      try {
        echo = await getEchoInstance();
        if (!isMounted || !echo) return;
        console.log("reom", roomId);

        echo
          .private(`chat.room.${roomId}`)
          .subscribed(() => {
            console.log(
              " Reverb: Successfully subscribed to private-chat.room." + roomId,
            );
          })
          .error((err: any) => {
            console.log(" Reverb: Subscription error:", err);
          })
          .listen(".chat.message.sent", (e: any) => {
            const data = e.data || e;
            if (data && isMounted) {
              // If the message is from me, skip adding it here because it's already handled in sendMessage
              if (data.sender_id?.toString() === currentUserId) {
                return;
              }
              const newMessage = {
                ...data,
                id:
                  data.id ||
                  data.created_at ||
                  `msg_${Date.now()}_${Math.random()}`,
              };
              setMessages(prev => {
                const exists = prev.find(m => m.id === newMessage.id);
                if (exists) {
                  return prev;
                }
                return [newMessage, ...prev];
              });
            }
          })
          .listen("ChatMessageSent", (e: any) => {
            const data = e.data || e;
            if (data && isMounted) {
              // If the message is from me, skip adding it here because it's already handled in sendMessage
              if (data.sender_id?.toString() === currentUserId) {
                return;
              }
              const newMessage = {
                ...data,
                id:
                  data.id ||
                  data.created_at ||
                  `msg_${Date.now()}_${Math.random()}`,
              };
              setMessages(prev => {
                const exists = prev.find(m => m.id === newMessage.id);
                if (exists) {
                  return prev;
                }
                return [newMessage, ...prev];
              });
            }
          });
      } catch (err) {
        console.log(" Reverb: Error in setupEcho", err);
      }
    };

    setupEcho();

    return () => {
      isMounted = false;
      if (echo) {
        echo.leave(`chat.room.${roomId}`);
      }
    };
  }, [roomId]);

  const fetchMessages = async (incremental = false) => {
    if (!roomId || roomId.includes("NaN")) return;
    try {
      const afterId = lastMessageIdRef.current;
      const response = await api.get("chat/messages", {
        params: incremental
          ? { room_id: roomId, after_id: afterId }
          : { room_id: roomId },
      });
      if (response.data?.status && Array.isArray(response.data?.data)) {
        const incoming = [...response.data.data].reverse();
        const latestId = incoming.reduce(
          (latest, message) => Math.max(latest, Number(message.id) || 0),
          afterId,
        );
        lastMessageIdRef.current = Math.max(afterId, latestId);

        if (incremental && afterId > 0) {
          if (incoming.length > 0) {
            setMessages(previous => {
              const knownIds = new Set(previous.map(message => String(message.id)));
              const newMessages = incoming.filter(
                message => !knownIds.has(String(message.id)),
              );
              return newMessages.length > 0
                ? [...newMessages, ...previous]
                : previous;
            });
          }
        } else {
          setMessages(incoming);
        }
      }
    } catch (e) {
      console.log("fetchMessages error", e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  // Initial Message Fetch
  useEffect(() => {
    lastMessageIdRef.current = 0;
    let cancelled = false;
    let pollingInterval: ReturnType<typeof setInterval> | undefined;

    const startPolling = async () => {
      await fetchMessages();
      if (!cancelled) {
        pollingInterval = setInterval(() => fetchMessages(true), 3000);
      }
    };

    startPolling();
    return () => {
      cancelled = true;
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [roomId]);

  const pickImages = async () => {
    launchImageLibrary({ mediaType: "photo", selectionLimit: 5 }, response => {
      if (response.didCancel) return;
      if (response.errorMessage) return;
      if (response.assets && response.assets.length > 0) {
        setSelectedImages(prev => [...prev, ...response.assets!]);
      }
    });
  };

  const sendMessage = async () => {
    if(sending.current||!roomId||roomId.includes('NaN')||(!input.trim()&&!selectedImages.length))return;
    sending.current=true;setUploading(true);setSendError('');
    const controller=new AbortController();
    const deadline=setTimeout(()=>controller.abort(),25000);

    const messageText = input.trim();
    const imagesToSend = [...selectedImages];

    setInput("");
    setSelectedImages([]);

    try {
      const token=await getValue("token");
      const receiverId = from === "help" ? adminId : driverId;
      const language = await getValue("selectedLanguage");
      const defaultLng = await getValue("defaultLanguage");
      const currentLng = language || defaultLng;

      let body;
      let headers: any = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Accept-Lang": currentLng,
      };

      if (imagesToSend.length > 0) {
        const formData = new FormData();
        formData.append("room_id", roomId);
        formData.append("receiver_id", receiverId.toString());

        if (messageText) {
          formData.append("message", messageText);
        }

        imagesToSend.forEach((image, index) => {
          formData.append(`images[${index}]`, {
            uri:
              Platform.OS === "android"
                ? image.uri
                : image.uri.replace("file://", ""),
            type: image.type || "image/jpeg",
            name: image.fileName || `image_${index}.jpg`,
          } as any);
        });
        body = formData;
        // Fetch in RN often needs this explicitly for multipart
        // Let React Native supply the multipart boundary.
      } else {
        body = JSON.stringify({
          room_id: roomId,
          receiver_id: parseInt(receiverId),
          message: messageText,
        });
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${URL}/api/chat/send`, {
        signal: controller.signal,
        method: "POST",
        body: body,
        headers: headers,
      });

      const responseData = await response.json();

      if(!response.ok || !responseData?.status || !responseData?.data) throw new Error(responseData?.message||"Message was not sent. Please try again.");
      if (responseData?.status && responseData?.data) {
        const data = responseData.data;
        lastMessageIdRef.current = Math.max(
          lastMessageIdRef.current,
          Number(data.id) || 0,
        );
        const newMessage = {
          ...data,
          id: data.id || data.created_at || `msg_send_${Date.now()}`,
        };
        setMessages(prev => {
          const exists = prev.find(m => m.id === newMessage.id);
          if (exists) {
            return prev;
          }
          return [newMessage, ...prev];
        });
        scrollToBottom();
      }
    } catch (e) {
      setSendError(controller.signal.aborted?'Sending timed out. Please retry.':(e as any)?.message||'Failed to send message');
      setInput(previous=>previous||messageText);
      setSelectedImages(previous=>previous.length?previous:imagesToSend);
    } finally {clearTimeout(deadline);sending.current=false;setUploading(false);}
  };

  return (
    <ReferenceScreen><View style={[[commonStyles.flexContainer], {backgroundColor:'transparent'}]}>
      <View style={{alignItems:'center',paddingVertical:10,backgroundColor:bgFullStyle}}><ReferenceLogo width={130}/></View>
      <View
        style={[
          styles.view_Main,
          { backgroundColor: bgFullStyle, flexDirection: viewRTLStyle },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.backButton,
            { borderColor: isDark ? appColors.darkBorder : appColors.border },
            { backgroundColor: isDark ? bgContainer : appColors.lightGray },
          ]}
          onPress={goBack}
        >
          <Back />
        </TouchableOpacity>
        <View style={[external.mh_10, external.fg_1]}>
          <Text
            style={[
              styles.templetionStyle,
              { color: textColorStyle, textAlign: textRTLStyle },
            ]}
          >
            {from == "help" ? "Administrator" : driverName}
          </Text>
          <Text
            style={[
              commonStyles.mediumTextBlack12,
              external.mt_2,
              { color: appColors.primary, textAlign: textRTLStyle },
            ]}
          >
            {translateData.online}
          </Text>
        </View>
      </View>

      <KeyboardViewport
        style={{
          backgroundColor: isDark ? appColors.primaryText : appColors.lightGray,
          flex: 1,
        }} iosOffset={100}
      >
        {from === "help" && supportLoadFailed && (
          <Text style={{ color: "#B42318", paddingHorizontal: 16, paddingVertical: 8 }}>
            Unable to load Dropa2z support. Please check your connection and try again.
          </Text>
        )}
        <View
          style={{
            flex: 1,
          }}
        >
          <FlatList
            ref={flatListRef}
            inverted
            data={messages}
            keyExtractor={(item, index) =>
              item.id?.toString() || index.toString()
            }
            style={styles.listStyle}
            renderItem={({ item }) => {
              const isMe = item.sender_id?.toString() === currentUserId;
              const timestamp = item.created_at
                ? new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : translateData.sending;

              return (
                <View
                  style={[
                    styles.mainView,
                    {
                      flexDirection: isMe ? "row-reverse" : "row",
                    },
                  ]}
                >
                  {!isMe && (
                    <Image
                      source={
                        driverImage ? { uri: driverImage } : Images.defultImage
                      }
                      style={[
                        styles.imageStyle,
                        { borderColor: appColors.border },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.messageContainer,
                      isMe ? styles.senderMessage : styles.receiverMessage,
                      !isMe && {backgroundColor:isDark ? "#25282D" : "#FFFFFF",borderWidth:1,borderColor:isDark ? "#444A46" : "#E5E7EB"},
                    ]}
                  >
                    {item?.message !== "" && (
                      <Text
                        style={[
                          styles.messageText,
                          !isMe
                            ? styles.senderMessageText
                            : styles.receiverMessageText,
                          { textAlign: "left",color:isMe ? "#FFFFFF" : isDark ? "#FFFFFF" : "#17191C",lineHeight:22 },
                        ]}
                      >
                        {item.message}
                      </Text>
                    )}
                    {item?.images &&
                      Array.isArray(item?.images) &&
                      item?.images?.length > 0 && (
                        <ScrollView horizontal style={{ marginVertical: 5 }}>
                          {item.images.map((img: any, idx: number) => {
                            const imgUri =
                              typeof img === "string" ? img : img.url;
                            return (
                              <Image
                                key={idx}
                                source={{ uri: imgUri }}
                                style={{
                                  width: 120,
                                  height: 120,
                                  borderRadius: 8,
                                  marginRight: 5,
                                }}
                              />
                            );
                          })}
                        </ScrollView>
                      )}
                    <Text
                      style={[
                        styles.timeStyle,
                        {
                          color: isMe ? appColors.whiteColor : appColors.gray,
                          textAlign: isMe ? "right" : "left",
                        },
                      ]}
                    >
                      {timestamp}
                    </Text>
                  </View>
                </View>
              );
            }}
            removeClippedSubviews={true}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[appColors.primary]}
                tintColor={appColors.primary}
              />
            }
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              ></View>
            }
          />

          {selectedImages?.length > 0 && (
            <ScrollView
              horizontal
              style={{ padding: windowHeight(10), maxHeight: windowHeight(75) }}
            >
              {selectedImages.map((image, idx) => (
                <Image
                  key={idx}
                  source={{ uri: image.uri }}
                  style={{
                    width: windowHeight(50),
                    height: windowHeight(50),
                    borderRadius: windowHeight(5),
                    margin: windowHeight(5),
                  }}
                />
              ))}
            </ScrollView>
          )}

          {!!sendError&&<Text accessibilityRole="alert" style={{color:isDark?'#FFAAA4':'#B42318',padding:10}}>{sendError}</Text>}
          <View
            style={[
              styles.inputContainer,
              {paddingBottom:Math.max(insets.bottom,8),flexShrink:0},
              {
                backgroundColor: isDark
                  ? appColors.primaryText
                  : appColors.lightGray,
              },
              { flexDirection: viewRTLStyle },
            ]}
          >
            <View
              style={[
                styles.textInputView,
                { backgroundColor: bgFullStyle, flexDirection: viewRTLStyle },
              ]}
            >
              <View style={styles.inputView}>
                <TouchableOpacity
                  style={styles.emojiView}
                  activeOpacity={0.7}
                  onPress={pickImages}
                >
                  <Clip />
                </TouchableOpacity>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    { textAlign: textRTLStyle, color: textColorStyle },
                  ]}
                  value={input}
                  onChangeText={setInput}
                  placeholder={translateData?.typeHere||'Type a message'}
                  multiline
                  editable={!!roomId}
                  placeholderTextColor={appColors.subtitle}
                />
              </View>
              <View style={styles.sendBtnView}>
                {uploading ? (
                  <BrandLoader size="small" color={appColors.primary} />
                ) : (
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendMessage}
                    activeOpacity={0.7}
                    accessibilityRole="button" accessibilityLabel="Send message" disabled={!roomId||roomId.includes('NaN')||uploading}
                  >
                    <Send />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </KeyboardViewport>
    </View></ReferenceScreen>
  );
}
