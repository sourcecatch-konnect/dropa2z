import {notificationContent} from './notificationPresentation';
import messaging from "@react-native-firebase/messaging";
import notifee, { EventType, AndroidStyle, AndroidImportance } from "@notifee/react-native";
import {bookingChanged,queueBookingNotification} from './bookingSignals';
import {updateBookingActivityFromPush} from './bookingActivityNotification';

// Request notification permission
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    return await getFCMToken();
  }
}

// Get FCM token
export async function getFCMToken() {
  try {
    const fcmToken = await messaging().getToken();

    if (fcmToken) {
      return fcmToken;
    }
  } catch (error) {
    console.log("FCM Token Error:", error);
  }
}

// Create Android notification channel
async function createNotificationChannel() {
  const channelId = await notifee.createChannel({
    id: "default",
    name: "Dropa2z delivery updates",
    importance: AndroidImportance.HIGH,
  });

  return channelId;
}

// Show Local Notification (Same UI as background)
async function showLocalNotification(remoteMessage) {
  const channelId = await createNotificationChannel();

  const {title,body}=notificationContent(remoteMessage);

  await notifee.displayNotification({
    ...(remoteMessage.messageId?{id:remoteMessage.messageId}:{}),
    data: remoteMessage.data || {},
    title: title,
    body: body,
    android: {
      channelId,
      smallIcon: "dropa2z_notification",
      color: "#FC9F03",
      style: {type: AndroidStyle.BIGTEXT, text:body}, // make sure this icon exists
      pressAction: {
        id: "default",
        launchActivity:'default',
      },
    },
  });
}

export function NotificationServices() {
  // Foreground message
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    bookingChanged();
    await updateBookingActivityFromPush(remoteMessage);
    // Show system notification when app is open
    await showLocalNotification(remoteMessage);
  });

  // When notification opens app from background
  const unsubscribeOpened=messaging().onNotificationOpenedApp(remoteMessage => {
    void queueBookingNotification(remoteMessage.data||{});
  });

  // When notification opens app from quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        void queueBookingNotification(remoteMessage.data||{});
      }
    });

  // Foreground notification press (Notifee)
  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      void queueBookingNotification(detail.notification?.data||{});
    }
  });

  return () => {
    unsubscribe();
    unsubscribeOpened();
    unsubscribeNotifee();
  };
}

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  await updateBookingActivityFromPush(remoteMessage);
  // Show notification for data-only payload
  if (!remoteMessage.notification) {
    await showLocalNotification(remoteMessage);
  }
});

// Handle notification press in background
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    await queueBookingNotification(detail.notification?.data||{});
  }
});
