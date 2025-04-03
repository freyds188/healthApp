import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';
import { securityService } from '../../services/SecurityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DoctorRegisterNavigationProp = StackNavigationProp<RootStackParamList, 'DoctorRegister'>;

interface Props {
  navigation: DoctorRegisterNavigationProp;
}

// Add ActivityIndicator to imports
import {
  ActivityIndicator
} from 'react-native';

// Move SecurityService initialization outside component
// securityService is already imported from SecurityService

const DoctorRegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospital, setHospital] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false); // Add loading state

  const validateStep1 = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Password strength validation
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!specialization || !licenseNumber || !hospital) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true); // Start loading
    try {
      const userData = {
        fullName,
        email,
        password,
        specialization,
        licenseNumber,
        hospital,
        role: 'doctor'
      };
  
      const result = await securityService.register(fullName, email, password);
      
      if (result.success) {
        await AsyncStorage.setItem(`doctor_info_${email}`, JSON.stringify({
          specialization,
          licenseNumber,
          hospital
        }));
        
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Please login to continue.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message || 'Unable to create account. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An unexpected error occurred during registration');
    } finally {
      setIsRegistering(false); // End loading
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (step === 1) {
                navigation.goBack();
              } else {
                setStep(1);
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#4A4A4A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Registration</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>
          <Text style={styles.stepText}>Step {step} of 2</Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          {step === 1 ? (
            <>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#999"
                />
              </View>

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

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Professional Information</Text>
              
              {/* Specialization Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="medical" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Specialization"
                  value={specialization}
                  onChangeText={setSpecialization}
                  placeholderTextColor="#999"
                />
              </View>

              {/* License Number Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Medical License Number"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Hospital/Clinic Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Hospital/Clinic"
                  value={hospital}
                  onChangeText={setHospital}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Terms and Conditions */}
              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={() => navigation.navigate('TermsAndConditions', {
                  terms: [
                    'I confirm that I am a licensed medical professional.',
                    'I agree to maintain patient confidentiality in accordance with HIPAA regulations.',
                    'I understand that my credentials will be verified before my account is activated.',
                    'I agree to the Terms of Service and Privacy Policy of HealthApp.'
                  ]
                })}
              >
                <Ionicons name="document-text-outline" size={20} color="#4CAF50" />
                <Text style={styles.termsText}>
                  By registering, you agree to our Terms and Conditions
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Next/Register Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleNextStep}>
            <Text style={styles.actionButtonText}>
              {step === 1 ? 'Next' : 'Register'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
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
  progressContainer: {
    paddingHorizontal: 30,
    marginTop: 20,
    marginBottom: 30,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 20,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 25,
  },
  termsText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
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
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default DoctorRegisterScreen;