import {KeyboardViewport} from '../../../design/KeyboardViewport';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BrandLoader} from '../../../design/BrandLogo';
import {ReferenceScreen,ReferenceLogo} from '../../../design/ReferenceChrome';
import React, { useState, useEffect } from 'react'
import {View, TouchableOpacity, FlatList, Image, BackHandler, ActivityIndicator, ScrollView, Modal, Pressable, Platform, RefreshControl, KeyboardAvoidingView} from 'react-native';
import {Text, TextInput} from '../../../design/Typography';
import appColors from '../../../theme/appColors'
import { getValue } from '../../../utils/localstorage'
import { URL } from '../../../api/config'
import { useValues } from '../../../utils/context'
import { styles } from './styles'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icons from '../../../utils/icons/icons'
import { useTheme } from '@react-navigation/native'
import Images from '../../../utils/images/images'
import { useSelector } from 'react-redux'
import { useAppNavigation } from '../../../utils/navigation'
import getEchoInstance from '../../../utils/echo'
import { api } from '../../../api/appClient'
import { launchImageLibrary } from 'react-native-image-picker'

export function Chat() {
  const route = useRoute()
  const { driverId, riderId, rideId, riderName, riderImage, from: requestedFrom }: any =
    route.params || {}
  const self=useSelector((state:any)=>state.account?.selfDriver ?? state.account?.self);
  const from=requestedFrom==='help'||!Number(rideId)||!Number(riderId)?'help':requestedFrom;
  const { goBack } = useAppNavigation()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [supportAdminId, setSupportAdminId] = useState<string | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedImages, setSelectedImages] = useState<any[]>([])
  const flatListRef = React.useRef<FlatList>(null)
  const lastMessageIdRef = React.useRef<number>(0)
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
  const { colors } = useTheme()
  const { viewRtlStyle, textRtlStyle, rtl, isDark } = useValues()
  const { translateData } = useSelector((state: any) => state.setting)
  const navigation = useNavigation()
  const insets=useSafeAreaInsets();
  const sending=React.useRef(false);
  const [sendError,setSendError]=useState('');

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

  useEffect(() => {
    if (from !== 'help') return

    let isMounted = true
    api
      .get('chat/support')
      .then(response => {
        const adminId = response.data?.data?.admin_id
        if (isMounted && adminId) {
          setSupportAdminId(String(adminId))
          setError(null)
        } else if (isMounted) {
          setError('Unable to load Dropa2z support. Please try again.')
          setLoading(false)
        }
      })
      .catch(error => {
        console.log('Unable to load chat support account', error)
        if (isMounted) {
          setError('Unable to load Dropa2z support. Please check your connection.')
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [from])

  const ride_Id = `${rideId}`
  const currentUserId = String(driverId ?? self?.id ?? '')
  const adminId = supportAdminId
  const chatWithUserId = from === 'help' ? adminId ?? '' : `${riderId}`

  // roomId convention for the backend
  const roomId =
    from === 'help'
      ? adminId && currentUserId
        ? [parseInt(adminId), parseInt(currentUserId)]
          .sort((a, b) => a - b)
          .join('_')
        : ''
      : [parseInt(ride_Id), parseInt(currentUserId), parseInt(chatWithUserId)]
          .sort((a, b) => a - b)
          .join('_')

  // Real-time Chat Listener
  useEffect(() => {
    if (!roomId || roomId.includes('NaN')) return

    let echo: any

    const setupEcho = async () => {
      echo = await getEchoInstance()

      const pusher = echo.connector.pusher

      if (pusher && pusher.connection) {
        // Detailed Connection Logging
        pusher.connection.bind('state_change', (states: any) => {
          console.log(' Reverb Connection State:', states.current)
        })

        pusher.connection.bind('error', (err: any) => {
          console.log('❌ Reverb Connection Error:', err)
        })

        pusher.connection.bind('connected', () => {
          console.log('✅ Reverb Connected Successfully!')
        })
      }


      echo
        .private(`chat.room.${roomId}`)
        .subscribed(() => {
          console.log('✅ Reverb: Subscribed to room:', roomId)
        })
        .listen('.chat.message.sent', (e: any) => {
          const data = e.data || e
          if (data && data.sender_id?.toString() !== currentUserId) {
            const newMessage = {
              ...data,
              id: data.id || data.created_at || `msg_${Date.now()}_${Math.random()}`,
            }
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMessage.id)
              if (exists) return prev
              return [newMessage, ...prev]
            })
          }
        })
        .listen('ChatMessageSent', (e: any) => {
          const data = e.data || e
          if (data && data.sender_id?.toString() !== currentUserId) {
            const newMessage = {
              ...data,
              id: data.id || data.created_at || `msg_${Date.now()}_${Math.random()}`,
            }
            setMessages(prev => {
              const exists = prev.some(m => m.id === newMessage.id)
              if (exists) return prev
              return [newMessage, ...prev]
            })
          }
        })
    }

    setupEcho()

    return () => {
      if (echo) {
        echo.leave(`chat.room.${roomId}`)
      }
    }
  }, [roomId])

  const fetchMessages = async (incremental = false) => {
    if (!roomId || roomId.includes('NaN')) return

    try {
      if (!incremental) setLoading(true)
      const afterId = lastMessageIdRef.current
      const response = await api.get('chat/messages', {
        params: incremental
          ? { room_id: roomId, after_id: afterId }
          : { room_id: roomId },
      })
      if (response.data?.status && Array.isArray(response.data?.data)) {
        // Ensure every fetched message has an ID for FlatList stability
        const fetchedMessages = response.data.data.map((m: any) => ({
          ...m,
          id: m.id || m.created_at || `msg_fetched_${Math.random()}`,
        }))
        // Backend returns the newest page in chronological order; the inverted
        // list displays newest messages at the top.
        const incoming = [...fetchedMessages].reverse()
        const latestId = incoming.reduce(
          (latest, message) => Math.max(latest, Number(message.id) || 0),
          afterId,
        )
        lastMessageIdRef.current = Math.max(afterId, latestId)

        if (incremental && afterId > 0) {
          if (incoming.length > 0) {
            setMessages(previous => {
              const knownIds = new Set(previous.map(message => String(message.id)))
              const newMessages = incoming.filter(
                message => !knownIds.has(String(message.id)),
              )
              return newMessages.length > 0
                ? [...newMessages, ...previous]
                : previous
            })
          }
        } else {
          setMessages(incoming)
        }
      }
      if (!incremental) setLoading(false)
    } catch (e) {
      console.log('fetchMessages error', e)
      if (!incremental) setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMessages()
    setRefreshing(false)
  }

  // Initial Message Fetch
  useEffect(() => {
    lastMessageIdRef.current = 0
    let cancelled = false
    let pollingInterval: ReturnType<typeof setInterval> | undefined

    const startPolling = async () => {
      await fetchMessages()
      if (!cancelled) {
        pollingInterval = setInterval(() => fetchMessages(true), 3000)
      }
    }

    startPolling()
    return () => {
      cancelled = true
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [roomId])

  const pickImages = async () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, response => {
      if (response.didCancel) {
        return
      }
      if (response.errorMessage) {
        setError(response.errorMessage)
        return
      }
      if (response.assets && response.assets?.length > 0) {
        setSelectedImages(prev => [...prev, ...response.assets!])
      }
    })
  }

  const scrollToBottom = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
  }

  const sendMessage = async () => {
    if(sending.current||!roomId||roomId.includes('NaN')||(!input.trim()&&!selectedImages.length))return;
    sending.current=true;setUploading(true);setSendError('');
    const controller=new AbortController();
    const deadline=setTimeout(()=>controller.abort(),25000);

    const messageText = input.trim()
    const imagesToSend = [...selectedImages]
    const tempId = `temp_${Date.now()}`

    // 1. Optimistic Update: Add message immediately
    const optimisticMessage = {
      id: tempId,
      message: messageText,
      images: imagesToSend.map(asset => ({ url: asset.uri })), // Format for UI
      sender_id: currentUserId,
      receiver_id: from === 'help' ? adminId : riderId,
      created_at: new Date().toISOString(),
      isOptimistic: true, // Tag to identify pending messages
    }

    setMessages(prev => [optimisticMessage, ...prev])
    setInput('')
    setSelectedImages([])

    try {
      const receiverId = from === 'help' ? adminId : riderId
      const token = await getValue('token')
      const language = await getValue('selectedLanguage')
      const defaultLng = await getValue('defaultLanguage')
      const currentLng = language || defaultLng

      let body
      let headers: any = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Accept-Lang': currentLng,
      }

      if (imagesToSend.length > 0) {
        const formData = new FormData()
        formData.append('room_id', roomId)
        formData.append('receiver_id', receiverId.toString())

        if (messageText) {
          formData.append('message', messageText)
        }

        imagesToSend.forEach((image, index) => {
          formData.append(`images[${index}]`, {
            uri:
              Platform.OS === 'android'
                ? image.uri
                : image.uri.replace('file://', ''),
            type: image.type || 'image/jpeg',
            name: image.fileName || `image_${index}.jpg`,
          } as any)
        })
        body = formData
        // Fetch in RN often needs this explicitly for multipart
        // Let React Native supply the multipart boundary.
      } else {
        body = JSON.stringify({
          room_id: roomId,
          receiver_id: parseInt(receiverId),
          message: messageText,
        })
        headers['Content-Type'] = 'application/json'
      }

      const response = await fetch(`${URL}/api/chat/send`, {
        signal: controller.signal,
        method: "POST",
        body: body,
        headers: headers,
      })

      const responseData = await response.json()

      if(!response.ok || !responseData?.status || !responseData?.data) throw new Error(responseData?.message||"Message was not sent. Please try again.");
      if (responseData?.status && responseData?.data) {
        const data = responseData.data
        lastMessageIdRef.current = Math.max(
          lastMessageIdRef.current,
          Number(data.id) || 0,
        )
        const sentMessage = {
          ...data,
          id: data.id || data.created_at || `msg_send_${Date.now()}`,
        }

        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempId)
          const exists = filtered.some(m => m.id === sentMessage.id)
          if (exists) return filtered
          return [sentMessage, ...filtered]
        })
        scrollToBottom()
      }
    } catch (err) {
      console.log('send error', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setSendError(controller.signal.aborted?'Sending timed out. Please retry.':(err as any)?.message||'Failed to send message');
      setInput(previous=>previous||messageText);
      setSelectedImages(previous=>previous.length?previous:imagesToSend);
    } finally {clearTimeout(deadline);sending.current=false;setUploading(false);}
  }


  return (
    <ReferenceScreen><View style={[styles.containerMain, {backgroundColor:'transparent'}]}>
      <View style={{alignItems:'center',paddingVertical:10,backgroundColor:colors.card}}><ReferenceLogo driver width={130}/></View>
      {/* Header */}
      <View
        style={[
          styles.view_Main,
          { backgroundColor: colors.card, flexDirection: viewRtlStyle },
        ]}
      >
        <View style={{ flexDirection: viewRtlStyle }}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.backButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={goBack}
          >
            <Icons.Back color={colors.text} />
          </TouchableOpacity>
          <View style={styles.riderContainer}>
            <Text
              style={[
                styles.templetionStyle,
                { textAlign: textRtlStyle, color: colors.text },
              ]}
            >
              {from && from === 'help' ? 'Administrator' : riderName}
            </Text>
            <Text style={[styles.onlineText, { textAlign: textRtlStyle }]}>
              {translateData.online}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardViewport
        style={{ flex: 1 }} iosOffset={100}
      >
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        inverted
        data={messages}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        style={styles.listContainer}
        renderItem={({ item }) => {
          const isMe = item.sender_id?.toString() === currentUserId
          const timestamp = item.created_at
            ? new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
            : `${translateData.sending}`

          return (
            <View
              style={[
                styles.mainContainer,
                {
                  flexDirection: isMe ? 'row-reverse' : 'row',
                },
              ]}
            >
              {!isMe && (
                <Image
                  source={
                    riderImage ? { uri: riderImage } : Images.ProfileDefault
                  }
                  style={[styles.image, { borderColor: colors.border }]}
                />
              )}

              <View
                style={[
                  styles.messageContainer,
                  isMe
                    ? styles.senderMessage
                    : [
                      styles.receiverMessage,
                      {
                        backgroundColor: isDark
                          ? appColors.darkThemeSub
                          : appColors.white,
                      },
                    ],
                ]}
              >
                {item.message && (
                  <Text
                    style={[
                      styles.messageText,
                      !isMe
                        ? [
                          styles.senderMessageText,
                          {
                            color: isDark
                              ? "#FFFFFF"
                              : appColors.primaryFont,
                          },
                          { textAlign: rtl ? 'right' : 'left' },
                        ]
                        : [
                          styles.receiverMessageText,
                          {
                            color: isDark
                              ? appColors.white
                              : appColors.graybackground,
                          },
                        ],
                    ]}
                  >
                    {item.message}
                  </Text>
                )}

                {/* multiple images with tap for full screen */}
                {item.images && (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginTop: 5,
                    }}
                  >
                    {(Array.isArray(item.images)
                      ? item.images
                      : [item.images]
                    ).map((img: any, idx: number) => {
                      const imgUri = typeof img === 'string' ? img : img.url;
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setFullScreenImage(imgUri)}
                        >
                          <Image
                            source={{ uri: imgUri }}
                            style={{
                              width: 120,
                              height: 120,
                              borderRadius: 8,
                              margin: 3,
                            }}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <Text
                  style={[
                    styles.messageText,
                    !isMe
                      ? [
                        styles.senderMessageTime,
                        { textAlign: rtl ? 'right' : 'left' },
                      ]
                      : [
                        styles.receiverMessageTime,
                        { textAlign: rtl ? 'left' : 'right' },
                      ],
                  ]}
                >
                  {timestamp}
                </Text>
              </View>
            </View>
          )
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[appColors.primary]}
            tintColor={appColors.primary}
          />
        }
      />

      {from === 'help' && error && (
        <Text style={{ color: '#B42318', paddingHorizontal: 16, paddingVertical: 8 }}>
          {error}
        </Text>
      )}

      {/* Selected image previews before sending */}
      {selectedImages?.length > 0 && (
        <ScrollView horizontal style={{ padding: 5,maxHeight:84,flexGrow:0 }}>
          {selectedImages.map((asset, idx) => (
            <Image
              key={idx}
              source={{ uri: asset.uri }}
              style={{ width: 70, height: 70, borderRadius: 8, marginRight: 5 }}
            />
          ))}
        </ScrollView>
      )}

      {!!sendError&&<Text accessibilityRole="alert" style={{color:isDark?'#FFAAA4':'#B42318',padding:10}}>{sendError}</Text>}
      {/* Input */}
      <View
        style={[
          styles.inputContainer,
          {paddingBottom:Math.max(insets.bottom,8),flexShrink:0},
          { backgroundColor: colors.background, flexDirection: viewRtlStyle },
        ]}
      >
        <View
          style={[
            styles.textInputView,
            { backgroundColor: colors.card, flexDirection: viewRtlStyle },
          ]}
        >
          <TouchableOpacity activeOpacity={0.7} onPress={pickImages}>
            <Icons.clip />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              { textAlign: textRtlStyle, color: colors.text },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder={translateData?.typeHere||'Type a message'}
            multiline
            editable={!!roomId}
            placeholderTextColor={isDark?"#BBC1CA":appColors.secondaryFont}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            activeOpacity={0.7}
            accessibilityRole="button" accessibilityLabel="Send message" disabled={!roomId||roomId.includes('NaN')||uploading}
          >
            <Icons.SendChat color="#17191C"/>
          </TouchableOpacity>
        </View>
      </View>

      {uploading && (
        <BrandLoader
          size="small"
          color={appColors.primary}
          style={{ marginVertical: 10 }}
        />
      )}
      </KeyboardViewport>

      {/* Fullscreen modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setFullScreenImage(null)}
        >
          {fullScreenImage && (
            <Image
              source={{ uri: fullScreenImage }}
              style={{
                width: '95%',
                height: '80%',
                resizeMode: 'contain',
                borderRadius: 10,
              }}
            />
          )}
        </Pressable>
      </Modal>
    </View></ReferenceScreen>
  )
}
