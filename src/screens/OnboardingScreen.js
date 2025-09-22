import React, { useState, useMemo } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useUserProfile } from "../contexts/UserProfileContext";

const OnboardingScreen = ({ onComplete }) => {
  const { colors } = useTheme();
  const { updateProfile } = useUserProfile();

  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Form state - exactly like working components
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);

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

      // Update user profile
      await updateProfile({
        name: name.trim(),
        birthdate: birthdate,
        weight_kg: parseFloat(weight),
        height_cm: parseFloat(height),
      });

      // Call completion callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert(
        "Error",
        "Failed to save your information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Stabilize setState functions with useCallback to prevent re-renders
  const handleNameChange = React.useCallback((text) => {
    setName(text);
  }, []);

  const handleBirthdateChange = React.useCallback((text) => {
    setBirthdate(text);
  }, []);

  const handleHeightChange = React.useCallback((text) => {
    setHeight(text);
  }, []);

  const handleWeightChange = React.useCallback((text) => {
    setWeight(text);
  }, []);

  // Create EXACT replicas of working StepTracker TextInput components
  const NameInput = React.memo(() => {
    const { colors } = useTheme();
    return (
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
            onChangeText={handleNameChange}
            returnKeyType="next"
          />
        </View>
      </View>
    );
  });

  const BirthdateInput = React.memo(() => {
    const { colors } = useTheme();
    return (
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
            onChangeText={handleBirthdateChange}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>
      </View>
    );
  });

  const HeightInput = React.memo(() => {
    const { colors } = useTheme();
    return (
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
            onChangeText={handleHeightChange}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>
      </View>
    );
  });

  const WeightInput = React.memo(() => {
    const { colors } = useTheme();
    return (
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
            onChangeText={handleWeightChange}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>
      </View>
    );
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Welcome to Health Tracker!</Text>
            <Text style={styles.subtitle}>
              Let's set up your profile to personalize your health journey
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <NameInput />
            <BirthdateInput />
            <HeightInput />
            <WeightInput />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              handleSubmit();
            }}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Saving..." : "Get Started"}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footerText}>
            Your information is stored securely and used only to personalize
            your experience.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text.primary,
      textAlign: "center",
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 20,
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
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 30,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    footerText: {
      fontSize: 12,
      color: colors.text.light,
      textAlign: "center",
      lineHeight: 18,
      fontStyle: "italic",
    },
  });

export default OnboardingScreen;
