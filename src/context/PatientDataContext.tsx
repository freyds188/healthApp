import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for health metrics
export interface HealthMetric {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
}

// Define types for health history
export interface HealthHistory {
  date: string;
  bloodPressure: string;
  heartRate: number;
  bloodSugar: number;
}

// Define types for patient data
export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastCheckup: string;
  status: 'normal' | 'warning' | 'critical';
  email: string;
  healthMetrics: HealthMetric[];
  healthHistory: HealthHistory[];
  alerts?: PatientAlert[];
}

// Define types for alerts
export interface PatientAlert {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  time: string;
  status: 'critical' | 'warning';
  read?: boolean;
  timestamp?: Date;
}

// Define context type
interface PatientDataContextType {
  patients: PatientData[];
  currentPatient: PatientData | null;
  alerts: PatientAlert[];
  setCurrentPatient: (patient: PatientData | null) => void;
  addPatient: (patient: PatientData) => void;
  updatePatient: (id: string, data: Partial<PatientData>) => void;
  addAlert: (alert: PatientAlert) => void;
  markAlertAsRead: (alertId: string) => void;
  getPatientById: (id: string) => PatientData | undefined;
  updatePatientHealthMetrics: (patientId: string, metrics: HealthMetric[]) => void;
  loadPatientData: () => Promise<void>;
}

// Create context
const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

// Sample patient data
const initialPatients: PatientData[] = [
  {
    id: '101',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    condition: 'Hypertension',
    lastCheckup: '2 days ago',
    status: 'critical',
    email: 'john@example.com',
    healthMetrics: [
      {
        name: 'Blood Pressure',
        value: '160/95',
        unit: 'mmHg',
        status: 'critical',
        icon: 'fitness',
      },
      {
        name: 'Heart Rate',
        value: '88',
        unit: 'bpm',
        status: 'normal',
        icon: 'heart',
      },
      {
        name: 'Blood Sugar',
        value: '110',
        unit: 'mg/dL',
        status: 'normal',
        icon: 'water',
      },
      {
        name: 'Oxygen Level',
        value: '97',
        unit: '%',
        status: 'normal',
        icon: 'pulse',
      },
      {
        name: 'Temperature',
        value: '98.6',
        unit: '°F',
        status: 'normal',
        icon: 'thermometer',
      },
    ],
    healthHistory: [
      { date: 'Mar 15', bloodPressure: '160/95', heartRate: 88, bloodSugar: 110 },
      { date: 'Mar 10', bloodPressure: '155/92', heartRate: 85, bloodSugar: 105 },
      { date: 'Mar 5', bloodPressure: '150/90', heartRate: 82, bloodSugar: 100 },
      { date: 'Feb 28', bloodPressure: '145/88', heartRate: 80, bloodSugar: 95 },
      { date: 'Feb 21', bloodPressure: '140/85', heartRate: 78, bloodSugar: 90 },
      { date: 'Feb 14', bloodPressure: '135/82', heartRate: 75, bloodSugar: 85 },
    ],
  },
];

// Initial alerts
const initialAlerts: PatientAlert[] = [
  {
    id: '1',
    patientId: '101',
    patientName: 'John Smith',
    message: 'High blood pressure: 160/95',
    time: '10 mins ago',
    status: 'critical',
    read: false,
    timestamp: new Date(),
  },
];

// Create provider component
export const PatientDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<PatientData[]>(initialPatients);
  const [currentPatient, setCurrentPatientState] = useState<PatientData | null>(null);
  const [alerts, setAlerts] = useState<PatientAlert[]>(initialAlerts);
  const [isLoading, setIsLoading] = useState(true);

  const checkForAbnormalities = (metric: HealthMetric): 'normal' | 'warning' | 'critical' => {
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    
    switch(metric.name) {
      case 'Blood Pressure':
        const [systolic, diastolic] = metric.value.split('/').map(Number);
        if (systolic > 140 || diastolic > 90) {
          status = 'critical';
        } else if (systolic > 130 || diastolic > 85) {
          status = 'warning';
        }
        break;
      case 'Heart Rate':
        const heartRate = Number(metric.value);
        if (heartRate > 100) {
          status = 'critical';
        } else if (heartRate > 90) {
          status = 'warning';
        }
        break;
      case 'Blood Sugar':
        const bloodSugar = Number(metric.value);
        if (bloodSugar > 180) {
          status = 'critical';
        } else if (bloodSugar > 140) {
          status = 'warning';
        }
        break;
      case 'Oxygen Level':
        const oxygenLevel = Number(metric.value);
        if (oxygenLevel < 92) {
          status = 'critical';
        } else if (oxygenLevel < 95) {
          status = 'warning';
        }
        break;
      case 'Temperature':
        const temp = Number(metric.value);
        if (temp > 100.4) {
          status = 'critical';
        } else if (temp > 99.5) {
          status = 'warning';
        }
        break;
    }
    
    return status;
  };
  
  const addPatient = (patient: PatientData) => {
    setPatients(prev => [...prev, patient]);
  };
  
  const setCurrentPatient = (patient: PatientData | null) => {
    if (patient === null) {
      setCurrentPatientState(null);
      return;
    }
    
    const existingPatient = patients.find(p => p.id === patient.id);
    
    if (!existingPatient) {
      addPatient(patient);
    }
    
    setCurrentPatientState(patient);
  };
  
  const updatePatientHealthMetrics = (patientId: string, metrics: HealthMetric[]) => {
    setPatients(prev => {
      return prev.map(patient => {
        if (patient.id === patientId) {
          const updatedPatient = { ...patient };
          const updatedAlerts = [...(updatedPatient.alerts || [])];
          
          const updatedMetrics = metrics.map(metric => {
            const status = checkForAbnormalities(metric);
            
            if (status !== 'normal' && (status !== metric.status)) {
              const newAlert = {
                id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                patientId: patient.id,
                patientName: patient.name,
                message: `${metric.name}: ${metric.value} ${metric.unit}`,
                time: new Date().toISOString(),
                status: status as 'warning' | 'critical',
                read: false
              };
              
              updatedAlerts.push(newAlert);
              setAlerts(prev => [...prev, newAlert]);
            }
            
            return { ...metric, status };
          });
          
          return { 
            ...updatedPatient,
            healthMetrics: updatedMetrics,
            alerts: updatedAlerts,
            status: updatedMetrics.some(m => m.status === 'critical') ? 'critical' : 
                   updatedMetrics.some(m => m.status === 'warning') ? 'warning' : 'normal'
          };
        }
        return patient;
      });
    });
  };

  const updatePatient = (id: string, data: Partial<PatientData>) => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === id ? { ...patient, ...data } : patient
      )
    );
    
    if (currentPatient?.id === id) {
      setCurrentPatient({ ...currentPatient, ...data });
    }
  };

  const addAlert = (alert: PatientAlert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };

  const getPatientById = (id: string) => {
    return patients.find(patient => patient.id === id);
  };

  const loadPatientData = async () => {
    try {
      // Implement actual data loading from storage
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading patient data:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, []);

  return (
    <PatientDataContext.Provider
      value={{
        patients,
        currentPatient,
        alerts,
        setCurrentPatient,
        addPatient,
        updatePatient,
        updatePatientHealthMetrics,
        addAlert,
        markAlertAsRead,
        getPatientById,
        loadPatientData,
      }}
    >
      {!isLoading ? children : null}
    </PatientDataContext.Provider>
  );
};

// Create hook for using the context
export const usePatientData = () => {
  const context = useContext(PatientDataContext);
  if (context === undefined) {
    throw new Error('usePatientData must be used within a PatientDataProvider');
  }
  return context;
};