import {notificationContent} from './notificationPresentation';

import messaging from "@react-native-firebase/messaging";
import notifee, {
  EventType,
  AndroidStyle, AndroidImportance,
} from "@notifee/react-native";

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
      console.log("FCM Token:", fcmToken);
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

// Show Local Notification
async function showLocalNotification(remoteMessage: any) {
  const channelId = await createNotificationChannel();

  const {title,body}=notificationContent(remoteMessage);

  await notifee.displayNotification({
    title,
    body,
    data: remoteMessage.data,
    android: {
      channelId,
      smallIcon: "dropa2z_notification",
      color: "#FC9F03",
      style: {type: AndroidStyle.BIGTEXT, text:body},
      pressAction: {
        id: "default",
      },
    },
  });
}

export function NotificationServices() {
  // Foreground message
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log(
      "Foreground notification received:",
      JSON.stringify(remoteMessage, null, 2)
    );

    await showLocalNotification(remoteMessage);
  });

  // Opened from background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      "Notification opened app from background:",
      JSON.stringify(remoteMessage, null, 2)
    );

    console.log("Notification Data:", remoteMessage?.data);
  });

  // Opened from quit/killed state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          "Notification opened app from quit state:",
          JSON.stringify(remoteMessage, null, 2)
        );

        console.log("Notification Data:", remoteMessage?.data);
      }
    });

  // Notifee foreground press
  const unsubscribeNotifee = notifee.onForegroundEvent(
    ({ type, detail }) => {
      switch (type) {
        case EventType.PRESS:
          console.log(
            "Foreground notification pressed:",
            JSON.stringify(detail.notification, null, 2)
          );

          console.log(
            "Foreground notification data:",
            detail.notification?.data
          );
          break;
      }
    }
  );

  return () => {
    unsubscribe();
    unsubscribeNotifee();
  };
}

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log(
    "Background notification received:",
    JSON.stringify(remoteMessage, null, 2)
  );

  // Show local notification only for data-only messages
  if (!remoteMessage.notification) {
    await showLocalNotification(remoteMessage);
  }
});

// Handle notification press in background
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log(
      "Background notification pressed:",
      JSON.stringify(detail.notification, null, 2)
    );

    console.log(
      "Background notification data:",
      detail.notification?.data
    );
  }
});