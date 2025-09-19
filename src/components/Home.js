import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { getRecentHistory } from "../services/api";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get('window');

const Home = ({ navigation }) => {

  

  const [recentScans, setRecentScans] = useState([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    cattleCount: 0,
    buffaloCount: 0,
    accuracy: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const res = await getRecentHistory();
      setRecentScans(res.history || []);

      // Mock stats loading - replace with real API call if available
      setStats({
        totalScans: 124,
        cattleCount: 78,
        buffaloCount: 46,
        accuracy: 92.5
      });

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartClassification = () => {
    navigation.navigate("ClassificationScreen");
  };

  const handleLogout = async () => {
    // Clear token or any other logout logic
    navigation.replace("Login");
  };

  const renderStatCard = (icon, title, value, color) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );

  const renderQuickAction = (icon, label, onPress, color = '#4F46E5') => (
    <TouchableOpacity 
      style={[styles.quickAction, { borderColor: color }]} 
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderScanItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.scanCard}
      onPress={() => navigation.navigate('ScanDetails', { scanId: item._id || item.id })}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://i.imgur.com/MebA7t3.png' }}
        style={styles.animalImage}
        resizeMode="cover"
      />
      <View style={styles.scanInfo}>
        <Text style={styles.animalId}>{item.animalId || "Unknown ID"}</Text>
        <Text style={styles.animalBreed}>{item.breed || "Unknown Breed"}</Text>
        <View style={styles.scanDate}>
          <Feather name="calendar" size={14} color="#666" />
          <Text style={styles.animalDate}>{item.date ? new Date(item.date).toLocaleDateString() : "Unknown Date"}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Bharat Pashudhan Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        {renderStatCard(
          <MaterialIcons name="pets" size={24} color="#fff" />,
          'Total Scans',
          stats.totalScans,
          '#4F46E5'
        )}
        {renderStatCard(
          <FontAwesome5 name="cow" size={20} color="#fff" />,
          'Cattle',
          stats.cattleCount,
          '#10B981'
        )}
        {renderStatCard(
          <FontAwesome5 name="water" size={20} color="#fff" />,
          'Buffaloes',
          stats.buffaloCount,
          '#F59E0B'
        )}
        {renderStatCard(
          <MaterialIcons name="speed" size={24} color="#fff" />,
          'Accuracy',
          `${stats.accuracy}%`,
          '#EF4444'
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {renderQuickAction(
            <MaterialIcons name="camera-alt" size={24} color="#4F46E5" />,
            'New Scan',
            handleStartClassification
          )}
          {renderQuickAction(
            <MaterialIcons name="add-circle" size={24} color="#F59E0B" />,
            'Add Animal',
            () => navigation.navigate('AddAnimal')
          )}
          {renderQuickAction(
            <MaterialIcons name="analytics" size={24} color="#EF4444" />,
            'Reports',
            () => navigation.navigate('Reports')
          )}
        </View>
      </View>

      {/* Recent Scans */}
      <View style={[styles.section, { flex: 1 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentScans.length > 0 ? (
          <FlatList
            data={recentScans}
            keyExtractor={(item) => item._id || item.id || item.animalId}
            renderItem={renderScanItem}
            scrollEnabled={false}
            contentContainerStyle={styles.scansList}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="pets" size={48} color="#E5E7EB" />
            <Text style={styles.emptyText}>No recent saves</Text>
            <Text style={styles.emptySubtext}>Start by capturing a new scan</Text>
            <TouchableOpacity 
              style={styles.emptyBtn}
              onPress={handleStartClassification}
            >
              <Text style={styles.emptyBtnText}>Start New Scan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginTop: 20,
    paddingLeft: 20,
  },
  statsContent: {
    paddingRight: 20,
    paddingBottom: 10,
  },
  statCard: {
    width: width * 0.4,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickAction: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },
  scansList: {
    paddingBottom: 40,
  },
  scanCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  scanInfo: {
    flex: 1,
    marginLeft: 12,
  },
  animalId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  animalBreed: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  scanDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animalDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default Home;
