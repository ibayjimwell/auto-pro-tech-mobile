import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, Modal as NativeModal } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNModal from "react-native-modal";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import io from "socket.io-client";
import { API_BASE_URL } from "../../services/api";
import appointmentsApi from "../../services/appointmentsApi";
import serviceTypesApi from "../../services/serviceTypesApi";
import vehiclesApi from "../../services/vehiclesApi";
import { notify } from "../../lib/notify";

// Helper: convert "HH:MM:SS" to "h:mm AM/PM"
const formatTime12h = (time24) => {
  if (!time24) return "";
  const [hour, minute] = time24.split(":");
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

// Helper: convert Date object to "HH:MM:SS"
const dateToTimeString = (date) => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
};

export default function BookingScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const customerId = user?.id;

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [socket, setSocket] = useState(null);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customTime, setCustomTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityModal, setAvailabilityModal] = useState({ visible: false, available: false, message: "" });

  const loadServices = async () => {
    try {
      const res = await serviceTypesApi.listActive();
      let data = res.data?.data || res.data || res;
      if (!Array.isArray(data)) data = [];
      setServices(data);
    } catch (err) { console.error(err); }
  };

  const loadVehicles = async () => {
    if (!customerId) return;
    try {
      const res = await vehiclesApi.listByCustomer(customerId);
      let vehicleArray = res.data?.data || res.data || res;
      if (!Array.isArray(vehicleArray)) vehicleArray = [];
      setVehicles(vehicleArray);
    } catch (err) { console.error(err); }
  };

  const loadAppointments = async () => {
    if (!customerId) return;
    try {
      const res = await appointmentsApi.list({ customerId });
      setAppointments(res.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const res = await appointmentsApi.getAvailableSlots(dateStr, selectedService.id);
      setAvailableSlots(res.data || []);
    } catch (err) {
      console.error(err);
      setAvailableSlots([]);
    }
  };

  useFocusEffect(useCallback(() => {
    loadServices();
    loadVehicles();
    loadAppointments();
  }, [customerId]));

  useEffect(() => {
    loadAvailableSlots();
  }, [selectedDate, selectedService]);

  // WebSocket
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

  const getMarkedDates = () => {
    const marked = {};
    const countMap = {};
    appointments.forEach((apt) => {
      if (apt.status !== "CANCELLED") {
        countMap[apt.appointmentDate] = (countMap[apt.appointmentDate] || 0) + 1;
      }
    });
    Object.entries(countMap).forEach(([date, count]) => {
      let color = "#22c55e";
      if (count > 2) color = "#eab308";
      if (count > 5) color = "#ef4444";
      marked[date] = { selected: true, selectedColor: color, selectedTextColor: "#fff" };
    });
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      marked[dateStr] = { ...marked[dateStr], selected: true, selectedColor: theme.primary, selectedTextColor: "#fff" };
    }
    return marked;
  };

  const handleDateSelect = (day) => {
    setSelectedDate(new Date(day.dateString));
    setSelectedTime(null);
    setCustomTime(null);
    setDatePickerVisible(false);
  };

  const handleCustomTimeChange = (event, selectedDateObj) => {
    setShowCustomTimePicker(Platform.OS === 'ios');
    if (selectedDateObj) {
      const timeStr = dateToTimeString(selectedDateObj);
      checkAndSetCustomTime(timeStr);
    } else {
      setShowCustomTimePicker(false);
    }
  };

  const checkAndSetCustomTime = async (timeStr) => {
    if (!selectedDate || !selectedService) {
      setAvailabilityModal({
        visible: true,
        available: false,
        message: "Please select a date and service first."
      });
      return;
    }
    const dateStr = selectedDate.toISOString().split("T")[0];
    try {
      const res = await appointmentsApi.checkAvailability(dateStr, timeStr, selectedService.id);
      if (res.data?.available) {
        setCustomTime(timeStr);
        setSelectedTime(null);
        setAvailabilityModal({
          visible: true,
          available: true,
          message: "This time is available. Click 'Book Appointment' to confirm."
        });
      } else {
        setAvailabilityModal({
          visible: true,
          available: false,
          message: "This time slot is already booked or outside shop hours. Please pick another time."
        });
      }
    } catch (err) {
      setAvailabilityModal({
        visible: true,
        available: false,
        message: "Could not check availability. Please try again."
      });
      console.error(err);
    }
  };

  const handleBook = async () => {
    const finalTime = customTime || selectedTime;
    if (!selectedService || !selectedVehicle || !selectedDate || !finalTime) {
      setAvailabilityModal({
        visible: true,
        available: false,
        message: "Please select service, vehicle, date, and time."
      });
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
        appointmentTime: finalTime,
        notes: "",
      };
      await appointmentsApi.create(payload);
      notify.success("Appointment booked!");
      setSelectedService(null);
      setSelectedVehicle(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setCustomTime(null);
      await loadAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || "Booking failed";
      setAvailabilityModal({ visible: true, available: false, message: msg });
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
        {/* My Appointments list */}
        {appointments.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>My Appointments</Text>
            {appointments.map((apt) => (
              <View key={apt.id} className="p-3 mb-2 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <Text className="font-semibold" style={{ color: theme.text }}>{apt.serviceTypeId}</Text>
                <Text style={{ color: theme.textSecondary }}>{apt.appointmentDate} at {formatTime12h(apt.appointmentTime)}</Text>
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
            }} onPress={() => setSelectedService(service)}>
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
              }} onPress={() => setSelectedVehicle(vehicle)}>
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

        <NativeModal animationType="slide" transparent visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-3xl p-5" style={{ backgroundColor: theme.surface, minHeight: 480 }}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-semibold" style={{ color: theme.text }}>Choose a Date</Text>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
              </View>
              <Calendar onDayPress={handleDateSelect} markedDates={getMarkedDates()} minDate={new Date().toISOString().split("T")[0]} theme={{
                  calendarBackground: theme.surface, textSectionTitleColor: theme.textSecondary,
                  selectedDayBackgroundColor: theme.primary, selectedDayTextColor: "#fff",
                  todayTextColor: theme.primary, dayTextColor: theme.text,
                  textDisabledColor: theme.textSecondary, monthTextColor: theme.text,
                  arrowColor: theme.primary,
                }} style={{ borderRadius: 12, marginBottom: 10 }} />
            </View>
          </View>
        </NativeModal>

        {/* Time slots */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>Select Time</Text>
        {!selectedDate || !selectedService ? (
          <Text style={{ color: theme.textSecondary }}>Please pick a date and service first</Text>
        ) : availableSlots.length === 0 ? (
          <Text style={{ color: theme.error }}>No available slots for this date</Text>
        ) : (
          <View className="flex-row flex-wrap">
            {availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                className={`w-1/4 p-2 mb-2 rounded-lg items-center ${!slot.available ? "opacity-50" : ""}`}
                style={{ backgroundColor: (selectedTime === slot.time && !customTime) ? theme.primary : theme.surface }}
                onPress={() => {
                  if (slot.available) {
                    setSelectedTime(slot.time);
                    setCustomTime(null);
                  }
                }}
                disabled={!slot.available}
              >
                <Text style={{ color: (selectedTime === slot.time && !customTime) ? "#FFF" : theme.text }}>
                  {formatTime12h(slot.time)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Custom time picker */}
        <View className="mt-4">
          <TouchableOpacity
            className="flex-row items-center justify-center p-3 rounded-xl border border-primary/30"
            style={{ backgroundColor: theme.surface }}
            onPress={() => setShowCustomTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text className="ml-2 font-semibold" style={{ color: theme.primary }}>
              {customTime ? `Custom: ${formatTime12h(customTime)}` : "Pick Custom Time"}
            </Text>
          </TouchableOpacity>
        </View>

        {showCustomTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleCustomTimeChange}
          />
        )}

        <TouchableOpacity
          className="mt-6 py-4 rounded-xl bg-primary"
          onPress={handleBook}
          disabled={submitting || !selectedService || !selectedVehicle || !selectedDate || (!selectedTime && !customTime)}
        >
          {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white text-center font-semibold text-lg">Book Appointment</Text>}
        </TouchableOpacity>
      </View>

      <RNModal
        isVisible={availabilityModal.visible}
        onBackdropPress={() => setAvailabilityModal({ ...availabilityModal, visible: false })}
        backdropOpacity={0.6}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View className="bg-white rounded-2xl p-6" style={{ backgroundColor: theme.surface }}>
          <Text className="text-xl font-bold mb-2" style={{ color: availabilityModal.available ? theme.success : theme.error }}>
            {availabilityModal.available ? "Available" : "Not Available"}
          </Text>
          <Text className="text-base mb-6" style={{ color: theme.textSecondary }}>
            {availabilityModal.message}
          </Text>
          <TouchableOpacity
            className="py-3 rounded-lg"
            style={{ backgroundColor: theme.primary }}
            onPress={() => setAvailabilityModal({ ...availabilityModal, visible: false })}
          >
            <Text className="text-white text-center font-semibold">OK</Text>
          </TouchableOpacity>
        </View>
      </RNModal>
    </ScrollView>
  );
}