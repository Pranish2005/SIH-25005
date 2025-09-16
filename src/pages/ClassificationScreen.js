import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { classifyPhoto } from "../services/api";

export default function ClassificationScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [scores, setScores] = useState(null);
  const [annotations, setAnnotations] = useState(null);
  const [loading, setLoading] = useState(false);

  // Take photo
  const handleImagePick = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      classifyImage(result.assets[0].uri);
    }
  };

  // Upload photo
  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      classifyImage(result.assets[0].uri);
    }
  };

  // Classification API
  const classifyImage = async (imageUri) => {
    try {
      setLoading(true);
      const response = await classifyPhoto(imageUri);
      setScores(response.scores || {});
      setAnnotations(response.annotations || null);
    } catch (error) {
      Alert.alert("Error", "Failed to classify image. Try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Save classification
  const handleSave = () => {
    Alert.alert("Saved", "Classification data saved to BPA.");
    navigation.goBack();
  };

  // Reset
  const handleRetake = () => {
    setImage(null);
    setScores(null);
    setAnnotations(null);
  };

  // Render score rows
  const renderScoreItem = ({ item }) => (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreTrait}>{item[0]}</Text>
      <Text style={styles.scoreValue}>{item[1]}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!image ? (
        <>
          <TouchableOpacity style={styles.actionBtn} onPress={handleImagePick}>
            <Text style={styles.btnText}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleImageUpload}>
            <Text style={styles.btnText}>🖼 Upload Photo</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Image
            source={{ uri: annotations || image }}
            style={styles.image}
            resizeMode="contain"
          />

          {loading && (
            <ActivityIndicator size="large" color="#2cb93d" style={{ marginVertical: 12 }} />
          )}

          {scores && !loading && (
            <>
              <Text style={styles.sectionHeader}>Classification Scores</Text>
              <FlatList
                data={Object.entries(scores)}
                renderItem={renderScoreItem}
                keyExtractor={(item) => item[0]}
                scrollEnabled={false}
              />
            </>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>✅ Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
              <Text style={styles.retakeBtnText}>🔄 Retake</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F7FAFC",
    flexGrow: 1,
    alignItems: "center",
  },
  actionBtn: {
    backgroundColor: "#2cb93d",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  image: {
    width: 320,
    height: 320,
    borderRadius: 12,
    backgroundColor: "#e4e4e4",
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    width: 300,
  },
  scoreTrait: {
    fontSize: 16,
    fontWeight: "500",
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2cb93d",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 24,
    width: 300,
    justifyContent: "space-between",
  },
  saveBtn: {
    backgroundColor: "#2cb93d",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  retakeBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retakeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
