import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Mail, Lock, User } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const navigation = useNavigation();

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const res = await API.post("/auth/register", form);

      if (res.data.token) {
        await AsyncStorage.setItem("token", res.data.token);
      }

      Alert.alert("✅ Success", "Registered successfully!");
      navigation.navigate("Login");
    } catch (err) {
      Alert.alert("❌ Error", err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account 🚀</Text>
        <Text style={styles.subtitle}>Join us and get started</Text>

        {/* Username */}
        <View style={styles.inputGroup}>
          <User size={20} color="#28a745" />
          <TextInput
            placeholder="Enter username"
            style={styles.input}
            value={form.username}
            onChangeText={(text) => handleChange("username", text)}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Mail size={20} color="#28a745" />
          <TextInput
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Lock size={20} color="#28a745" />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={form.password}
            onChangeText={(text) => handleChange("password", text)}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Register</Text>
        </TouchableOpacity>

        {/* Switch to Login */}
        <Text style={styles.switchText}>
          Already have an account?{" "}
          <Text
            style={styles.switchLink}
            onPress={() => navigation.navigate("Login")}
          >
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8f9f0", // light green background
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
    color: "#28a745",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cfe8d9",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: "#f9fffb",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#28a745",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  switchText: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },
  switchLink: {
    color: "#28a745",
    fontWeight: "bold",
  },
});
