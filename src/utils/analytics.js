import { getEntriesForDateRange } from "../db/database";

// Analytics service for processing health data
export class AnalyticsService {
  // Calculate weekly averages for a date range
  static async getWeeklyAverages(startDate, endDate) {
    try {
      const entries = await getEntriesForDateRange(startDate, endDate);

      if (entries.length === 0) {
        return {
          water: 0,
          calories: 0,
          steps: 0,
          daysTracked: 0,
        };
      }

      const totals = entries.reduce(
        (acc, entry) => ({
          water: acc.water + (entry.water_ml || 0),
          calories: acc.calories + (entry.calories || 0),
          steps: acc.steps + (entry.steps || 0),
          count: acc.count + 1,
        }),
        { water: 0, calories: 0, steps: 0, count: 0 }
      );

      return {
        water: Math.round(totals.water / totals.count),
        calories: Math.round(totals.calories / totals.count),
        steps: Math.round(totals.steps / totals.count),
        daysTracked: totals.count,
      };
    } catch (error) {
      console.error("Error calculating weekly averages:", error);
      return {
        water: 0,
        calories: 0,
        steps: 0,
        daysTracked: 0,
      };
    }
  }

  // Calculate progress percentage compared to goals
  static calculateProgress(current, goal) {
    if (goal === 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  }

  // Get trend analysis (improving, declining, stable)
  static analyzeTrend(currentWeek, previousWeek) {
    if (!previousWeek.water && !previousWeek.calories && !previousWeek.steps) {
      return "new"; // First week of tracking
    }

    const waterChange =
      ((currentWeek.water - previousWeek.water) / previousWeek.water) * 100;
    const calorieChange =
      ((currentWeek.calories - previousWeek.calories) / previousWeek.calories) *
      100;
    const stepChange =
      ((currentWeek.steps - previousWeek.steps) / previousWeek.steps) * 100;

    const avgChange = (waterChange + calorieChange + stepChange) / 3;

    if (avgChange > 10) return "improving";
    if (avgChange < -10) return "declining";
    return "stable";
  }

  // Get achievement milestones
  static getAchievements(currentData, goals) {
    const achievements = [];

    // Water achievements
    if (currentData.water >= goals.water) {
      achievements.push({
        type: "water_goal",
        title: "💧 Hydration Master",
        description: "Reached daily water goal!",
        icon: "water",
      });
    }

    // Calorie achievements
    if (currentData.calories >= goals.calories) {
      achievements.push({
        type: "calorie_goal",
        title: "🔥 Energy Champion",
        description: "Reached daily calorie goal!",
        icon: "restaurant",
      });
    }

    // Step achievements
    if (currentData.steps >= goals.steps) {
      achievements.push({
        type: "step_goal",
        title: "🚶 Step Warrior",
        description: "Reached daily step goal!",
        icon: "walk",
      });
    }

    // Streak achievements
    if (currentData.daysTracked >= 7) {
      achievements.push({
        type: "week_streak",
        title: "📅 Week Warrior",
        description: "Tracked for 7 consecutive days!",
        icon: "calendar",
      });
    }

    if (currentData.daysTracked >= 30) {
      achievements.push({
        type: "month_streak",
        title: "🏆 Health Hero",
        description: "Tracked for 30 consecutive days!",
        icon: "trophy",
      });
    }

    return achievements;
  }

  // Get personalized insights
  static getInsights(currentData, goals, trend) {
    const insights = [];

    // Water insights
    const waterProgress = this.calculateProgress(
      currentData.water,
      goals.water
    );
    if (waterProgress < 50) {
      insights.push({
        type: "water_low",
        message:
          "💡 Try setting reminders to drink water regularly throughout the day.",
        category: "hydration",
      });
    } else if (waterProgress >= 100) {
      insights.push({
        type: "water_excellent",
        message:
          "🎉 Excellent hydration! You're meeting your water goals consistently.",
        category: "hydration",
      });
    }

    // Calorie insights
    const calorieProgress = this.calculateProgress(
      currentData.calories,
      goals.calories
    );
    if (calorieProgress < 50) {
      insights.push({
        type: "calories_low",
        message:
          "💡 Consider planning your meals to ensure you're getting enough nutrition.",
        category: "nutrition",
      });
    } else if (calorieProgress >= 100) {
      insights.push({
        type: "calories_good",
        message:
          "🎉 Great job maintaining your calorie goals! Keep up the balanced approach.",
        category: "nutrition",
      });
    }

    // Step insights
    const stepProgress = this.calculateProgress(currentData.steps, goals.steps);
    if (stepProgress < 50) {
      insights.push({
        type: "steps_low",
        message:
          "💡 Try taking short walks during breaks or using stairs instead of elevators.",
        category: "activity",
      });
    } else if (stepProgress >= 100) {
      insights.push({
        type: "steps_excellent",
        message:
          "🎉 Fantastic activity level! You're consistently meeting your step goals.",
        category: "activity",
      });
    }

    // Trend-based insights
    if (trend === "improving") {
      insights.push({
        type: "trend_positive",
        message: "📈 You're on an upward trend! Keep up the great progress.",
        category: "motivation",
      });
    } else if (trend === "declining") {
      insights.push({
        type: "trend_negative",
        message:
          "📉 Progress has slowed down. Consider adjusting your goals or routine.",
        category: "motivation",
      });
    }

    return insights;
  }

  // Get data for charts
  static async getChartData(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      const entries = await getEntriesForDateRange(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      // Fill missing dates with zero values
      const chartData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        const entry = entries.find((e) => e.date === dateStr);
        chartData.push({
          date: dateStr,
          water: entry ? entry.water_ml || 0 : 0,
          calories: entry ? entry.calories || 0 : 0,
          steps: entry ? entry.steps || 0 : 0,
          label: date.toLocaleDateString("en-US", { weekday: "short" }),
        });
      }

      return chartData;
    } catch (error) {
      console.error("Error getting chart data:", error);
      return [];
    }
  }

  // Get summary statistics
  static async getSummaryStats() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const thisWeek = new Date();
      thisWeek.setDate(thisWeek.getDate() - 7);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 14);

      const [todayData, thisWeekData, lastWeekData] = await Promise.all([
        this.getWeeklyAverages(today, today),
        this.getWeeklyAverages(thisWeek.toISOString().split("T")[0], today),
        this.getWeeklyAverages(
          lastWeek.toISOString().split("T")[0],
          thisWeek.toISOString().split("T")[0]
        ),
      ]);

      return {
        today: todayData,
        thisWeek: thisWeekData,
        lastWeek: lastWeekData,
        trend: this.analyzeTrend(thisWeekData, lastWeekData),
      };
    } catch (error) {
      console.error("Error getting summary stats:", error);
      return {
        today: { water: 0, calories: 0, steps: 0, daysTracked: 0 },
        thisWeek: { water: 0, calories: 0, steps: 0, daysTracked: 0 },
        lastWeek: { water: 0, calories: 0, steps: 0, daysTracked: 0 },
        trend: "stable",
      };
    }
  }
}
