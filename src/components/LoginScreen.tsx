import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { usePatientData, PatientData } from '../context/PatientDataContext';
import { securityService } from '../services/SecurityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  patientData?: Partial<PatientData>;
}

// Remove the local PatientData interface since we're importing it

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const { setCurrentPatient } = usePatientData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  
  
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
  
      // Validate inputs
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
  
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
  
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
  
      // For debugging - check if user exists in storage
      const userKey = `user_${trimmedEmail}`;
      const storedUser = await AsyncStorage.getItem(userKey);
      console.log('Stored user data:', storedUser);
  
      // Check if we need to use doctor or patient login flow
      if (isDoctor) {
        // Doctor login flow remains unchanged
        const result: LoginResponse = await securityService.login(trimmedEmail, trimmedPassword);
        
        if (result.success) {
          // Store user session
          await AsyncStorage.setItem('user_session', JSON.stringify({
            email: trimmedEmail,
            isDoctor: true,
            token: result.token || '',
            timestamp: new Date().toISOString()
          }));
  
          navigation.replace('DoctorDashboard');
        } else {
          setError(result.message || 'Login failed. Please check your credentials.');
        }
      } else {
        // Patient login flow - Try direct storage check first
        try {
          const userString = await AsyncStorage.getItem(`user_${trimmedEmail}`);
          
          if (userString) {
            const userData = JSON.parse(userString);
            
            // Check if password matches - SIMPLIFIED CHECK
            if (userData.password === trimmedPassword) {
              console.log('Local authentication successful');
              // Password matches, create session
              await AsyncStorage.setItem('user_session', JSON.stringify({
                email: trimmedEmail,
                isDoctor: false,
                token: 'local-auth-token',
                timestamp: new Date().toISOString()
              }));
              
              // Create patient data
              const patientData: PatientData = {
                id: userData.id || trimmedEmail,
                name: userData.fullName || userData.name || trimmedEmail.split('@')[0],
                email: trimmedEmail,
                age: userData.age || 0,
                gender: userData.gender || 'Unknown',
                condition: userData.condition || 'None',
                lastCheckup: userData.lastCheckup || new Date().toISOString(),
                status: userData.status || 'normal',
                healthMetrics: userData.healthMetrics || [],
                healthHistory: userData.healthHistory || [],
                alerts: userData.alerts || []
              };
              
              setCurrentPatient(patientData);
              navigation.replace('Landing');
              return;
            } else {
              console.log('Password mismatch in local authentication');
              setError('Invalid email or password');
              setIsLoading(false);
              return;
            }
          }
          
          // If direct check fails, try the service
          const result: LoginResponse = await securityService.login(trimmedEmail, trimmedPassword);
          
          if (result.success) {
            // Store user session
            await AsyncStorage.setItem('user_session', JSON.stringify({
              email: trimmedEmail,
              isDoctor: false,
              token: result.token || '',
              timestamp: new Date().toISOString()
            }));
  
            // Get user data from storage again (might have been updated by the service)
            const refreshedUserString = await AsyncStorage.getItem(`user_${trimmedEmail}`);
            let userData = null;
            
            if (refreshedUserString) {
              userData = JSON.parse(refreshedUserString);
            }
  
            // Create patient data
            const patientData: PatientData = {
              id: userData?.id || result.patientData?.id || trimmedEmail,
              name: userData?.fullName || userData?.name || result.patientData?.name || trimmedEmail.split('@')[0],
              email: trimmedEmail,
              age: userData?.age || result.patientData?.age || 0,
              gender: userData?.gender || result.patientData?.gender || 'Unknown',
              condition: userData?.condition || result.patientData?.condition || 'None',
              lastCheckup: userData?.lastCheckup || result.patientData?.lastCheckup || new Date().toISOString(),
              status: userData?.status || result.patientData?.status || 'normal',
              healthMetrics: userData?.healthMetrics || result.patientData?.healthMetrics || [],
              healthHistory: userData?.healthHistory || result.patientData?.healthHistory || [],
              alerts: userData?.alerts || result.patientData?.alerts || []
            };
            
            setCurrentPatient(patientData);
            navigation.replace('Landing');
          } else {
            setError(result.message || 'Login failed. Please check your credentials.');
          }
        } catch (err) {
          console.error('Error during patient login:', err);
          setError('Login failed. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>HealthApp</Text>
          <Text style={styles.tagline}>Your health, in your hands</Text>
        </View>

        <View style={styles.formContainer}>
          {/* User Type Toggle */}
          <View style={styles.userTypeContainer}>
            <Text style={[styles.userTypeText, !isDoctor && styles.activeUserType]}>Patient</Text>
            <Switch
              value={isDoctor}
              onValueChange={setIsDoctor}
              trackColor={{ false: '#98D8AA', true: '#4CAF50' }}
              thumbColor={isDoctor ? '#fff' : '#fff'}
              ios_backgroundColor="#98D8AA"
              style={styles.switch}
            />
            <Text style={[styles.userTypeText, isDoctor && styles.activeUserType]}>Doctor</Text>
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
        

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate(isDoctor ? 'DoctorRegister' : 'Register')}
            >
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E4F4F',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  userTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  userTypeText: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 10,
  },
  activeUserType: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#4A4A4A',
  },
  passwordToggle: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 15,
  },
});

export default LoginScreen;