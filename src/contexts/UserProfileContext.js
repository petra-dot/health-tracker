import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from "react";
import { getUserProfile, saveUserProfile } from "../db/database";

const UserProfileContext = createContext();

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

// Default user profile
const defaultProfile = {
  id: 1,
  birthdate: null,
  weight_kg: null,
  height_cm: null,
  daily_water_goal_ml: 2000,
  daily_calorie_goal: 2000,
  daily_step_goal: 10000,
  name: "",
  activity_level: "moderate", // low, moderate, high
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load user profile from database on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const savedProfile = await getUserProfile();

      if (savedProfile) {
        setProfile(savedProfile);
      } else {
        // Create default profile if none exists
        await saveUserProfile(defaultProfile);
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      // Use default profile if loading fails
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      setProfile(updatedProfile);
      await saveUserProfile(updatedProfile);

      return updatedProfile;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const updateGoals = async (goals) => {
    return await updateProfile({
      daily_water_goal_ml: goals.water,
      daily_calorie_goal: goals.calories,
      daily_step_goal: goals.steps,
    });
  };

  const resetToDefaults = async () => {
    try {
      const resetProfile = {
        ...defaultProfile,
        updated_at: new Date().toISOString(),
      };

      setProfile(resetProfile);
      await saveUserProfile(resetProfile);

      return resetProfile;
    } catch (error) {
      console.error("Error resetting profile:", error);
      throw error;
    }
  };

  // Memoize the value object to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      profile,
      loading,
      initialized,
      updateProfile,
      updateGoals,
      resetToDefaults,
      // Memoize convenience getters as well
      goals: {
        water: profile.daily_water_goal_ml,
        calories: profile.daily_calorie_goal,
        steps: profile.daily_step_goal,
      },
    }),
    [profile, loading, initialized, updateProfile, updateGoals, resetToDefaults]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
