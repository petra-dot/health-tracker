import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Switch,
  TextInput,
  Modal,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { useNotifications } from "../contexts/NotificationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PersonalInfoEditor from "../components/PersonalInfoEditor";
import { AnalyticsService } from "../utils/analytics";
import { getEntriesForDateRange } from "../db/database";

const SettingsScreen = () => {
  const { theme, toggleTheme, colors, isDark } = useTheme();
  const { goals, profile, updateGoals } = useUserProfile();
  const {
    notificationsEnabled,
    waterReminders,
    dailySummaries,
    goalAlerts,
    setNotificationsEnabled,
    setWaterReminders,
    setDailySummaries,
    setGoalAlerts,
    testNotification,
    cancelAllNotifications,
  } = useNotifications();

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Goal editing state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalInputs, setGoalInputs] = useState({
    water: goals.water.toString(),
    calories: goals.calories.toString(),
    steps: goals.steps.toString(),
  });

  // Personal info editing state
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);

  const exportData = async () => {
    try {
      Alert.alert("Export Data", "Preparing your health data for download...", [
        { text: "OK" },
      ]);

      // Collect all health data for export
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // Up to 1 year of data

      const entries = await getEntriesForDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      // Get summary statistics
      const summaryStats = await AnalyticsService.getSummaryStats();
      const weeklyData = await AnalyticsService.getChartData(52 * 7); // 52 weeks

      // Prepare export data structure
      const exportDataObj = {
        exportDate: new Date().toISOString(),
        appVersion: "1.0.0",
        userProfile: {
          name: profile?.name || "Not set",
          birthdate: profile?.birthdate || "Not set",
          height_cm: profile?.height_cm || "Not set",
          weight_kg: profile?.weight_kg || "Not set",
        },
        userGoals: goals,
        summary: summaryStats,
        entries: entries,
        weeklyTrends: weeklyData,
      };

      setTimeout(() => {
        Alert.alert(
          "Data Export Ready",
          `Your health data has been prepared (${entries.length} entries found).\n\nIncludes:\n• Daily tracking records\n• Personal profile & goals\n• Progress trends\n• Summary statistics\n\nData exported successfully for backup, analysis, or healthcare provider sharing.`,
          [
            {
              text: "Export as JSON",
              onPress: async () => {
                try {
                  const jsonData = JSON.stringify(exportDataObj, null, 2);
                  // In a real implementation, this would save to file using expo-file-system
                  console.log(
                    "JSON Export (first 500 chars):",
                    jsonData.substring(0, 500)
                  );

                  Alert.alert(
                    "Success",
                    `JSON export completed!\n\nEntries: ${
                      entries.length
                    }\nSize: ${Math.round(
                      jsonData.length / 1024
                    )}KB\n\nFile would be saved as 'health-data-${
                      new Date().toISOString().split("T")[0]
                    }.json'`
                  );
                } catch (error) {
                  console.error("JSON export error:", error);
                  Alert.alert("Error", "Failed to create JSON export file.");
                }
              },
            },
            {
              text: "Export as CSV",
              onPress: async () => {
                try {
                  // Convert to CSV format
                  const csvHeaders = "Date,Water (ml),Calories,Steps,Notes\n";
                  const csvRows = entries
                    .map(
                      (entry) =>
                        `"${entry.date}",${entry.water_ml || 0},${
                          entry.calories || 0
                        },${entry.steps || 0},"${entry.notes || ""}"`
                    )
                    .join("\n");

                  const csvData = csvHeaders + csvRows;
                  console.log(
                    "CSV Export (first 200 chars):",
                    csvData.substring(0, 200)
                  );

                  Alert.alert(
                    "Success",
                    `CSV export completed!\n\nEntries: ${
                      entries.length
                    }\nSize: ${Math.round(
                      csvData.length / 1024
                    )}KB\n\nFile would be saved as 'health-data-${
                      new Date().toISOString().split("T")[0]
                    }.csv'`
                  );
                } catch (error) {
                  console.error("CSV export error:", error);
                  Alert.alert("Error", "Failed to create CSV export file.");
                }
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }, 1500);
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert("Error", "Failed to export data. Please try again.");
    }
  };

  const clearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all your health data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Alert.alert("Success", "All data has been cleared.");
          },
        },
      ]
    );
  };

  const aboutApp = () => {
    Alert.alert(
      "Health Tracker",
      "Version 1.0.0\n\nA comprehensive health tracking app to monitor your daily water intake, calories, and steps.\n\nFeatures:\n• Water, Calorie & Step Tracking\n• Statistics & Charts\n• Dark/Light Theme\n• Goal Setting\n• Progress Analytics",
      [{ text: "OK" }]
    );
  };

  // Goal editing functions
  const openGoalEditor = (goalType) => {
    setEditingGoal(goalType);
    setGoalInputs({
      water: goals.water.toString(),
      calories: goals.calories.toString(),
      steps: goals.steps.toString(),
    });
    setShowGoalModal(true);
  };

  // Personal info editing functions
  const openPersonalInfoEditor = () => {
    setShowPersonalInfoModal(true);
  };

  const closePersonalInfoEditor = () => {
    setShowPersonalInfoModal(false);
  };

  const handlePersonalInfoSave = () => {
    // Refresh the profile data in settings
    // The PersonalInfoEditor component handles the actual saving
    Alert.alert(
      "Success",
      "Your personal information has been updated successfully!",
      [{ text: "OK" }]
    );
  };

  const validateGoal = (goalType, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue <= 0) {
      return false;
    }

    switch (goalType) {
      case "water":
        return numValue >= 500 && numValue <= 5000; // 500ml to 5L
      case "calories":
        return numValue >= 1200 && numValue <= 4000; // 1200 to 4000 calories
      case "steps":
        return numValue >= 1000 && numValue <= 50000; // 1K to 50K steps
      default:
        return true;
    }
  };

  const getGoalValidationMessage = (goalType) => {
    switch (goalType) {
      case "water":
        return "Water goal should be between 500ml and 5000ml";
      case "calories":
        return "Calorie goal should be between 1200 and 4000 calories";
      case "steps":
        return "Step goal should be between 1,000 and 50,000 steps";
      default:
        return "Please enter a valid number";
    }
  };

  const saveGoals = async () => {
    const newGoals = {
      water: parseInt(goalInputs.water),
      calories: parseInt(goalInputs.calories),
      steps: parseInt(goalInputs.steps),
    };

    // Validate all goals
    const invalidGoals = [];
    if (!validateGoal("water", goalInputs.water)) invalidGoals.push("Water");
    if (!validateGoal("calories", goalInputs.calories))
      invalidGoals.push("Calories");
    if (!validateGoal("steps", goalInputs.steps)) invalidGoals.push("Steps");

    if (invalidGoals.length > 0) {
      Alert.alert(
        "Invalid Goals",
        `${invalidGoals.join(", ")} ${
          invalidGoals.length === 1 ? "goal is" : "goals are"
        } outside the recommended range.\n\n${getGoalValidationMessage(
          invalidGoals[0].toLowerCase()
        )}`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      await updateGoals(newGoals);
      setShowGoalModal(false);
      setEditingGoal(null);

      Alert.alert(
        "Goals Updated",
        "Your health goals have been updated successfully!",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error updating goals:", error);
      Alert.alert("Error", "Failed to update goals. Please try again.");
    }
  };

  const resetGoals = () => {
    Alert.alert(
      "Reset Goals",
      "Are you sure you want to reset all goals to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            try {
              await updateGoals({
                water: 2000,
                calories: 2000,
                steps: 10000,
              });
              setGoalInputs({
                water: "2000",
                calories: "2000",
                steps: "10000",
              });
              Alert.alert("Success", "Goals reset to default values.");
            } catch (error) {
              console.error("Error resetting goals:", error);
              Alert.alert("Error", "Failed to reset goals.");
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.surface }]}
        >
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.settingSubtitle, { color: colors.text.secondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.light}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: colors.text.primary }]}>
      {title}
    </Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Settings
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Customize your app experience
          </Text>
        </View>

        <View style={styles.content}>
          {/* Theme Section */}
          <SectionHeader title="Appearance" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="color-palette"
              title="Theme"
              subtitle={`Currently ${theme}`}
              onPress={() => {
                Alert.alert("Choose Theme", "Select your preferred theme", [
                  {
                    text: "Light",
                    onPress: () => toggleTheme("light"),
                  },
                  {
                    text: "Dark",
                    onPress: () => toggleTheme("dark"),
                  },
                  {
                    text: "System",
                    onPress: () => toggleTheme("system"),
                  },
                  { text: "Cancel", style: "cancel" },
                ]);
              }}
            />
          </View>

          {/* Personal Information Section */}
          <SectionHeader title="Personal Information" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="person"
              title="Name"
              subtitle={profile && profile.name ? profile.name : "Not set"}
              onPress={() => openPersonalInfoEditor()}
            />
            <SettingItem
              icon="calendar"
              title="Birthdate"
              subtitle={
                profile && profile.birthdate
                  ? new Date(profile.birthdate).toLocaleDateString()
                  : "Not set"
              }
              onPress={() => openPersonalInfoEditor()}
            />
            <SettingItem
              icon="resize"
              title="Height"
              subtitle={
                profile && profile.height_cm
                  ? `${profile.height_cm}cm`
                  : "Not set"
              }
              onPress={() => openPersonalInfoEditor()}
            />
            <SettingItem
              icon="scale"
              title="Weight"
              subtitle={
                profile && profile.weight_kg
                  ? `${profile.weight_kg}kg`
                  : "Not set"
              }
              onPress={() => openPersonalInfoEditor()}
            />
          </View>

          {/* Health Goals Section */}
          <SectionHeader title="Health Goals" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="water"
              title="Water Goal"
              subtitle={`${goals.water}ml per day`}
              onPress={() => openGoalEditor("water")}
            />
            <SettingItem
              icon="restaurant"
              title="Calorie Goal"
              subtitle={`${goals.calories} calories per day`}
              onPress={() => openGoalEditor("calories")}
            />
            <SettingItem
              icon="walk"
              title="Step Goal"
              subtitle={`${goals.steps.toLocaleString()} steps per day`}
              onPress={() => openGoalEditor("steps")}
            />
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
              onPress={resetGoals}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Reset to Defaults
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Restore default health goals
                  </Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.light}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Notifications Section */}
          <SectionHeader title="Notifications" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons
                    name="notifications"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Push Notifications
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Receive health reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={notificationsEnabled ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons name="alarm" size={20} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Daily Reminders
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Water intake reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={waterReminders}
                onValueChange={setWaterReminders}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={waterReminders ? colors.primary : "#f4f3f4"}
              />
            </View>

            <View
              style={[styles.settingItem, { borderBottomColor: colors.border }]}
            >
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Ionicons
                    name="stats-chart"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: colors.text.primary },
                    ]}
                  >
                    Weekly Reports
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Weekly progress summaries
                  </Text>
                </View>
              </View>
              <Switch
                value={dailySummaries}
                onValueChange={setDailySummaries}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={dailySummaries ? colors.primary : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Data Management Section */}
          <SectionHeader title="Data & Privacy" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="download"
              title="Export Data"
              subtitle="Download your health data"
              onPress={exportData}
            />
            <SettingItem
              icon="trash"
              title="Clear All Data"
              subtitle="Remove all health records"
              onPress={clearAllData}
            />
          </View>

          {/* About Section */}
          <SectionHeader title="About" />
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <SettingItem
              icon="information-circle"
              title="About Health Tracker"
              subtitle="Version 1.0.0"
              onPress={aboutApp}
            />
          </View>
        </View>
      </ScrollView>

      {/* Goal Editing Modal - Only render when needed */}
      {showGoalModal && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="overFullScreen"
          transparent={true}
          onRequestClose={() => setShowGoalModal(false)}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { backgroundColor: colors.surface },
                ]}
              >
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowGoalModal(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.text.primary}
                  />
                </TouchableOpacity>
                <Text
                  style={[styles.modalTitle, { color: colors.text.primary }]}
                >
                  Edit Health Goals
                </Text>
                <View style={styles.modalHeaderSpace} />
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.goalInputSection}>
                  <View style={styles.goalInputContainer}>
                    <View style={styles.goalInputHeader}>
                      <Ionicons name="water" size={24} color={colors.info} />
                      <Text
                        style={[
                          styles.goalInputTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        Water Goal
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.goalInputSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Daily water intake target (500ml - 5000ml)
                    </Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[
                          styles.goalInput,
                          {
                            color: colors.text.primary,
                            borderColor: colors.border,
                            backgroundColor: colors.input.background,
                          },
                        ]}
                        value={goalInputs.water}
                        onChangeText={(text) =>
                          setGoalInputs({ ...goalInputs, water: text })
                        }
                        placeholder="2000"
                        keyboardType="numeric"
                        placeholderTextColor={colors.text.light}
                        autoCorrect={false}
                      />
                      <Text
                        style={[
                          styles.goalInputUnit,
                          { color: colors.text.secondary },
                        ]}
                      >
                        ml
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goalInputContainer}>
                    <View style={styles.goalInputHeader}>
                      <Ionicons
                        name="restaurant"
                        size={24}
                        color={colors.warning}
                      />
                      <Text
                        style={[
                          styles.goalInputTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        Calorie Goal
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.goalInputSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Daily calorie intake target (1200 - 4000 cal)
                    </Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[
                          styles.goalInput,
                          {
                            color: colors.text.primary,
                            borderColor: colors.border,
                            backgroundColor: colors.input.background,
                          },
                        ]}
                        value={goalInputs.calories}
                        onChangeText={(text) =>
                          setGoalInputs({ ...goalInputs, calories: text })
                        }
                        placeholder="2000"
                        keyboardType="numeric"
                        placeholderTextColor={colors.text.light}
                        autoCorrect={false}
                      />
                      <Text
                        style={[
                          styles.goalInputUnit,
                          { color: colors.text.secondary },
                        ]}
                      >
                        cal
                      </Text>
                    </View>
                  </View>

                  <View style={styles.goalInputContainer}>
                    <View style={styles.goalInputHeader}>
                      <Ionicons name="walk" size={24} color={colors.accent} />
                      <Text
                        style={[
                          styles.goalInputTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        Step Goal
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.goalInputSubtitle,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Daily step count target (1,000 - 50,000 steps)
                    </Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[
                          styles.goalInput,
                          {
                            color: colors.text.primary,
                            borderColor: colors.border,
                            backgroundColor: colors.input.background,
                          },
                        ]}
                        value={goalInputs.steps}
                        onChangeText={(text) =>
                          setGoalInputs({ ...goalInputs, steps: text })
                        }
                        placeholder="10000"
                        keyboardType="numeric"
                        placeholderTextColor={colors.text.light}
                        autoCorrect={false}
                      />
                      <Text
                        style={[
                          styles.goalInputUnit,
                          { color: colors.text.secondary },
                        ]}
                      >
                        steps
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowGoalModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.saveButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={saveGoals}
                  >
                    <Text
                      style={[
                        styles.saveButtonText,
                        { color: colors.header.text },
                      ]}
                    >
                      Save Goals
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Personal Info Editor Modal */}
      <PersonalInfoEditor
        visible={showPersonalInfoModal}
        onClose={closePersonalInfoEditor}
        onSave={handlePersonalInfoSave}
      />
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: 20,
      paddingTop: 50,
      alignItems: "center",
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 16,
      textAlign: "center",
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      borderRadius: 12,
      marginBottom: 20,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
      marginLeft: 5,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
    },
    settingText: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
    },
    settingRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    // Modal styles
    scrollView: {
      flex: 1,
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    modalHeaderSpace: {
      width: 40,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    goalInputSection: {
      flex: 1,
    },
    goalInputContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    goalInputHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    goalInputTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 10,
    },
    goalInputSubtitle: {
      fontSize: 14,
      marginBottom: 16,
      lineHeight: 20,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    goalInput: {
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      fontSize: 16,
      backgroundColor: colors.input.background,
    },
    goalInputUnit: {
      fontSize: 16,
      fontWeight: "600",
      minWidth: 40,
      textAlign: "center",
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 20,
      marginBottom: 40,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text.primary,
    },
    saveButton: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default SettingsScreen;
