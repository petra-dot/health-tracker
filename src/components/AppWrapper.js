import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import OnboardingScreen from "../screens/OnboardingScreen";
import AppNavigator from "../AppNavigator";

const AppWrapper = () => {
  const { colors } = useTheme();
  const { profile, loading, initialized } = useUserProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [profile, loading, initialized]);

  const checkOnboardingStatus = () => {
    // Wait for profile to load
    if (loading || !initialized) {
      setCheckingStatus(true);
      return;
    }

    // Check if user has completed onboarding
    // User has completed onboarding if they have a name set
    const hasCompletedOnboarding =
      profile && profile.name && profile.name.trim() !== "";

    setShowOnboarding(!hasCompletedOnboarding);
    setCheckingStatus(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show loading screen while checking onboarding status
  if (checkingStatus || loading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Loading Health Tracker...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show onboarding screen for new users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show main app for existing users
  return <AppNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
});

export default AppWrapper;
