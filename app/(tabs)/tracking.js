import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function TrackingScreen() {
  const { theme } = useTheme();
  const [currentStage, setCurrentStage] = useState(4); // 0: Pending, 1: Confirmed, 2: Inspection, 3: Waiting, 4: Progress, 5: Completed

  const stages = [
    { name: "Pending", description: "Your appointment request has been received and is awaiting confirmation." },
    { name: "Confirmed", description: "Appointment confirmed. We are preparing for your arrival." },
    { name: "Under Inspection", description: "Technicians are currently inspecting your vehicle and diagnosing issues." },
    { name: "Waiting Approval", description: "Inspection complete. Estimate generated and awaiting your approval." },
    { name: "In Progress", description: "Work has begun. Our team is performing the approved services." },
    { name: "Completed", description: "All services finished. Vehicle is ready for pickup or delivery." },
  ];

  // Example task data (read‑only, representing work done by the shop)
  const tasks = [
    {
      id: 1,
      name: "Inspect and replace spark plugs",
      completed: false,
      subtasks: [
        { id: 11, name: "Check gap", completed: true },
        { id: 12, name: "Remove old plugs", completed: true },
        { id: 13, name: "Install new plugs", completed: false },
      ],
    },
    {
      id: 2,
      name: "Replace air filter",
      completed: false,
      subtasks: [
        { id: 21, name: "Remove old filter", completed: true },
        { id: 22, name: "Install new filter", completed: false },
      ],
    },
    {
      id: 3,
      name: "Replace fuel filter",
      completed: false,
      subtasks: [],
    },
    {
      id: 4,
      name: "Check ignition wires",
      completed: false,
      subtasks: [],
    },
    {
      id: 5,
      name: "Scan for fault codes",
      completed: true,
      subtasks: [
        { id: 51, name: "Clear old codes", completed: true },
      ],
    },
  ];

  // Calculate overall progress
  const progress = useMemo(() => {
    let total = 0;
    let completed = 0;
    tasks.forEach(task => {
      if (task.subtasks.length > 0) {
        total += task.subtasks.length;
        completed += task.subtasks.filter(st => st.completed).length;
      } else {
        total += 1;
        if (task.completed) completed += 1;
      }
    });
    return total > 0 ? (completed / total) * 100 : 0;
  }, [tasks]);

  const simulateNextStage = () => {
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-sm" style={{ color: theme.textSecondary }}>
            APPOINTMENT ID
          </Text>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            APT-8842
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: theme.warning }} />
            <Text className="text-base font-semibold" style={{ color: theme.warning }}>
              {stages[currentStage].name}
            </Text>
          </View>
        </View>

        {/* Service & Vehicle */}
        <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-base" style={{ color: theme.text }}>
            PMS (Preventive Maintenance)
          </Text>
          <Text className="text-sm" style={{ color: theme.textSecondary }}>
            Toyota Vios • ABC 1234
          </Text>
        </View>

        {/* Service Progress */}
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>
          Service Progress
        </Text>

        {stages.map((stage, index) => (
          <View key={index} className="flex-row mb-4">
            <View className="items-center mr-3">
              <View
                className="w-8 h-8 rounded-full justify-center items-center"
                style={{ backgroundColor: index <= currentStage ? theme.primary : theme.border }}
              >
                {index < currentStage ? (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                ) : (
                  <Text style={{ color: index <= currentStage ? "#FFFFFF" : theme.textSecondary }}>
                    {index + 1}
                  </Text>
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
                {stage.description}
              </Text>
            </View>
          </View>
        ))}

        {/* Mechanic's Current Tasks (only shown when in progress) */}
        {currentStage === 4 && (
          <View className="mt-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-semibold" style={{ color: theme.text }}>
                MECHANIC'S CURRENT TASKS
              </Text>
              <Text className="text-sm font-semibold" style={{ color: theme.primary }}>
                {Math.round(progress)}% done
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="h-2 bg-gray-200 rounded-full mb-4" style={{ backgroundColor: theme.border }}>
              <View
                className="h-2 rounded-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: theme.primary,
                }}
              />
            </View>

            {/* Read‑only Task List with Subtasks */}
            {tasks.map((task) => (
              <View key={task.id} className="mb-4">
                {/* Main Task */}
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={theme.primary}
                  />
                  <Text
                    className={`ml-2 text-base font-medium ${task.completed ? "line-through" : ""}`}
                    style={{ color: task.completed ? theme.textSecondary : theme.text }}
                  >
                    {task.name}
                  </Text>
                </View>

                {/* Subtasks */}
                {task.subtasks.length > 0 && (
                  <View className="ml-6">
                    {task.subtasks.map((subtask) => (
                      <View key={subtask.id} className="flex-row items-center mb-1">
                        <Ionicons
                          name={subtask.completed ? "checkmark-circle" : "ellipse-outline"}
                          size={16}
                          color={theme.primary}
                        />
                        <Text
                          className={`ml-2 text-sm ${subtask.completed ? "line-through" : ""}`}
                          style={{ color: subtask.completed ? theme.textSecondary : theme.text }}
                        >
                          {subtask.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Simulate Next Stage Button (for testing) */}
        <TouchableOpacity
          className="mt-6 py-4 rounded-lg"
          style={{ backgroundColor: theme.primary }}
          onPress={simulateNextStage}
        >
          <Text className="text-white text-center font-semibold text-lg">
            Simulate Next Stage
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}