import { Platform } from "react-native";

// Platform detection
const isWeb = Platform.OS === "web";

// Web storage keys
const STORAGE_KEYS = {
  DAILY_ENTRIES: "healthtracker_daily_entries",
  USER_PROFILE: "healthtracker_user_profile",
  MEDICINES: "healthtracker_medicines",
  MEDICINE_DOSE_HISTORY: "healthtracker_medicine_dose_history",
};

// Helper functions for web storage
const webStorage = {
  getItem: (key) => {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn("localStorage not available:", error);
        return null;
      }
    }
    return null;
  },

  setItem: (key, value) => {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn("localStorage not available:", error);
      }
    }
  },

  removeItem: (key) => {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn("localStorage not available:", error);
      }
    }
  },
};

// AsyncStorage for mobile (will be imported conditionally)
let AsyncStorage = null;

// Dynamic import for AsyncStorage to avoid issues
const getAsyncStorage = async () => {
  if (isWeb) {
    return null; // Web uses localStorage
  }

  if (AsyncStorage) {
    return AsyncStorage;
  }

  try {
    // Dynamic import to avoid build issues
    const asyncStorageModule = await import(
      "@react-native-async-storage/async-storage"
    );
    AsyncStorage = asyncStorageModule.default;
    return AsyncStorage;
  } catch (error) {
    console.warn("AsyncStorage not available:", error);
    return null;
  }
};

// Mobile storage functions using AsyncStorage
const mobileStorage = {
  getItem: async (key) => {
    try {
      const storage = await getAsyncStorage();
      if (storage) {
        return await storage.getItem(key);
      }
    } catch (error) {
      console.warn("Error getting item from AsyncStorage:", error);
    }
    return null;
  },

  setItem: async (key, value) => {
    try {
      const storage = await getAsyncStorage();
      if (storage) {
        await storage.setItem(key, value);
      }
    } catch (error) {
      console.warn("Error setting item in AsyncStorage:", error);
    }
  },

  removeItem: async (key) => {
    try {
      const storage = await getAsyncStorage();
      if (storage) {
        await storage.removeItem(key);
      }
    } catch (error) {
      console.warn("Error removing item from AsyncStorage:", error);
    }
  },
};

// Data validation functions for medicines
const validateMedicine = (medicine) => {
  const errors = [];

  if (
    !medicine.name ||
    typeof medicine.name !== "string" ||
    medicine.name.trim().length < 1
  ) {
    errors.push("Medicine name is required");
  }

  if (
    !medicine.dosage ||
    typeof medicine.dosage !== "string" ||
    medicine.dosage.trim().length < 1
  ) {
    errors.push("Dosage is required");
  }

  if (!medicine.frequency || typeof medicine.frequency !== "string") {
    errors.push("Frequency is required");
  }

  if (!Array.isArray(medicine.times) || medicine.times.length === 0) {
    errors.push("At least one dose time is required");
  } else {
    // Validate times are valid hours (0-23)
    medicine.times.forEach((hour, index) => {
      if (typeof hour !== "number" || hour < 0 || hour > 23) {
        errors.push(`Invalid time for dose ${index + 1}`);
      }
    });
  }

  if (
    medicine.total_doses !== undefined &&
    (typeof medicine.total_doses !== "number" || medicine.total_doses < 1)
  ) {
    errors.push("Total doses must be a positive number");
  }

  if (
    medicine.doses_taken !== undefined &&
    (typeof medicine.doses_taken !== "number" || medicine.doses_taken < 0)
  ) {
    errors.push("Doses taken must be non-negative");
  }

  return errors;
};

// Data validation functions
const validateDailyEntry = (water_ml, calories, steps) => {
  const errors = [];

  if (typeof water_ml !== "number" || water_ml < 0 || water_ml > 10000) {
    errors.push("Water intake must be between 0 and 10,000 ml");
  }

  if (typeof calories !== "number" || calories < 0 || calories > 10000) {
    errors.push("Calories must be between 0 and 10,000");
  }

  if (typeof steps !== "number" || steps < 0 || steps > 100000) {
    errors.push("Steps must be between 0 and 100,000");
  }

  return errors;
};

const validateUserProfile = (profile) => {
  const errors = [];

  if (profile.name && typeof profile.name !== "string") {
    errors.push("Name must be a string");
  }

  if (
    profile.weight_kg &&
    (typeof profile.weight_kg !== "number" ||
      profile.weight_kg < 20 ||
      profile.weight_kg > 500)
  ) {
    errors.push("Weight must be between 20 and 500 kg");
  }

  if (
    profile.height_cm &&
    (typeof profile.height_cm !== "number" ||
      profile.height_cm < 50 ||
      profile.height_cm > 300)
  ) {
    errors.push("Height must be between 50 and 300 cm");
  }

  if (
    profile.daily_water_goal_ml &&
    (typeof profile.daily_water_goal_ml !== "number" ||
      profile.daily_water_goal_ml < 500 ||
      profile.daily_water_goal_ml > 5000)
  ) {
    errors.push("Water goal must be between 500 and 5,000 ml");
  }

  if (
    profile.daily_calorie_goal &&
    (typeof profile.daily_calorie_goal !== "number" ||
      profile.daily_calorie_goal < 1200 ||
      profile.daily_calorie_goal > 4000)
  ) {
    errors.push("Calorie goal must be between 1,200 and 4,000 calories");
  }

  if (
    profile.daily_step_goal &&
    (typeof profile.daily_step_goal !== "number" ||
      profile.daily_step_goal < 1000 ||
      profile.daily_step_goal > 50000)
  ) {
    errors.push("Step goal must be between 1,000 and 50,000 steps");
  }

  return errors;
};

// Initialize database tables with enhanced error handling
export const initDatabase = async () => {
  try {
    if (isWeb) {
      // For web, just initialize localStorage structure
      const existingEntries = webStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES);
      if (!existingEntries) {
        webStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify({}));
      }
      const existingProfile = webStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!existingProfile) {
        const defaultProfile = {
          id: 1,
          name: "",
          birthdate: null,
          weight_kg: null,
          height_cm: null,
          daily_water_goal_ml: 2000,
          daily_calorie_goal: 2000,
          daily_step_goal: 10000,
        };
        webStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(defaultProfile)
        );
      }
      console.log("Web storage initialized successfully");
      return null;
    } else {
      // Mobile: Use AsyncStorage
      const existingEntries = await mobileStorage.getItem(
        STORAGE_KEYS.DAILY_ENTRIES
      );
      if (!existingEntries) {
        await mobileStorage.setItem(
          STORAGE_KEYS.DAILY_ENTRIES,
          JSON.stringify({})
        );
      }
      const existingProfile = await mobileStorage.getItem(
        STORAGE_KEYS.USER_PROFILE
      );
      if (!existingProfile) {
        const defaultProfile = {
          id: 1,
          name: "",
          birthdate: null,
          weight_kg: null,
          height_cm: null,
          daily_water_goal_ml: 2000,
          daily_calorie_goal: 2000,
          daily_step_goal: 10000,
        };
        await mobileStorage.setItem(
          STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(defaultProfile)
        );
      }
      console.log("Mobile storage initialized successfully");
      return null;
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw new Error(`Database initialization failed: ${error.message}`);
  }
};

// Get today's entry
export const getTodayEntry = async (date) => {
  try {
    if (isWeb) {
      const entries = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES) || "{}"
      );
      return entries[date] || null;
    } else {
      const entries = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES)) || "{}"
      );
      return entries[date] || null;
    }
  } catch (error) {
    console.error("Error getting today entry:", error);
    throw error;
  }
};

// Create or update daily entry with validation
export const saveDailyEntry = async (date, water_ml, calories, steps) => {
  try {
    // Validate input data
    const validationErrors = validateDailyEntry(water_ml, calories, steps);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid data: ${validationErrors.join(", ")}`);
    }

    // Validate date format
    if (!date || typeof date !== "string") {
      throw new Error("Invalid date format");
    }

    if (isWeb) {
      const entries = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES) || "{}"
      );
      entries[date] = {
        id: Date.now(), // Simple ID for web
        date,
        water_ml,
        calories,
        steps,
        created_at: new Date().toISOString(),
      };
      webStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(entries));
      return { changes: 1, lastInsertRowid: entries[date].id };
    } else {
      const entries = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES)) || "{}"
      );
      entries[date] = {
        id: Date.now(), // Simple ID for mobile
        date,
        water_ml,
        calories,
        steps,
        created_at: new Date().toISOString(),
      };
      await mobileStorage.setItem(
        STORAGE_KEYS.DAILY_ENTRIES,
        JSON.stringify(entries)
      );
      return { changes: 1, lastInsertRowid: entries[date].id };
    }
  } catch (error) {
    console.error("Error saving daily entry:", error);
    throw new Error(`Failed to save daily entry: ${error.message}`);
  }
};

// Get entries for date range (for charts)
export const getEntriesForDateRange = async (startDate, endDate) => {
  try {
    if (isWeb) {
      const entries = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES) || "{}"
      );
      const result = Object.values(entries).filter(
        (entry) => entry.date >= startDate && entry.date <= endDate
      );
      return result.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      const entries = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES)) || "{}"
      );
      const result = Object.values(entries).filter(
        (entry) => entry.date >= startDate && entry.date <= endDate
      );
      return result.sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (error) {
    console.error("Error getting entries for date range:", error);
    throw error;
  }
};

// Save user profile with validation
export const saveUserProfile = async (profile) => {
  try {
    // Validate profile data
    const validationErrors = validateUserProfile(profile);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid profile data: ${validationErrors.join(", ")}`);
    }

    if (isWeb) {
      const updatedProfile = {
        id: 1,
        ...profile,
        updated_at: new Date().toISOString(),
      };
      webStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(updatedProfile)
      );
      return { changes: 1, lastInsertRowid: 1 };
    } else {
      const updatedProfile = {
        id: 1,
        ...profile,
        updated_at: new Date().toISOString(),
      };
      await mobileStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(updatedProfile)
      );
      return { changes: 1, lastInsertRowid: 1 };
    }
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw new Error(`Failed to save user profile: ${error.message}`);
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    if (isWeb) {
      const profile = webStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } else {
      const profile = await mobileStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Medicine Management Functions

// Initialize medicine storage
export const initMedicines = async () => {
  try {
    if (isWeb) {
      const existingMedicines = webStorage.getItem(STORAGE_KEYS.MEDICINES);
      if (!existingMedicines) {
        webStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify({}));
      }
      const existingHistory = webStorage.getItem(
        STORAGE_KEYS.MEDICINE_DOSE_HISTORY
      );
      if (!existingHistory) {
        webStorage.setItem(
          STORAGE_KEYS.MEDICINE_DOSE_HISTORY,
          JSON.stringify([])
        );
      }
    } else {
      const existingMedicines = await mobileStorage.getItem(
        STORAGE_KEYS.MEDICINES
      );
      if (!existingMedicines) {
        await mobileStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify({}));
      }
      const existingHistory = await mobileStorage.getItem(
        STORAGE_KEYS.MEDICINE_DOSE_HISTORY
      );
      if (!existingHistory) {
        await mobileStorage.setItem(
          STORAGE_KEYS.MEDICINE_DOSE_HISTORY,
          JSON.stringify([])
        );
      }
    }
  } catch (error) {
    console.error("Error initializing medicine storage:", error);
  }
};

// Get all medicines
export const getAllMedicines = async () => {
  try {
    if (isWeb) {
      const medicines = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.MEDICINES) || "{}"
      );
      return Object.values(medicines).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else {
      const medicines = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.MEDICINES)) || "{}"
      );
      return Object.values(medicines).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  } catch (error) {
    console.error("Error getting medicines:", error);
    throw error;
  }
};

// Save a new medicine
export const saveMedicine = async (medicine) => {
  try {
    // Validate medicine data
    const validationErrors = validateMedicine(medicine);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid medicine data: ${validationErrors.join(", ")}`);
    }

    const id = Date.now();
    const medicineWithId = {
      ...medicine,
      id,
      created_at: new Date().toISOString(),
      doses_taken: medicine.doses_taken || 0,
    };

    if (isWeb) {
      const medicines = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.MEDICINES) || "{}"
      );
      medicines[id] = medicineWithId;
      webStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } else {
      const medicines = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.MEDICINES)) || "{}"
      );
      medicines[id] = medicineWithId;
      await mobileStorage.setItem(
        STORAGE_KEYS.MEDICINES,
        JSON.stringify(medicines)
      );
    }

    return id;
  } catch (error) {
    console.error("Error saving medicine:", error);
    throw error;
  }
};

// Update an existing medicine
export const updateMedicine = async (id, medicine) => {
  try {
    // Validate medicine data
    const validationErrors = validateMedicine(medicine);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid medicine data: ${validationErrors.join(", ")}`);
    }

    if (isWeb) {
      const medicines = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.MEDICINES) || "{}"
      );
      if (!medicines[id]) {
        throw new Error("Medicine not found");
      }
      medicines[id] = {
        ...medicines[id],
        ...medicine,
        updated_at: new Date().toISOString(),
      };
      webStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } else {
      const medicines = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.MEDICINES)) || "{}"
      );
      if (!medicines[id]) {
        throw new Error("Medicine not found");
      }
      medicines[id] = {
        ...medicines[id],
        ...medicine,
        updated_at: new Date().toISOString(),
      };
      await mobileStorage.setItem(
        STORAGE_KEYS.MEDICINES,
        JSON.stringify(medicines)
      );
    }
  } catch (error) {
    console.error("Error updating medicine:", error);
    throw error;
  }
};

// Delete a medicine
export const deleteMedicine = async (id) => {
  try {
    if (isWeb) {
      const medicines = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.MEDICINES) || "{}"
      );
      delete medicines[id];
      webStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
    } else {
      const medicines = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.MEDICINES)) || "{}"
      );
      delete medicines[id];
      await mobileStorage.setItem(
        STORAGE_KEYS.MEDICINES,
        JSON.stringify(medicines)
      );
    }
  } catch (error) {
    console.error("Error deleting medicine:", error);
    throw error;
  }
};

// Record a dose taken
export const recordDoseTaken = async (medicineId, doseTime) => {
  try {
    const now = new Date().toISOString();

    // Update medicine dose count
    if (isWeb) {
      const medicines = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.MEDICINES) || "{}"
      );
      if (medicines[medicineId]) {
        medicines[medicineId].doses_taken =
          (medicines[medicineId].doses_taken || 0) + 1;
        webStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
      }

      // Add to dose history
      const history = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.MEDICINE_DOSE_HISTORY) || "[]"
      );
      history.push({
        id: Date.now(),
        medicine_id: medicineId,
        dose_time: doseTime,
        taken_at: now,
      });
      webStorage.setItem(
        STORAGE_KEYS.MEDICINE_DOSE_HISTORY,
        JSON.stringify(history)
      );
    } else {
      const medicines = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.MEDICINES)) || "{}"
      );
      if (medicines[medicineId]) {
        medicines[medicineId].doses_taken =
          (medicines[medicineId].doses_taken || 0) + 1;
        await mobileStorage.setItem(
          STORAGE_KEYS.MEDICINES,
          JSON.stringify(medicines)
        );
      }

      // Add to dose history
      const history = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.MEDICINE_DOSE_HISTORY)) ||
          "[]"
      );
      history.push({
        id: Date.now(),
        medicine_id: medicineId,
        dose_time: doseTime,
        taken_at: now,
      });
      await mobileStorage.setItem(
        STORAGE_KEYS.MEDICINE_DOSE_HISTORY,
        JSON.stringify(history)
      );
    }
  } catch (error) {
    console.error("Error recording dose:", error);
    throw error;
  }
};

// Get recent dose history
export const getDoseHistory = async (limit = 50) => {
  try {
    if (isWeb) {
      const history = JSON.parse(
        webStorage.getItem(STORAGE_KEYS.MEDICINE_DOSE_HISTORY) || "[]"
      );
      return history
        .sort((a, b) => b.taken_at.localeCompare(a.taken_at))
        .slice(0, limit);
    } else {
      const history = JSON.parse(
        (await mobileStorage.getItem(STORAGE_KEYS.MEDICINE_DOSE_HISTORY)) ||
          "[]"
      );
      return history
        .sort((a, b) => b.taken_at.localeCompare(a.taken_at))
        .slice(0, limit);
    }
  } catch (error) {
    console.error("Error getting dose history:", error);
    throw error;
  }
};
