import React, { useState } from "react";
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Alert,
  FlatList, ScrollView, ActivityIndicator, Dimensions,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { classifyPhoto, saveClassification } from "../services/api";

const { width } = Dimensions.get('window');

const TraitLine = ({ label, value, unit, conf }) => {
  if (value == null) return null;
  return (
    <Text style={styles.traitText}>
      {label}: {value}{unit ? ` ${unit}` : ""}{conf != null ? ` (conf ${Math.round(conf*100)}%)` : ""}
    </Text>
  );
};

const DetectionItem = ({ item }) => {
  const t = item.traits || {};
  return (
    <View style={styles.detItem}>
      <Text style={styles.scoreTrait}>{item.class_ || "animal"}</Text>
      <Text style={styles.scoreValue}>
        {`Score: ${(item.score ?? 0).toFixed(2)} | W: ${item.cm_width ?? 0} cm | H: ${item.cm_height ?? 0} cm`}
      </Text>
      <View style={styles.traitsBlock}>
        <TraitLine label="Chest width" value={t?.chest_width?.cm?.toFixed?.(2)} unit="cm" conf={t?.chest_width?.conf} />
        <TraitLine label="Front leg" value={t?.front_leg?.cm?.toFixed?.(2)} unit="cm" conf={t?.front_leg?.conf} />
        {t?.front_leg?.upper_cm != null && (
          <TraitLine label=" └ upper" value={t.front_leg.upper_cm.toFixed(2)} unit="cm" />
        )}
        {t?.front_leg?.lower_cm != null && (
          <TraitLine label=" └ lower" value={t.front_leg.lower_cm.toFixed(2)} unit="cm" />
        )}
        <TraitLine label="Rear leg" value={t?.rear_leg?.cm?.toFixed?.(2)} unit="cm" conf={t?.rear_leg?.conf} />
        {t?.rear_leg?.upper_cm != null && (
          <TraitLine label=" └ upper" value={t.rear_leg.upper_cm.toFixed(2)} unit="cm" />
        )}
        {t?.rear_leg?.lower_cm != null && (
          <TraitLine label=" └ lower" value={t.rear_leg.lower_cm.toFixed(2)} unit="cm" />
        )}
        <TraitLine label="Hock angle" value={t?.hock_angle?.deg?.toFixed?.(1)} unit="deg" conf={t?.hock_angle?.conf} />
        <TraitLine label="Pastern front" value={t?.pastern_front?.deg?.toFixed?.(1)} unit="deg" conf={t?.pastern_front?.conf} />
        <TraitLine label="Pastern rear" value={t?.pastern_rear?.deg?.toFixed?.(1)} unit="deg" conf={t?.pastern_rear?.conf} />
      </View>
    </View>
  );
};

export default function ClassificationScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [annotated, setAnnotated] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!res.canceled) {
      const uri = res.assets?.[0]?.uri;
      setImage(uri);
      classifyImage(uri);
    }
  };

  const handleImageUpload = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!res.canceled) {
      const uri = res.assets?.[0]?.uri;
      setImage(uri);
      classifyImage(uri);
    }
  };

  const classifyImage = async (imageUri) => {
    try {
      setLoading(true);
      const response = await classifyPhoto(imageUri, 37.79); // pass calibration if you have a dynamic one
      setDetections(response?.detections || []);
      setAnnotated(response?.annotated_image || null);
      setSummary(response?.summary || null);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to classify image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!detections?.length || !summary) {
        Alert.alert("No data", "Nothing to save");
        return;
      }
      await saveClassification({ detections, summary });
      Alert.alert("Saved", "Classification saved");
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert("Save failed", "Could not save data.");
    }
  };

  const handleRetake = () => {
    setImage(null);
    setDetections([]);
    setAnnotated(null);
    setSummary(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Body Part Classification</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {!image ? (
          <View style={styles.initialView}>
            <View style={styles.heroSection}>
              <FontAwesome5 name="camera-retro" size={80} color="#4F46E5" style={styles.heroIcon} />
              <Text style={styles.heroTitle}>Capture & Classify</Text>
              <Text style={styles.heroSubtitle}>Get instant body part classification with AI</Text>
            </View>

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

            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>📋 Tips for Best Results</Text>
              <Text style={styles.instructionText}>
                • Ensure good lighting and focus{'\n'}
                • Keep full body in frame{'\n'}
                • Capture left-side profile at 3–5 m
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultView}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: annotated || image }} style={styles.image} resizeMode="contain" />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Analyzing...</Text>
                </View>
              )}
            </View>

            {summary && !loading && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>
            )}

            {!!detections?.length && !loading && (
              <View style={styles.resultsCard}>
                <Text style={styles.sectionHeader}>Classification Results</Text>
                <FlatList
                  data={detections}
                  renderItem={({ item }) => <DetectionItem item={item} />}
                  keyExtractor={(_, idx) => String(idx)}
                  scrollEnabled={false}
                />
              </View>
            )}

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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, backgroundColor: '#fff',
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  headerText: { fontSize: 22, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5 },
  placeholder: { width: 44 },
  content: { flex: 1, paddingHorizontal: 20 },
  initialView: { alignItems: 'center', paddingTop: 40 },
  heroSection: { alignItems: 'center', marginBottom: 40 },
  heroIcon: { marginBottom: 20, opacity: 0.8 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  buttonContainer: { width: '100%', marginBottom: 40 },
  primaryBtn: {
    flexDirection: 'row', backgroundColor: '#4F46E5', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 12 },
  secondaryBtn: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E2E8F0', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  secondaryBtnText: { color: '#4F46E5', fontSize: 18, fontWeight: '600', marginLeft: 12 },
  instructionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  instructionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  instructionText: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  resultView: { alignItems: 'center', paddingTop: 20 },
  imageContainer: { position: 'relative', marginBottom: 30 },
  image: {
    width: width * 0.85, height: width * 0.85, borderRadius: 20, backgroundColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  summaryText: { fontSize: 16, color: '#333', lineHeight: 22 },
  resultsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  sectionHeader: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  detItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  scoreTrait: { fontSize: 16, fontWeight: '600', color: '#374151' },
  scoreValue: { fontSize: 14, fontWeight: '600', color: '#10B981', marginTop: 4 },
  traitsBlock: { marginTop: 8 },
  traitText: { fontSize: 14, color: '#334155', marginTop: 4 },
  resultButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  saveBtn: {
    flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flex: 1, marginRight: 12,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  retakeBtn: {
    flexDirection: 'row', backgroundColor: '#EF4444', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flex: 1, marginLeft: 12,
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
  retakeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
