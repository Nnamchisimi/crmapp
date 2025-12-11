import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function Dashboard() {
  return (
    <ScrollView style={styles.container}>

      {/* Page Title */}
      <Text style={styles.title}>Dashboard</Text>

      {/* Subtitle / Description */}
      <Text style={styles.subtitle}>
        Manage your vehicles and track schedules
      </Text>

      {/* Example card section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Vehicles</Text>
        <Text style={styles.cardValue}>12</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming Bookings</Text>
        <Text style={styles.cardValue}>4</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Campaigns</Text>
        <Text style={styles.cardValue}>3</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#000",
  },

  title: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
  },

  cardTitle: {
    color: "#888",
    fontSize: 14,
  },

  cardValue: {
    color: "#00bcd4",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },
});
