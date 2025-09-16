import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Mail, Eye, EyeOff } from "lucide-react-native"; 
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ For token storage
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

      // ✅ Save token in AsyncStorage
      await AsyncStorage.setItem("token", res.data.token);

      Alert.alert("✅ Success", "Logged in successfully!");
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert("❌ Error", err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back 👋</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Mail size={20} color="#555" />
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
          <TextInput
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={form.password}
            onChangeText={(text) => handleChange("password", text)}
          />
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
            {showPassword ? <EyeOff size={20} color="#555" /> : <Eye size={20} color="#555" />}
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.options}>
          <TouchableOpacity>
            <Text style={styles.remember}>Remember me</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgot}>Forgot?</Text>
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
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  remember: {
    fontSize: 14,
    color: "#555",
  },
  forgot: {
    fontSize: 14,
    color: "#007bff",
  },
  submitBtn: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
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
