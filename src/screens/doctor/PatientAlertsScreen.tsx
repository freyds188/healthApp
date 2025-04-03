import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';

type PatientAlertsNavigationProp = StackNavigationProp<RootStackParamList, 'PatientAlerts'>;
type PatientAlertsRouteProp = RouteProp<RootStackParamList, 'PatientAlerts'>;

interface Props {
  navigation: PatientAlertsNavigationProp;
  route: PatientAlertsRouteProp;
}

interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  timestamp: Date;
  status: 'warning' | 'critical';
  message: string;
  read: boolean;
}

const PatientAlertsScreen: React.FC<Props> = ({ navigation, route }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'unread'>('all');

  useEffect(() => {
    // In a real app, you would fetch alerts from your backend
    const mockAlerts: Alert[] = [
      {
        id: '1',
        patientId: '101',
        patientName: 'John Smith',
        timestamp: new Date(),
        status: 'critical',
        message: 'High blood pressure detected: 160/95',
        read: false,
      },
      {
        id: '2',
        patientId: '102',
        patientName: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'warning',
        message: 'Elevated heart rate: 110 BPM',
        read: false,
      },
      {
        id: '3',
        patientId: '103',
        patientName: 'Michael Brown',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        status: 'warning',
        message: 'Low oxygen level: 92%',
        read: true,
      },
      {
        id: '4',
        patientId: '101',
        patientName: 'John Smith',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        status: 'critical',
        message: 'Missed medication: Blood pressure medication',
        read: true,
      },
      {
        id: '5',
        patientId: '104',
        patientName: 'Emily Davis',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        status: 'warning',
        message: 'Asthma symptoms reported: Shortness of breath',
        read: true,
      },
    ];
    
    setAlerts(mockAlerts);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'critical':
        return alert.status === 'critical';
      case 'warning':
        return alert.status === 'warning';
      case 'unread':
        return !alert.read;
      default:
        return true;
    }
  });

  const markAsRead = (alertId: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const renderAlertItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity 
      style={[styles.alertCard, item.read ? styles.readAlert : styles.unreadAlert]}
      onPress={() => {
        markAsRead(item.id);
        navigation.navigate('PatientDetails', { patientId: item.patientId });
      }}
    >
      <View style={styles.alertHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'critical' ? '#FF5252' : '#FFC107' }
        ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.alertMessage}>{item.message}</Text>
      {!item.read && (
        <View style={styles.unreadIndicator} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Alerts</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            // In a real app, you would refresh alerts from your backend
            console.log('Refreshing alerts...');
          }}
        >
          <Ionicons name="refresh" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'critical' && styles.activeFilterTab]}
          onPress={() => setFilter('critical')}
        >
          <Text style={[styles.filterText, filter === 'critical' && styles.activeFilterText]}>Critical</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'warning' && styles.activeFilterTab]}
          onPress={() => setFilter('warning')}
        >
          <Text style={[styles.filterText, filter === 'warning' && styles.activeFilterText]}>Warning</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>Unread</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts List */}
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlertItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.emptyText}>No alerts found</Text>
          </View>
        }
      />
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingTop: 5,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  readAlert: {
    opacity: 0.8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
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
});

export default PatientAlertsScreen;