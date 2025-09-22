import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, BarChart, ProgressChart } from "react-native-chart-kit";
import { useTheme } from "../contexts/ThemeContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { AnalyticsService } from "../utils/analytics";
import { getProgressColor, formatNumber } from "../utils/calculations";

const { width } = Dimensions.get("window");

const StatsScreen = () => {
  const { colors } = useTheme();
  const { goals } = useUserProfile();
  const styles = createStyles(colors);
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [chartData, setChartData] = useState({
    waterData: [],
    calorieData: [],
    stepData: [],
    labels: [],
  });
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get real data from AnalyticsService
      const days = selectedPeriod === "7days" ? 7 : 30;
      const chartDataResult = await AnalyticsService.getChartData(days);
      const summaryStatsResult = await AnalyticsService.getSummaryStats();

      // Convert chart data to percentages for display
      const waterData = chartDataResult.map((entry) =>
        AnalyticsService.calculateProgress(
          entry.water_ml || entry.water || 0,
          goals.water
        )
      );
      const calorieData = chartDataResult.map((entry) =>
        AnalyticsService.calculateProgress(entry.calories || 0, goals.calories)
      );
      const stepData = chartDataResult.map((entry) =>
        AnalyticsService.calculateProgress(entry.steps || 0, goals.steps)
      );

      // Get personalized insights
      const insightsResult = AnalyticsService.getInsights(
        summaryStatsResult.thisWeek,
        goals,
        summaryStatsResult.trend
      );

      setChartData({
        waterData,
        calorieData,
        stepData,
        labels: chartDataResult.map((entry) => entry.date),
      });

      setSummaryStats(summaryStatsResult);
      setInsights(insightsResult);
    } catch (error) {
      console.error("Error loading stats data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAverage = (data) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => acc + val, 0);
    return (sum / data.length).toFixed(1);
  };

  const getTotal = (data, type) => {
    const entries = chartData.labels.map((date, index) => {
      const percentage = data[index];
      const goal =
        type === "water"
          ? goals.water
          : type === "calories"
          ? goals.calories
          : goals.steps;

      return Math.round((percentage / 100) * goal);
    });

    return entries.reduce((acc, val) => acc + val, 0);
  };

  const StatCard = ({ title, data, type, unit, color }) => {
    const average = getAverage(data);
    const total = getTotal(data, type);

    return (
      <View style={[styles.statCard, { borderLeftColor: color }]}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>
          {type === "percentage" ? `${average}%` : formatNumber(total)} {unit}
        </Text>
        <Text style={styles.statLabel}>
          {type === "percentage" ? "Average" : "Total"} (
          {selectedPeriod === "7days" ? "7 days" : "30 days"})
        </Text>
      </View>
    );
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      // Convert hex to RGB and apply opacity
      const hex = colors.primary.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      // Handle the secondary text color which already has alpha
      if (colors.text.secondary.includes("#EBEBF599")) {
        // For the specific iOS dark theme color, just return it as is
        return colors.text.secondary;
      }
      // For other colors, convert hex to RGB and apply opacity
      const hex = colors.text.secondary.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: colors.primary,
    },
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your statistics...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Health Statistics</Text>

          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "7days" && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod("7days")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "7days" && styles.periodButtonTextActive,
                ]}
              >
                7 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === "30days" && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod("30days")}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === "30days" && styles.periodButtonTextActive,
                ]}
              >
                30 Days
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Water Intake"
            data={chartData.waterData}
            type="water"
            unit="ml"
            color={getProgressColor(
              parseFloat(getAverage(chartData.waterData))
            )}
          />
          <StatCard
            title="Calorie Intake"
            data={chartData.calorieData}
            type="calories"
            unit="cal"
            color={getProgressColor(
              parseFloat(getAverage(chartData.calorieData))
            )}
          />
          <StatCard
            title="Step Count"
            data={chartData.stepData}
            type="steps"
            unit="steps"
            color={getProgressColor(parseFloat(getAverage(chartData.stepData)))}
          />
        </View>

        {/* Charts */}
        <View style={styles.chartsContainer}>
          <Text style={styles.chartTitle}>Progress Over Time (% of Goals)</Text>

          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>Water Intake Progress</Text>
            <LineChart
              data={{
                labels: chartData.labels.map((date) =>
                  new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                ),
                datasets: [
                  {
                    data: chartData.waterData,
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>Calorie Intake Progress</Text>
            <LineChart
              data={{
                labels: chartData.labels.map((date) =>
                  new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                ),
                datasets: [
                  {
                    data: chartData.calorieData,
                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartLabel}>Step Count Progress</Text>
            <BarChart
              data={{
                labels: chartData.labels.map((date) =>
                  new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                ),
                datasets: [
                  {
                    data: chartData.stepData,
                  },
                ],
              }}
              width={width - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>
        </View>

        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>💡 Insights</Text>
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <Text key={index} style={styles.insightText}>
                • {insight.message}
              </Text>
            ))
          ) : (
            <Text style={styles.insightText}>
              • Start tracking your health data to see personalized insights!
            </Text>
          )}

          {summaryStats && (
            <View style={styles.trendContainer}>
              <Text style={styles.trendTitle}>
                📈 Trend:{" "}
                {summaryStats.trend === "improving"
                  ? "Improving"
                  : summaryStats.trend === "declining"
                  ? "Needs Attention"
                  : "Stable"}
              </Text>
              <Text style={styles.trendText}>
                This week: {summaryStats.thisWeek.daysTracked} days tracked
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      fontSize: 16,
      color: colors.text.secondary,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text.primary,
      marginBottom: 15,
    },
    periodSelector: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: "center",
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text.secondary,
    },
    periodButtonTextActive: {
      color: colors.header.text,
    },
    statsContainer: {
      flexDirection: "row",
      padding: 15,
      justifyContent: "space-between",
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 5,
      borderLeftWidth: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    statTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text.secondary,
      marginBottom: 5,
    },
    statValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text.primary,
      marginBottom: 3,
    },
    statLabel: {
      fontSize: 10,
      color: colors.text.light,
    },
    chartsContainer: {
      padding: 15,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text.primary,
      marginBottom: 15,
      textAlign: "center",
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    chartLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text.primary,
      marginBottom: 10,
      textAlign: "center",
    },
    chart: {
      borderRadius: 8,
    },
    insightsContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      margin: 15,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    insightsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text.primary,
      marginBottom: 15,
    },
    insightText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    trendContainer: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    trendTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text.primary,
      marginBottom: 5,
    },
    trendText: {
      fontSize: 14,
      color: colors.text.secondary,
    },
  });

export default StatsScreen;
