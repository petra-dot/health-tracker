import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { initDatabase, getTodayEntry, saveDailyEntry } from "../db/database";
import { getCurrentDate, getCurrentDateFormatted } from "../utils/calculations";

const { width } = Dimensions.get("window");

const HomeScreen = memo(() => {
  const { colors } = useTheme();
  const { goals, profile, initialized } = useUserProfile();
  const [waterCount, setWaterCount] = useState(0);
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [showCalorieInput, setShowCalorieInput] = useState(false);
  const [showStepInput, setShowStepInput] = useState(false);
  const [customCalorieValue, setCustomCalorieValue] = useState("");
  const [customStepValue, setCustomStepValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Memoize expensive calculations
  const percentages = useMemo(
    () => ({
      waterPercentage: Math.min((waterCount / goals.water) * 100, 100),
      caloriePercentage: Math.min((calories / goals.calories) * 100, 100),
      stepPercentage: Math.min((steps / goals.steps) * 100, 100),
    }),
    [waterCount, calories, steps, goals.water, goals.calories, goals.steps]
  );

  // Memoize current date to avoid recalculation
  const currentDate = useMemo(() => getCurrentDate(), []);
  const currentDateFormatted = useMemo(() => getCurrentDateFormatted(), []);

  // Load data from database on component mount
  useEffect(() => {
    loadTodayData();
  }, []); // Empty dependency array is correct here

  // Save data to database whenever values change
  useEffect(() => {
    if (!loading) {
      saveDataToDatabase();
    }
  }, [waterCount, calories, steps]); // Only depend on the values that trigger saves

  const loadTodayData = useCallback(async () => {
    try {
      setLoading(true);

      // Initialize database
      await initDatabase();

      // Get today's date
      const today = getCurrentDate();

      // Load today's entry from database
      const todayEntry = await getTodayEntry(today);

      if (todayEntry) {
        setWaterCount(todayEntry.water_ml || 0);
        setCalories(todayEntry.calories || 0);
        setSteps(todayEntry.steps || 0);
      } else {
        // Create new entry for today
        await saveDailyEntry(today, 0, 0, 0);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load today's data");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDataToDatabase = useCallback(async () => {
    try {
      setSaving(true);
      const today = getCurrentDate();
      await saveDailyEntry(today, waterCount, calories, steps);
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setSaving(false);
    }
  }, [waterCount, calories, steps]);

  const addWater = useCallback(() => {
    const newWaterCount = waterCount + 250;
    setWaterCount(newWaterCount);
  }, [waterCount]);

  const addCustomCalories = useCallback(() => {
    const cal = parseInt(customCalorieValue);
    if (customCalorieValue && !isNaN(cal) && cal > 0) {
      const newCalories = calories + cal;
      setCalories(newCalories);
      setCustomCalorieValue("");
      setShowCalorieInput(false);
    } else {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid number greater than 0"
      );
    }
  }, [customCalorieValue, calories]);

  const addCustomSteps = useCallback(() => {
    const stepCount = parseInt(customStepValue);
    if (customStepValue && !isNaN(stepCount) && stepCount > 0) {
      const newSteps = steps + stepCount;
      setSteps(newSteps);
      setCustomStepValue("");
      setShowStepInput(false);
    } else {
      Alert.alert(
        "Invalid Input",
        "Please enter a valid number greater than 0"
      );
    }
  }, [customStepValue, steps]);

  const resetAll = useCallback(() => {
    Alert.alert("Reset All", "Are you sure you want to reset all data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: async () => {
          try {
            const today = getCurrentDate();
            setWaterCount(0);
            setCalories(0);
            setSteps(0);
            await saveDailyEntry(today, 0, 0, 0);
          } catch (error) {
            console.error("Error resetting data:", error);
          }
        },
      },
    ]);
  }, []);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Show loading screen while data is loading
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons name="fitness" size={48} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>
          Loading your health data...
        </Text>
        <Text style={[styles.loadingSubtext, { color: colors.text.secondary }]}>
          Please wait while we fetch today's entries
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="fitness" size={28} color={colors.header.text} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.header.text }]}>
              {profile && profile.name
                ? `${profile.name}'s Health`
                : "Health Tracker"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.header.text }]}>
              {getCurrentDateFormatted()}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={resetAll} style={styles.resetButton}>
          <Ionicons name="refresh" size={20} color={colors.header.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Ionicons name="heart" size={24} color={colors.success} />
          <Text style={styles.welcomeText}>
            {profile && profile.name
              ? `Welcome back, ${profile.name}!`
              : "Welcome back!"}
          </Text>
          <Text style={styles.welcomeSubtext}>
            Track your daily health goals and stay motivated
          </Text>
        </View>

        <View style={styles.tracker}>
          <View style={styles.trackerHeader}>
            <View style={styles.trackerTitleContainer}>
              <Ionicons name="water" size={24} color={colors.info} />
              <Text style={styles.trackerTitle}>Water Intake</Text>
            </View>
            <Text style={styles.trackerValue}>
              {waterCount}ml / {goals.water}ml
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percentages.waterPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {percentages.waterPercentage.toFixed(0)}%
            </Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={addWater}>
            <Ionicons name="add" size={16} color={colors.header.text} />
            <Text style={styles.addButtonText}>+250ml</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tracker}>
          <View style={styles.trackerHeader}>
            <View style={styles.trackerTitleContainer}>
              <Ionicons name="restaurant" size={24} color={colors.warning} />
              <Text style={styles.trackerTitle}>Calories</Text>
            </View>
            <Text style={styles.trackerValue}>
              {calories} cal / {goals.calories} cal
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percentages.caloriePercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {percentages.caloriePercentage.toFixed(0)}%
            </Text>
          </View>

          <View style={styles.quickAddContainer}>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setCalories(calories + 100)}
            >
              <Text style={styles.quickAddButtonText}>+100</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setCalories(calories + 250)}
            >
              <Text style={styles.quickAddButtonText}>+250</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setCalories(calories + 500)}
            >
              <Text style={styles.quickAddButtonText}>+500</Text>
            </TouchableOpacity>
          </View>

          {showCalorieInput ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.inputLabel}>Enter calories:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.customInput}
                  value={customCalorieValue}
                  onChangeText={setCustomCalorieValue}
                  placeholder="e.g., 300"
                  keyboardType="numeric"
                  autoFocus
                  placeholderTextColor={colors.input.placeholder}
                />
                <TouchableOpacity
                  style={styles.inputButton}
                  onPress={addCustomCalories}
                >
                  <Text style={styles.inputButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inputCancelButton}
                  onPress={() => {
                    setShowCalorieInput(false);
                    setCustomCalorieValue("");
                  }}
                >
                  <Text style={styles.inputCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setShowCalorieInput(true)}
            >
              <Ionicons name="create" size={16} color={colors.header.text} />
              <Text style={styles.customButtonText}>Custom Amount</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tracker}>
          <View style={styles.trackerHeader}>
            <View style={styles.trackerTitleContainer}>
              <Ionicons name="walk" size={24} color={colors.accent} />
              <Text style={styles.trackerTitle}>Steps</Text>
            </View>
            <Text style={styles.trackerValue}>
              {steps.toLocaleString()} / {goals.steps.toLocaleString()}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percentages.stepPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {percentages.stepPercentage.toFixed(0)}%
            </Text>
          </View>

          <View style={styles.quickAddContainer}>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setSteps(steps + 500)}
            >
              <Text style={styles.quickAddButtonText}>+500</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setSteps(steps + 1000)}
            >
              <Text style={styles.quickAddButtonText}>+1000</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => setSteps(steps + 2000)}
            >
              <Text style={styles.quickAddButtonText}>+2000</Text>
            </TouchableOpacity>
          </View>

          {showStepInput ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.inputLabel}>Enter steps:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.customInput}
                  value={customStepValue}
                  onChangeText={setCustomStepValue}
                  placeholder="e.g., 1500"
                  keyboardType="numeric"
                  autoFocus
                  placeholderTextColor={colors.input.placeholder}
                />
                <TouchableOpacity
                  style={styles.inputButton}
                  onPress={addCustomSteps}
                >
                  <Text style={styles.inputButtonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inputCancelButton}
                  onPress={() => {
                    setShowStepInput(false);
                    setCustomStepValue("");
                  }}
                >
                  <Text style={styles.inputCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => setShowStepInput(true)}
            >
              <Ionicons name="create" size={16} color={colors.header.text} />
              <Text style={styles.customButtonText}>Custom Amount</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Ionicons name="stats-chart" size={20} color={colors.success} />
            <Text style={styles.summaryTitle}>Today's Summary</Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Ionicons name="water" size={16} color={colors.info} />
              <Text style={styles.statText}>{waterCount}ml</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="restaurant" size={16} color={colors.warning} />
              <Text style={styles.statText}>{calories} cal</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="walk" size={16} color={colors.accent} />
              <Text style={styles.statText}>
                {steps.toLocaleString()} steps
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: colors.text.secondary,
    },
    loadingSubtext: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 8,
      textAlign: "center",
      opacity: 0.8,
    },
    tabContent: {
      flex: 1,
      padding: 15,
    },
    summaryContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    summaryHeader: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text.primary,
      marginBottom: 5,
    },
    dateText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 15,
    },
    summaryCards: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 5,
      borderLeftWidth: 4,
      alignItems: "center",
    },
    summaryTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text.secondary,
      marginBottom: 5,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text.primary,
      marginBottom: 3,
    },
    summaryPercentage: {
      fontSize: 16,
      fontWeight: "bold",
    },
    header: {
      padding: 20,
      paddingTop: 50,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.header.background,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerText: {
      marginLeft: 15,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 16,
      opacity: 0.9,
    },
    resetButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    welcomeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeText: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text.primary,
      marginTop: 10,
      marginBottom: 5,
    },
    welcomeSubtext: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: "center",
      lineHeight: 20,
    },
    tracker: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    trackerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    trackerTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    trackerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text.primary,
      marginLeft: 10,
    },
    trackerValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text.secondary,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.progress.background,
      borderRadius: 4,
      marginBottom: 8,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.progress.fill,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text.secondary,
      textAlign: "right",
    },
    addButton: {
      backgroundColor: colors.button.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    addButtonText: {
      color: colors.header.text,
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 5,
    },
    customButton: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    customButtonText: {
      color: colors.header.text,
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 5,
    },
    quickAddContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 16,
      gap: 12,
    },
    quickAddButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    quickAddButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    customInputContainer: {
      marginTop: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text.primary,
      marginBottom: 12,
      textAlign: "center",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    customInput: {
      flex: 1,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.input.border,
      borderRadius: 8,
      fontSize: 16,
      backgroundColor: colors.input.background,
      color: colors.text.primary,
    },
    inputButton: {
      backgroundColor: colors.button.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    inputButtonText: {
      color: colors.header.text,
      fontSize: 14,
      fontWeight: "600",
    },
    inputCancelButton: {
      backgroundColor: colors.error,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
    },
    inputCancelButtonText: {
      color: colors.header.text,
      fontSize: 14,
      fontWeight: "600",
    },
    summary: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 10,
      marginBottom: 30,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text.primary,
      marginLeft: 8,
    },
    summaryStats: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    statText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text.secondary,
      marginLeft: 6,
    },
  });

export default HomeScreen;
