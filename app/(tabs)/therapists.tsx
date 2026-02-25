import React from "react";
import { View, Text, Pressable } from "react-native";
import { THERAPISTS } from "@/constants/therapists_list";
import { useAuth } from "@/contexts/auth-context";

export default function TherapistsScreen() {
  const { user, selectTherapist } = useAuth();
  const selectedTherapist = THERAPISTS.find((t) => t.id === user?.selectedTherapistId);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12, color: "white" }}>
        Choose Therapist
      </Text>

      <Text style={{ marginBottom: 12, color: "white" }}>
        Selected: {selectedTherapist?.name ?? "None"}
      </Text>

      {THERAPISTS.map((t) => {
        const isSelected = user?.selectedTherapistId === t.id;

        return (
          <View
            key={t.id}
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: isSelected ? "#5b8def" : "#ccc",
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>{t.name}</Text>
            <Text style={{ marginBottom: 8, color: "white" }}>{t.specialty}</Text>

            <Pressable
              onPress={() => selectTherapist(t.id)}
              style={{
                padding: 10,
                borderWidth: 1,
                borderColor: "#333",
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white" }}>{isSelected ? "Selected" : "Select"}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
