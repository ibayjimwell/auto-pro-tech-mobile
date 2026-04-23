import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function TrackingScreen() {
  const { theme } = useTheme();
  const [currentStage, setCurrentStage] = useState(3); // 0: Pending, 1: Confirmed, 2: Inspection, 3: Waiting, 4: Progress, 5: Completed

  const stages = [
    { name: "Pending", description: "Your appointment request has been received and is awaiting confirmation." },
    { name: "Confirmed", description: "Appointment confirmed. We are preparing for your arrival." },
    { name: "Under Inspection", description: "Technicians are currently inspecting your vehicle and diagnosing issues." },
    { name: "Waiting Approval", description: "Inspection complete. Estimate generated and awaiting your approval." },
    { name: "In Progress", description: "Work has begun. Our team is performing the approved services." },
    { name: "Completed", description: "All services finished. Vehicle is ready for pickup or delivery." },
  ];

  const tasks = [
    { id: 1, name: "Removing left front wheel", completed: true },
    { id: 2, name: "Changing engine oil", completed: false },
    { id: 3, name: "Inspecting brake pads", completed: false },
    { id: 4, name: "Rotating tires", completed: false },
    { id: 5, name: "Final safety check", completed: false },
  ];

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
                className={`w-8 h-8 rounded-full justify-center items-center ${
                  index <= currentStage ? "bg-primary" : "bg-gray-300"
                }`}
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
            <Text className="text-lg font-semibold mb-2" style={{ color: theme.text }}>
              MECHANIC'S CURRENT TASKS
            </Text>
            {tasks.map((task) => (
              <View key={task.id} className="flex-row items-center mb-2">
                <Ionicons
                  name={task.completed ? "checkbox" : "square-outline"}
                  size={20}
                  color={task.completed ? theme.success : theme.textSecondary}
                />
                <Text
                  className={`ml-2 ${task.completed ? "line-through" : ""}`}
                  style={{ color: task.completed ? theme.textSecondary : theme.text }}
                >
                  {task.name}
                </Text>
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