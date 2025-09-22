import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import {
  getAllMedicines,
  saveMedicine,
  updateMedicine,
  deleteMedicine,
  recordDoseTaken,
  initMedicines,
} from "../db/database";

const { width } = Dimensions.get("window");

const MedicineTracker = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [nextDose, setNextDose] = useState(null);

  // Form state for adding/editing medicines
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    times: [],
    instructions: "",
    total_doses: "",
    doses_taken: 0,
  });

  // Load medicines from database on component mount
  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      await initMedicines();
      const loadedMedicines = await getAllMedicines();
      setMedicines(loadedMedicines);
    } catch (error) {
      console.error("Error loading medicines:", error);
      Alert.alert("Error", "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const saveMedicineToDatabase = async () => {
    try {
      const medicineData = {
        ...medicineForm,
        total_doses: medicineForm.total_doses
          ? parseInt(medicineForm.total_doses)
          : undefined,
      };

      let result;
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, medicineData);
        result = "updated";
      } else {
        result = await saveMedicine(medicineData);
      }

      // Reload medicines
      await loadMedicines();

      // Reset form
      setMedicineForm({
        name: "",
        dosage: "",
        frequency: "",
        times: [],
        instructions: "",
        total_doses: "",
        doses_taken: 0,
      });

      setShowAddModal(false);
      setEditingMedicine(null);

      Alert.alert(
        "Success",
        `Medicine ${result === "updated" ? "updated" : "added"} successfully!`
      );
    } catch (error) {
      console.error("Error saving medicine:", error);
      Alert.alert("Error", "Failed to save medicine");
    }
  };

  const handleDeleteMedicine = (medicine) => {
    Alert.alert(
      "Delete Medicine",
      `Are you sure you want to delete "${medicine.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMedicine(medicine.id);
              await loadMedicines();
              Alert.alert("Success", "Medicine deleted successfully");
            } catch (error) {
              console.error("Error deleting medicine:", error);
              Alert.alert("Error", "Failed to delete medicine");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);
    setMedicineForm({
      name: medicine.name,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      times: medicine.times || [],
      instructions: medicine.instructions || "",
      total_doses: medicine.total_doses ? medicine.total_doses.toString() : "",
      doses_taken: medicine.doses_taken || 0,
    });
    setShowAddModal(true);
  };

  const addTimeSlot = (hour) => {
    if (!medicineForm.times.includes(hour)) {
      setMedicineForm({
        ...medicineForm,
        times: [...medicineForm.times, hour].sort((a, b) => a - b),
      });
    }
  };

  const removeTimeSlot = (hour) => {
    setMedicineForm({
      ...medicineForm,
      times: medicineForm.times.filter((time) => time !== hour),
    });
  };

  // Find the next upcoming dose across all medicines
  useEffect(() => {
    const updateNextDose = () => {
      let soonestDose = null;
      let soonestTime = Infinity;

      medicines.forEach((medicine) => {
        if (medicine.nextDose) {
          const timeUntil = medicine.nextDose.getTime() - Date.now();
          if (timeUntil > 0 && timeUntil < soonestTime) {
            soonestTime = timeUntil;
            soonestDose = medicine;
          }
        }
      });

      setNextDose(soonestDose);
    };

    updateNextDose();
    // Update every minute
    const interval = setInterval(updateNextDose, 60000);
    return () => clearInterval(interval);
  }, [medicines]);

  const formatTimeUntil = (date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return "Due now";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleTakeDose = async (medicineId, doseTime) => {
    try {
      // Format the time for display
      const timeString =
        doseTime < 12
          ? `${doseTime || 12}AM`
          : doseTime === 12
          ? "12PM"
          : `${doseTime - 12}PM`;

      const confirmed = await new Promise((resolve) => {
        Alert.alert(
          "Confirm Dose Taken",
          `Mark dose for ${timeString} as taken?`,
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            {
              text: "Confirm",
              onPress: () => resolve(true),
            },
          ]
        );
      });

      if (!confirmed) return;

      await recordDoseTaken(medicineId, doseTime);
      await loadMedicines(); // Refresh to show updated counts

      Alert.alert("Success", "Dose recorded! Next dose reminder scheduled.");
    } catch (error) {
      console.error("Error recording dose:", error);
      Alert.alert("Error", "Failed to record dose. Please try again.");
    }
  };

  const handleSnooze = (medicineId) => {
    Alert.alert("Snooze Reminder", "Snooze this reminder for 15 minutes?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Snooze",
        onPress: () => {
          Alert.alert(
            "Reminder Snoozed",
            "We'll remind you again in 15 minutes."
          );
        },
      },
    ]);
  };

  const MedicineCard = ({ medicine }) => {
    const progress = medicine.total_doses
      ? Math.min(
          ((medicine.doses_taken || 0) / medicine.total_doses) * 100,
          100
        )
      : null;
    const remainingDoses = medicine.total_doses - (medicine.doses_taken || 0);

    return (
      <View style={[styles.medicineCard, { backgroundColor: colors.surface }]}>
        <View style={styles.medicineHeader}>
          <View style={styles.medicineInfo}>
            <Text style={[styles.medicineName, { color: colors.text.primary }]}>
              {medicine.name}
            </Text>
            <Text
              style={[styles.medicineDosage, { color: colors.text.secondary }]}
            >
              {medicine.dosage} • {medicine.frequency}
            </Text>
            {medicine.total_doses && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${progress}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.progressText,
                    { color: colors.text.secondary },
                  ]}
                >
                  {medicine.doses_taken || 0} / {medicine.total_doses} doses
                  taken (
                  {remainingDoses > 0
                    ? `${remainingDoses} remaining`
                    : "Completed"}
                  )
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => openEditModal(medicine)}
            >
              <Ionicons name="create" size={20} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => handleDeleteMedicine(medicine)}
            >
              <Ionicons name="trash" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.instructions, { color: colors.text.secondary }]}>
          📝 {medicine.instructions}
        </Text>

        <View style={styles.timeSlots}>
          <Text style={[styles.timeSlotTitle, { color: colors.text.primary }]}>
            Next doses today:
          </Text>
          <View style={styles.timeButtons}>
            {medicine.times.map((hour, index) => (
              <TouchableOpacity
                key={index}
                style={styles.timeButton}
                onPress={() => handleTakeDose(medicine.id, hour)}
              >
                <Text style={styles.timeButtonText}>
                  {hour < 12
                    ? `${hour || 12}AM`
                    : hour === 12
                    ? "12PM"
                    : `${hour - 12}PM`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const NextDoseCard = () => {
    if (!nextDose) return null;

    return (
      <View style={[styles.nextDoseCard, { backgroundColor: colors.primary }]}>
        <View style={styles.nextDoseHeader}>
          <Ionicons name="alarm" size={24} color="#FFFFFF" />
          <Text style={styles.nextDoseTitle}>Next Medication</Text>
        </View>

        <Text style={styles.nextDoseMedicine}>{nextDose.name}</Text>
        <Text style={styles.nextDoseTime}>
          {formatTimeUntil(nextDose.nextDose)}
        </Text>

        <View style={styles.nextDoseActions}>
          <TouchableOpacity
            style={styles.snoozeButton}
            onPress={() => handleSnooze(nextDose.id)}
          >
            <Text style={styles.snoozeButtonText}>Snooze 15m</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.takeButton}
            onPress={() => handleTakeDose(nextDose.id, 0)}
          >
            <Text style={styles.takeButtonText}>Take Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const AddMedicineModal = () => (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => setShowAddModal(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {showAddModal ? (
            <>
              <View
                style={[
                  styles.modalHeader,
                  { backgroundColor: colors.surface },
                ]}
              >
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAddModal(false)}
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
                  {editingMedicine ? "Edit Medicine" : "Add Medicine"}
                </Text>
                <View style={styles.modalHeaderSpace} />
              </View>

              <ScrollView
                style={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <Text
                  style={[
                    styles.modalDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  Enter your medicine details below. We'll help you stay on
                  track with reminders.
                </Text>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: colors.text.primary }]}
                  >
                    Medicine Name*
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text.primary,
                        borderColor: colors.border,
                      },
                    ]}
                    value={medicineForm.name}
                    onChangeText={(text) =>
                      setMedicineForm({ ...medicineForm, name: text })
                    }
                    placeholder="e.g., Aspirin 100mg"
                    placeholderTextColor={colors.text.light}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: colors.text.primary }]}
                  >
                    Dosage*
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text.primary,
                        borderColor: colors.border,
                      },
                    ]}
                    value={medicineForm.dosage}
                    onChangeText={(text) =>
                      setMedicineForm({ ...medicineForm, dosage: text })
                    }
                    placeholder="e.g., 1 tablet, 500mg"
                    placeholderTextColor={colors.text.light}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: colors.text.primary }]}
                  >
                    Frequency*
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text.primary,
                        borderColor: colors.border,
                      },
                    ]}
                    value={medicineForm.frequency}
                    onChangeText={(text) =>
                      setMedicineForm({ ...medicineForm, frequency: text })
                    }
                    placeholder="e.g., Once daily, Twice daily, Every 8 hours"
                    placeholderTextColor={colors.text.light}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: colors.text.primary }]}
                  >
                    Dose Times*
                  </Text>
                  <Text
                    style={[
                      styles.formDescription,
                      { color: colors.text.secondary },
                    ]}
                  >
                    Select when you should take your doses (tap to add/remove
                    times)
                  </Text>

                  <View style={styles.timeGrid}>
                    {Array.from({ length: 24 }, (_, hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeSlot,
                          { backgroundColor: colors.surface },
                          medicineForm.times.includes(hour) && {
                            backgroundColor: colors.primary,
                          },
                        ]}
                        onPress={() =>
                          medicineForm.times.includes(hour)
                            ? removeTimeSlot(hour)
                            : addTimeSlot(hour)
                        }
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            { color: colors.text.primary },
                            medicineForm.times.includes(hour) && {
                              color: "#FFFFFF",
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          {hour < 12
                            ? `${hour || 12}AM`
                            : hour === 12
                            ? "12PM"
                            : `${hour - 12}PM`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {medicineForm.times.length > 0 && (
                    <Text
                      style={[
                        styles.selectedTimesText,
                        { color: colors.text.secondary },
                      ]}
                    >
                      Selected times:{" "}
                      {medicineForm.times
                        .map((hour) =>
                          hour < 12
                            ? `${hour || 12}AM`
                            : hour === 12
                            ? "12PM"
                            : `${hour - 12}PM`
                        )
                        .join(", ")}
                    </Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: colors.text.primary }]}
                  >
                    Total Doses (Optional)
                  </Text>
                  <Text
                    style={[
                      styles.formDescription,
                      { color: colors.text.secondary },
                    ]}
                  >
                    For courses of medicine with a specific number of doses
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text.primary,
                        borderColor: colors.border,
                      },
                    ]}
                    value={medicineForm.total_doses}
                    onChangeText={(text) =>
                      setMedicineForm({ ...medicineForm, total_doses: text })
                    }
                    placeholder="e.g., 30 (for a 30-day course)"
                    placeholderTextColor={colors.text.light}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text
                    style={[styles.formLabel, { color: colors.text.primary }]}
                  >
                    Special Instructions
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        color: colors.text.primary,
                        borderColor: colors.border,
                        height: 80,
                      },
                    ]}
                    value={medicineForm.instructions}
                    onChangeText={(text) =>
                      setMedicineForm({ ...medicineForm, instructions: text })
                    }
                    placeholder="With water, after meals, on empty stomach, etc."
                    placeholderTextColor={colors.text.light}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={saveMedicineToDatabase}
                  disabled={
                    !medicineForm.name.trim() ||
                    !medicineForm.dosage.trim() ||
                    !medicineForm.frequency.trim() ||
                    medicineForm.times.length === 0
                  }
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: colors.header.text },
                    ]}
                  >
                    {editingMedicine ? "Update Medicine" : "Save Medicine"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentHeader}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Stay on Schedule
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Track your medications and never miss a dose
          </Text>
        </View>

        {/* Next Dose Reminder */}
        <NextDoseCard />

        {/* Medicine List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Your Medicines
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {medicines.length > 0 ? (
            medicines.map((medicine) => (
              <MedicineCard key={medicine.id} medicine={medicine} />
            ))
          ) : (
            <View
              style={[styles.emptyState, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="medical" size={64} color={colors.text.light} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No Medicines Yet
              </Text>
              <Text
                style={[styles.emptyText, { color: colors.text.secondary }]}
              >
                Add your first medicine to start tracking your intake
              </Text>
              <TouchableOpacity
                style={[
                  styles.emptyAddButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setShowAddModal(true)}
              >
                <Text
                  style={[
                    styles.emptyAddButtonText,
                    { color: colors.header.text },
                  ]}
                >
                  Add Medicine
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {showAddModal && <AddMedicineModal />}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    screenHeader: {
      padding: 20,
      paddingTop: 50,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    headerText: {
      marginLeft: 15,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    headerSubtitle: {
      fontSize: 12,
      opacity: 0.9,
    },
    scrollView: {
      flex: 1,
    },
    contentHeader: {
      padding: 20,
      alignItems: "center",
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
    nextDoseCard: {
      margin: 15,
      padding: 20,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    nextDoseHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    nextDoseTitle: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 10,
    },
    nextDoseMedicine: {
      color: "#FFFFFF",
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 5,
    },
    nextDoseTime: {
      color: "#FFFFFF",
      fontSize: 16,
      marginBottom: 15,
    },
    nextDoseActions: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    snoozeButton: {
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      marginRight: 10,
      alignItems: "center",
    },
    takeButton: {
      backgroundColor: "#FFFFFF",
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      marginLeft: 10,
      alignItems: "center",
    },
    snoozeButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
    takeButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    section: {
      padding: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    medicineCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medicineHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    medicineInfo: {
      flex: 1,
    },
    medicineName: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 4,
    },
    medicineDosage: {
      fontSize: 14,
    },
    progressContainer: {
      marginTop: 8,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      marginBottom: 6,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      textAlign: "center",
    },
    cardActions: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    cardActionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    doseIndicator: {
      alignItems: "flex-end",
    },
    remainingText: {
      fontSize: 12,
      fontWeight: "600",
    },
    instructions: {
      fontSize: 14,
      marginBottom: 15,
    },
    timeSlots: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 15,
    },
    timeSlotTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 10,
    },
    timeButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    timeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    timeButtonText: {
      color: colors.header.text,
      fontSize: 14,
      fontWeight: "600",
    },
    emptyState: {
      padding: 40,
      alignItems: "center",
      borderRadius: 12,
      marginTop: 10,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginVertical: 10,
    },
    emptyText: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 20,
    },
    emptyAddButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    emptyAddButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
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
    modalDescription: {
      fontSize: 16,
      marginBottom: 20,
      lineHeight: 24,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    formInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
    },
    formPlaceholder: {
      fontSize: 16,
    },
    saveButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 20,
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
    timeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    timeSlot: {
      width: (width - 80) / 8, // 8 columns on a row
      aspectRatio: 1,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeSlotText: {
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    selectedTimesText: {
      fontSize: 14,
      marginTop: 10,
      lineHeight: 20,
    },
    formDescription: {
      fontSize: 14,
      marginBottom: 10,
      lineHeight: 20,
    },
  });

export default MedicineTracker;
