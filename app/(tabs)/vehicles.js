import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function VehiclesScreen() {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [vehicles, setVehicles] = useState([
    { id: 1, name: "Toyota Vios", plate: "ABC 1234", year: "2021", type: "Sedan", color: "White" },
    { id: 2, name: "Honda Civic", plate: "XYZ 5678", year: "2022", type: "Sedan", color: "Black" },
  ]);

  const [newVehicle, setNewVehicle] = useState({
    name: "",
    plate: "",
    year: "",
    type: "",
    color: "",
  });

  const addVehicle = () => {
    if (newVehicle.name && newVehicle.plate && newVehicle.year) {
      setVehicles([...vehicles, { id: Date.now(), ...newVehicle }]);
      setNewVehicle({ name: "", plate: "", year: "", type: "", color: "" });
      setModalVisible(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView className="flex-1 px-5 pt-12">
        {/* Header with Title and Add Button */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            My Vehicles
          </Text>
          <TouchableOpacity
            className="w-10 h-10 rounded-full justify-center items-center"
            style={{ backgroundColor: theme.primary }}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Vehicle Cards */}
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} theme={theme} />
        ))}
      </ScrollView>

      {/* Add Vehicle Modal */}
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
                Add New Vehicle
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Vehicle Name *
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-3"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., Toyota Vios"
              placeholderTextColor={theme.textSecondary}
              value={newVehicle.name}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, name: text })}
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
              placeholder="e.g., ABC 1234"
              placeholderTextColor={theme.textSecondary}
              value={newVehicle.plate}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, plate: text })}
            />

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Model Year *
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-3"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., 2021"
              placeholderTextColor={theme.textSecondary}
              value={newVehicle.year}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, year: text })}
              keyboardType="numeric"
            />

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Vehicle Type
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-3"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., Sedan, SUV"
              placeholderTextColor={theme.textSecondary}
              value={newVehicle.type}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, type: text })}
            />

            <Text className="text-sm mb-1" style={{ color: theme.text }}>
              Color
            </Text>
            <TextInput
              className="p-3 rounded-lg mb-4"
              style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
              }}
              placeholder="e.g., White, Black"
              placeholderTextColor={theme.textSecondary}
              value={newVehicle.color}
              onChangeText={(text) => setNewVehicle({ ...newVehicle, color: text })}
            />

            <TouchableOpacity
              className="py-4 rounded-lg"
              style={{ backgroundColor: theme.primary }}
              onPress={addVehicle}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Add Vehicle
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// VehicleCard
const VehicleCard = ({ vehicle, theme }) => (
  <View className="p-4 mb-3 rounded-xl" style={{ backgroundColor: theme.surface }}>
    <View className="flex-row justify-between items-start">
      <View className="flex-1">
        <Text className="text-lg font-bold mb-1" style={{ color: theme.text }}>
          {vehicle.name}
        </Text>
        <Text className="text-base mb-1" style={{ color: theme.textSecondary }}>
          {vehicle.plate}
        </Text>
        <Text className="text-sm" style={{ color: theme.textSecondary }}>
          {vehicle.year} {vehicle.type} {vehicle.color}
        </Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity className="mr-3">
          <Ionicons name="pencil-outline" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="trash-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);