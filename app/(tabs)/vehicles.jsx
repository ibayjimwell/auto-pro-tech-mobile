import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import vehiclesApi from "../../services/vehiclesApi";
import { notify } from "../../lib/notify";

export default function VehiclesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const customerId = user?.id;

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({
    make: "",
    model: "",
    plateNumber: "",
    year: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load vehicles
  const loadVehicles = async () => {
  if (!customerId) {
    console.warn('No customerId, skipping vehicle load');
    return;
  }
    setLoading(true);
    try {
      const res = await vehiclesApi.listByCustomer(customerId);
      console.log('Raw response:', res);
      // Try both possible structures
      let vehicleArray = res.data?.data;
      if (!vehicleArray && Array.isArray(res.data)) {
        vehicleArray = res.data;
      }
      if (!vehicleArray && Array.isArray(res)) {
        vehicleArray = res;
      }
      setVehicles(vehicleArray || []);
    } catch (err) {
      console.error('Load vehicles error:', err);
      notify.error('Failed to load vehicles');
    }
    setLoading(false);
};
  useEffect(() => {
    loadVehicles();
  }, [customerId]);

  // Open modal for adding
  const openAddModal = () => {
    setEditingVehicle(null);
    setForm({ make: "", model: "", plateNumber: "", year: "" });
    setModalVisible(true);
  };

  // Open modal for editing
  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      year: vehicle.year?.toString() || "",
    });
    setModalVisible(true);
  };

  // Save vehicle (create or update)
  const handleSave = async () => {
    if (!form.make || !form.model || !form.plateNumber) {
      notify.error("Make, model and plate number are required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingVehicle) {
        // Update
        await vehiclesApi.update(editingVehicle.id, {
          make: form.make,
          model: form.model,
          plateNumber: form.plateNumber,
          year: form.year ? parseInt(form.year) : null,
        });
        notify.success("Vehicle updated");
      } else {
        // Create
        await vehiclesApi.create({
          customerId,
          make: form.make,
          model: form.model,
          plateNumber: form.plateNumber,
          year: form.year ? parseInt(form.year) : null,
        });
        notify.success("Vehicle added");
      }
      setModalVisible(false);
      loadVehicles();
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed";
      notify.error(msg);
    }
    setSubmitting(false);
  };

  // Delete vehicle
  const handleDelete = (vehicle) => {
    Alert.alert("Delete Vehicle", `Remove ${vehicle.make} ${vehicle.model}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await vehiclesApi.delete(vehicle.id);
            notify.success("Vehicle deleted");
            loadVehicles();
          } catch (err) {
            notify.error(err.response?.data?.message || "Delete failed");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView className="flex-1 px-5 pt-12">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            My Vehicles
          </Text>
          <TouchableOpacity
            className="w-10 h-10 rounded-full justify-center items-center"
            style={{ backgroundColor: theme.primary }}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="car-outline" size={64} color={theme.textSecondary} />
            <Text className="mt-4 text-center" style={{ color: theme.textSecondary }}>
              No vehicles yet. Tap + to add one.
            </Text>
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              theme={theme}
              onEdit={() => openEditModal(vehicle)}
              onDelete={() => handleDelete(vehicle)}
            />
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="p-6 rounded-t-3xl" style={{ backgroundColor: theme.background }}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold" style={{ color: theme.text }}>
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Make *
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-3"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., Toyota"
              placeholderTextColor={theme.textSecondary}
              value={form.make}
              onChangeText={(text) => setForm({ ...form, make: text })}
            />

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Model *
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-3"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., Vios"
              placeholderTextColor={theme.textSecondary}
              value={form.model}
              onChangeText={(text) => setForm({ ...form, model: text })}
            />

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Plate Number *
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-3"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., ABC-1234"
              placeholderTextColor={theme.textSecondary}
              value={form.plateNumber}
              onChangeText={(text) => setForm({ ...form, plateNumber: text })}
            />

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Year (optional)
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-4"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., 2021"
              placeholderTextColor={theme.textSecondary}
              value={form.year}
              onChangeText={(text) => setForm({ ...form, year: text })}
              keyboardType="numeric"
            />

            <TouchableOpacity
              className="py-4 rounded-lg"
              style={{ backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  {editingVehicle ? "Save Changes" : "Add Vehicle"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// VehicleCard Component
const VehicleCard = ({ vehicle, theme, onEdit, onDelete }) => (
  <View className="p-4 mb-3 rounded-xl" style={{ backgroundColor: theme.surface }}>
    <View className="flex-row justify-between items-start">
      <View className="flex-1">
        <Text className="text-lg font-bold mb-1" style={{ color: theme.text }}>
          {vehicle.make} {vehicle.model}
        </Text>
        <Text className="text-base mb-1" style={{ color: theme.textSecondary }}>
          {vehicle.plateNumber}
        </Text>
        {vehicle.year && (
          <Text className="text-sm" style={{ color: theme.textSecondary }}>
            Year: {vehicle.year}
          </Text>
        )}
      </View>
      <View className="flex-row">
        <TouchableOpacity onPress={onEdit} className="mr-3">
          <Ionicons name="pencil-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);