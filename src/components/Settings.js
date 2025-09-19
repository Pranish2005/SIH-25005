import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import API from '../services/api';

export default function Settings({ navigation }) {
  const { isDark, toggleTheme } = useTheme();
  const [notification, setNotification] = useState(true);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      Alert.alert('Error', 'Could not logout');
    }
  };

  const handleAccountSettings = () => {
    navigation.navigate('AccountSettings');
  };

  const handleHelp = () => {
    navigation.navigate('Help');
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.title, isDark && styles.darkText]}>Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Preferences</Text>

        <View style={[styles.optionCard, isDark && styles.darkCard]}>
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="language" size={24} color={isDark ? '#fff' : '#333'} />
              <Text style={[styles.optionText, isDark && styles.darkText]}>Language.</Text>
            </View>
            <TouchableOpacity>
              <Text style={[styles.valueText, isDark && styles.darkText]}>English.</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.optionCard, isDark && styles.darkCard]}>
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="moon" size={24} color={isDark ? '#fff' : '#333'} />
              <Text style={[styles.optionText, isDark && styles.darkText]}>Dark Theme</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
        </View>

        <View style={[styles.optionCard, isDark && styles.darkCard]}>
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="notifications" size={24} color={isDark ? '#fff' : '#333'} />
              <Text style={[styles.optionText, isDark && styles.darkText]}>Notifications.</Text>
            </View>
            <Switch value={notification} onValueChange={setNotification} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Account</Text>

        <TouchableOpacity style={[styles.optionCard, isDark && styles.darkCard]} onPress={handleAccountSettings}>
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="person" size={24} color={isDark ? '#fff' : '#333'} />
              <Text style={[styles.optionText, isDark && styles.darkText]}>Account Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={isDark ? '#fff' : '#333'} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, isDark && styles.darkCard]} onPress={handleHelp}>
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="help-circle" size={24} color={isDark ? '#fff' : '#333'} />
              <Text style={[styles.optionText, isDark && styles.darkText]}>Help.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={isDark ? '#fff' : '#333'} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.optionCard, styles.logoutCard]} onPress={handleLogout}>
          <View style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name="log-out" size={24} color="red" />
              <Text style={[styles.optionText, { color: 'red' }]}>LogOut.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="red" />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7FAFC' },
  darkContainer: { backgroundColor: '#333' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#333' },
  darkText: { color: '#fff' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 15, color: '#333' },
  optionCard: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  darkCard: { backgroundColor: '#444' },
  logoutCard: { backgroundColor: '#ffeaea' },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: 18, marginLeft: 15, maxWidth: '80%' },
  valueText: { fontSize: 16, color: '#666' },
});
