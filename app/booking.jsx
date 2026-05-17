import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, Modal as NativeModal } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNModal from "react-native-modal";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import io from "socket.io-client";
import { API_BASE_URL } from "../services/api";
import appointmentsApi from "../services/appointmentsApi";
import serviceTypesApi from "../services/serviceTypesApi";
import vehiclesApi from "../services/vehiclesApi";
import { notify } from "../lib/notify";

const formatTime12h = (time24) => {
  if (!time24) return "";
  const [hour, minute] = time24.split(":");
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

const dateToTimeString = (date) => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
};

export default function BookingScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { serviceId } = useLocalSearchParams();
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
  const [notes, setNotes] = useState("");

  // --- Data Fetching with cache busting ---
  const loadServices = async () => {
    try {
      const res = await serviceTypesApi.listActive();
      let data = res.data?.data || res.data || res;
      const serviceList = Array.isArray(data) ? data : [];
      setServices(serviceList);
      // Auto-select service if serviceId param is provided
      if (serviceId && serviceList.length > 0) {
        const matched = serviceList.find(s => String(s.id) === String(serviceId));
        if (matched) setSelectedService(matched);
      }
    } catch (err) { console.error(err); }
  };

  const loadVehicles = async () => {
    if (!customerId) return;
    try {
      const res = await vehiclesApi.listByCustomer(customerId);
      let vehicleArray = res.data?.data || res.data || res;
      setVehicles(Array.isArray(vehicleArray) ? vehicleArray : []);
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
      // Add timestamp to prevent caching
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

  // Reload slots when date or service changes AND reset times
  useEffect(() => {
    loadAvailableSlots();
    // Clear any previously selected times to avoid confusion
    setSelectedTime(null);
    setCustomTime(null);
  }, [selectedDate, selectedService]);

  // --- WebSocket ---
  useEffect(() => {
    const socketUrl = API_BASE_URL.replace("/api/v1", "");
    const newSocket = io(socketUrl, { transports: ["websocket"] });
    setSocket(newSocket);
    newSocket.on("appointmentChanged", (data) => {
      loadAppointments();
      if (data.type === "created" && data.appointment.customerId === customerId) {
        notify.success("New appointment booked!");
        // Refresh available slots for the current date
        loadAvailableSlots();
      }
    });
    return () => newSocket.disconnect();
  }, [customerId]);

  const getMarkedDates = () => {
    const marked = {};
    appointments.forEach((apt) => {
      if (apt.status !== "CANCELLED") {
        marked[apt.appointmentDate] = { marked: true, dotColor: theme.primary };
      }
    });
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      marked[dateStr] = { ...marked[dateStr], selected: true, selectedColor: theme.primary };
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
      setAvailabilityModal({ visible: true, available: false, message: "Please select a date and service first." });
      return;
    }
    const dateStr = selectedDate.toISOString().split("T")[0];
    try {
      const res = await appointmentsApi.checkAvailability(dateStr, timeStr, selectedService.id);
      if (res.data?.available) {
        setCustomTime(timeStr);
        setSelectedTime(null);
        setAvailabilityModal({ visible: true, available: true, message: "This time is available!" });
      } else {
        setAvailabilityModal({ visible: true, available: false, message: "Slot unavailable." });
      }
    } catch (err) {
      setAvailabilityModal({ visible: true, available: false, message: "Error checking availability." });
    }
  };

  const handleBook = async () => {
    const finalTime = customTime || selectedTime;
    if (!selectedService || !selectedVehicle || !selectedDate || !finalTime) return;
    setSubmitting(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      await appointmentsApi.create({
        customerId,
        vehicleId: selectedVehicle.id,
        serviceTypeId: selectedService.id,
        appointmentDate: dateStr,
        appointmentTime: finalTime,
        notes: notes,
      });
      notify.success("Appointment booked!");
      setSelectedService(null);
      setSelectedVehicle(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setCustomTime(null);
      await loadAppointments();
    } catch (err) {
      setAvailabilityModal({ visible: true, available: false, message: err.response?.data?.message || "Booking failed" });
    }
    setSubmitting(false);
  };

  const handleCancelAppointment = (aptId) => {
    Alert.alert("Cancel Appointment", "Are you sure?", [
      { text: "No" },
      { text: "Yes", style: 'destructive', onPress: async () => {
          try {
            await appointmentsApi.cancel(aptId);
            notify.success("Cancelled");
            loadAppointments();
          } catch (err) { notify.error("Failed to cancel"); }
        }},
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
    <ScrollView 
      className="flex-1" 
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-12 pb-10">
        
        {/* Header */}
        <View className="mb-8">
          <Text className="text-sm font-bold uppercase tracking-[2px] opacity-50" style={{ color: theme.text }}>
            Service Center
          </Text>
          <Text className="text-3xl font-black" style={{ color: theme.text }}>
            Book <Text style={{ color: theme.primary }}>Appointment</Text>
          </Text>
        </View>

        {/* Active Bookings */}
        {appointments.filter(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED').length > 0 && (
          <View className="mb-10">
            <Text className="text-xs font-black uppercase tracking-widest mb-4 opacity-40" style={{ color: theme.text }}>
              Your Active Schedule
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {appointments.filter(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED').map((apt) => (
                <View 
                  key={apt.id} 
                  className="p-5 mr-4 rounded-[32px] border w-[260px]" 
                  style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: theme.primary + '15' }}>
                      <MaterialCommunityIcons name="calendar-check" size={20} color={theme.primary} />
                    </View>
                    <TouchableOpacity onPress={() => handleCancelAppointment(apt.id)}>
                      <Ionicons name="close-circle-outline" size={22} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                  <Text className="font-black text-base" style={{ color: theme.text }}>Service #{apt.id.toString().slice(-4)}</Text>
                  <Text className="text-xs font-bold opacity-50 mb-4" style={{ color: theme.text }}>
                    {apt.appointmentDate} • {formatTime12h(apt.appointmentTime)}
                  </Text>
                  <View className="px-3 py-1.5 rounded-full self-start" style={{ backgroundColor: theme.primary }}>
                    <Text className="text-[10px] font-black uppercase text-white">{apt.status}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Service Selection */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.primary }}>
              <Text className="text-white font-black text-xs">1</Text>
            </View>
            <Text className="text-lg font-black" style={{ color: theme.text }}>Select Service</Text>
          </View>
          <View className="space-y-3">
            {services.map((service) => (
              <TouchableOpacity 
                key={service.id} 
                activeOpacity={0.8}
                className="p-5 rounded-[28px] border-2 flex-row justify-between items-center" 
                style={{
                  backgroundColor: selectedService?.id === service.id ? theme.primary + "10" : theme.surface,
                  borderColor: selectedService?.id === service.id ? theme.primary : theme.border,
                }} 
                onPress={() => setSelectedService(service)}
              >
                <View className="flex-1">
                  <Text className="text-base font-black" style={{ color: theme.text }}>{service.name}</Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                    <Text className="text-xs ml-1 font-bold" style={{ color: theme.textSecondary }}>{service.durationMinutes} min</Text>
                  </View>
                </View>
                <Text className="text-lg font-black" style={{ color: theme.primary }}>₱{service.basePrice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicle Selection */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.primary }}>
              <Text className="text-white font-black text-xs">2</Text>
            </View>
            <Text className="text-lg font-black" style={{ color: theme.text }}>Select Vehicle</Text>
          </View>
          {vehicles.length === 0 ? (
            <View className="p-6 rounded-[28px] border border-dashed items-center" style={{ borderColor: theme.border }}>
              <Text className="text-sm font-bold opacity-50" style={{ color: theme.text }}>No vehicles in your garage</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {vehicles.map((vehicle) => (
                <TouchableOpacity 
                  key={vehicle.id} 
                  activeOpacity={0.8}
                  className="p-5 rounded-[28px] border-2 flex-row items-center" 
                  style={{
                    backgroundColor: selectedVehicle?.id === vehicle.id ? theme.primary + "10" : theme.surface,
                    borderColor: selectedVehicle?.id === vehicle.id ? theme.primary : theme.border,
                  }} 
                  onPress={() => setSelectedVehicle(vehicle)}
                >
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4 shadow-sm" style={{ backgroundColor: theme.background }}>
                    <MaterialCommunityIcons name="car-side" size={24} color={selectedVehicle?.id === vehicle.id ? theme.primary : theme.textSecondary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-black" style={{ color: theme.text }}>{vehicle.make} {vehicle.model}</Text>
                    <Text className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>{vehicle.plateNumber}</Text>
                  </View>
                  <Ionicons 
                    name={selectedVehicle?.id === vehicle.id ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={selectedVehicle?.id === vehicle.id ? theme.primary : theme.border} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Additional Notes / Describe the issue */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.primary }}>
              <Text className="text-white font-black text-xs">4</Text>
            </View>
            <Text className="text-lg font-black" style={{ color: theme.text }}>Describe the issue (optional)</Text>
          </View>
          <TextInput
            className="p-5 rounded-[28px] border"
            style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }}
            placeholder="e.g., Engine noise, AC not cooling, etc."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
          <Text className="text-xs mt-2 opacity-50" style={{ color: theme.textSecondary }}>
            Tell us more about your vehicle's condition or special requests.
          </Text>
        </View>

        {/* Schedule */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.primary }}>
              <Text className="text-white font-black text-xs">3</Text>
            </View>
            <Text className="text-lg font-black" style={{ color: theme.text }}>Choose Schedule</Text>
          </View>

          <TouchableOpacity 
            className="p-5 rounded-[28px] flex-row justify-between items-center mb-4 border" 
            style={{ backgroundColor: theme.surface, borderColor: theme.border }} 
            onPress={() => setDatePickerVisible(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color={theme.primary} />
              <Text className="ml-3 font-bold" style={{ color: selectedDate ? theme.text : theme.textSecondary }}>
                {selectedDate ? selectedDate.toDateString() : "Choose Date"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <View>
            {!selectedDate || !selectedService ? (
              <View className="p-8 items-center bg-gray-50 rounded-[28px] dark:bg-black/20">
                <Text className="text-xs font-black uppercase tracking-widest opacity-30 text-center">Complete steps 1 & 2 to view slots</Text>
              </View>
            ) : (
              <>
                <View className="flex-row flex-wrap justify-between">
                  {availableSlots.length === 0 ? (
                    <Text className="text-center w-full py-4 font-bold" style={{ color: theme.error }}>No slots available today</Text>
                  ) : (
                    availableSlots.map((slot) => (
                      <TouchableOpacity
                        key={slot.time}
                        activeOpacity={0.7}
                        className="w-[23%] py-4 mb-3 rounded-2xl items-center"
                        style={{ 
                          backgroundColor: (selectedTime === slot.time && !customTime) ? theme.primary : theme.surface,
                          opacity: !slot.available ? 0.3 : 1,
                          borderWidth: 1,
                          borderColor: theme.border
                        }}
                        onPress={() => { if (slot.available) { setSelectedTime(slot.time); setCustomTime(null); } }}
                        disabled={!slot.available}
                      >
                        <Text className="text-[10px] font-black" style={{ color: (selectedTime === slot.time && !customTime) ? "#FFF" : theme.text }}>
                          {formatTime12h(slot.time)}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center p-4 rounded-2xl border-2 border-dashed mt-2"
                  style={{ backgroundColor: customTime ? theme.primary + '10' : 'transparent', borderColor: theme.primary + '40' }}
                  onPress={() => setShowCustomTimePicker(true)}
                >
                  <Ionicons name="time" size={18} color={theme.primary} />
                  <Text className="ml-2 font-black text-xs uppercase tracking-widest" style={{ color: theme.primary }}>
                    {customTime ? `Custom: ${formatTime12h(customTime)}` : "Pick Custom Time"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          className="mt-6 py-5 rounded-[30px] shadow-xl shadow-primary/40"
          style={{ 
            backgroundColor: theme.primary, 
            opacity: submitting || !selectedService || !selectedVehicle || !selectedDate || (!selectedTime && !customTime) ? 0.6 : 1 
          }}
          onPress={handleBook}
          disabled={submitting || !selectedService || !selectedVehicle || !selectedDate || (!selectedTime && !customTime)}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-black uppercase tracking-[2px]">Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <NativeModal animationType="slide" transparent visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-[40px] p-8 pb-12" style={{ backgroundColor: theme.surface }}>
            <View className="w-12 h-1.5 rounded-full self-center mb-6 opacity-10" style={{ backgroundColor: theme.text }} />
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black" style={{ color: theme.text }}>Select Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar 
              onDayPress={handleDateSelect} 
              markedDates={getMarkedDates()} 
              minDate={new Date().toISOString().split("T")[0]} 
              theme={{
                calendarBackground: 'transparent',
                textSectionTitleColor: theme.textSecondary,
                selectedDayBackgroundColor: theme.primary,
                selectedDayTextColor: "#fff",
                todayTextColor: theme.primary,
                dayTextColor: theme.text,
                textDisabledColor: theme.textSecondary + '40',
                monthTextColor: theme.text,
                arrowColor: theme.primary,
                textDayFontWeight: '700',
                textMonthFontWeight: '900',
              }} 
            />
          </View>
        </View>
      </NativeModal>

      {showCustomTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleCustomTimeChange}
        />
      )}

      <RNModal
        isVisible={availabilityModal.visible}
        onBackdropPress={() => setAvailabilityModal({ ...availabilityModal, visible: false })}
        backdropOpacity={0.6}
        animationIn="zoomIn"
        animationOut="zoomOut"
      >
        <View className="rounded-[40px] p-8 items-center" style={{ backgroundColor: theme.surface }}>
          <View 
            className="w-16 h-16 rounded-full items-center justify-center mb-4" 
            style={{ backgroundColor: (availabilityModal.available ? theme.success : theme.error) + '20' }}
          >
            <Ionicons 
              name={availabilityModal.available ? "checkmark-done-circle" : "alert-circle"} 
              size={40} 
              color={availabilityModal.available ? theme.success : theme.error} 
            />
          </View>
          <Text className="text-lg font-black mb-2" style={{ color: theme.text }}>
            {availabilityModal.available ? "Spot Available!" : "Wait a moment"}
          </Text>
          <Text className="text-center font-medium opacity-60 mb-8" style={{ color: theme.textSecondary }}>
            {availabilityModal.message}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full py-4 rounded-2xl"
            style={{ backgroundColor: theme.primary }}
            onPress={() => setAvailabilityModal({ ...availabilityModal, visible: false })}
          >
            <Text className="text-white text-center font-black uppercase">Continue</Text>
          </TouchableOpacity>
        </View>
      </RNModal>
    </ScrollView>
  );
}