import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./contexts/ThemeContext";
import HomeScreen from "./screens/HomeScreen";
import MedicineTracker from "./screens/MedicineTracker";
import StatsScreen from "./screens/StatsScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const { colors, isDark } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.statusBar.background}
      />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Medicine") {
              iconName = focused ? "medical" : "medical-outline";
            } else if (route.name === "Stats") {
              iconName = focused ? "stats-chart" : "stats-chart-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "settings" : "settings-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.tabBar.active,
          tabBarInactiveTintColor: colors.tabBar.inactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: 5,
            paddingTop: 5,
            height: 65,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          headerStyle: {
            backgroundColor: colors.header.background,
          },
          headerTintColor: colors.header.text,
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "Health Tracker",
            headerRight: () => (
              <Ionicons
                name="fitness"
                size={24}
                color={colors.header.text}
                style={{ marginRight: 15 }}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Medicine"
          component={MedicineTracker}
          options={{
            title: "Medicine",
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            title: "Statistics",
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: "Settings",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
