import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import appointmentsApi from "../../services/appointmentsApi";
import io from "socket.io-client";
import { API_BASE_URL } from "../../services/api";

const statusToStage = {
  PENDING: 0,
  CONFIRMED: 1,
  UNDER_INSPECTION: 2,
  WAITING_FOR_APPROVAL: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
  APPROVED: 1,
  CANCELLED: -1,
};

const stages = [
  { name: "Pending", description: "Your appointment request has been received. Waiting for shop confirmation." },
  { name: "Confirmed", description: "Appointment confirmed. We are preparing for your arrival." },
  { name: "Under Inspection", description: "The mechanics are inspecting your vehicle. See the current status below." },
  { name: "Waiting Approval", description: "Estimate cost is generated. Waiting for your approval check the receipt below." },
  { name: "In Progress", description: "Work has begun on your vehicle. See the current status below." },
  { name: "Completed", description: "All services finished. Vehicle is ready." },
];

export default function TrackingScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { appointmentId } = useLocalSearchParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const isMounted = useRef(true);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId || !user?.id) return;
    try {
      // Use list endpoint to get full joined data
      const res = await appointmentsApi.list({ customerId: user.id, _t: Date.now() });
      const found = res.data?.find(apt => apt.id === appointmentId);
      if (found && isMounted.current) {
        setAppointment(found);
      } else {
        // Fallback to single endpoint
        const singleRes = await appointmentsApi.get(appointmentId);
        if (singleRes.data && isMounted.current) setAppointment(singleRes.data);
      }
    } catch (error) {
      console.error("Failed to load appointment:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [appointmentId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      isMounted.current = true;
      fetchAppointment();
      return () => { isMounted.current = false; };
    }, [fetchAppointment])
  );

  // WebSocket with robust reconnection
  useEffect(() => {
    const socketUrl = API_BASE_URL.replace("/api/v1", "");
    console.log("Connecting WebSocket to:", socketUrl);
    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connected (tracking)"));
    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      Alert.alert("Connection Warning", "Real-time updates may not work.");
    });
    socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

    socket.on("appointmentChanged", (data) => {
      console.log("Received appointmentChanged event:", JSON.stringify(data));
      // Check if the event is for the current appointment
      if (data.appointment?.id === appointmentId) {
        console.log("Reloading appointment due to event");
        fetchAppointment();
      } else if (data.appointmentId === appointmentId) {
        console.log("Reloading appointment due to event (by ID)");
        fetchAppointment();
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [appointmentId, fetchAppointment]);

  const formatTime12h = (time24) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(":");
    let h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <Text style={{ color: theme.textSecondary }}>Appointment not found</Text>
      </View>
    );
  }

  const currentStage = statusToStage[appointment.status] ?? 0;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-sm" style={{ color: theme.textSecondary }}>APPOINTMENT ID</Text>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            {appointment.id.slice(0, 8).toUpperCase()}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: currentStage >= 0 ? theme.primary : theme.error }} />
            <Text className="text-base font-semibold" style={{ color: currentStage >= 0 ? theme.primary : theme.error }}>
              {appointment.status || "PENDING"}
            </Text>
          </View>
        </View>

        {/* Service & Vehicle Info */}
        <View className="p-4 rounded-xl mb-6" style={{ backgroundColor: theme.surface }}>
          <Text className="text-lg font-bold" style={{ color: theme.text }}>
            {appointment.serviceType?.name || "Service"}
          </Text>
          <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
            {appointment.vehicle?.make} {appointment.vehicle?.model} • {appointment.vehicle?.plateNumber}
            {appointment.vehicle?.year && ` (${appointment.vehicle.year})`}
          </Text>
          <View className="flex-row mt-2">
            <Text style={{ color: theme.textSecondary }}>Date: {formatDate(appointment.appointmentDate)}</Text>
            <Text style={{ color: theme.textSecondary, marginLeft: 16 }}>Time: {formatTime12h(appointment.appointmentTime)}</Text>
          </View>
          <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
            Customer: {appointment.customer?.fullName || "Customer"}
          </Text>
        </View>

        {/* Progress Timeline */}
        <Text className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Service Progress</Text>
        {stages.map((stage, index) => {
          const isActive = index <= currentStage;
          const isCurrent = index === currentStage;
          return (
            <View key={index} className="flex-row">
              <View className="items-center mr-3">
                <View className="w-8 h-8 rounded-full justify-center items-center" style={{ backgroundColor: isActive ? theme.primary : theme.border }}>
                  {index <= currentStage ? (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: isActive ? "#FFFFFF" : theme.textSecondary }}>{index + 1}</Text>
                  )}
                </View>
                {index < stages.length - 1 && (
                  <View className="w-0.5 h-12" style={{ backgroundColor: index <= currentStage ? theme.primary : theme.border }} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: theme.text }}>{stage.name}</Text>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>{stage.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}