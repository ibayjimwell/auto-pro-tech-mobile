import { View, Text, ScrollView, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, TextInput, Modal } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import appointmentsApi from "../services/appointmentsApi";
import tasksApi from "../services/tasksApi";
import estimateApi from "../services/estimateApi";
import additionalCostsApi from "../services/additionalCostsApi";
import invoicesApi from "../services/invoicesApi";
import io from "socket.io-client";
import { API_BASE_URL } from "../services/api";

// --- Configuration & Constants --- [cite: 199-205]
const statusToStage = {
  PENDING: 0,
  CONFIRMED: 1,
  UNDER_INSPECTION: 2,
  WAITING_FOR_APPROVAL: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

const stages = [
  { name: "Pending", description: "Your appointment request has been received.", icon: "clock-outline" },
  { name: "Confirmed", description: "Appointment confirmed. We are preparing for your arrival.", icon: "calendar-check" },
  { name: "Under Inspection", description: "The mechanics are inspecting your vehicle.", icon: "magnify-scan" },
  { name: "Waiting Approval", description: "Estimate cost generated. Waiting for your approval.", icon: "file-document-edit-outline" },
  { name: "In Progress", description: "Work has begun on your vehicle.", icon: "wrench-clock" },
  { name: "Completed", description: "All services finished. Vehicle is ready.", icon: "check-decagram" },
];

// --- Helper Functions --- [cite: 206-210]
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

export default function TrackingScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { appointmentId } = useLocalSearchParams();

  // --- State Management --- [cite: 212-217]
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [adjustments, setAdjustments] = useState({ laborItems: [], discounts: [] });
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [originalEstimateTotal, setOriginalEstimateTotal] = useState(0);
  const [approveLoading, setApproveLoading] = useState(null);
  const [declineLoading, setDeclineLoading] = useState(null);
  const [excludedFindingIds, setExcludedFindingIds] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const socketRef = useRef(null);
  const isMounted = useRef(true);

  // ---------- Fetch functions (Logic Unchanged) ---------- [cite: 218-228]
  const fetchAppointment = useCallback(async () => {
    if (!appointmentId || !user?.id) return null;
    try {
      const res = await appointmentsApi.list({ customerId: user.id });
      const found = res.data?.find(apt => apt.id === appointmentId);
      if (found && isMounted.current) {
        setAppointment(found);
        return found;
      } else {
        const singleRes = await appointmentsApi.get(appointmentId);
        const apt = singleRes.data || singleRes;
        if (apt && isMounted.current) {
          setAppointment(Array.isArray(apt) ? apt[0] : apt);
        }
        return apt;
      }
    } catch (error) {
      console.error("Failed to load appointment:", error);
      return null;
    }
  }, [appointmentId, user?.id]);

  const fetchTasks = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await tasksApi.getByAppointment(appointmentId);
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  }, [appointmentId]);

  const fetchAdjustments = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await estimateApi.getAdjustments(appointmentId);
      const adjustmentsArray = res.data || [];
      const labors = adjustmentsArray.filter(a => a.type === 'labor');
      const discounts = adjustmentsArray.filter(a => a.type === 'discount');
      setAdjustments({
        laborItems: labors.map(l => ({ amount: parseFloat(l.amount) })),
        discounts: discounts.map(d => ({ type: d.discountType, value: parseFloat(d.discountValue) })),
      });
    } catch (err) {
      console.error("Failed to load adjustments:", err);
    }
  }, [appointmentId]);

  const fetchAdditionalCosts = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await additionalCostsApi.getByAppointment(appointmentId);
      setAdditionalCosts(res.data || []);
    } catch (err) {
      console.error("Failed to load additional costs:", err);
    }
  }, [appointmentId]);

  const fetchOriginalEstimate = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const res = await invoicesApi.getByAppointment(appointmentId);
      const invoices = res.data || [];
      const approvedEstimate = invoices.find(
        inv => inv.invoiceType === "ESTIMATE" && inv.status === "APPROVED"
      );
      if (approvedEstimate) {
        setOriginalEstimateTotal(parseFloat(approvedEstimate.totalAmount));
      }
    } catch (err) {
      console.error("Failed to load original estimate:", err);
    }
  }, [appointmentId]);

  const refreshAllData = useCallback(async () => {
    const updatedAppointment = await fetchAppointment();
    if (updatedAppointment && isMounted.current) {
      if (updatedAppointment.status === "UNDER_INSPECTION") {
        await Promise.all([fetchTasks(), fetchAdjustments()]);
      } else if (updatedAppointment.status === "WAITING_FOR_APPROVAL") {
        await Promise.all([fetchTasks(), fetchAdjustments()]);
      } else if (updatedAppointment.status === "IN_PROGRESS") {
        await Promise.all([fetchTasks(), fetchAdditionalCosts(), fetchOriginalEstimate()]);
      } else if (updatedAppointment.status === "COMPLETED") {
        await Promise.all([fetchTasks(), fetchOriginalEstimate()]);
      }
    }
    if (isMounted.current) setLoading(false);
  }, [fetchAppointment, fetchTasks, fetchAdjustments, fetchAdditionalCosts, fetchOriginalEstimate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  }, [refreshAllData]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // ---------- WebSocket real‑time ---------- [cite: 230-237]
  useEffect(() => {
    const socketUrl = API_BASE_URL.replace("/api/v1", "");
    const socket = io(socketUrl, { transports: ["websocket"], reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on("taskChanged", (data) => {
      if (data.appointmentId === appointmentId) {
        fetchTasks();
        fetchAdjustments();
      }
    });
    socket.on("findingAdded", () => fetchTasks());
    socket.on("findingDeleted", () => fetchTasks());
    socket.on("productAdded", () => fetchTasks());
    socket.on("productDeleted", () => fetchTasks());
    socket.on("estimateUpdated", (data) => {
      if (data.appointmentId === appointmentId) fetchAdjustments();
    });
    socket.on("additionalCostAdded", (data) => {
      if (data.appointmentId === appointmentId) fetchAdditionalCosts();
    });
    socket.on("additionalCostRemoved", (data) => {
      if (data.appointmentId === appointmentId) fetchAdditionalCosts();
    });
    socket.on("additionalCostApproved", (data) => {
      if (data.appointmentId === appointmentId) fetchAdditionalCosts();
    });
    socket.on("additionalCostDeclined", (data) => {
      if (data.appointmentId === appointmentId) fetchAdditionalCosts();
    });
    socket.on("appointmentChanged", (data) => {
      if (data.appointment?.id === appointmentId && data.type === "statusChanged") {
        refreshAllData();
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [appointmentId, fetchTasks, fetchAdjustments, fetchAdditionalCosts, refreshAllData]);

  // ---------- Compute costs ---------- [cite: 238-248]
  const computeInitialCosting = () => {
    if (!appointment) return { servicePrice: 0, partsItems: [], laborTotal: 0, discountTotal: 0, grandTotal: 0 };
    const servicePrice = parseFloat(appointment.serviceType?.basePrice) || 0;
    let partsItems = [];
    let partsTotal = 0;
    const excludedSet = new Set(excludedFindingIds);
    tasks.forEach((task) => {
      if (task.status === "DONE" && task.findings) {
        task.findings.forEach((finding) => {
          if (excludedSet.has(finding.id)) return;
          if (finding.products && finding.products.length) {
            finding.products.forEach((prod) => {
              const qty = prod.quantity || 1;
              const unitPrice = parseFloat(prod.priceAtTime) || 0;
              const subtotal = qty * unitPrice;
              partsTotal += subtotal;
              partsItems.push({ name: prod.name, quantity: qty, unitPrice, subtotal });
            });
          }
        });
      }
    });
    const laborTotal = adjustments.laborItems.reduce((sum, l) => sum + l.amount, 0);
    const preDiscount = servicePrice + partsTotal + laborTotal;
    let discountTotal = 0;
    adjustments.discounts.forEach(d => {
      if (d.type === "percentage") discountTotal += preDiscount * (d.value / 100);
      else discountTotal += d.value;
    });
    const grandTotal = preDiscount - discountTotal;
    return { servicePrice, partsItems, laborTotal, discountTotal, grandTotal };
  };

  const computeAdditionalTotal = () => {
    let total = 0;
    additionalCosts.forEach(cost => {
      if (cost.type === 'discount') total -= parseFloat(cost.amount);
      else total += parseFloat(cost.amount);
    });
    return total;
  };

  // ---------- Additional Cost Approval ---------- [cite: 249-254]
  const handleApproveCost = async (costId) => {
    setApproveLoading(costId);
    try {
      await additionalCostsApi.approve(costId);
      fetchAdditionalCosts();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to approve cost");
    } finally {
      setApproveLoading(null);
    }
  };

  const handleDeclineCost = async (costId) => {
    Alert.alert(
      "Decline Additional Charge",
      "Declining this charge will remove it from your total.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setDeclineLoading(costId);
            try {
              await additionalCostsApi.decline(costId);
              fetchAdditionalCosts();
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to decline cost");
            } finally {
              setDeclineLoading(null);
            }
          }
        }
      ]
    );
  };

  // ---------- Main Action Handlers ---------- [cite: 255-267]
  const handleToggleExclude = (findingId) => {
    setExcludedFindingIds(prev => {
      if (prev.includes(findingId)) {
        return prev.filter(id => id !== findingId);
      }
      return [...prev, findingId];
    });
  };

  const handleApprove = () => setApproveModalVisible(true);

  const confirmApprove = async () => {
    setApproveModalVisible(false);
    setActionLoading(true);
    try {
      await appointmentsApi.approveEstimate(appointmentId, excludedFindingIds);
      Alert.alert("Approved!", "Your estimate has been approved. Work is now in progress.");
      await refreshAllData();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to approve estimate.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => setRejectModalVisible(true);

  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for rejecting the estimate.");
      return;
    }
    setRejectModalVisible(false);
    setActionLoading(true);
    try {
      await appointmentsApi.rejectEstimate(appointmentId, rejectReason.trim());
      Alert.alert("Rejected", "Your estimate has been rejected. The appointment has been cancelled.");
      await refreshAllData();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to reject estimate.");
    } finally {
      setActionLoading(false);
    }
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
        <Ionicons name="alert-circle-outline" size={60} color={theme.textSecondary} />
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Appointment not found</Text>
      </View>
    );
  }

  const currentStage = statusToStage[appointment.status] ?? 0;
  const isUnderInspection = appointment.status === "UNDER_INSPECTION";
  const isWaitingForApproval = appointment.status === "WAITING_FOR_APPROVAL";
  const isInProgress = appointment.status === "IN_PROGRESS";
  const isCompleted = appointment.status === "COMPLETED";
  const isCancelled = appointment.status === "CANCELLED";
  const initialCosting = computeInitialCosting();
  const additionalTotal = computeAdditionalTotal();

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
    >
      <View className="px-6 pt-10 pb-20">
        
        {/* --- Header Section --- [cite: 272-274] */}
        <View className="mb-8">
          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-[10px] font-black uppercase tracking-[2px] opacity-40 mb-1" style={{ color: theme.text }}>
                Track Order
              </Text>
              <Text className="text-3xl font-black" style={{ color: theme.text }}>
                #{appointment.id ? appointment.id.slice(0, 8).toUpperCase() : 'N/A'}
              </Text>
            </View>
            <View className="items-end">
                <View 
                    className="px-4 py-1.5 rounded-full mb-1" 
                    style={{ backgroundColor: isCancelled ? theme.error + '20' : theme.primary + '15' }}
                >
                    <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: isCancelled ? theme.error : theme.primary }}>
                        {appointment.status || "PENDING"}
                    </Text>
                </View>
                <Text className="text-[11px] font-medium opacity-50" style={{ color: theme.textSecondary }}>
                    Updated Just Now
                </Text>
            </View>
          </View>
        </View>

        {/* --- Vehicle Card --- [cite: 275-278] */}
        <View className="p-6 rounded-[32px] mb-8 shadow-sm border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.primary + '10' }}>
                <MaterialCommunityIcons name="car-cog" size={24} color={theme.primary} />
            </View>
            <View className="flex-1">
                <Text className="text-lg font-black leading-tight" style={{ color: theme.text }}>
                    {appointment.serviceType?.name || "Maintenance Service"}
                </Text>
                <Text className="text-xs font-bold opacity-50" style={{ color: theme.textSecondary }}>
                    {appointment.vehicle?.make} {appointment.vehicle?.model} • {appointment.vehicle?.plateNumber}
                </Text>
            </View>
          </View>
          
          <View className="flex-row justify-between pt-4 border-t" style={{ borderTopColor: theme.border }}>
            <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                <Text className="text-xs font-bold ml-2" style={{ color: theme.text }}>{formatDate(appointment.appointmentDate)}</Text>
            </View>
            <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text className="text-xs font-bold ml-2" style={{ color: theme.text }}>{formatTime12h(appointment.appointmentTime)}</Text>
            </View>
          </View>
        </View>

        {/* --- Tasks List Section --- [cite: 279-302] */}
        {(isUnderInspection || isWaitingForApproval || isInProgress || isCompleted) && (
          <View className="mb-10">
            <View className="flex-row justify-between items-center mb-5">
                <Text className="text-xl font-black" style={{ color: theme.text }}>
                    {isInProgress ? "Work Logs" : "Inspection Checklist"}
                </Text>
                <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: theme.primary + '10' }}>
                    <Text className="text-[10px] font-black uppercase text-primary" style={{ color: theme.primary }}>
                        {tasks.length} Items
                    </Text>
                </View>
            </View>
            
            {tasks.length === 0 ? (
                <View className="items-center py-10 rounded-[32px] border-2 border-dashed" style={{ borderColor: theme.border }}>
                    <MaterialCommunityIcons name="clipboard-text-search-outline" size={40} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                    <Text className="text-sm font-bold mt-2 opacity-50" style={{ color: theme.textSecondary }}>Waiting for mechanic to start...</Text>
                </View>
            ) : (
              tasks.map(task => {
                const findingsToShow = isWaitingForApproval
                  ? task.findings?.filter(f => !excludedFindingIds.includes(f.id)) || []
                  : task.findings || [];

                if (task.status === "DONE" && findingsToShow.length === 0) return null;

                return (
                  <View key={task.id} className="mb-4 overflow-hidden rounded-[24px] border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <View className="p-5 flex-row justify-between items-center">
                        <View className="flex-1 mr-3">
                            <Text className="font-black text-sm uppercase tracking-wide" style={{ color: theme.text }}>{task.title}</Text>
                            <View className="flex-row items-center mt-1">
                                <View 
                                    className={`w-2 h-2 rounded-full mr-2 ${task.status === "IN_PROGRESS" ? "bg-amber-500" : task.status === "DONE" ? "bg-emerald-500" : "bg-gray-400"}`} 
                                />
                                <Text className="text-[10px] font-black uppercase opacity-60" style={{ color: theme.text }}>
                                    {task.status.replace('_', ' ')}
                                </Text>
                            </View>
                        </View>
                        {task.status === "DONE" && <Ionicons name="checkmark-circle" size={24} color={theme.success} />}
                    </View>

                    {findingsToShow.length > 0 && (
                      <View className="px-5 pb-5 pt-2" style={{ backgroundColor: theme.background + '40' }}>
                        {findingsToShow.map((finding) => (
                          <View key={finding.id} className="p-4 mb-3 rounded-2xl border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                            <View className="flex-row justify-between">
                              <View className="flex-1 pr-4">
                                <Text className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: theme.primary }}>Diagnostic Finding</Text>
                                <Text className="text-xs font-bold leading-5" style={{ color: theme.text }}>{finding.description}</Text>
                                
                                {finding.products?.length > 0 && (
                                  <View className="mt-4 pt-3 border-t" style={{ borderTopColor: theme.border }}>
                                    {finding.products.map((p, i) => (
                                      <View key={i} className="flex-row justify-between mb-1">
                                        <Text className="text-[11px] font-medium opacity-60" style={{ color: theme.text }}>• {p.quantity}x {p.name}</Text>
                                        <Text className="text-[11px] font-black" style={{ color: theme.text }}>₱{parseFloat(p.priceAtTime).toFixed(2)}</Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>
            
                              {isWaitingForApproval && (
                                <TouchableOpacity
                                  onPress={() => handleToggleExclude(finding.id)}
                                  className="h-10 px-4 rounded-xl items-center justify-center border shadow-sm"
                                  style={{
                                    backgroundColor: excludedFindingIds.includes(finding.id) ? theme.success : theme.surface,
                                    borderColor: excludedFindingIds.includes(finding.id) ? theme.success : theme.error
                                  }}
                                >
                                  <Text className="text-[10px] font-black uppercase" style={{ color: excludedFindingIds.includes(finding.id) ? '#fff' : theme.error }}>
                                    {excludedFindingIds.includes(finding.id) ? "Include" : "Skip Item"}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* --- Costing Sections --- [cite: 304-329] */}
        {(isUnderInspection || isWaitingForApproval || isInProgress || isCompleted) && (
          <View className="p-8 rounded-[32px] mb-10 border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <Text className="text-xl font-black mb-6" style={{ color: theme.text }}>
                {(isUnderInspection || isWaitingForApproval) ? "Price Estimate" : "Financial Summary"}
            </Text>

            {/* Base Service */}
            <View className="flex-row justify-between mb-4">
              <Text className="text-sm font-medium opacity-60" style={{ color: theme.text }}>{appointment.serviceType?.name || 'Base Package'}</Text>
              <Text className="text-sm font-black" style={{ color: theme.text }}>₱{initialCosting.servicePrice.toFixed(2)}</Text>
            </View>

            {/* Parts & Labor */}
            {initialCosting.partsItems.map((item, i) => (
              <View key={i} className="flex-row justify-between mb-4">
                <Text className="text-sm font-medium opacity-60" style={{ color: theme.text }}>{item.name} (x{item.quantity})</Text>
                <Text className="text-sm font-black" style={{ color: theme.text }}>₱{item.subtotal.toFixed(2)}</Text>
              </View>
            ))}

            {initialCosting.laborTotal > 0 && (
              <View className="flex-row justify-between mb-4">
                <Text className="text-sm font-medium opacity-60" style={{ color: theme.text }}>Extra Labor</Text>
                <Text className="text-sm font-black" style={{ color: theme.text }}>₱{initialCosting.laborTotal.toFixed(2)}</Text>
              </View>
            )}

            {/* Additional Costs (For In Progress) */}
            {isInProgress && additionalCosts.map(cost => (
                <View key={cost.id} className="flex-row justify-between items-center mb-4 py-2 border-y border-dashed border-border/30">
                    <View className="flex-1 pr-4">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">New Finding Added</Text>
                        <Text className="text-xs font-bold" style={{ color: theme.text }}>{cost.description}</Text>
                        <View className="flex-row items-center mt-1">
                            <Text className={`text-[10px] font-black uppercase ${cost.status === 'PENDING' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {cost.status === 'PENDING' ? 'Approval Required' : 'Approved ✓'}
                            </Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-sm font-black mb-2" style={{ color: cost.type === 'discount' ? theme.error : theme.text }}>
                             {cost.type === 'discount' ? '- ' : ''}₱{parseFloat(cost.amount).toFixed(2)}
                        </Text>
                        {cost.status === 'PENDING' && (
                            <View className="flex-row gap-2">
                                <TouchableOpacity onPress={() => handleApproveCost(cost.id)} className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
                                    {approveLoading === cost.id ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color="#fff" />}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeclineCost(cost.id)} className="w-8 h-8 rounded-full bg-red-500 items-center justify-center">
                                    {declineLoading === cost.id ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="close" size={16} color="#fff" />}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            ))}

            {/* Discounts */}
            {initialCosting.discountTotal > 0 && (
              <View className="flex-row justify-between mb-4 px-4 py-3 rounded-2xl" style={{ backgroundColor: theme.success + '10' }}>
                <Text className="text-sm font-black" style={{ color: theme.success }}>Promo Discount</Text>
                <Text className="text-sm font-black" style={{ color: theme.success }}>- ₱{initialCosting.discountTotal.toFixed(2)}</Text>
              </View>
            )}

            {/* Grand Total */}
            <View className="mt-6 pt-6 border-t flex-row justify-between items-center" style={{ borderTopColor: theme.border }}>
              <Text className="text-lg font-black uppercase tracking-wider" style={{ color: theme.text }}>Total Due</Text>
              <View className="items-end">
                <Text className="text-3xl font-black" style={{ color: theme.primary }}>
                    ₱{(isInProgress ? (originalEstimateTotal + additionalTotal) : initialCosting.grandTotal).toFixed(2)}
                </Text>
                <Text className="text-[10px] font-bold opacity-40 uppercase" style={{ color: theme.text }}>Tax & Fees Incl.</Text>
              </View>
            </View>
          </View>
        )}

        {/* --- Cancellation Note --- [cite: 336-337] */}
        {isCancelled && (
          <View className="p-8 rounded-[32px] mb-8 border items-center text-center" style={{ backgroundColor: theme.error + '05', borderColor: theme.error + '30' }}>
            <Ionicons name="alert-circle" size={40} color={theme.error} />
            <Text className="text-xl font-black mt-3 mb-1" style={{ color: theme.error }}>Order Cancelled</Text>
            <Text className="text-sm text-center font-medium leading-5 opacity-70" style={{ color: theme.text }}>{appointment.notes || "This appointment was cancelled by the shop or customer."}</Text>
          </View>
        )}

        {/* --- Action Buttons --- [cite: 338-343] */}
        {isWaitingForApproval && (
          <View className="flex-row gap-4 mb-10">
            <TouchableOpacity
              onPress={handleReject}
              disabled={actionLoading}
              className="flex-1 h-16 rounded-[24px] items-center justify-center border-2"
              style={{ borderColor: theme.error }}
            >
                <Text className="text-sm font-black uppercase tracking-widest" style={{ color: theme.error }}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleApprove}
                disabled={actionLoading}
                className="flex-[2] h-16 rounded-[24px] items-center justify-center shadow-xl shadow-emerald-500/30"
                style={{ backgroundColor: theme.success }}
            >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Text className="text-white font-black uppercase tracking-widest mr-2">Confirm & Proceed</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
            </TouchableOpacity>
          </View>
        )}

        {/* --- Progress Timeline --- [cite: 364-372] */}
        <View className="mb-10">
            <Text className="text-xl font-black mb-8" style={{ color: theme.text }}>Milestones</Text>
            {stages.map((stage, index) => {
                const isActive = index <= currentStage;
                const isCurrent = index === currentStage;
                return (
                    <View key={index} className="flex-row mb-8">
                        <View className="items-center mr-6">
                            <View
                                className="w-10 h-10 rounded-2xl justify-center items-center shadow-sm"
                                style={{ backgroundColor: isActive ? theme.primary : theme.surface, borderWidth: 1, borderColor: isActive ? theme.primary : theme.border }}
                            >
                                <MaterialCommunityIcons 
                                    name={stage.icon} 
                                    size={20} 
                                    color={isActive ? "#FFFFFF" : theme.textSecondary} 
                                />
                            </View>
                            {index < stages.length - 1 && (
                                <View
                                    className="w-0.5 h-10 mt-2"
                                    style={{ backgroundColor: index < currentStage ? theme.primary : theme.border }}
                                />
                            )}
                        </View>
                        <View className="flex-1 pt-1">
                            <Text 
                                className={`text-base font-black ${isActive ? 'opacity-100' : 'opacity-30'}`} 
                                style={{ color: theme.text }}
                            >
                                {stage.name}
                            </Text>
                            {isCurrent && (
                                <Text className="text-xs font-medium mt-1 leading-5" style={{ color: theme.textSecondary }}>
                                    {stage.description}
                                </Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>

        {/* --- Modals --- [cite: 344-363] */}
        <Modal visible={approveModalVisible} transparent animationType="slide">
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View className="p-8 rounded-t-[40px]" style={{ backgroundColor: theme.surface }}>
              <View className="w-12 h-1.5 rounded-full bg-gray-300 self-center mb-8" />
              <Text className="text-2xl font-black mb-4" style={{ color: theme.text }}>Approve Estimate?</Text>
              <Text className="text-sm font-medium mb-8 leading-6 opacity-60" style={{ color: theme.text }}>
                The work will begin immediately upon approval. {excludedFindingIds.length > 0 ? `${excludedFindingIds.length} items will be skipped as per your selection.` : ''}
              </Text>
              
              <View className="p-6 rounded-3xl mb-8" style={{ backgroundColor: theme.primary + '10' }}>
                 <Text className="text-center text-[10px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: theme.text }}>Final Amount</Text>
                 <Text className="text-4xl text-center font-black" style={{ color: theme.primary }}>₱{initialCosting.grandTotal.toFixed(2)}</Text>
              </View>

              <View className="flex-row gap-4">
                <TouchableOpacity onPress={() => setApproveModalVisible(false)} className="flex-1 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: theme.background }}>
                  <Text className="font-bold" style={{ color: theme.text }}>Go Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmApprove} className="flex-[2] h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: theme.success }}>
                  <Text className="text-white font-black uppercase tracking-widest">Approve & Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={rejectModalVisible} transparent animationType="slide">
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View className="p-8 rounded-t-[40px]" style={{ backgroundColor: theme.surface }}>
              <View className="w-12 h-1.5 rounded-full bg-gray-300 self-center mb-8" />
              <Text className="text-2xl font-black mb-2" style={{ color: theme.text }}>Reject Estimate</Text>
              <Text className="text-sm font-medium mb-6 opacity-60" style={{ color: theme.text }}>This will cancel your appointment. Please tell us why.</Text>
              
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Reason for cancellation..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                className="p-5 rounded-3xl mb-8 text-sm font-bold border"
                style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.background, height: 120 }}
              />
              
              <View className="flex-row gap-4">
                <TouchableOpacity onPress={() => { setRejectModalVisible(false); setRejectReason(""); }} className="flex-1 h-14 rounded-2xl items-center justify-center">
                  <Text className="font-bold" style={{ color: theme.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={submitRejection} 
                    disabled={!rejectReason.trim()} 
                    className="flex-[2] h-14 rounded-2xl items-center justify-center" 
                    style={{ backgroundColor: theme.error, opacity: !rejectReason.trim() ? 0.5 : 1 }}
                >
                  <Text className="text-white font-black uppercase tracking-widest">Confirm Rejection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}