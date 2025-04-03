import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Share,
  Modal,
  Keyboard,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePatientData } from '../context/PatientDataContext';
import { healthAnalysisService } from '../services/HealthAnalysisService';
import { healthMonitoringService } from '../services/HealthMonitoringService';
import { securityService } from '../services/SecurityService';
import { HealthData, HealthStatus } from '../services/HealthAnalysisService';
import { LineChart } from 'react-native-chart-kit';

// Define types
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type MetricType = 'bloodPressure' | 'heartRate' | 'temperature' | 'oxygenLevel' | 'weight';

type HealthMetric = {
  type: MetricType;
  value: string;
  unit: string;
  timestamp: Date;
};

type AnalysisResult = {
  status: HealthStatus;
  analysis: string;
  metrics: {
    [key: string]: {
      value: number;
      status: HealthStatus;
    };
  };
};

const HealthMonitoringScreen: React.FC = () => {
  // State variables
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMetric, setCurrentMetric] = useState<string | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [healthData, setHealthData] = useState<HealthData>({
    heartRate: 0,
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    temperature: 0,
    oxygenLevel: 0,
    weight: 0
  });

  // References
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Context
  const { currentPatient, updatePatient, addAlert } = usePatientData();

  // Initial message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: `Hello${currentPatient ? ' ' + currentPatient.name : ''}! I'm your health monitoring assistant. What health metric would you like to record today?\n\n1. Blood Pressure\n2. Heart Rate\n3. Temperature\n4. Weight\n5. Oxygen Level`,
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Load unread alerts count
    setUnreadAlerts(healthMonitoringService.getUnreadAlertsCount());
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Function to validate metric values
  const validateMetricValue = (metric: string, value: string): boolean => {
    switch (metric.toLowerCase()) {
      case 'blood pressure':
        const bpMatch = /^\d{2,3}\/\d{2,3}$/.test(value);
        if (!bpMatch) return false;
        
        const [systolic, diastolic] = value.split('/').map(Number);
        if (systolic <= diastolic) return false;
        
        setHealthData(prev => ({
          ...prev,
          bloodPressureSystolic: systolic,
          bloodPressureDiastolic: diastolic
        }));
        return true;

      case 'heart rate':
        const hrValid = /^\d{2,3}$/.test(value) && Number(value) > 30 && Number(value) < 220;
        if (hrValid) {
          setHealthData(prev => ({
            ...prev,
            heartRate: Number(value)
          }));
        }
        return hrValid;

      case 'temperature':
        const tempValid = /^\d{2}(\.\d)?$/.test(value) && Number(value) >= 35 && Number(value) <= 42;
        if (tempValid) {
          setHealthData(prev => ({
            ...prev,
            temperature: Number(value)
          }));
        }
        return tempValid;

      case 'oxygen level':
        const o2Valid = /^\d{2}(\.\d)?$/.test(value) && Number(value) >= 80 && Number(value) <= 100;
        if (o2Valid) {
          setHealthData(prev => ({
            ...prev,
            oxygenLevel: Number(value)
          }));
        }
        return o2Valid;

      case 'weight':
        return /^\d{2,3}(\.\d)?$/.test(value) && Number(value) > 20 && Number(value) < 300;

      default:
        return false;
    }
  };

  // Function to get metric format instructions
  const getMetricFormat = (metric: string): string => {
    switch (metric.toLowerCase()) {
      case 'blood pressure': return 'Format: systolic/diastolic (e.g., 120/80)';
      case 'heart rate': return 'Format: beats per minute (e.g., 72)';
      case 'temperature': return 'Format: Celsius (e.g., 36.8)';
      case 'weight': return 'Format: kilograms (e.g., 70.5)';
      case 'oxygen level': return 'Format: percentage (e.g., 98)';
      default: return '';
    }
  };

  // Function to map metric type to enum
  const mapMetricTypeToEnum = (metric: string): MetricType => {
    const metricMap: Record<string, MetricType> = {
      'blood pressure': 'bloodPressure',
      'heart rate': 'heartRate',
      'temperature': 'temperature',
      'weight': 'weight',
      'oxygen level': 'oxygenLevel'
    };
    
    return metricMap[metric.toLowerCase()] || 'heartRate';
  };

  // Function to get metric unit
  const getMetricUnit = (metric: string): string => {
    switch (metric.toLowerCase()) {
      case 'blood pressure': return 'mmHg';
      case 'heart rate': return 'bpm';
      case 'temperature': return '°C';
      case 'weight': return 'kg';
      case 'oxygen level': return '%';
      default: return '';
    }
  };

  // Function to check for abnormalities in health metrics
  const checkForAbnormalities = (metric: HealthMetric): HealthStatus => {
    const value = parseFloat(metric.value);
    
    switch (metric.type) {
      case 'bloodPressure':
        const [systolic, diastolic] = metric.value.split('/').map(Number);
        if (systolic >= 180 || diastolic >= 120) return 'critical';
        if (systolic >= 140 || diastolic >= 90) return 'warning';
        if (systolic <= 90 || diastolic <= 60) return 'warning';
        return 'normal';

      case 'heartRate':
        if (value >= 120 || value <= 50) return 'critical';
        if (value >= 100 || value <= 60) return 'warning';
        return 'normal';

      case 'temperature':
        if (value >= 39 || value <= 35) return 'critical';
        if (value >= 38 || value <= 36) return 'warning';
        return 'normal';

      case 'oxygenLevel':
        if (value <= 90) return 'critical';
        if (value <= 94) return 'warning';
        return 'normal';

      case 'weight':
        return 'normal';

      default:
        return 'normal';
    }
  };

  // Function to update suggestions based on context
  const updateSuggestions = (context: string | null) => {
    if (context === 'blood pressure') {
      setSuggestions(['120/80', '130/85', '110/70']);
    } else if (context === 'heart rate') {
      setSuggestions(['72', '75', '80']);
    } else if (context === 'temperature') {
      setSuggestions(['36.5', '37.0', '36.8']);
    } else if (context === 'oxygen level') {
      setSuggestions(['98', '99', '97']);
    } else if (context === 'weight') {
      setSuggestions(['65', '70', '75']);
    } else if (context === null && messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      // After AI response with analysis
      if (messages[messages.length - 1].text.includes('Would you like more detailed information?')) {
        setSuggestions(['details', 'yes', 'no']);
      }
      // Default suggestions after AI response
      else if (messages[messages.length - 1].text.includes('Would you like to record another metric?')) {
        setSuggestions(['Blood Pressure', 'Heart Rate', 'Temperature', 'Oxygen Level', 'Weight', 'analyze']);
      }
      // Default suggestions
      else {
        setSuggestions(['Blood Pressure', 'Heart Rate', 'Temperature', 'Oxygen Level', 'Weight']);
      }
    }
  };

  useEffect(() => {
    updateSuggestions(currentMetric);
  }, [currentMetric, messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleHealthMetricResponse = (userInput: string) => {
    let aiResponse: Message;

    // Check if user is authenticated before processing any input
    if (!securityService.isAuthenticated()) {
      aiResponse = {
        id: Date.now().toString(),
        text: "Please authenticate first to access and save health data.",
        sender: 'ai',
        timestamp: new Date(),
      };
      return aiResponse;
    }

    // Check if we're waiting for a specific metric value
    if (currentMetric) {
      // Validate and process the metric value
      const isValid = validateMetricValue(currentMetric, userInput);

      if (isValid) {
        // Store the metric
        const newMetric: HealthMetric = {
          type: mapMetricTypeToEnum(currentMetric),
          value: userInput,
          unit: getMetricUnit(currentMetric),
          timestamp: new Date(),
        };

        setHealthMetrics(prev => [...prev, newMetric]);

        // Update patient data in context if available
        if (currentPatient) {
          const updatedPatient = {
            ...currentPatient,
            healthMetrics: [
              ...(currentPatient.healthMetrics || []),
              {
                name: currentMetric,
                value: userInput,
                unit: getMetricUnit(currentMetric),
                status: checkForAbnormalities(newMetric),
                icon: 'pulse'
              }
            ],
            healthHistory: [
              ...(currentPatient.healthHistory || []),
              {
                date: new Date().toISOString(),
                bloodPressure: currentMetric === 'blood pressure' ? userInput : '',
                heartRate: currentMetric === 'heart rate' ? Number(userInput) : 0,
                bloodSugar: 0
              }
            ],
            status: checkForAbnormalities(newMetric)
          };
        
          updatePatient(currentPatient.id, updatedPatient);

          // Check for abnormalities and generate alerts
          const status = checkForAbnormalities(newMetric);
          if (status !== 'normal') {
            const alertMessage = `Abnormal ${currentMetric} reading: ${userInput} ${getMetricUnit(currentMetric)}`;

            // Add to local alerts
            try {
              healthMonitoringService.createAlert({
                id: `alert-${Date.now()}`,
                message: alertMessage,
                status: status as HealthStatus,
                timestamp: new Date(),
                metrics: {
                  [mapMetricTypeToEnum(currentMetric)]: {
                    value: parseFloat(userInput),
                    status: status as HealthStatus
                  }
                }
              });
            } catch (error) {
              console.error("Error creating alert:", error);
            }

            // Update context alerts if patient exists
            addAlert({
              id: `alert-${Date.now()}`,
              patientId: currentPatient.id,
              patientName: currentPatient.name,
              message: alertMessage,
              time: new Date().toISOString(),
              status, 
              read: false
            });

            // Update unread alerts count
            setUnreadAlerts(healthMonitoringService.getUnreadAlertsCount());
          }
        }

        aiResponse = {
          id: Date.now().toString(),
          text: `Great! I've recorded your ${currentMetric} as ${userInput}${getMetricUnit(currentMetric) ? ' ' + getMetricUnit(currentMetric) : ''}.\n\nWould you like to record another metric?`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setCurrentMetric(null);
        return aiResponse;
      } else {
        aiResponse = {
          id: Date.now().toString(),
          text: `That doesn't look like a valid ${currentMetric} value. ${getMetricFormat(currentMetric)}`,
          sender: 'ai',
          timestamp: new Date(),
        };
        return aiResponse;
      }
    }

    // Process metric selection
    switch (userInput.toLowerCase()) {
      case '1':
      case 'blood pressure':
      case 'bp':
        setCurrentMetric('blood pressure');
        aiResponse = {
          id: Date.now().toString(),
          text: 'Please enter your blood pressure in the format "systolic/diastolic" (e.g., 120/80):',
          sender: 'ai',
          timestamp: new Date(),
        };
        break;

      case '2':
      case 'heart rate':
      case 'hr':
        setCurrentMetric('heart rate');
        aiResponse = {
          id: Date.now().toString(),
          text: 'Please enter your heart rate in beats per minute (e.g., 72):',
          sender: 'ai',
          timestamp: new Date(),
        };
        break;

      case '3':
      case 'temperature':
      case 'temp':
        setCurrentMetric('temperature');
        aiResponse = {
          id: Date.now().toString(),
          text: 'Please enter your temperature in Celsius (e.g., 36.8):',
          sender: 'ai',
          timestamp: new Date(),
        };
        break;

      case '4':
      case 'weight':
      case 'wt':
        setCurrentMetric('weight');
        aiResponse = {
          id: Date.now().toString(),
          text: 'Please enter your weight in kilograms (e.g., 70.5):',
          sender: 'ai',
          timestamp: new Date(),
        };
        break;

      case '5':
      case 'oxygen level':
      case 'o2':
      case 'oxygen':
        setCurrentMetric('oxygen level');
        aiResponse = {
          id: Date.now().toString(),
          text: 'Please enter your oxygen level in percentage (e.g., 98):',
          sender: 'ai',
          timestamp: new Date(),
        };
        break;

      case 'analyze':
      case 'analysis':
      case 'check':
        const result = analyzeHealthData();
        if (result) {
          aiResponse = {
            id: Date.now().toString(),
            text: `Based on my analysis of your health metrics:\n\n${result.analysis}\n\nWould you like more detailed information?`,
            sender: 'ai',
            timestamp: new Date(),
          };
          setAnalysisResult(result);
        } else {
          aiResponse = {
            id: Date.now().toString(),
            text: 'I need more health metrics to perform an analysis. Please provide at least your blood pressure, heart rate, and temperature.',
            sender: 'ai',
            timestamp: new Date(),
          };
        }
        break;

      case 'done':
      case 'finish':
      case 'exit':
        aiResponse = {
          id: Date.now().toString(),
          text: 'Thank you for updating your health metrics! Is there anything else you\'d like to know about your health data?',
          sender: 'ai',
          timestamp: new Date(),
        };
        break;

      case 'details':
      case 'more info':
      case 'more information':
      case 'yes':
        if (analysisResult) {
          setShowAnalysisModal(true);
          aiResponse = {
            id: Date.now().toString(),
            text: 'Opening detailed analysis view for you.',
            sender: 'ai',
            timestamp: new Date(),
          };
        } else {
          aiResponse = {
            id: Date.now().toString(),
            text: 'I don\'t have any analysis results to show you yet. Would you like to record your health metrics and then analyze them?',
            sender: 'ai',
            timestamp: new Date(),
          };
        }
        break;

      default:
        aiResponse = {
          id: Date.now().toString(),
          text: 'I didn\'t understand that. What health metric would you like to record?',
          sender: 'ai',
          timestamp: new Date(),
        };
    }

    return aiResponse;
  };

  const analyzeHealthData = () => {
    // Check if user is authenticated before analyzing
    if (!securityService.isAuthenticated()) {
      Alert.alert(
        "Authentication Required",
        "Please log in to analyze and save your health data.",
        [{ text: "OK" }]
      );
      return null;
    }

    // Check if we have enough data to analyze
    if (healthData.heartRate === 0 ||
      healthData.bloodPressureSystolic === 0 ||
      healthData.temperature === 0) {
      return null;
    }

    // If oxygen level is not set, use a default value
    if (healthData.oxygenLevel === 0) {
      setHealthData(prev => ({ ...prev, oxygenLevel: 97 }));
    }

    // Analyze using the SVM service
    const result = healthAnalysisService.analyzeHealthData(healthData);

    try {
      // Make sure we have a valid patient ID before saving
      if (currentPatient && currentPatient.id) {
        // Save the result to the monitoring service with patient ID
        healthMonitoringService.saveHealthData(
          healthData, 
          result.status
        );
        
        // Update unread alerts count
        setUnreadAlerts(healthMonitoringService.getUnreadAlertsCount());
      } else {
        throw new Error("Invalid patient data");
      }
    } catch (error) {
      console.error("Error saving health data:", error);
      Alert.alert(
        "Error",
        "There was a problem saving your health data. Please try again.",
        [{ text: "OK" }]
      );
    }

    return result;
  };

  const getStatusColor = (status: HealthStatus): string => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'warning': return '#FFC107';
      case 'critical': return '#FF5252';
      default: return '#9E9E9E';
    }
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      setIsTyping(true);
      const aiResponse = handleHealthMetricResponse(userMessage.text);

      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, aiResponse]);
      }, Math.min(1500, aiResponse.text.length * 20));
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    const aiResponse = handleHealthMetricResponse(suggestion);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, aiResponse]);
    }, Math.min(1500, aiResponse.text.length * 20));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExportFile = (fileType: string) => {
    console.log(`Exporting as ${fileType}`);
    setShowExportModal(false);
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
  };

  const handleImportFile = (fileType: string) => {
    console.log(`Importing ${fileType} file`);
    setShowImportModal(false);
  };

  const handleViewAlerts = () => {
    setShowAlertsModal(true);
  };

  const clearAllAlerts = () => {
    healthMonitoringService.markAllAlertsAsSeen();
    setUnreadAlerts(0);
    Alert.alert(
      "Notifications Cleared",
      "All health alerts have been marked as read.",
      [{ text: "OK" }]
    );
  };

  const toggleMonitoring = () => {
    const currentConfig = healthMonitoringService.getMonitoringConfig();
    const newActiveState = !currentConfig.isActive;

    healthMonitoringService.updateMonitoringConfig({
      isActive: newActiveState
    });

    Alert.alert(
      "Health Monitoring",
      `Health monitoring has been ${newActiveState ? 'activated' : 'deactivated'}.`,
      [{ text: "OK" }]
    );

    if (!newActiveState) {
      Alert.alert(
        "Clear Notifications?",
        "Would you like to clear all health alert notifications?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: clearAllAlerts }
        ]
      );
    }
  };

  const handleAnalysisButton = () => {
    if (analysisResult) {
      setShowAnalysisModal(true);
    } else {
      Alert.alert(
        "No Analysis Available",
        "Please record your health metrics and analyze them first.",
        [{ text: "OK" }]
      );
    }
  };

  const renderMessageItem = ({ item: message }: { item: Message }) => (
    <View
      style={[
        styles.messageWrapper,
        message.sender === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
      ]}
    >
      {message.sender === 'ai' && (
        <View style={styles.aiAvatar}>
          <Ionicons name="medical" size={20} color="#fff" />
        </View>
      )}
      <View
        style={[
          styles.message,
          message.sender === 'user' ? styles.userMessage : styles.aiMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.sender === 'user' ? styles.userMessageTime : styles.aiMessageTime,
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Health Assistant</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleAnalysisButton}>
            <Ionicons name="analytics-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowExportModal(true)}>
            <Ionicons name="share-outline" size={24} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleViewAlerts}>
            <Ionicons name="notifications-outline" size={24} color="#4A4A4A" />
            {unreadAlerts > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadAlerts}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(message => renderMessageItem({ item: message }))}
        {isTyping && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="medical" size={20} color="#fff" />
            </View>
            <View style={[styles.message, styles.aiMessage, styles.typingIndicator]}>
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      {!keyboardVisible && suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        style={styles.inputContainer}
      >
        <TouchableOpacity
          style={[styles.inputButton, isRecording && styles.recordingButton]}
          onPress={handleVoiceInput}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic-outline'}
            size={24}
            color={isRecording ? '#FF5252' : '#4A4A4A'}
          />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#9E9E9E"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          multiline
        />
        <TouchableOpacity
          style={[styles.inputButton, newMessage.trim() ? styles.sendButton : {}]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={24}
            color={newMessage.trim() ? '#4CAF50' : '#9E9E9E'}
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExportModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export Health Data</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleExportFile('pdf')}
            >
              <Ionicons name="document-text-outline" size={24} color="#4A4A4A" />
              <Text style={styles.modalOptionText}>Export as PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleExportFile('csv')}
            >
              <Ionicons name="document-outline" size={24} color="#4A4A4A" />
              <Text style={styles.modalOptionText}>Export as CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowExportModal(false);
                setShowImportModal(true);
              }}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#4A4A4A" />
              <Text style={styles.modalOptionText}>Import Data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionCancel]}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalOptionCancelText}></Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImportModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Health Data</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImportFile('csv')}
            >
              <Ionicons name="document-outline" size={24} color="#4A4A4A" />
              <Text style={styles.modalOptionText}>Import from CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImportFile('json')}
            >
              <Ionicons name="code-outline" size={24} color="#4A4A4A" />
              <Text style={styles.modalOptionText}>Import from JSON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionCancel]}
              onPress={() => setShowImportModal(false)}
            >
              <Text style={styles.modalOptionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Alerts Modal */}
      <Modal
        visible={showAlertsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlertsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAlertsModal(false)}
        >
          <View style={[styles.modalContent, styles.alertsModalContent]}>
            <Text style={styles.modalTitle}>Health Alerts</Text>
            <FlatList
              data={healthMonitoringService.getAlerts()}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[
                  styles.alertItem,
                  item.status === 'critical' && styles.alertItemCritical,
                  item.status === 'warning' && styles.alertItemWarning
                ]}>
                  <Text style={styles.alertItemText}>{item.message}</Text>
                  <Text style={styles.alertItemTime}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.noAlertsText}>No health alerts to display</Text>
              }
            />
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionCancel]}
              onPress={() => setShowAlertsModal(false)}
            >
              <Text style={styles.modalOptionCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        visible={showAnalysisModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAnalysisModal(false)}
        >
          <View style={[styles.modalContent, styles.analysisModalContent]}>
            <Text style={styles.modalTitle}>Detailed Health Analysis</Text>
            {analysisResult && (
              <>
                <View style={styles.analysisSummary}>
                  <Text style={styles.analysisSummaryText}>
                    Overall Status: <Text style={{ color: getStatusColor(analysisResult.status) }}>
                      {analysisResult.status.toUpperCase()}
                    </Text>
                  </Text>
                </View>
                <ScrollView style={styles.analysisDetails}>
                  <Text style={styles.analysisDetailsText}>
                    {analysisResult.analysis}
                  </Text>
                  <View style={styles.analysisChart}>
                    <LineChart
                      data={{
                        labels: ['Heart Rate', 'BP Sys', 'BP Dia', 'Temp', 'O2'],
                        datasets: [
                          {
                            data: [
                              healthData.heartRate,
                              healthData.bloodPressureSystolic,
                              healthData.bloodPressureDiastolic,
                              healthData.temperature,
                              healthData.oxygenLevel
                            ],
                            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                            strokeWidth: 2
                          }
                        ]
                      }}
                      width={Dimensions.get('window').width - 80}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                          borderRadius: 16
                        },
                        propsForDots: {
                          r: '6',
                          strokeWidth: '2',
                          stroke: '#4CAF50'
                        }
                      }}
                      bezier
                      style={{
                        marginVertical: 8,
                        borderRadius: 16
                      }}
                    />
                  </View>
                </ScrollView>
              </>
            )}
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionCancel]}
              onPress={() => setShowAnalysisModal(false)}
            >
              <Text style={styles.modalOptionCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
  },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  typingIndicator: {
    padding: 8,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9E9E9E',
    marginHorizontal: 2,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  userMessageTime: {
    color: '#e0e0e0',
  },
  aiMessageTime: {
    color: '#9E9E9E',
  },
  suggestionsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
  },
  suggestionsContent: {
    paddingHorizontal: 8,
  },
  suggestionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    marginHorizontal: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    fontSize: 16,
    color: '#333333',
  },
  inputButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  recordingButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
  },
  sendButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  alertsModalContent: {
    maxHeight: '70%',
  },
  analysisModalContent: {
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
  },
  modalOptionCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8,
  },
  modalOptionCancelText: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: 'bold',
  },
  alertItem: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  alertItemCritical: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  alertItemWarning: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  alertItemText: {
    fontSize: 14,
    color: '#333333',
  },
  alertItemTime: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  noAlertsText: {
    textAlign: 'center',
    padding: 16,
    color: '#9E9E9E',
  },
  analysisSummary: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  analysisSummaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  analysisDetails: {
    flex: 1,
  },
  analysisDetailsText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 20,
  },
  analysisChart: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default HealthMonitoringScreen;
              