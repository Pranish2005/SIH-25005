import React, { useEffect, useState } from "react";
import { View, Text, Button, TextInput, StyleSheet, Modal, Alert } from "react-native";
import API from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editVisible, setEditVisible] = useState(false);
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    API.get("/auth/profile")
      .then(res => {
        setUser(res.data);
        setMobile(res.data.mobile || "");
      })
      .catch(() => Alert.alert("Error", "Could not load profile"));
  }, []);

  // Save changes
  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await API.put("/auth/profile", { mobile });
      setUser(res.data);
      setEditVisible(false);
    } catch (e) {
      Alert.alert("Error", "Could not update profile");
    }
    setLoading(false);
  };

  if (!user) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Username:</Text>
      <Text style={styles.value}>{user.username}</Text>
      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{user.email}</Text>
      <Text style={styles.label}>Mobile:</Text>
      <Text style={styles.value}>{user.mobile || "-"}</Text>
      <Button title="Edit" onPress={() => setEditVisible(true)} />

      <Modal visible={editVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.label}>Mobile Number:</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />
          <Button title={loading ? "Saving..." : "Save"} onPress={handleSave} disabled={loading} />
          <Button title="Cancel" onPress={() => setEditVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, backgroundColor: "#F7FAFC" },
  label: { fontWeight: "bold", fontSize: 17, marginTop: 10 },
  value: { fontSize: 16, marginBottom: 8 },
  modalContent: { flex: 1, justifyContent: "center", padding: 32 },
  input: { borderWidth: 1, borderColor: "#aaa", padding: 10, borderRadius: 6, marginBottom: 18 }
});
