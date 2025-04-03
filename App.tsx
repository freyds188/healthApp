// Add console log handling for production and development
if (!__DEV__) {
  // Disable all console logs in production
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
} else {
  // In development, filter out specific warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && args[0].includes && args[0].includes('encountered two children')) {
      return; // Suppress this specific warning
    }
    originalConsoleWarn(...args);
  };
}

import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LandingScreen from './src/components/LandingScreen';
import HealthMonitoringScreen from './src/components/HealthMonitoringScreen';
import LoginScreen from './src/components/LoginScreen';
import RegisterScreen from './src/components/RegisterScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import TermsAndConditionsScreen from './src/screens/TermsAndConditionsScreen';
// Import doctor screens
import DoctorDashboardScreen from './src/screens/doctor/DoctorDashboardScreen';
import PatientListScreen from './src/screens/doctor/PatientListScreen';
import PatientDetailsScreen from './src/screens/doctor/PatientDetailsScreen';
import PatientAlertsScreen from './src/screens/doctor/PatientAlertsScreen';
import DoctorRegisterScreen from './src/screens/doctor/DoctorRegisterScreen';
import { PatientDataProvider } from './src/context/PatientDataContext';

// Define the type for our stack parameter list
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Landing: undefined;
  Home: undefined;
  Appointment: undefined;
  Messages: undefined;
  TermsAndConditions: {
    terms: string[];
  };
  // Doctor screens
  DoctorRegister: undefined;
  DoctorDashboard: undefined;
  PatientList: {
    filter?: string; // Add optional filter parameter
    sortBy?: 'name' | 'status' | 'lastCheckup'; // Add sorting options
  };
  PatientDetails: {
    patientId: string;
  };
  PatientAlerts: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  // Create a navigation reference to help with debugging
  const navigationRef = useRef(null);

  return (
    <PatientDataProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#98D8AA" />
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            console.log('Navigation is ready');
          }}
          onStateChange={(state) => {
            // Optional: Log navigation state changes for debugging
            console.log('New navigation state:', state);
          }}
        >
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#f5f5f5' },
              headerStyle: {
                backgroundColor: '#98D8AA',
                elevation: 0,
                shadowOpacity: 0,
              },
              headerTintColor: '#2E4F4F',
              headerTitleStyle: {
                fontWeight: '600',
                color: '#2E4F4F',
              },
              headerLeftContainerStyle: {
                paddingLeft: 10,
              },
              headerRightContainerStyle: {
                paddingRight: 10,
              },
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
            />
            <Stack.Screen 
              name="Landing" 
              component={LandingScreen}
            />
            <Stack.Screen 
              name="Home" 
              component={HealthMonitoringScreen}
              options={{
                headerShown: false,
                title: 'Health Monitoring',
              }}
            />
            <Stack.Screen 
              name="Appointment" 
              component={AppointmentScreen}
            />
            <Stack.Screen 
              name="Messages" 
              component={MessagesScreen}
            />
            <Stack.Screen 
              name="TermsAndConditions" 
              component={TermsAndConditionsScreen}
            />
            {/* Doctor screens */}
            <Stack.Screen 
              name="DoctorRegister" 
              component={DoctorRegisterScreen}
            />
            <Stack.Screen 
              name="DoctorDashboard" 
              component={DoctorDashboardScreen}
            />
            <Stack.Screen 
              name="PatientList" 
              component={PatientListScreen}
            />
            <Stack.Screen 
              name="PatientDetails" 
              component={PatientDetailsScreen}
            />
            <Stack.Screen 
              name="PatientAlerts" 
              component={PatientAlertsScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PatientDataProvider>
  );
}