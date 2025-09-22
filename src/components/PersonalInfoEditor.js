import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useUserProfile } from "../contexts/UserProfileContext";

const PersonalInfoEditor = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const { profile, updateProfile } = useUserProfile();

  // Form state - exactly like working components
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (visible && profile) {
      setName(profile.name || "");
      setBirthdate(profile.birthdate || "");
      setHeight(profile.height_cm ? profile.height_cm.toString() : "");
      setWeight(profile.weight_kg ? profile.weight_kg.toString() : "");
      setSaveStatus(null);
    }
  }, [visible, profile]);

  const styles = createStyles(colors);

  // Input validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return "Name is required";
    }

    // Check for special characters (allow letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }

    if (name.trim().length > 50) {
      return "Name cannot be longer than 50 characters";
    }

    return "";
  };

  const validateBirthdate = (birthdate) => {
    if (!birthdate.trim()) {
      return "Birthdate is required";
    }

    const date = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();

    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }

    if (date > today) {
      return "Birthdate cannot be in the future";
    }

    if (age < 1) {
      return "Age must be at least 1 year";
    }

    if (age > 150) {
      return "Please enter a realistic age";
    }

    return "";
  };

  const validateHeight = (height) => {
    const h = parseFloat(height);

    if (!height.trim()) {
      return "Height is required";
    }

    if (isNaN(h) || h <= 0) {
      return "Height must be a valid number";
    }

    if (h < 120 || h > 220) {
      return "Height must be between 120cm and 220cm";
    }

    return "";
  };

  const validateWeight = (weight) => {
    const w = parseFloat(weight);

    if (!weight.trim()) {
      return "Weight is required";
    }

    if (isNaN(w) || w <= 0) {
      return "Weight must be a valid number";
    }

    if (w < 30 || w > 300) {
      return "Weight must be between 30kg and 300kg";
    }

    return "";
  };

  // Validate all fields - exactly like working components
  const validateForm = () => {
    const nameError = validateName(name);
    const birthdateError = validateBirthdate(birthdate);
    const heightError = validateHeight(height);
    const weightError = validateWeight(weight);

    if (nameError || birthdateError || heightError || weightError) {
      const errors = [
        nameError,
        birthdateError,
        heightError,
        weightError,
      ].filter(Boolean);
      Alert.alert("Validation Error", errors.join("\n"));
      return false;
    }

    return true;
  };

  // Handle form submission - exactly like working components
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setSaveStatus("saving");

      const dataToSave = {
        name: name.trim(),
        birthdate: birthdate,
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height),
      };

      // Update user profile
      await updateProfile(dataToSave);

      setSaveStatus("success");

      // Call save callback
      if (onSave) {
        onSave();
      }

      // Show success message briefly then close
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("error");
      Alert.alert(
        "Error",
        "Failed to save your information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Stabilize setState functions with useCallback to prevent re-renders
  const handleNameChange = useCallback((text) => {
    setName(text);
  }, []);

  const handleBirthdateChange = useCallback((text) => {
    setBirthdate(text);
  }, []);

  const handleHeightChange = useCallback((text) => {
    setHeight(text);
  }, []);

  const handleWeightChange = useCallback((text) => {
    setWeight(text);
  }, []);

  // Input components - exactly like working StepTracker
  const NameInput = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <View style={styles.labelContainer}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={styles.inputLabel}>Name</Text>
        </View>
      </View>
      <Text style={styles.helpText}>
        Use only letters, spaces, hyphens, and apostrophes
      </Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your full name"
          placeholderTextColor={colors.input.placeholder || colors.text.light}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  const BirthdateInput = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <View style={styles.labelContainer}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={styles.inputLabel}>Birthdate</Text>
        </View>
      </View>
      <Text style={styles.helpText}>Enter your birthdate (YYYY-MM-DD)</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.input.placeholder || colors.text.light}
          value={birthdate}
          onChangeText={setBirthdate}
          keyboardType="numeric"
          returnKeyType="next"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  const HeightInput = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <View style={styles.labelContainer}>
          <Ionicons name="resize" size={20} color={colors.primary} />
          <Text style={styles.inputLabel}>Height</Text>
        </View>
        <Text style={styles.unitText}>cm</Text>
      </View>
      <Text style={styles.helpText}>Height in centimeters (120-220cm)</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="170"
          placeholderTextColor={colors.input.placeholder || colors.text.light}
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
          returnKeyType="next"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  const WeightInput = () => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <View style={styles.labelContainer}>
          <Ionicons name="scale" size={20} color={colors.primary} />
          <Text style={styles.inputLabel}>Weight</Text>
        </View>
        <Text style={styles.unitText}>kg</Text>
      </View>
      <Text style={styles.helpText}>Weight in kilograms (30-300kg)</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="70"
          placeholderTextColor={colors.input.placeholder || colors.text.light}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          returnKeyType="done"
          autoCorrect={false}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {visible ? (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      onClose();
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={colors.text.primary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.title}>Edit Personal Information</Text>
                  <View style={styles.headerSpace} />
                </View>

                {/* Form */}
                <View style={styles.form}>
                  <NameInput />
                  <BirthdateInput />
                  <HeightInput />
                  <WeightInput />
                </View>

                {/* Save Status Indicator */}
                {saveStatus && (
                  <View style={styles.saveStatusContainer}>
                    {saveStatus === "saving" && (
                      <View style={styles.saveStatus}>
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.saveStatusText,
                            { color: colors.text.secondary },
                          ]}
                        >
                          Saving changes...
                        </Text>
                      </View>
                    )}
                    {saveStatus === "success" && (
                      <View style={styles.saveStatus}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.success || "#4CAF50"}
                        />
                        <Text
                          style={[
                            styles.saveStatusText,
                            { color: colors.success || "#4CAF50" },
                          ]}
                        >
                          Changes saved successfully!
                        </Text>
                      </View>
                    )}
                    {saveStatus === "error" && (
                      <View style={styles.saveStatus}>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colors.error || "#FF6B6B"}
                        />
                        <Text
                          style={[
                            styles.saveStatusText,
                            { color: colors.error || "#FF6B6B" },
                          ]}
                        >
                          Failed to save changes
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Action Buttons */}
                {visible && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        Keyboard.dismiss();
                        onClose();
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.saveButton,
                        {
                          backgroundColor:
                            saveStatus === "success"
                              ? colors.success || "#4CAF50"
                              : colors.primary,
                          opacity: loading ? 0.6 : 1,
                        },
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        handleSubmit();
                      }}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.saveButtonText,
                          { color: colors.header.text },
                        ]}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text.primary,
    },
    headerSpace: {
      width: 40,
    },
    form: {
      marginBottom: 30,
    },
    inputContainer: {
      marginBottom: 25,
    },
    inputHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    labelContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text.primary,
      marginLeft: 8,
    },
    unitText: {
      fontSize: 14,
      color: colors.text.secondary,
      fontWeight: "500",
    },
    helpText: {
      fontSize: 12,
      color: colors.text.light,
      marginBottom: 8,
      fontStyle: "italic",
    },
    inputWrapper: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    textInput: {
      padding: 16,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: "transparent",
    },
    inputError: {
      borderColor: colors.error || "#FF6B6B",
      borderWidth: 1.5,
    },
    errorText: {
      fontSize: 12,
      color: colors.error || "#FF6B6B",
      marginTop: 5,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 40,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
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
      // Background color set dynamically
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    pickerValueText: {
      flex: 1,
      fontSize: 16,
      color: colors.text.primary,
      paddingVertical: 16,
      paddingLeft: 16,
    },
    // Save status indicator styles
    saveStatusContainer: {
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    saveStatus: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    saveStatusText: {
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 8,
    },
  });

export default PersonalInfoEditor;
