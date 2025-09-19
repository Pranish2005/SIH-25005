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
  Dimensions,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { classifyPhoto, saveClassification } from "../services/api";

const { width } = Dimensions.get('window');

export default function ClassificationScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [scores, setScores] = useState(null);
  const [annotations, setAnnotations] = useState(null);
  const [summary, setSummary] = useState(null);
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
      setScores(response.detections || []);
      setAnnotations(null);
      setSummary(response.summary || null);
    } catch (error) {
      Alert.alert("Error", "Failed to classify image. Try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Save classification
  const handleSave = async () => {
    try {
      if (!scores || !summary) {
        Alert.alert('No data', 'Nothing to save');
        return;
      }

      // You can also send measurements and any other relevant data if available
      const dataToSave = { scores, summary, measurements: {} }; // Assuming 'measurements' is an empty object for this example

      await saveClassification(dataToSave);

      Alert.alert('Saved', 'Classification saved to history');
      navigation.goBack();

    } catch (error) {
      Alert.alert('Save failed', 'Could not save data. Try again.');
      console.error(error);
    }
  };

  // Reset
  const handleRetake = () => {
    setImage(null);
    setScores(null);
    setAnnotations(null);
    setSummary(null);
  };

const renderScoreItem = ({ item }) => (
  <View style={styles.scoreRow}>
    <Text style={styles.scoreTrait}>{item.class}</Text>
    <Text style={styles.scoreValue}>
      {`Conf: ${(item.score * 100).toFixed(1)}% | W: ${item.cm_width ? item.cm_width + " cm" : item.pixel_width + " px"} | H: ${item.cm_height ? item.cm_height + " cm" : item.pixel_height + " px"}`}
    </Text>
  </View>
);




  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Body Part Classification</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!image ? (
          <View style={styles.initialView}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <FontAwesome5 name="camera-retro" size={80} color="#4F46E5" style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Capture & Classify</Text>
              <Text style={styles.heroSubtitle}>Get instant body part classification with AI</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleImagePick}>
                <MaterialIcons name="camera-alt" size={24} color="#fff" />
                <Text style={styles.primaryBtnText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={handleImageUpload}>
                <MaterialIcons name="photo-library" size={24} color="#4F46E5" />
                <Text style={styles.secondaryBtnText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>📋 Tips for Best Results</Text>
              <Text style={styles.instructionText}>
                • Ensure good lighting and focus{'\n'}
                • Cover the body part completely{'\n'}
                • Hold steady for clear capture
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultView}>
            {/* Image Display */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: annotations || image }}
                style={styles.image}
                resizeMode="contain"
              />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              )}
            </View>

            {/* Results */}
            {summary && !loading && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
            )}

            {scores && !loading && (
              <View style={styles.resultsCard}>
                <Text style={styles.sectionHeader}>Classification Results</Text>
                <FlatList
                  data={scores}
                  renderItem={renderScoreItem}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />

              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.resultButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <MaterialIcons name="save" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Results</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                <MaterialIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  initialView: {
    alignItems: 'center',
    paddingTop: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroIcon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  secondaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryBtnText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  resultView: {
    alignItems: 'center',
    paddingTop: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  image: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scoreTrait: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  resultButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  retakeBtn: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  retakeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});