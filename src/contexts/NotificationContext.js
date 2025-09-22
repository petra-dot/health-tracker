import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { useUserProfile } from "./UserProfileContext";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { goals } = useUserProfile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [dailySummaries, setDailySummaries] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);

  // Notification scheduling state
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  // Mock notification system for web (since web doesn't have native notifications)
  const webNotifications = {
    requestPermissions: async () => {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
      return false;
    },

    scheduleNotification: (title, body, scheduleTime) => {
      if ("Notification" in window && Notification.permission === "granted") {
        const delay = scheduleTime.getTime() - new Date().getTime();
        if (delay > 0) {
          setTimeout(() => {
            new Notification(title, { body, icon: "/favicon.png" });
          }, delay);
        }
      }
    },

    cancelNotification: (id) => {
      // Web notifications can't be cancelled once scheduled
      console.log(`Cancelled notification ${id}`);
    },
  };

  // Real Expo notification system for mobile
  const mobileNotifications = {
    requestPermissions: async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === "granted";

        if (granted) {
          // Configure notification channel for Android
          if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync(
              "health-reminders",
              {
                name: "Health Reminders",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#4CAF50",
              }
            );
          }
        }

        return granted;
      } catch (error) {
        console.error("Error requesting notification permissions:", error);
        return false;
      }
    },

    scheduleNotification: async (title, body, scheduleTime) => {
      try {
        // Calculate trigger time in seconds from now
        const now = new Date();
        const triggerTimeSeconds = Math.floor(
          (scheduleTime.getTime() - now.getTime()) / 1000
        );

        if (triggerTimeSeconds <= 0) {
          console.warn(
            "Notification scheduled for past time, skipping:",
            title
          );
          return null;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: title,
            body: body,
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            seconds: triggerTimeSeconds,
            channelId: "health-reminders",
          },
        });

        console.log(`Scheduled notification ${notificationId}: ${title}`);
        return notificationId;
      } catch (error) {
        console.error("Error scheduling notification:", error);
        throw error;
      }
    },

    cancelNotification: async (id) => {
      try {
        if (id) {
          await Notifications.cancelScheduledNotificationAsync(id);
          console.log(`Cancelled notification ${id}`);
        }
      } catch (error) {
        console.error("Error cancelling notification:", error);
      }
    },
  };

  const notificationSystem =
    Platform.OS === "web" ? webNotifications : mobileNotifications;

  // Setup notification listeners and request permissions on mount
  useEffect(() => {
    const requestPermissionsAndSetupListeners = async () => {
      // Request permissions
      const granted = await notificationSystem.requestPermissions();
      setNotificationsEnabled(granted);

      // Set up foreground notification listener (important for Expo)
      const foregroundSubscription =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log(
            "Notification received while app is foreground:",
            notification
          );
        });

      const responseSubscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("User tapped notification:", response.notification);
        });

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Cleanup subscriptions on unmount
      return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      };
    };

    requestPermissionsAndSetupListeners();
  }, []);

  // Schedule water reminders
  useEffect(() => {
    if (!waterReminders || !notificationsEnabled) return;

    const scheduleWaterReminders = async () => {
      const now = new Date();
      const reminders = [];

      // Cancel existing water notifications first
      const existingWaterNotifications = scheduledNotifications.filter(
        (n) => n.type === "water"
      );
      for (const notification of existingWaterNotifications) {
        if (notification.notificationId) {
          await notificationSystem.cancelNotification(
            notification.notificationId
          );
        }
      }

      // Schedule reminders every 2 hours from 8 AM to 8 PM
      for (let hour = 8; hour <= 20; hour += 2) {
        const reminderTime = new Date(now);
        reminderTime.setHours(hour, 0, 0, 0);

        // If the time has passed today, schedule for tomorrow
        if (reminderTime <= now) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }

        try {
          const notificationId = await notificationSystem.scheduleNotification(
            "💧 Hydration Reminder",
            `Time to drink some water! You're aiming for ${goals.water}ml today.`,
            reminderTime
          );

          reminders.push({
            id: `water-${hour}`,
            notificationId: notificationId,
            type: "water",
            time: reminderTime,
            title: "💧 Hydration Reminder",
            body: `Time to drink some water! You're aiming for ${goals.water}ml today.`,
          });
        } catch (error) {
          console.error(
            "Failed to schedule water reminder for hour",
            hour,
            error
          );
        }
      }

      // Filter out old water notifications and add new ones
      setScheduledNotifications((prev) => [
        ...prev.filter((n) => n.type !== "water"),
        ...reminders,
      ]);
    };

    scheduleWaterReminders();

    // Set up interval to reschedule daily
    const interval = setInterval(scheduleWaterReminders, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [waterReminders, notificationsEnabled, goals.water]);

  // Schedule daily summary
  useEffect(() => {
    if (!dailySummaries || !notificationsEnabled) return;

    const scheduleDailySummary = async () => {
      const now = new Date();
      const summaryTime = new Date(now);
      summaryTime.setHours(20, 0, 0, 0); // 8 PM daily

      // If the time has passed today, schedule for tomorrow
      if (summaryTime <= now) {
        summaryTime.setDate(summaryTime.getDate() + 1);
      }

      // Cancel existing daily summary notification
      const existingSummaryNotification = scheduledNotifications.find(
        (n) => n.type === "summary"
      );
      if (existingSummaryNotification?.notificationId) {
        await notificationSystem.cancelNotification(
          existingSummaryNotification.notificationId
        );
      }

      try {
        const notificationId = await notificationSystem.scheduleNotification(
          "📊 Daily Health Summary",
          "Check your progress for today! See how you did with your health goals.",
          summaryTime
        );

        // Filter out old summary notification and add new one
        setScheduledNotifications((prev) => [
          ...prev.filter((n) => n.type !== "summary"),
          {
            id: "daily-summary",
            notificationId: notificationId,
            type: "summary",
            time: summaryTime,
            title: "📊 Daily Health Summary",
            body: "Check your progress for today! See how you did with your health goals.",
          },
        ]);
      } catch (error) {
        console.error("Failed to schedule daily summary notification:", error);
      }
    };

    scheduleDailySummary();

    // Set up interval to reschedule daily
    const interval = setInterval(scheduleDailySummary, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dailySummaries, notificationsEnabled]);

  const cancelAllNotifications = async () => {
    try {
      if (Platform.OS === "web") {
        // Web doesn't support canceling scheduled notifications
        console.log("Canceling all notifications on web");
      } else {
        // For mobile, cancel all scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      setScheduledNotifications([]);
      Alert.alert(
        "Success",
        "All scheduled notifications have been cancelled."
      );
    } catch (error) {
      console.error("Error cancelling all notifications:", error);
      Alert.alert("Error", "Failed to cancel notifications.");
    }
  };

  const testNotification = async () => {
    try {
      const notificationId = await notificationSystem.scheduleNotification(
        "🧪 Test Notification",
        "This is a test notification from Health Tracker!",
        new Date(Date.now() + 5000) // 5 seconds from now
      );

      if (notificationId) {
        Alert.alert(
          "Test Notification",
          "A test notification has been scheduled for 5 seconds from now."
        );
      }
    } catch (error) {
      console.error("Error testing notification:", error);
      Alert.alert("Error", "Failed to schedule test notification.");
    }
  };

  const value = {
    notificationsEnabled,
    waterReminders,
    dailySummaries,
    goalAlerts,
    setNotificationsEnabled,
    setWaterReminders,
    setDailySummaries,
    setGoalAlerts,
    cancelAllNotifications,
    testNotification,
    scheduledNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
