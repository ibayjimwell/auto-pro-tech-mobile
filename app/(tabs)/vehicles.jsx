import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

  // --- Logic: Load Vehicles ---
  const loadVehicles = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await vehiclesApi.listByCustomer(customerId);
      let vehicleArray = res.data?.data || (Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
      setVehicles(vehicleArray);
    } catch (err) {
      console.error('Load vehicles error:', err);
      notify.error('Failed to load vehicles');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVehicles();
  }, [customerId]);

  // --- Logic: Modal Management ---
  const openAddModal = () => {
    setEditingVehicle(null);
    setForm({ make: "", model: "", plateNumber: "", year: "" });
    setModalVisible(true);
  };

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

  // --- Logic: Save Vehicle ---
  const handleSave = async () => {
    if (!form.make || !form.model || !form.plateNumber) {
      notify.error("Required fields are missing");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        make: form.make,
        model: form.model,
        plateNumber: form.plateNumber,
        year: form.year ? parseInt(form.year) : null,
      };
      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, payload);
        notify.success("Vehicle updated");
      } else {
        await vehiclesApi.create({ ...payload, customerId });
        notify.success("Vehicle added");
      }
      setModalVisible(false);
      loadVehicles();
    } catch (err) {
      notify.error(err.response?.data?.message || "Operation failed");
    }
    setSubmitting(false);
  };

  // --- Logic: Delete Vehicle ---
  const handleDelete = (vehicle) => {
    Alert.alert("Remove Vehicle", `Are you sure you want to remove the ${vehicle.make} ${vehicle.model}?`, [
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
            notify.error("Delete failed");
          }
        },
      },
    ]);
  };

  // --- UI: Loading State ---
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* --- Custom Header --- */}
      <View className="px-6 pt-14 pb-4 flex-row justify-between items-end">
        <View>
          <Text className="text-sm font-bold uppercase tracking-[2px] opacity-50" style={{ color: theme.text }}>
            Garage
          </Text>
          <Text className="text-3xl font-black" style={{ color: theme.text }}>
            Vehicles<Text style={{ color: theme.primary }}>.</Text>
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          className="w-12 h-12 rounded-2xl justify-center items-center shadow-lg shadow-primary/30"
          style={{ backgroundColor: theme.primary }}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* --- Empty State --- */}
        {vehicles.length === 0 ? (
          <View className="items-center justify-center py-24 opacity-50">
            <View className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-900 items-center justify-center mb-6">
              <MaterialCommunityIcons name="car-off" size={48} color={theme.textSecondary} />
            </View>
            <Text className="text-lg font-black text-center" style={{ color: theme.text }}>
              No vehicles found
            </Text>
            <Text className="text-sm font-medium text-center mt-2" style={{ color: theme.textSecondary }}>
              Start your journey by adding{"\n"}your first car.
            </Text>
          </View>
        ) : (
          /* --- Vehicle List --- */
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
        <View className="h-10" />
      </ScrollView>

      {/* --- Add/Edit Modal (Bottom Sheet Style) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1"
        >
          <View className="flex-1 justify-end bg-black/60">
            <View className="p-8 rounded-t-[40px] shadow-2xl" style={{ backgroundColor: theme.surface }}>
              {/* Modal Indicator */}
              <View className="w-12 h-1.5 rounded-full self-center mb-6 opacity-10" style={{ backgroundColor: theme.text }} />
              
              <View className="flex-row justify-between items-center mb-8">
                <Text className="text-2xl font-black" style={{ color: theme.text }}>
                  {editingVehicle ? "Update Car" : "New Vehicle"}
                </Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View className="space-y-4">
                <View>
                  <Text className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 opacity-50" style={{ color: theme.text }}>Brand / Make</Text>
                  <TextInput
                    className="p-4 rounded-2xl text-base font-bold border"
                    style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
                    placeholder="e.g., Toyota"
                    placeholderTextColor={theme.textSecondary + '70'}
                    value={form.make}
                    onChangeText={(text) => setForm({ ...form, make: text })}
                  />
                </View>

                <View>
                  <Text className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 opacity-50" style={{ color: theme.text }}>Model Name</Text>
                  <TextInput
                    className="p-4 rounded-2xl text-base font-bold border"
                    style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
                    placeholder="e.g., Vios"
                    placeholderTextColor={theme.textSecondary + '70'}
                    value={form.model}
                    onChangeText={(text) => setForm({ ...form, model: text })}
                  />
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 opacity-50" style={{ color: theme.text }}>Plate Number</Text>
                    <TextInput
                      className="p-4 rounded-2xl text-base font-bold border uppercase"
                      style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
                      placeholder="ABC 123"
                      placeholderTextColor={theme.textSecondary + '70'}
                      value={form.plateNumber}
                      onChangeText={(text) => setForm({ ...form, plateNumber: text })}
                    />
                  </View>
                  <View className="w-[100px]">
                    <Text className="text-[10px] font-black uppercase tracking-widest ml-1 mb-2 opacity-50" style={{ color: theme.text }}>Year</Text>
                    <TextInput
                      className="p-4 rounded-2xl text-base font-bold border"
                      style={{ backgroundColor: theme.background, color: theme.text, borderColor: theme.border }}
                      placeholder="2024"
                      placeholderTextColor={theme.textSecondary + '70'}
                      value={form.year}
                      onChangeText={(text) => setForm({ ...form, year: text })}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                className="mt-10 py-5 rounded-[24px] shadow-xl shadow-primary/30"
                style={{ backgroundColor: theme.primary, opacity: submitting ? 0.8 : 1 }}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-black text-base uppercase tracking-widest">
                    {editingVehicle ? "Confirm Changes" : "Save to Garage"}
                  </Text>
                )}
              </TouchableOpacity>
              <View className="h-4" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// --- Sub-Component: Vehicle Card ---
const VehicleCard = ({ vehicle, theme, onEdit, onDelete }) => (
  <View 
    className="p-5 mb-4 rounded-[32px] border flex-row items-center" 
    style={{ backgroundColor: theme.surface, borderColor: theme.border }}
  >
    {/* Icon Representation */}
    <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.primary + '10' }}>
      <MaterialCommunityIcons name="car-hatchback" size={30} color={theme.primary} />
    </View>

    {/* Vehicle Info */}
    <View className="flex-1">
      <Text className="text-lg font-black" style={{ color: theme.text }}>
        {vehicle.make} {vehicle.model}
      </Text>
      <View className="flex-row items-center mt-1">
        <Text className="text-[11px] font-black uppercase tracking-widest py-0.5 px-2 rounded-md mr-2" style={{ backgroundColor: theme.background, color: theme.textSecondary }}>
          {vehicle.plateNumber}
        </Text>
        {vehicle.year && (
          <Text className="text-xs font-bold opacity-40" style={{ color: theme.text }}>
            • {vehicle.year}
          </Text>
        )}
      </View>
    </View>

    {/* Actions */}
    <View className="flex-row space-x-2">
      <TouchableOpacity 
        onPress={onEdit} 
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: theme.background }}
      >
        <Ionicons name="pencil-outline" size={18} color={theme.text} />
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={onDelete}
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: '#ef444415' }}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  </View>
);