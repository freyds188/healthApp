import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator, // Added missing import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import { LineChart } from 'react-native-chart-kit';
import { usePatientData } from '../../context/PatientDataContext';

type PatientDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'PatientDetails'>;
type PatientDetailsRouteProp = RouteProp<RootStackParamList, 'PatientDetails'>;

interface Props {
  navigation: PatientDetailsNavigationProp;
  route: PatientDetailsRouteProp;
}

interface HealthMetric {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
}

interface HealthHistory {
  date: string;
  bloodPressure: string;
  heartRate: number;
  bloodSugar: number;
}

// Add PatientData interface
interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  status: string;
  healthMetrics: HealthMetric[];
  healthHistory: HealthHistory[];
}

const PatientDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { getPatientById } = usePatientData();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState('Blood Pressure');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPatientDetails = async () => {
      try {
        const patientData = getPatientById(patientId);
        if (patientData) {
          setPatient(patientData);
        }
      } catch (error) {
        console.error('Error loading patient details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientDetails();
  }, [patientId, getPatientById]);

  if (isLoading || !patient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const patientName = patient?.name || 'Unknown';
  const patientAge = patient?.age || '--';
  const patientGender = patient?.gender || '--';
  const patientCondition = patient?.condition || 'None';

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

  const getChartData = () => {
    const historyData = patient?.healthHistory || [];
    if (!historyData.length) return { labels: [], datasets: [], legend: [] };

    switch (selectedMetric) {
      case 'Blood Pressure':
        return {
          labels: historyData.map(item => item.date).reverse(),
          datasets: [
            {
              data: historyData.map(item => parseInt(item.bloodPressure.split('/')[0])).reverse(),
              color: () => '#FF5252',
              strokeWidth: 2,
            },
            {
              data: historyData.map(item => parseInt(item.bloodPressure.split('/')[1])).reverse(),
              color: () => '#2196F3',
              strokeWidth: 2,
            },
          ],
          legend: ['Systolic', 'Diastolic'],
        };
      case 'Heart Rate':
        return {
          labels: historyData.map(item => item.date).reverse(),
          datasets: [
            {
              data: historyData.map(item => item.heartRate).reverse(),
              color: () => '#FF5252',
              strokeWidth: 2,
            },
          ],
          legend: ['BPM'],
        };
      case 'Blood Sugar':
        return {
          labels: historyData.map(item => item.date).reverse(),
          datasets: [
            {
              data: historyData.map(item => item.bloodSugar).reverse(),
              color: () => '#4CAF50',
              strokeWidth: 2,
            },
          ],
          legend: ['mg/dL'],
        };
      default:
        return {
          labels: [],
          datasets: [{ data: [] }],
          legend: [''],
        };
    }
  };

  const handleContactPatient = () => {
    navigation.navigate('Messages');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4A4A4A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleContactPatient}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#4A4A4A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Patient Info */}
        <View style={styles.patientInfoCard}>
          <View style={styles.patientBasicInfo}>
            <Text style={styles.patientName}>{patientName}</Text>
            <Text style={styles.patientDetails}>{patientAge} yrs • {patientGender}</Text>
            <View style={styles.conditionContainer}>
              <Text style={styles.conditionLabel}>Condition:</Text>
              <Text style={styles.conditionValue}>{patientCondition}</Text>
            </View>
          </View>
          <View style={styles.patientActions}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => Alert.alert('Medical History', 'View complete medical history')}
            >
              <Text style={styles.historyButtonText}>Medical History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Metrics */}
        <Text style={styles.sectionTitle}>Current Health Metrics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsContainer}>
          {patient.healthMetrics.map((metric, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.metricCard,
                selectedMetric === metric.name && styles.selectedMetricCard
              ]}
              onPress={() => setSelectedMetric(metric.name)}
            >
              <View style={[
                styles.metricIconContainer,
                { backgroundColor: getStatusColor(metric.status) + '20' }
              ]}>
                <Ionicons
                  name={metric.icon as any}
                  size={24}
                  color={getStatusColor(metric.status)}
                />
              </View>
              <Text style={styles.metricName}>{metric.name}</Text>
              <Text style={styles.metricValue}>{metric.value} <Text style={styles.metricUnit}>{metric.unit}</Text></Text>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(metric.status) }
              ]}>
                <Text style={styles.statusText}>{metric.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Health Trends */}
        <View style={styles.trendsContainer}>
          <Text style={styles.sectionTitle}>Health Trends</Text>
          <Text style={styles.trendSubtitle}>{selectedMetric} - Last 6 Readings</Text>

          <LineChart
            data={getChartData()}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationCard}>
            <Ionicons name="alert-circle" size={24} color="#FF5252" style={styles.recommendationIcon} />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>High Blood Pressure Alert</Text>
              <Text style={styles.recommendationText}>
                Patient's blood pressure readings are consistently high. Consider adjusting medication and scheduling a follow-up appointment.
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Ionicons name="fitness" size={24} color="#4CAF50" style={styles.recommendationIcon} />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Exercise Recommendation</Text>
              <Text style={styles.recommendationText}>
                Recommend 30 minutes of moderate exercise daily to help manage hypertension.
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Ionicons name="nutrition" size={24} color="#2196F3" style={styles.recommendationIcon} />
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>Dietary Changes</Text>
              <Text style={styles.recommendationText}>
                Suggest DASH diet to help lower blood pressure. Reduce sodium intake to less than 1,500mg per day.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Add loadingContainer to styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  // ... rest of the styles remain the same
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
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  patientInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  patientBasicInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 5,
  },
  patientDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 5,
  },
  conditionValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  patientActions: {
    justifyContent: 'center',
  },
  historyButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  historyButtonText: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 15,
    marginTop: 5,
  },
  metricsContainer: {
    paddingBottom: 10,
    paddingRight: 20,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedMetricCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 10,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  statusIndicator: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  trendsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trendSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  recommendationsContainer: {
    marginBottom: 30,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 5,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default PatientDetailsScreen;