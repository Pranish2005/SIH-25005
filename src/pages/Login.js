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
import { Mail, Eye, EyeOff, Lock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const res = await API.post("/auth/login", form);
      await AsyncStorage.setItem("token", res.data.token);
      Alert.alert("✅ Success", "Logged in successfully!");
      navigation.replace("MainTabs");
    } catch (err) {
      Alert.alert("❌ Error", err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Mail size={20} color="#007bff" />
          <TextInput
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={form.email}
            onChangeText={(text) => handleChange("email", text)}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Lock size={20} color="#007bff" />
          <TextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={form.password}
            onChangeText={(text) => handleChange("password", text)}
          />
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
            {showPassword ? (
              <EyeOff size={20} color="#007bff" />
            ) : (
              <Eye size={20} color="#007bff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.options}>
          <TouchableOpacity>
            <Text style={styles.remember}>Remember me</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Sign in</Text>
        </TouchableOpacity>

        {/* Switch to Register */}
        <Text style={styles.switchText}>
          Don’t have an account?{" "}
          <Text
            style={styles.switchLink}
            onPress={() => navigation.navigate("Register")}
          >
            Create one
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
    backgroundColor: "#e9f0ff", // light gradient-like feel
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
    color: "#007bff",
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
    borderColor: "#cdd9ed",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    backgroundColor: "#f8faff",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
  },
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  remember: {
    fontSize: 14,
    color: "#444",
  },
  forgot: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#007bff",
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
    color: "#007bff",
    fontWeight: "bold",
  },
});
