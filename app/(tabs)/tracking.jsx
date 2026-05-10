import { View, Text, ScrollView, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, TextInput, Modal } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import appointmentsApi from "../../services/appointmentsApi";
import tasksApi from "../../services/tasksApi";
import estimateApi from "../../services/estimateApi";
import additionalCostsApi from "../../services/additionalCostsApi";
import invoicesApi from "../../services/invoicesApi";
import io from "socket.io-client";
import { API_BASE_URL } from "../../services/api";

const statusToStage = {
  PENDING: 0,
  CONFIRMED: 1,
  UNDER_INSPECTION: 2,
  WAITING_FOR_APPROVAL: 3,
  IN_PROGRESS: 4,
  COMPLETED: 5,
};

const stages = [
  { name: "Pending", description: "Your appointment request has been received." },
  { name: "Confirmed", description: "Appointment confirmed. We are preparing for your arrival." },
  { name: "Under Inspection", description: "The mechanics are inspecting your vehicle. See the tasks below." },
  { name: "Waiting Approval", description: "Estimate cost generated. Waiting for your approval." },
  { name: "In Progress", description: "Work has begun on your vehicle. Repair tasks are ongoing." },
  { name: "Completed", description: "All services finished. Vehicle is ready." },
];

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

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [adjustments, setAdjustments] = useState({ laborItems: [], discounts: [] });
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [originalEstimateTotal, setOriginalEstimateTotal] = useState(0);
  const [approveLoading, setApproveLoading] = useState(null); // cost id being approved
  const [declineLoading, setDeclineLoading] = useState(null); // cost id being declined

  // WAITING_FOR_APPROVAL state
  const [excludedFindingIds, setExcludedFindingIds] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const socketRef = useRef(null);
  const isMounted = useRef(true);

  // ---------- Fetch functions ----------
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

  // Refresh all dependent data based on current status
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

  // ---------- WebSocket real‑time ----------
  useEffect(() => {
    const socketUrl = API_BASE_URL.replace("/api/v1", "");
    console.log("Connecting WebSocket to:", socketUrl);
    const socket = io(socketUrl, { transports: ["websocket"], reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connected (tracking)"));
    socket.on("connect_error", (err) => console.error("Socket connect error:", err.message));
    socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

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

  // ---------- Compute costs ----------
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
              partsItems.push({
                name: prod.name,
                quantity: qty,
                unitPrice,
                subtotal,
              });
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

  // ---------- Additional Cost Approval ----------
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

  // ---------- Main Action Handlers ----------
  const handleToggleExclude = (findingId) => {
    setExcludedFindingIds(prev => {
      if (prev.includes(findingId)) {
        return prev.filter(id => id !== findingId);
      }
      return [...prev, findingId];
    });
  };

  const handleApprove = () => {
    setApproveModalVisible(true);
  };

  const confirmApprove = async () => {
    setApproveModalVisible(false);
    setActionLoading(true);
    try {
      console.log("Approving estimate with excluded findings:", excludedFindingIds);
      const result = await appointmentsApi.approveEstimate(appointmentId, excludedFindingIds);
      console.log("Approve result:", result);
      Alert.alert("Approved!", "Your estimate has been approved. Work is now in progress.");
      await refreshAllData();
    } catch (err) {
      console.error("Approve error:", err);
      Alert.alert("Error", err.message || "Failed to approve estimate. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = () => {
    setRejectModalVisible(true);
  };

  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for rejecting the estimate.");
      return;
    }
    setRejectModalVisible(false);
    setActionLoading(true);
    try {
      console.log("Rejecting estimate with reason:", rejectReason.trim());
      const result = await appointmentsApi.rejectEstimate(appointmentId, rejectReason.trim());
      console.log("Reject result:", result);
      Alert.alert("Rejected", "Your estimate has been rejected. The appointment has been cancelled.");
      await refreshAllData();
    } catch (err) {
      console.error("Reject error:", err);
      Alert.alert("Error", err.message || "Failed to reject estimate. Please try again.");
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
        <Text style={{ color: theme.textSecondary }}>Appointment not found</Text>
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
    >
      <View className="px-5 pt-4 pb-8">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-sm" style={{ color: theme.textSecondary }}>APPOINTMENT ID</Text>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            {appointment.id ? appointment.id.slice(0, 8).toUpperCase() : 'N/A'}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: theme.primary }} />
            <Text className="text-base font-semibold" style={{ color: theme.primary }}>
              {appointment.status || "PENDING"}
            </Text>
          </View>
        </View>

        {/* Vehicle & Customer Info */}
        <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-lg font-bold" style={{ color: theme.text }}>
            {appointment.serviceType?.name || "Service"}
          </Text>
          <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
            {appointment.vehicle?.make || ''} {appointment.vehicle?.model || ''} • {appointment.vehicle?.plateNumber || 'N/A'}
            {appointment.vehicle?.year && ` (${appointment.vehicle.year})`}
          </Text>
          <View className="flex-row mt-2">
            <Text style={{ color: theme.textSecondary }}>Date: {formatDate(appointment.appointmentDate)}</Text>
            <Text style={{ color: theme.textSecondary, marginLeft: 16 }}>Time: {formatTime12h(appointment.appointmentTime)}</Text>
          </View>
          <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>
            {appointment.customer?.fullName || "Customer"}
          </Text>
        </View>

        {/* Tasks List */}
        {(isUnderInspection || isWaitingForApproval || isInProgress || isCompleted) && (
          <View className="mb-4">
            <Text className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
              {isInProgress ? "Repair Tasks" : "Inspection Tasks"}
            </Text>
            {tasks.length === 0 ? (
              <Text style={{ color: theme.textSecondary }}>No tasks yet. Mechanic will start soon.</Text>
            ) : (
              tasks.map(task => {
                const findingsToShow = isWaitingForApproval
                  ? task.findings?.filter(f => !excludedFindingIds.includes(f.id)) || []
                  : task.findings || [];

                const hasVisibleContent = task.status !== "DONE" || findingsToShow.length > 0;

                if (!hasVisibleContent) return null;

                return (
                  <View
                    key={task.id}
                    className={`p-3 mb-3 rounded-xl border-l-4 ${
                      task.status === "IN_PROGRESS" ? "border-red-500" : task.status === "DONE" ? "border-green-500" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: theme.surface }}
                  >
                    <Text className="font-semibold text-base" style={{ color: theme.text }}>
                      {task.title}
                    </Text>
                    {task.status === "IN_PROGRESS" && (
                      <View className="flex-row items-center mt-1">
                        <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                        <Text className="text-xs text-red-500">In progress</Text>
                      </View>
                    )}
                    {task.status === "DONE" && (
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                        <Text className="text-xs ml-1" style={{ color: theme.success }}>Completed</Text>
                      </View>
                    )}

                    {findingsToShow.length > 0 && (
                      <View className="mt-2 bg-muted/20 p-2 rounded">
                        {findingsToShow.map((finding, idx) => (
                          <View key={finding.id} className="mb-2 last:mb-0">
                            <View className="flex-row items-start justify-between">
                              <View className="flex-1">
                                <Text className="text-xs font-semibold" style={{ color: theme.text }}>Finding:</Text>
                                <Text className="text-xs" style={{ color: theme.textSecondary }}>{finding.description}</Text>
                                {finding.products?.length > 0 && (
                                  <View className="mt-1 ml-2">
                                    <Text className="text-xs font-semibold" style={{ color: theme.text }}>Parts/Supplies used:</Text>
                                    {finding.products.map((p, i) => (
                                      <Text key={i} className="text-xs" style={{ color: theme.textSecondary }}>
                                        • {p.quantity}x {p.name} (₱{parseFloat(p.priceAtTime).toFixed(2)})
                                      </Text>
                                    ))}
                                  </View>
                                )}
                              </View>
                              {isWaitingForApproval && task.status === "DONE" && (
                                <TouchableOpacity
                                  onPress={() => handleToggleExclude(finding.id)}
                                  className="ml-2 px-2 py-1 rounded"
                                  style={{
                                    backgroundColor: excludedFindingIds.includes(finding.id) ? '#22c55e' : '#ef444420',
                                  }}
                                >
                                  <Text
                                    className="text-xs font-semibold"
                                    style={{
                                      color: excludedFindingIds.includes(finding.id) ? '#fff' : '#ef4444',
                                    }}
                                  >
                                    {excludedFindingIds.includes(finding.id) ? "✓ Include" : "✗ Don't do"}
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

        {/* Costing Sections */}
        {(isUnderInspection || isWaitingForApproval) && (
          <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.text }}>
              {isWaitingForApproval
                ? excludedFindingIds.length > 0
                  ? "Estimate (Items you opted out excluded)"
                  : "Estimate (Awaiting Your Approval)"
                : "Initial Estimate"}
            </Text>
            <View className="border-t border-border pt-2">
              <View className="flex-row justify-between mb-1">
                <Text style={{ color: theme.textSecondary }}>{appointment.serviceType?.name || 'Service'}</Text>
                <Text style={{ color: theme.text }}>₱{initialCosting.servicePrice.toFixed(2)}</Text>
              </View>
              {initialCosting.partsItems.map((item, i) => (
                <View key={i} className="flex-row justify-between mb-1">
                  <Text style={{ color: theme.textSecondary }}>{item.name} (x{item.quantity})</Text>
                  <Text style={{ color: theme.text }}>₱{item.subtotal.toFixed(2)}</Text>
                </View>
              ))}
              {initialCosting.laborTotal > 0 && (
                <View className="flex-row justify-between mb-1">
                  <Text style={{ color: theme.textSecondary }}>Labor</Text>
                  <Text style={{ color: theme.text }}>₱{initialCosting.laborTotal.toFixed(2)}</Text>
                </View>
              )}
              {initialCosting.discountTotal > 0 && (
                <View className="flex-row justify-between mb-1">
                  <Text style={{ color: theme.textSecondary }}>Discount</Text>
                  <Text style={{ color: theme.text }}>- ₱{initialCosting.discountTotal.toFixed(2)}</Text>
                </View>
              )}
              <View className="border-t border-border mt-2 pt-2 flex-row justify-between">
                <Text className="font-bold" style={{ color: theme.text }}>Total</Text>
                <Text className="font-bold" style={{ color: theme.primary }}>₱{initialCosting.grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {isInProgress && (
          <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.text }}>Additional Costs & Findings</Text>
            {additionalCosts.length === 0 ? (
              <Text style={{ color: theme.textSecondary }}>No additional charges so far.</Text>
            ) : (
              <View>
                {additionalCosts.map(cost => (
                  <View key={cost.id} className="mb-2 pb-2 border-b border-border/50">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: theme.text }}>
                          {cost.description || (cost.type === 'labor' ? 'Labor' : cost.type === 'part' ? 'Part' : cost.type === 'discount' ? 'Discount' : 'Finding')}
                        </Text>
                        <Text style={{ color: cost.type === 'discount' ? theme.error : theme.text }}>
                          {cost.type === 'discount' ? '- ' : ''}₱{parseFloat(cost.amount).toFixed(2)}
                        </Text>
                        {cost.status === 'PENDING' && (
                          <Text className="text-xs text-yellow-600 mt-1">Awaiting your approval</Text>
                        )}
                        {cost.status === 'APPROVED' && (
                          <Text className="text-xs" style={{ color: theme.success }}>Approved ✓</Text>
                        )}
                        {cost.status === 'DECLINED' && (
                          <Text className="text-xs text-red-500">Declined ✗</Text>
                        )}
                        {!cost.status && (
                          <Text className="text-xs" style={{ color: theme.success }}>Approved ✓</Text>
                        )}
                      </View>
                      <View className="flex-row gap-2 ml-2">
                        {cost.status === 'PENDING' && (
                          <>
                            <TouchableOpacity
                              onPress={() => handleApproveCost(cost.id)}
                              disabled={approveLoading === cost.id}
                              className="px-2 py-1 rounded"
                              style={{ backgroundColor: theme.success }}
                            >
                              {approveLoading === cost.id ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text className="text-white text-xs font-bold">Approve</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeclineCost(cost.id)}
                              disabled={declineLoading === cost.id}
                              className="px-2 py-1 rounded"
                              style={{ backgroundColor: theme.error }}
                            >
                              {declineLoading === cost.id ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text className="text-white text-xs font-bold">Don't do</Text>
                              )}
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
                <View className="border-t border-border mt-2 pt-2 flex-row justify-between">
                  <Text style={{ color: theme.text }}>Original Estimate:</Text>
                  <Text style={{ color: theme.text }}>₱{originalEstimateTotal.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="font-bold" style={{ color: theme.text }}>Total with Extras:</Text>
                  <Text className="font-bold" style={{ color: theme.primary }}>₱{(originalEstimateTotal + additionalTotal).toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {isCompleted && (
          <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.text }}>Final Invoice</Text>
            <View className="border-t border-border pt-2">
              <View className="flex-row justify-between mb-1">
                <Text style={{ color: theme.textSecondary }}>{appointment.serviceType?.name || 'Service'}</Text>
                <Text style={{ color: theme.text }}>₱{initialCosting.servicePrice.toFixed(2)}</Text>
              </View>
              {initialCosting.partsItems.map((item, i) => (
                <View key={i} className="flex-row justify-between mb-1">
                  <Text style={{ color: theme.textSecondary }}>{item.name} (x{item.quantity})</Text>
                  <Text style={{ color: theme.text }}>₱{item.subtotal.toFixed(2)}</Text>
                </View>
              ))}
              {initialCosting.laborTotal > 0 && (
                <View className="flex-row justify-between mb-1">
                  <Text style={{ color: theme.textSecondary }}>Labor</Text>
                  <Text style={{ color: theme.text }}>₱{initialCosting.laborTotal.toFixed(2)}</Text>
                </View>
              )}
              {initialCosting.discountTotal > 0 && (
                <View className="flex-row justify-between mb-1">
                  <Text style={{ color: theme.textSecondary }}>Discount</Text>
                  <Text style={{ color: theme.text }}>- ₱{initialCosting.discountTotal.toFixed(2)}</Text>
                </View>
              )}
              <View className="border-t border-border mt-2 pt-2 flex-row justify-between">
                <Text className="font-bold" style={{ color: theme.text }}>Total</Text>
                <Text className="font-bold" style={{ color: theme.primary }}>₱{initialCosting.grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {isCancelled && (
          <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
            <View className="flex-row items-center">
              <Ionicons name="close-circle" size={24} color={theme.error} />
              <Text className="text-lg font-semibold ml-2" style={{ color: theme.error }}>Appointment Cancelled</Text>
            </View>
            {appointment.notes && (
              <Text className="mt-2 text-sm" style={{ color: theme.textSecondary }}>{appointment.notes}</Text>
            )}
          </View>
        )}

        {/* WAITING_FOR_APPROVAL: Approve / Reject Buttons */}
        {isWaitingForApproval && (
          <View className="mb-6">
            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                onPress={handleApprove}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.success }}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text className="text-white font-bold ml-1">Approve</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReject}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: theme.error }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text className="text-white font-bold ml-1">Reject</Text>
                </View>
              </TouchableOpacity>
            </View>

            {excludedFindingIds.length > 0 && (
              <Text className="text-xs text-center" style={{ color: theme.textSecondary }}>
                You've opted out of {excludedFindingIds.length} finding(s). Total has been recalculated.
              </Text>
            )}
          </View>
        )}

        {/* Approve Confirmation Modal */}
        <Modal visible={approveModalVisible} transparent animationType="fade">
          <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View className="w-5/6 p-5 rounded-xl" style={{ backgroundColor: theme.surface }}>
              <Text className="text-lg font-bold mb-2" style={{ color: theme.text }}>Approve Estimate</Text>
              <Text className="text-sm mb-4" style={{ color: theme.textSecondary }}>
                Are you sure you want to approve this estimate?
                {excludedFindingIds.length > 0
                  ? ` ${excludedFindingIds.length} finding(s) will be skipped.`
                  : ''}
                {'\n\n'}The work will begin on your vehicle.
              </Text>
              <Text className="text-lg font-bold mb-4 text-center" style={{ color: theme.primary }}>
                Total: ₱{initialCosting.grandTotal.toFixed(2)}
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setApproveModalVisible(false)}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                >
                  <Text style={{ color: theme.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmApprove}
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: theme.success, opacity: actionLoading ? 0.5 : 1 }}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text className="text-white font-bold ml-1">Approve</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Reject Reason Modal */}
        <Modal visible={rejectModalVisible} transparent animationType="fade">
          <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View className="w-5/6 p-5 rounded-xl" style={{ backgroundColor: theme.surface }}>
              <Text className="text-lg font-bold mb-2" style={{ color: theme.text }}>Reject Estimate</Text>
              <Text className="text-sm mb-4" style={{ color: theme.textSecondary }}>
                Please provide a reason for rejecting this estimate. This will cancel your appointment.
              </Text>
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="e.g., Too expensive, need to check other shops..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                className="border rounded-lg p-3 mb-4 text-sm"
                style={{
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.background,
                }}
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => { setRejectModalVisible(false); setRejectReason(""); }}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
                >
                  <Text style={{ color: theme.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitRejection}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: theme.error, opacity: (!rejectReason.trim() || actionLoading) ? 0.5 : 1 }}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold">Submit Rejection</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Progress Timeline */}
        <Text className="text-xl font-semibold mb-4" style={{ color: theme.text }}>Service Progress</Text>
        {stages.map((stage, index) => {
          const isActive = index <= currentStage;
          const isCurrent = index === currentStage;
          return (
            <View key={index} className="flex-row mb-4">
              <View className="items-center mr-3">
                <View
                  className="w-8 h-8 rounded-full justify-center items-center"
                  style={{ backgroundColor: isActive ? theme.primary : theme.border }}
                >
                  {index < currentStage ? (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: isActive ? "#FFFFFF" : theme.textSecondary }}>{index + 1}</Text>
                  )}
                </View>
                {index < stages.length - 1 && (
                  <View
                    className="w-0.5 h-10"
                    style={{ backgroundColor: index < currentStage ? theme.primary : theme.border }}
                  />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: theme.text }}>
                  {stage.name}
                </Text>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  {isCurrent ? stage.description : ""}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}