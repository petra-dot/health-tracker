// Utility functions for health calculations

// Get current date in YYYY-MM-DD format
export const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// Get current date in full format (Monday, September 22, 2025)
export const getCurrentDateFormatted = () => {
  const today = new Date();
  return today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Calculate water intake percentage
export const calculateWaterPercentage = (current_ml, goal_ml) => {
  if (goal_ml === 0) return 0;
  return Math.min((current_ml / goal_ml) * 100, 100);
};

// Calculate calorie percentage
export const calculateCaloriePercentage = (current_calories, goal_calories) => {
  if (goal_calories === 0) return 0;
  return Math.min((current_calories / goal_calories) * 100, 100);
};

// Calculate step percentage
export const calculateStepPercentage = (current_steps, goal_steps) => {
  if (goal_steps === 0) return 0;
  return Math.min((current_steps / goal_steps) * 100, 100);
};

// Calculate BMI
export const calculateBMI = (weight_kg, height_cm) => {
  if (weight_kg === 0 || height_cm === 0) return 0;
  const height_m = height_cm / 100;
  return (weight_kg / (height_m * height_m)).toFixed(1);
};

// Get BMI category
export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

// Calculate daily water goal based on weight (30ml per kg)
export const calculateWaterGoal = (weight_kg) => {
  if (!weight_kg) return 2000; // Default 2L
  return Math.round(weight_kg * 30);
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
export const calculateBMR = (weight_kg, height_cm, age, gender = "male") => {
  if (!weight_kg || !height_cm || !age) return 0;

  const height_m = height_cm / 100;
  const baseCalories = 10 * weight_kg + 6.25 * height_m * 100 - 5 * age;

  return gender === "male" ? baseCalories + 5 : baseCalories - 161;
};

// Calculate TDEE (Total Daily Energy Expenditure) based on activity level
export const calculateTDEE = (bmr, activityLevel = "sedentary") => {
  if (bmr === 0) return 0;

  const activityMultipliers = {
    sedentary: 1.2, // Little/no exercise
    light: 1.375, // Light exercise 1-3 days/week
    moderate: 1.55, // Moderate exercise 3-5 days/week
    active: 1.725, // Hard exercise 6-7 days/week
    very_active: 1.9, // Very hard exercise & physical job
  };

  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
};

// Get date range for charts (last 7 days)
export const getLast7Days = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

// Get date range for charts (last 30 days)
export const getLast30Days = () => {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

// Format number with commas
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Calculate progress color based on percentage
export const getProgressColor = (percentage) => {
  if (percentage >= 80) return "#4CAF50"; // Green
  if (percentage >= 60) return "#FF9800"; // Orange
  return "#F44336"; // Red
};
