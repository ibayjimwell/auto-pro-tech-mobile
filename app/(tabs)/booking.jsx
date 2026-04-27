import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import io from "socket.io-client";
import { API_BASE_URL } from "../../services/api";
import appointmentsApi from "../../services/appointmentsApi";    // ✅ default import
import serviceTypesApi from "../../services/serviceTypesApi";  // ✅ default import
import vehiclesApi from "../../services/vehiclesApi";          // ✅ default import
import { notify } from "../../lib/notify";

export default function BookingScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const customerId = user?.id;

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [socket, setSocket] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ---------- Data fetching ----------
  const loadServices = async () => {
  try {
    const res = await serviceTypesApi.listActive();
    console.log('Services API full response:', JSON.stringify(res, null, 2));
    // Try different possible structures
    let data = res.data?.data || res.data || res;
    if (!Array.isArray(data)) data = [];
    setServices(data);
    console.log('Services loaded:', data);
  } catch (err) {
    console.error('Load services error:', err);
  }
};

const loadVehicles = async () => {
  if (!customerId) return;
  try {
    const res = await vehiclesApi.listByCustomer(customerId);
    console.log('Vehicles API full response:', JSON.stringify(res, null, 2));
    let vehicleArray = res.data?.data || res.data || res;
    if (!Array.isArray(vehicleArray)) vehicleArray = [];
    setVehicles(vehicleArray);
    console.log('Vehicles loaded:', vehicleArray);
  } catch (err) {
    console.error('Load vehicles error:', err);
  }
};

  const loadAppointments = async () => {
    if (!customerId) return;
    try {
      const res = await appointmentsApi.list({ customerId });
      setAppointments(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const res = await appointmentsApi.getAvailableSlots(dateStr, selectedService.id);
      console.log('Available slots response:', JSON.stringify(res, null, 2));
      // res is { success: true, data: [...] }
      const slots = res.data || [];
      setAvailableSlots(slots);
      console.log('Available slots set:', slots);
    } catch (err) {
      console.error('Load available slots error:', err);
      setAvailableSlots([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadServices();
      loadVehicles();
      loadAppointments();
    }, [customerId])
  );

  useEffect(() => {
    loadAvailableSlots();
  }, [selectedDate, selectedService]);

  // ---------- WebSocket realtime updates ----------
  useEffect(() => {
    const socketUrl = API_BASE_URL.replace("/api/v1", "");
    const newSocket = io(socketUrl, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("connect", () => console.log("Socket connected"));
    newSocket.on("appointmentChanged", (data) => {
      loadAppointments();
      if (data.type === "created" && data.appointment.customerId === customerId) {
        notify.success("New appointment booked!");
      } else if (data.type === "statusChanged" && data.appointment.customerId === customerId) {
        notify.info(`Appointment status changed to ${data.appointment.status}`);
      }
    });

    return () => newSocket.disconnect();
  }, [customerId]);

  // ---------- Calendar marked dates ----------
  const getMarkedDates = () => {
    const marked = {};
    const countMap = {};
    appointments.forEach((apt) => {
      if (apt.status !== "CANCELLED") {
        const date = apt.appointmentDate;
        countMap[date] = (countMap[date] || 0) + 1;
      }
    });
    Object.entries(countMap).forEach(([date, count]) => {
      let color = "#22c55e";
      if (count > 2) color = "#eab308";
      if (count > 5) color = "#ef4444";
      marked[date] = {
        selected: true,
        selectedColor: color,
        selectedTextColor: "#fff",
      };
    });
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      marked[dateStr] = {
        ...marked[dateStr],
        selected: true,
        selectedColor: theme.primary,
        selectedTextColor: "#fff",
      };
    }
    return marked;
  };

  const handleDateSelect = (day) => {
    setSelectedDate(new Date(day.dateString));
    setSelectedTime(null);
    setDatePickerVisible(false);
  };

  const handleBook = async () => {
    if (!selectedService || !selectedVehicle || !selectedDate || !selectedTime) {
      Alert.alert("Missing info", "Please select service, vehicle, date, and time.");
      return;
    }
    setSubmitting(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const payload = {
        customerId,
        vehicleId: selectedVehicle.id,
        serviceTypeId: selectedService.id,
        appointmentDate: dateStr,
        appointmentTime: selectedTime,
        notes: "",
      };
      await appointmentsApi.create(payload);
      notify.success("Appointment booked!");
      setSelectedService(null);
      setSelectedVehicle(null);
      setSelectedDate(null);
      setSelectedTime(null);
      await loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || "Booking failed";
      Alert.alert("Error", msg);
    }
    setSubmitting(false);
  };

  const handleCancelAppointment = (aptId) => {
    Alert.alert("Cancel Appointment", "Are you sure?", [
      { text: "No" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await appointmentsApi.cancel(aptId);
            notify.success("Appointment cancelled");
            loadAppointments();
          } catch (err) {
            notify.error("Could not cancel");
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
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-4">
        {appointments.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>
              My Appointments
            </Text>
            {appointments.map((apt) => (
              <View key={apt.id} className="p-3 mb-2 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <Text className="font-semibold" style={{ color: theme.text }}>{apt.serviceTypeId}</Text>
                <Text style={{ color: theme.textSecondary }}>{apt.appointmentDate} at {apt.appointmentTime?.slice(0,5)}</Text>
                <View className="flex-row justify-between mt-1">
                  <Text style={{ color: theme.primary }}>{apt.status}</Text>
                  {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                    <TouchableOpacity onPress={() => handleCancelAppointment(apt.id)}>
                      <Text style={{ color: theme.error }}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <Text className="text-2xl font-bold mb-4" style={{ color: theme.primary }}>Book New Appointment</Text>

        {/* Service selection */}
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>Select Service</Text>
        {services.map((service) => (
          <TouchableOpacity key={service.id} className="p-4 mb-2 rounded-xl flex-row justify-between items-center" style={{
              backgroundColor: selectedService?.id === service.id ? theme.primary + "20" : theme.surface,
              borderWidth: selectedService?.id === service.id ? 2 : 0,
              borderColor: theme.primary,
            }}
            onPress={() => setSelectedService(service)}
          >
            <View>
              <Text className="text-lg font-semibold" style={{ color: theme.text }}>{service.name}</Text>
              <Text style={{ color: theme.textSecondary }}>{service.durationMinutes} min</Text>
            </View>
            <Text className="text-lg font-bold" style={{ color: theme.primary }}>₱{service.basePrice}</Text>
          </TouchableOpacity>
        ))}

        {/* Vehicle selection */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>Select Vehicle</Text>
        {vehicles.length === 0 ? (
          <Text style={{ color: theme.textSecondary }}>No vehicles added. Please add one from Profile.</Text>
        ) : (
          vehicles.map((vehicle) => (
            <TouchableOpacity key={vehicle.id} className="p-4 mb-2 rounded-xl flex-row justify-between items-center" style={{
                backgroundColor: selectedVehicle?.id === vehicle.id ? theme.primary + "20" : theme.surface,
                borderWidth: selectedVehicle?.id === vehicle.id ? 2 : 0,
                borderColor: theme.primary,
              }}
              onPress={() => setSelectedVehicle(vehicle)}
            >
              <View>
                <Text className="text-lg font-semibold" style={{ color: theme.text }}>{vehicle.make} {vehicle.model}</Text>
                <Text style={{ color: theme.textSecondary }}>{vehicle.plateNumber}</Text>
              </View>
              <Ionicons name={selectedVehicle?.id === vehicle.id ? "checkmark-circle" : "ellipse-outline"} size={24} color={selectedVehicle?.id === vehicle.id ? theme.primary : theme.textSecondary} />
            </TouchableOpacity>
          ))
        )}

        {/* Date picker trigger */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>Select Date</Text>
        <TouchableOpacity className="p-4 rounded-xl flex-row justify-between items-center" style={{ backgroundColor: theme.surface }} onPress={() => setDatePickerVisible(true)}>
          <Text style={{ color: selectedDate ? theme.text : theme.textSecondary }}>
            {selectedDate ? selectedDate.toDateString() : "Tap to choose date"}
          </Text>
          <Text style={{ color: theme.primary }}>Select</Text>
        </TouchableOpacity>

        <Modal animationType="slide" transparent visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-3xl p-5" style={{ backgroundColor: theme.surface, minHeight: 480 }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-semibold" style={{ color: theme.text }}>Choose a Date</Text>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
              </View>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={getMarkedDates()}
                minDate={new Date().toISOString().split("T")[0]}
                theme={{
                  calendarBackground: theme.surface,
                  textSectionTitleColor: theme.textSecondary,
                  selectedDayBackgroundColor: theme.primary,
                  selectedDayTextColor: "#fff",
                  todayTextColor: theme.primary,
                  dayTextColor: theme.text,
                  textDisabledColor: theme.textSecondary,
                  monthTextColor: theme.text,
                  arrowColor: theme.primary,
                }}
                style={{ borderRadius: 12, marginBottom: 10 }}
              />
            </View>
          </View>
        </Modal>

        {/* Time slots */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>Select Time</Text>
        {!selectedDate || !selectedService ? (
          <Text style={{ color: theme.textSecondary }}>Please pick a date and service first</Text>
        ) : availableSlots.length === 0 ? (
          <Text style={{ color: theme.error }}>No available slots for this date</Text>
        ) : (
          <View className="flex-row flex-wrap">
            {availableSlots.map((slot) => (
              <TouchableOpacity key={slot.time} className={`w-1/4 p-2 mb-2 rounded-lg items-center ${!slot.available ? "opacity-50" : ""}`} style={{ backgroundColor: selectedTime === slot.time ? theme.primary : theme.surface }} onPress={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available}>
                <Text style={{ color: selectedTime === slot.time ? "#FFF" : theme.text }}>{slot.time.slice(0,5)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity className="mt-6 py-4 rounded-xl bg-primary" onPress={handleBook} disabled={submitting || !selectedService || !selectedVehicle || !selectedDate || !selectedTime}>
          {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-semibold text-lg">Book Appointment</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}