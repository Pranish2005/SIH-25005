import React from "react";
import { View, Text, StyleSheet } from "react-native";

const HistoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.message}>No History Saved.</Text>
      {/* Add your history content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7FAFC" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  message: { fontSize: 16, color: "#555" },
});

export default HistoryScreen;
