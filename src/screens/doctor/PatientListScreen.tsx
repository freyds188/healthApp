import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';
import { usePatientData } from '../../context/PatientDataContext';

type PatientListNavigationProp = StackNavigationProp<RootStackParamList, 'PatientList'>;

interface Props {
  navigation: PatientListNavigationProp;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastCheckup: string;
  status: 'normal' | 'warning' | 'critical';
}

// Mock patient data
const mockPatients: Patient[] = [
  {
    id: '101',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    condition: 'Hypertension',
    lastCheckup: '2 days ago',
    status: 'critical',
  },
  {
    id: '102',
    name: 'Sarah Johnson',
    age: 32,
    gender: 'Female',
    condition: 'Diabetes Type 2',
    lastCheckup: '1 week ago',
    status: 'warning',
  },
  {
    id: '103',
    name: 'Michael Brown',
    age: 58,
    gender: 'Male',
    condition: 'Arthritis',
    lastCheckup: '3 days ago',
    status: 'normal',
  },
  {
    id: '104',
    name: 'Emily Davis',
    age: 27,
    gender: 'Female',
    condition: 'Asthma',
    lastCheckup: '2 weeks ago',
    status: 'normal',
  },
  {
    id: '105',
    name: 'Robert Wilson',
    age: 62,
    gender: 'Male',
    condition: 'Coronary Heart Disease',
    lastCheckup: '5 days ago',
    status: 'warning',
  },
  {
    id: '106',
    name: 'Jennifer Taylor',
    age: 41,
    gender: 'Female',
    condition: 'Migraine',
    lastCheckup: '1 month ago',
    status: 'normal',
  },
];

const PatientListScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { patients } = usePatientData();

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return '#FF5252';
      case 'warning':
        return '#FFC107';
      default:
        return '#4CAF50';
    }
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity 
      style={styles.patientCard}
      onPress={() => navigation.navigate('PatientDetails', { patientId: item.id })}
    >
      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <View style={styles.patientDetails}>
          <Text style={styles.detailText}>{item.age} yrs • {item.gender}</Text>
          <Text style={styles.conditionText}>{item.condition}</Text>
        </View>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.lastCheckup}>Last checkup</Text>
        <Text style={styles.checkupDate}>{item.lastCheckup}</Text>
        <Ionicons name="chevron-forward" size={20} color="#4A4A4A" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('DoctorDashboard')}
        >
          <Ionicons name="arrow-back" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Patients</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name or condition"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterChip, styles.activeFilterChip]}>
          <Text style={styles.activeFilterText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <View style={[styles.statusDot, { backgroundColor: '#FF5252' }]} />
          <Text style={styles.filterText}>Critical</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <View style={[styles.statusDot, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.filterText}>Warning</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.filterText}>Normal</Text>
        </TouchableOpacity>
      </View>

      {/* Patient List */}
      <FlatList
        data={filteredPatients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />

      {/* Add Patient Button */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#4A4A4A',
  },
  clearButton: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  activeFilterChip: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#4A4A4A',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  listContainer: {
    padding: 20,
    paddingTop: 5,
  },
  patientCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  patientDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  conditionText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  lastCheckup: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  checkupDate: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default PatientListScreen;