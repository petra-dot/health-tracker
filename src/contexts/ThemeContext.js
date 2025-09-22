import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const lightTheme = {
  // Modern iOS-inspired light theme
  background: "#F2F2F7", // iOS system background
  surface: "#FFFFFF", // Pure white cards/surfaces
  primary: "#007AFF", // iOS system blue
  secondary: "#5856D6", // iOS purple
  accent: "#FF9500", // iOS orange
  error: "#FF3B30", // iOS red
  success: "#34C759", // iOS green
  warning: "#FF9500", // iOS orange
  info: "#007AFF", // iOS blue

  text: {
    primary: "#1D1D1F", // iOS dark text
    secondary: "#3C3C43", // iOS secondary text
    light: "#8E8E93", // iOS tertiary text
    inverse: "#FFFFFF", // White text
  },

  border: "#C6C6C8", // iOS light border
  shadow: "rgba(0, 0, 0, 0.08)",

  // Enhanced color categories
  card: {
    background: "#FFFFFF",
    border: "#F2F2F7",
    shadow: "rgba(0, 0, 0, 0.06)",
    gradient: ["#FFFFFF", "#FAFAFA"],
  },

  button: {
    primary: "#007AFF",
    secondary: "#5856D6",
    danger: "#FF3B30",
    success: "#34C759",
    outline: "transparent",
    disabled: "#8E8E93",
  },

  input: {
    background: "#F2F2F7",
    border: "#D1D1D6",
    placeholder: "#8E8E93",
    focus: "#007AFF",
    error: "#FF3B30",
  },

  progress: {
    background: "#E5E5EA",
    fill: "#34C759",
    secondary: "#007AFF",
    track: "#E5E5EA",
  },

  header: {
    background: "#FFFFFF",
    text: "#1D1D1F",
    shadow: "rgba(0, 0, 0, 0.08)",
  },

  tabBar: {
    background: "#FFFFFF",
    active: "#007AFF",
    inactive: "#8E8E93",
    indicator: "#007AFF",
  },

  statusBar: {
    background: "#FFFFFF",
    text: "#1D1D1F",
  },

  // iOS-style gradients and effects
  gradient: {
    primary: ["#007AFF", "#0056CC"],
    secondary: ["#5856D6", "#4A44C1"],
    surface: ["#FFFFFF", "#F8F8F8"],
    card: ["#FFFFFF", "#FAFAFA"],
  },

  // Modern shadow system
  shadows: {
    small: "rgba(0, 0, 0, 0.06)",
    medium: "rgba(0, 0, 0, 0.12)",
    large: "rgba(0, 0, 0, 0.16)",
  },
};

const darkTheme = {
  // Modern iOS-inspired dark theme
  background: "#000000", // Pure black background
  surface: "#1C1C1E", // iOS dark surface
  primary: "#0A84FF", // iOS dark blue
  secondary: "#5AC8FA", // iOS light blue
  accent: "#FF9F0A", // iOS dark orange
  error: "#FF453A", // iOS dark red
  success: "#30D158", // iOS dark green
  warning: "#FF9F0A", // iOS dark orange
  info: "#0A84FF", // iOS dark blue

  text: {
    primary: "#FFFFFF", // Pure white text
    secondary: "#EBEBF599", // iOS secondary text with opacity
    light: "#8E8E93", // iOS tertiary text
    inverse: "#000000", // Black text
  },

  border: "#38383A", // iOS dark border
  shadow: "rgba(0, 0, 0, 0.3)",

  // Enhanced dark theme categories
  card: {
    background: "#1C1C1E",
    border: "#38383A",
    shadow: "rgba(0, 0, 0, 0.2)",
    gradient: ["#1C1C1E", "#2C2C2E"],
  },

  button: {
    primary: "#0A84FF",
    secondary: "#5AC8FA",
    danger: "#FF453A",
    success: "#30D158",
    outline: "transparent",
    disabled: "#8E8E93",
  },

  input: {
    background: "#1C1C1E",
    border: "#38383A",
    placeholder: "#8E8E93",
    focus: "#0A84FF",
    error: "#FF453A",
  },

  progress: {
    background: "#2C2C2E",
    fill: "#30D158",
    secondary: "#0A84FF",
    track: "#2C2C2E",
  },

  header: {
    background: "#1C1C1E",
    text: "#FFFFFF",
    shadow: "rgba(0, 0, 0, 0.2)",
  },

  tabBar: {
    background: "#1C1C1E",
    active: "#0A84FF",
    inactive: "#8E8E93",
    indicator: "#0A84FF",
  },

  statusBar: {
    background: "#000000",
    text: "#FFFFFF",
  },

  // iOS-style dark gradients and effects
  gradient: {
    primary: ["#0A84FF", "#0066CC"],
    secondary: ["#5AC8FA", "#4A9EFF"],
    surface: ["#1C1C1E", "#2C2C2E"],
    card: ["#1C1C1E", "#2C2C2E"],
  },

  // Modern shadow system for dark theme
  shadows: {
    small: "rgba(0, 0, 0, 0.2)",
    medium: "rgba(0, 0, 0, 0.3)",
    large: "rgba(0, 0, 0, 0.4)",
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("system");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === "system") {
        setIsDark(colorScheme === "dark");
      }
    });

    return () => subscription?.remove();
  }, [theme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("userTheme");
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === "dark") {
          setIsDark(true);
        } else if (savedTheme === "light") {
          setIsDark(false);
        } else {
          // System theme
          setIsDark(Appearance.getColorScheme() === "dark");
        }
      } else {
        // Default to system theme
        setIsDark(Appearance.getColorScheme() === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
      setIsDark(Appearance.getColorScheme() === "dark");
    }
  };

  const toggleTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem("userTheme", newTheme);

      if (newTheme === "dark") {
        setIsDark(true);
      } else if (newTheme === "light") {
        setIsDark(false);
      } else {
        // System theme
        setIsDark(Appearance.getColorScheme() === "dark");
      }
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  // Memoize currentTheme to prevent recreation
  const currentTheme = useMemo(
    () => (isDark ? darkTheme : lightTheme),
    [isDark]
  );

  // Memoize the value object to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      theme,
      isDark,
      colors: currentTheme,
      toggleTheme,
      lightTheme,
      darkTheme,
    }),
    [theme, isDark, currentTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
