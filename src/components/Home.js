import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

const Home = ({ navigation }) => {
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentScans();
  }, []);

  const fetchRecentScans = async () => {
    try {
      const response = await API.get("/auth/recent-scans"); // Adjust endpoint
      setRecentScans(response.data.scans || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartClassification = () => {
    navigation.navigate("ClassificationScreen");
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    navigation.replace("Login");
  };

  const renderScanItem = ({ item }) => (
    <View style={styles.scanCard}>
      <Image
        source={{ uri: item.imageUrl || "https://i.imgur.com/MebA7t3.png" }}
        style={styles.animalImage}
      />
      <View>
        <Text style={styles.animalId}>Animal ID: {item.animalId}</Text>
        <Text style={styles.animalBreed}>Breed: {item.breed}</Text>
        <Text style={styles.animalDate}>Date: {item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Bharat Pashudhan App (BPA)</Text>
        <Text style={styles.aiTag}>BovineVision AI</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Animal Type Classification</Text>
      <Text style={styles.subtitle}>Automated Scoring for Cattle & Buffaleos</Text>

      <TouchableOpacity style={styles.newClassBtn} onPress={handleStartClassification}>
        <Text style={styles.classBtnText}>📷 Start New Classification</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>Recent Scans</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={recentScans}
          keyExtractor={(item, idx) =>
            item.id?.toString() || item.animalId?.toString() || idx.toString()
          }
          renderItem={renderScanItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: "#F7FAFC", marginTop:15 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, justifyContent: "space-between" },
  headerText: { fontSize: 16, fontWeight: "bold" },
  aiTag: { color: "#094bc7", fontWeight: "bold", marginLeft: 8 },
  logoutBtn: { marginLeft: 18, backgroundColor: "#e74c3c", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  logoutText: { color: "#fff", fontWeight: "bold" },
  title: { fontSize: 22, fontWeight: "bold", marginVertical: 2 },
  subtitle: { fontSize: 15, color: "#555", marginBottom: 18 },
  newClassBtn: { backgroundColor: "#2cb93d", paddingVertical: 15, borderRadius: 8, alignItems: "center", marginBottom: 18 },
  classBtnText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
  sectionHeader: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  scanCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 8, marginBottom: 10, padding: 10, alignItems: "center", elevation: 1 },
  animalImage: { width: 55, height: 55, borderRadius: 30, marginRight: 15, backgroundColor: "#e4e4e4" },
  animalId: { fontWeight: "bold", fontSize: 15 },
  animalBreed: { fontSize: 14, color: "#222" },
  animalDate: { fontSize: 13, color: "#555" },
});

export default Home;
