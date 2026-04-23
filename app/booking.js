import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useTheme } from "../context/ThemeContext";

export default function BookingScreen() {
  const { theme } = useTheme();
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const services = [
    { id: 1, name: "PMS (Preventive Maintenance)", duration: "2 hours", price: "₱3,500" },
    { id: 2, name: "Oil Change", duration: "45 mins", price: "₱1,500" },
  ];

  const vehicles = [
    { id: 1, name: "Toyota Vios", plate: "ABC 1234" },
    { id: 2, name: "Honda Civic", plate: "XYZ 5678" },
  ];

  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  ];

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-4">
        {/* Select Service */}
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>
          Select Service
        </Text>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            className="p-4 mb-2 rounded-xl flex-row justify-between items-center"
            style={{
              backgroundColor: selectedService?.id === service.id ? theme.primary + "20" : theme.surface,
              borderWidth: selectedService?.id === service.id ? 2 : 0,
              borderColor: theme.primary,
            }}
            onPress={() => setSelectedService(service)}
          >
            <View>
              <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                {service.name}
              </Text>
              <Text style={{ color: theme.textSecondary }}>{service.duration}</Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: theme.primary }}>
              {service.price}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Select Vehicle */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>
          Select Vehicle
        </Text>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            className="p-4 mb-2 rounded-xl flex-row justify-between items-center"
            style={{
              backgroundColor: selectedVehicle?.id === vehicle.id ? theme.primary + "20" : theme.surface,
              borderWidth: selectedVehicle?.id === vehicle.id ? 2 : 0,
              borderColor: theme.primary,
            }}
            onPress={() => setSelectedVehicle(vehicle)}
          >
            <View>
              <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                {vehicle.name}
              </Text>
              <Text style={{ color: theme.textSecondary }}>{vehicle.plate}</Text>
            </View>
            <Ionicons
              name={selectedVehicle?.id === vehicle.id ? "checkmark-circle" : "chevron-forward"}
              size={24}
              color={selectedVehicle?.id === vehicle.id ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>
        ))}

        {/* Select Date */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>
          Select Date
        </Text>
        <TouchableOpacity
          className="p-4 rounded-xl flex-row justify-between items-center"
          style={{ backgroundColor: theme.surface }}
          onPress={() => setDatePickerVisible(true)}
        >
          <Text style={{ color: selectedDate ? theme.text : theme.textSecondary }}>
            {selectedDate ? selectedDate.toDateString() : "No date selected"}
          </Text>
          <Text style={{ color: theme.primary }}>Select Date</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisible(false)}
          minimumDate={new Date()}
        />

        {/* Select Time */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>
          Select Time
        </Text>
        <View className="flex-row flex-wrap">
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot}
              className={`w-1/4 p-2 mb-2 rounded-lg items-center ${
                slot === "11:00 AM" ? "opacity-50" : ""
              }`}
              style={{
                backgroundColor: selectedTime === slot ? theme.primary : theme.surface,
              }}
              onPress={() => slot !== "11:00 AM" && setSelectedTime(slot)}
              disabled={slot === "11:00 AM"}
            >
              <Text
                style={{
                  color: selectedTime === slot ? "#FFFFFF" : theme.text,
                }}
              >
                {slot}
              </Text>
              {slot === "11:00 AM" && (
                <Text className="text-xs" style={{ color: theme.error }}>
                  Booked
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Time */}
        <TouchableOpacity className="mt-4 p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
          <Text style={{ color: theme.textSecondary }}>Or select custom time:</Text>
          <Text className="text-lg font-semibold mt-1" style={{ color: theme.primary }}>
            Tap to select time
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}