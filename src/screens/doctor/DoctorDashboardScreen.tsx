import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert as RNAlert, // Renamed to avoid conflict
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';
import { usePatientData, PatientData } from '../../context/PatientDataContext';
import { formatTime } from '../../utils/dateUtils';

type DoctorDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'DoctorDashboard'>;

interface Props {
  navigation: DoctorDashboardNavigationProp;
}

// Rename the interface to avoid conflict
interface PatientAlert {
  id: string;
  patientName: string;
  message: string;
  time: string;
  status: 'critical' | 'warning';
  patientId: string;
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  image?: any;
}

const DoctorDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { patients, alerts, loadPatientData } = usePatientData();
  const doctorName = "Dr. Smith"; // This should come from authentication context

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadPatientData();
      } catch (error) {
        setError('Failed to load dashboard data. Please check your connection.');
        RNAlert.alert('Error', 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const displayAlerts = useMemo(() =>
    (alerts || []).map(alert => ({
      id: alert.id,
      patientName: alert.patientName || 'Unknown Patient',
      message: alert.message || 'No message available',
      time: formatTime(alert.time) || 'Unknown time',
      status: alert.status || 'warning',
      patientId: alert.patientId
    })).sort((a, b) =>
      a.status === 'critical' ? -1 : b.status === 'critical' ? 1 : 0
    ),
    [alerts]
  );

  const patientAppointments = useMemo(() =>
    (patients || []).map((patient, index) => ({
      id: `appt-${patient.id}-${index}`,
      patientName: patient.name || 'Unknown Patient',
      time: `${9 + (index % 8)}:00 AM`, // Limit to 8 hours of appointments
      type: index % 2 === 0 ? 'Check-up' : 'Follow-up',
    })).slice(0, 8), // Limit to 8 appointments
    [patients]
  );

  const renderAlertItem = ({ item }: { item: PatientAlert }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => {
        navigation.navigate('PatientDetails', { patientId: item.patientId });
      }}
    >
      <View style={[
        styles.alertIndicator,
        { backgroundColor: item.status === 'critical' ? '#FF5252' : '#FFC107' }
      ]} />
      <View style={styles.alertContent}>
        <Text style={styles.alertPatientName}>{item.patientName}</Text>
        <Text style={styles.alertMessage}>{item.message}</Text>
        <Text style={styles.alertTime}>{item.time}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#4A4A4A" />
    </TouchableOpacity>
  );

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentTimeContainer}>
        <Text style={styles.appointmentTime}>{item.time}</Text>
      </View>
      <View style={styles.appointmentDivider} />
      <View style={styles.appointmentDetails}>
        <View style={[styles.patientImage, { backgroundColor: '#E0E0E0' }]}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentPatientName}>{item.patientName}</Text>
          <Text style={styles.appointmentType}>{item.type}</Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadPatientData()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.doctorName}>{doctorName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PatientList', { filter: '', sortBy: 'name' })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="people" size={24} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PatientAlerts')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="notifications" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Appointment')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="calendar" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E0F7FA' }]}>
              <Ionicons name="chatbubbles" size={24} color="#00BCD4" />
            </View>
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Alerts */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('PatientAlerts')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {displayAlerts.length > 0 ? (
            <FlatList
              data={displayAlerts}
              renderItem={renderAlertItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No alerts at this time</Text>
            </View>
          )}
        </View>

        {/* Today's Appointments */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Appointment')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {patientAppointments.length > 0 ? (
            <FlatList
              data={patientAppointments}
              renderItem={renderAppointmentItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No appointments today</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    width: '22%',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#4A4A4A',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  seeAllButton: {
    paddingVertical: 5,
  },
  seeAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  appointmentTimeContainer: {
    backgroundColor: '#E8F5E9',
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  appointmentDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  appointmentDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  patientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentPatientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DoctorDashboardScreen;