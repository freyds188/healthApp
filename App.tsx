import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LandingScreen from './src/components/LandingScreen';
import HealthMonitoringScreen from './src/components/HealthMonitoringScreen';
import LoginScreen from './src/components/LoginScreen';
import RegisterScreen from './src/components/RegisterScreen';
import AppointmentScreen from './src/screens/AppointmentScreen';

// Define the type for our stack parameter list
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Landing: undefined;
  Home: undefined;
  Appointment: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#98D8AA" />
      <NavigationContainer>
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
              headerLeft: () => null,
            }}
          />
          <Stack.Screen 
            name="Appointment" 
            component={AppointmentScreen}
            options={{
              headerShown: false,
              title: 'Appointments',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}