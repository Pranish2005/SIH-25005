import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { getRecentHistory } from "../services/api";

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRecentHistory();
        setHistory(res.history || []);
      } catch (err) {
        console.error('Failed to fetch history', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.summaryText}>{item.summary || "No Summary"}</Text>
      <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.message}>No History Saved.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7FAFC", marginTop: 40, padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  message: { fontSize: 16, color: "#555" },
  itemContainer: { padding: 12, borderWidth: 2, borderBottomWidth:1, borderRadius: 5, borderColor: "#050000ff" },
  summaryText: { fontSize: 16, fontWeight: "600", color: "#333" },
  dateText: { fontSize: 12, color: "#888", marginTop: 4 },
});

export default HistoryScreen;
