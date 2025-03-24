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
  Animated,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { healthAnalysisService, HealthData, HealthStatus } from '../services/HealthAnalysisService';
import { healthMonitoringService } from '../services/HealthMonitoringService';

type HealthMonitoringScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HealthMonitoringScreenNavigationProp;
};

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type HealthMetric = {
  type: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight' | 'oxygenLevel';
  value: string;
  unit: string;
  timestamp: Date;
};

const HealthMonitoringScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI health assistant. I\'ll help you track your vital signs and health metrics using advanced machine learning analysis.',
      sender: 'ai',
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'Let\'s start by recording your health metrics. Which would you like to record?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  
  // Add suggestions for quick responses
  const [suggestions, setSuggestions] = useState<string[]>([
    'Blood Pressure',
    'Heart Rate',
    'Temperature',
    'Oxygen Level',
    'Weight'
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [currentMetric, setCurrentMetric] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  const [healthData, setHealthData] = useState<HealthData>({
    heartRate: 0,
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    oxygenLevel: 0,
    temperature: 0
  });
  
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [analysisResult, setAnalysisResult] = useState<{
    status: HealthStatus;
    analysis: string;
    metrics: {[key: string]: {value: number, status: HealthStatus}};
  } | null>(null);
  
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [showAlertsModal, setShowAlertsModal] = useState<boolean>(false);

  useEffect(() => {
    // Get unread alerts count on mount
    const alertCount = healthMonitoringService.getUnreadAlertsCount();
    setUnreadAlerts(alertCount);

    // You could also set up a periodic check here
    const intervalId = setInterval(() => {
      const updatedCount = healthMonitoringService.getUnreadAlertsCount();
      setUnreadAlerts(updatedCount);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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

  const handleHealthMetricResponse = (userInput: string) => {
    let aiResponse: Message;
    
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
        
        aiResponse = {
          id: Date.now().toString(),
          text: `Great! I've recorded your ${currentMetric} as ${userInput}.\n\nWould you like to record another metric?`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setCurrentMetric(null);
      } else {
        aiResponse = {
          id: Date.now().toString(),
          text: `That doesn't seem to be a valid ${currentMetric} value. Please try again with the correct format:\n\n${getMetricFormat(currentMetric)}`,
          sender: 'ai',
          timestamp: new Date(),
        };
      }
    } else {
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
              text: 'I need to perform an analysis first. Please type "analyze" to analyze your health data.',
              sender: 'ai',
              timestamp: new Date(),
            };
          }
          break;
          
        case 'hello':
        case 'hi':
        case 'hey':
          aiResponse = {
            id: Date.now().toString(),
            text: 'Hello! How can I help you today with your health monitoring?',
            sender: 'ai',
            timestamp: new Date(),
          };
          break;
          
        case 'help':
          aiResponse = {
            id: Date.now().toString(),
            text: 'I can help you track and analyze your health metrics. You can:\n\n- Record metrics like blood pressure, heart rate, temperature, etc.\n- Get an analysis of your health data by typing "analyze"\n- View detailed information by typing "details" after analysis\n- View health alerts by tapping the notification icon',
            sender: 'ai',
            timestamp: new Date(),
          };
          break;
          
        default:
          aiResponse = {
            id: Date.now().toString(),
            text: 'I didn\'t understand that. What health metric would you like to record?',
            sender: 'ai',
            timestamp: new Date(),
          };
      }
    }
    
    return aiResponse;
  };

  const validateMetricValue = (metric: string, value: string): boolean => {
    switch (metric) {
      case 'blood pressure':
        const bpMatch = /^\d{2,3}\/\d{2,3}$/.test(value);
        if (bpMatch) {
          const [systolic, diastolic] = value.split('/').map(Number);
          // Update blood pressure in healthData
          setHealthData(prev => ({
            ...prev,
            bloodPressureSystolic: systolic,
            bloodPressureDiastolic: diastolic
          }));
        }
        return bpMatch;
      
      case 'heart rate':
        const hrValid = /^\d{2,3}$/.test(value) && Number(value) > 30 && Number(value) < 220;
        if (hrValid) {
          // Update heart rate in healthData
          setHealthData(prev => ({
            ...prev,
            heartRate: Number(value)
          }));
        }
        return hrValid;
      
      case 'temperature':
        const tempValid = /^\d{2}(\.\d)?$/.test(value) && Number(value) >= 35 && Number(value) <= 42;
        if (tempValid) {
          // Update temperature in healthData
          setHealthData(prev => ({
            ...prev,
            temperature: Number(value)
          }));
        }
        return tempValid;
      
      case 'oxygen level':
        const o2Valid = /^\d{2}(\.\d)?$/.test(value) && Number(value) >= 80 && Number(value) <= 100;
        if (o2Valid) {
          // Update oxygen level in healthData
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

  const getMetricFormat = (metric: string): string => {
    switch (metric) {
      case 'blood pressure':
        return 'Format: systolic/diastolic (e.g., 120/80)';
      case 'heart rate':
        return 'Format: beats per minute (e.g., 72)';
      case 'temperature':
        return 'Format: Celsius (e.g., 36.8)';
      case 'weight':
        return 'Format: kilograms (e.g., 70.5)';
      default:
        return '';
    }
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: 'user',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      // Show typing indicator
      setIsTyping(true);
      
      // Get AI response based on health metric logic
      const aiResponse = handleHealthMetricResponse(userMessage.text);
      
      // Add AI response with a slight delay and typing effect
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, aiResponse]);
      }, Math.min(1500, aiResponse.text.length * 20)); // Typing delay proportional to message length
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    // Add the suggestion as a user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Get AI response based on the suggestion
    const aiResponse = handleHealthMetricResponse(suggestion);
    
    // Add AI response with a typing effect
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, aiResponse]);
    }, Math.min(1500, aiResponse.text.length * 20));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportFile = (fileType: string) => {
    // Here you would implement the actual file export logic
    // This is a placeholder for the actual implementation
    console.log(`Exporting as ${fileType}`);
    setShowExportModal(false);
  };

  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceInput = () => {
    // Toggle recording state
    setIsRecording(!isRecording);
    // Voice recording functionality would be implemented here
    // This is a placeholder for the actual voice recording implementation
  };

  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportFile = (fileType: string) => {
    // Here you would implement the actual file import logic
    console.log(`Importing ${fileType} file`);
    setShowImportModal(false);
  };

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const mapMetricTypeToEnum = (metric: string): HealthMetric['type'] => {
    switch (metric.toLowerCase()) {
      case 'blood pressure': return 'bloodPressure';
      case 'heart rate': return 'heartRate';
      case 'temperature': return 'temperature';
      case 'weight': return 'weight';
      case 'oxygen level': return 'oxygenLevel';
      default: return 'heartRate'; // Default fallback
    }
  };

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

  const analyzeHealthData = () => {
    // Check if we have enough data to analyze
    if (healthData.heartRate === 0 || 
        healthData.bloodPressureSystolic === 0 || 
        healthData.temperature === 0) {
      return null;
    }
    
    // If oxygen level is not set, use a default value
    if (healthData.oxygenLevel === 0) {
      setHealthData(prev => ({...prev, oxygenLevel: 97}));
    }
    
    // Analyze using the SVM service
    const result = healthAnalysisService.analyzeHealthData(healthData);
    
    // Save the result to the monitoring service
    healthMonitoringService.saveHealthData(healthData, result.status);
    
    // Update unread alerts count
    setUnreadAlerts(healthMonitoringService.getUnreadAlertsCount());
    
    return result;
  };

  const getStatusColor = (status: HealthStatus): string => {
    switch (status) {
      case 'normal': return '#4CAF50';  // Green
      case 'warning': return '#FFC107'; // Yellow
      case 'critical': return '#FF5252'; // Red
      default: return '#9E9E9E';        // Grey
    }
  };

  const handleViewAlerts = () => {
    setShowAlertsModal(true);
    // Don't automatically mark alerts as seen when modal opens
    // This gives the user a chance to see which ones are new
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
    
    // Show toast-like alert at the bottom
    Alert.alert(
      "Health Monitoring",
      `Health monitoring has been ${newActiveState ? 'activated' : 'deactivated'}.`,
      [{ text: "OK" }]
    );
    
    // Optional: If deactivating, you could also clear any existing alerts
    if (!newActiveState) {
      // Ask if they want to clear notifications
      Alert.alert(
        "Clear Notifications?",
        "Would you like to clear all health alert notifications?",
        [
          {
            text: "No",
            style: "cancel"
          },
          {
            text: "Yes",
            onPress: clearAllAlerts
          }
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

  // Render functions for FlatList
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
          {message.text.split('\n').map((line, i) => (
            <Text key={i}>
              {line}
              {i < message.text.split('\n').length - 1 ? '\n' : ''}
            </Text>
          ))}
        </Text>
        <Text style={[
          styles.timestamp,
          message.sender === 'user' ? styles.userTimestamp : styles.aiTimestamp
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
      {message.sender === 'user' && (
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={18} color="#fff" />
        </View>
      )}
    </View>
  );
  
  const renderTypingIndicator = () => (
    <View style={styles.messageWrapper}>
      <View style={styles.aiAvatar}>
        <Ionicons name="medical" size={20} color="#fff" />
      </View>
      <View style={[styles.message, styles.aiMessage, styles.typingIndicator]}>
        <View style={styles.typingAnimation}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDotMiddle]} />
          <View style={styles.typingDot} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#98D8AA" barStyle="dark-content" />
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Landing')}
          >
            <Ionicons name="arrow-back" size={24} color="#2E4F4F" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.analysisButton}
              onPress={handleAnalysisButton}
            >
              <Ionicons name="pulse" size={22} color="#2E4F4F" />
              <Text style={styles.analysisButtonText}>Analysis</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleViewAlerts}
            >
              <Ionicons name="notifications-outline" size={24} color="#2E4F4F" />
              {unreadAlerts > 0 && (
                <View style={styles.notificationBadge}>
                  {unreadAlerts > 0 && (
                    <Text style={styles.notificationBadgeText}>{unreadAlerts}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.monitoringButton, 
                healthMonitoringService.getMonitoringConfig().isActive 
                  ? styles.monitoringActive 
                  : styles.monitoringInactive
              ]}
              onPress={toggleMonitoring}
            >
              <Ionicons 
                name={healthMonitoringService.getMonitoringConfig().isActive ? "pulse" : "pulse-outline"} 
                size={22} 
                color={healthMonitoringService.getMonitoringConfig().isActive ? "#2E4F4F" : "#FF6B6B"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerTitle}>Health Assistant</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Replace ScrollView with FlatList for better performance */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesContent,
            keyboardVisible && { paddingBottom: 10 }
          ]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isTyping ? renderTypingIndicator : null}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
        
        {/* Quick Suggestions */}
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContent}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText} numberOfLines={1} ellipsizeMode="tail">
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[
          styles.inputWrapper,
          Platform.OS === 'android' && keyboardVisible && { paddingBottom: 0 }
        ]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              placeholderTextColor="#9DB2BF"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!newMessage.trim()}
            >
              <Ionicons
                name="send"
                size={22}
                color={newMessage.trim() ? '#fff' : '#77B254'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.additionalControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowImportModal(true)}
            >
              <Ionicons name="cloud-upload" size={22} color="#2E4F4F" />
              <Text style={styles.controlButtonText}>Import Files</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isRecording && styles.recordingButton]}
              onPress={handleVoiceInput}
            >
              <Ionicons
                name={isRecording ? "mic" : "mic-outline"}
                size={22}
                color={isRecording ? "#FF6B6B" : "#2E4F4F"}
              />
              <Text style={[
                styles.controlButtonText,
                isRecording && styles.recordingText
              ]}>
                {isRecording ? 'Recording...' : 'Voice Message'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import File</Text>
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleImportFile('document')}
            >
              <Ionicons name="document-text" size={24} color="#2E4F4F" />
              <Text style={styles.exportOptionText}>Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleImportFile('image')}
            >
              <Ionicons name="image" size={24} color="#2E4F4F" />
              <Text style={styles.exportOptionText}>Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleImportFile('media')}
            >
              <Ionicons name="play-circle" size={24} color="#2E4F4F" />
              <Text style={styles.exportOptionText}>Media File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportOption, styles.cancelButton]}
              onPress={() => setShowImportModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export as</Text>
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExportFile('pdf')}
            >
              <Ionicons name="document-text" size={24} color="#2E4F4F" />
              <Text style={styles.exportOptionText}>PDF Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExportFile('png')}
            >
              <Ionicons name="image" size={24} color="#2E4F4F" />
              <Text style={styles.exportOptionText}>PNG Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExportFile('csv')}
            >
              <Ionicons name="grid" size={24} color="#2E4F4F" />
              <Text style={styles.exportOptionText}>CSV File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportOption, styles.cancelButton]}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Analysis Results Modal */}
      <Modal
        visible={showAnalysisModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.analysisModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.analysisModalTitle}>
                Health Analysis Results
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAnalysisModal(false)}
              >
                <Ionicons name="close" size={24} color="#9DB2BF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.analysisScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.analysisScrollContent}
            >
              {analysisResult && (
                <>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(analysisResult.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {analysisResult.status.toUpperCase()}
                    </Text>
                  </View>
                  
                  <Text style={styles.analysisText}>{analysisResult.analysis}</Text>
                  
                  <View style={styles.metricsContainer}>
                    <Text style={styles.metricsTitle}>Detailed Metrics:</Text>
                    
                    {analysisResult.metrics.heartRate && (
                      <View style={styles.metricRow}>
                        <Text style={styles.metricName}>Heart Rate:</Text>
                        <Text style={[
                          styles.metricValue,
                          { color: getStatusColor(analysisResult.metrics.heartRate.status) }
                        ]}>
                          {analysisResult.metrics.heartRate.value} bpm
                        </Text>
                      </View>
                    )}
                    
                    {analysisResult.metrics.bloodPressureSystolic && 
                    analysisResult.metrics.bloodPressureDiastolic && (
                      <View style={styles.metricRow}>
                        <Text style={styles.metricName}>Blood Pressure:</Text>
                        <Text style={styles.metricValue}>
                          <Text style={{
                            color: getStatusColor(analysisResult.metrics.bloodPressureSystolic.status)
                          }}>
                            {analysisResult.metrics.bloodPressureSystolic.value}
                          </Text>
                          /
                          <Text style={{
                            color: getStatusColor(analysisResult.metrics.bloodPressureDiastolic.status)
                          }}>
                            {analysisResult.metrics.bloodPressureDiastolic.value}
                          </Text>
                          {' '}mmHg
                        </Text>
                      </View>
                    )}
                    
                    {analysisResult.metrics.temperature && (
                      <View style={styles.metricRow}>
                        <Text style={styles.metricName}>Temperature:</Text>
                        <Text style={[
                          styles.metricValue,
                          { color: getStatusColor(analysisResult.metrics.temperature.status) }
                        ]}>
                          {analysisResult.metrics.temperature.value} °C
                        </Text>
                      </View>
                    )}
                    
                    {analysisResult.metrics.oxygenLevel && (
                      <View style={styles.metricRow}>
                        <Text style={styles.metricName}>Oxygen Level:</Text>
                        <Text style={[
                          styles.metricValue,
                          { color: getStatusColor(analysisResult.metrics.oxygenLevel.status) }
                        ]}>
                          {analysisResult.metrics.oxygenLevel.value}%
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.recommendationContainer}>
                    <Text style={styles.recommendationTitle}>AI Recommendation:</Text>
                    <Text style={styles.recommendationText}>
                      {analysisResult.status === 'normal' 
                        ? 'Continue regular monitoring of your health metrics. Maintain your healthy lifestyle!' 
                        : analysisResult.status === 'warning'
                          ? 'Monitor these metrics more frequently. Consider lifestyle adjustments and consult a healthcare provider if values don\'t improve.' 
                          : 'Please seek medical attention promptly. These readings indicate a potential health concern that requires professional evaluation.'}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowAnalysisModal(false);
                  setShowExportModal(true);
                }}
              >
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Export</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.closeModalButton]}
                onPress={() => setShowAnalysisModal(false)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alerts Modal */}
      <Modal
        visible={showAlertsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAlertsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.analysisModalTitle}>Health Alerts</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAlertsModal(false)}
              >
                <Ionicons name="close" size={24} color="#9DB2BF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.alertsContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.alertsScrollContent}
            >
              {healthMonitoringService.getAlerts().length > 0 ? (
                healthMonitoringService.getAlerts().map((alert) => (
                  <View 
                    key={alert.id} 
                    style={[
                      styles.alertItem,
                      { borderLeftColor: getStatusColor(alert.status) }
                    ]}
                  >
                    <View style={styles.alertHeader}>
                      <Text style={[
                        styles.alertStatus,
                        { color: getStatusColor(alert.status) }
                      ]}>
                        {alert.status.toUpperCase()}
                      </Text>
                      <Text style={styles.alertDate}>
                        {alert.timestamp.toLocaleDateString()} {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    
                    <View style={styles.alertMetrics}>
                      {Object.entries(alert.metrics).map(([key, data]) => {
                        // Skip displaying diastolic BP separately since we'll show it with systolic
                        if (key === 'bloodPressureDiastolic') return null;
                        
                        // Format the metric name for display
                        let displayName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
                        let displayValue = `${data.value}`;
                        
                        // Special case for blood pressure
                        if (key === 'bloodPressureSystolic' && alert.metrics.bloodPressureDiastolic) {
                          displayName = 'blood pressure';
                          displayValue = `${data.value}/${alert.metrics.bloodPressureDiastolic.value} mmHg`;
                        } else if (key === 'heartRate') {
                          displayValue = `${data.value} bpm`;
                        } else if (key === 'temperature') {
                          displayValue = `${data.value} °C`;
                        } else if (key === 'oxygenLevel') {
                          displayValue = `${data.value}%`;
                        }
                        
                        return (
                          <View key={key} style={styles.alertMetricItem}>
                            <Text style={styles.alertMetricName}>{displayName}:</Text>
                            <Text style={[
                              styles.alertMetricValue,
                              { color: getStatusColor(data.status) }
                            ]}>
                              {displayValue}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noAlertsText}>
                  No health alerts at this time. Continue monitoring your health metrics regularly.
                </Text>
              )}
            </ScrollView>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearAlertsButton]}
                onPress={() => {
                  clearAllAlerts();
                  setShowAlertsModal(false);
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Mark All Read</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.closeModalButton]}
                onPress={() => setShowAlertsModal(false)}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    backgroundColor: '#98D8AA',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E4F4F',
    textAlign: 'center',
    marginTop: 5,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2E4F4F',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  analysisButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#2E4F4F',
    fontWeight: '600',
  },
  notificationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  monitoringButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  monitoringActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
  },
  monitoringInactive: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 30,
    width: '100%',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-end',
    width: '100%',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  message: {
    minWidth: 50,
    maxWidth: '75%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#4CAF50',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    marginRight: 12,
  },
  aiMessage: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    marginLeft: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#2C3333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTimestamp: {
    color: '#9DB2BF',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E4F4F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 7,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingRight: 45,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 12,
    color: '#2C3333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#F1F1F1',
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 79, 79, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  controlButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2E4F4F',
    fontWeight: '500',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  recordingText: {
    color: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E4F4F',
    marginBottom: 15,
    textAlign: 'center',
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(46, 79, 79, 0.1)',
  },
  exportOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2E4F4F',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  analysisModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  analysisModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E4F4F',
    flex: 1,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 15,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisScrollView: {
    maxHeight: '70%',
  },
  analysisScrollContent: {
    paddingBottom: 20,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C3333',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  metricsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E4F4F',
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  metricName: {
    fontSize: 16,
    color: '#2C3333',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E4F4F',
    marginBottom: 10,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C3333',
  },
  alertsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  alertsContainer: {
    maxHeight: '75%',
  },
  alertsScrollContent: {
    paddingBottom: 10,
  },
  alertItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertStatus: {
    fontWeight: '700',
    fontSize: 14,
  },
  alertDate: {
    color: '#9DB2BF',
    fontSize: 12,
  },
  alertMessage: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
    color: '#2C3333',
  },
  alertMetrics: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  alertMetricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  alertMetricName: {
    fontSize: 13,
    color: '#2C3333',
  },
  alertMetricValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  noAlertsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#9DB2BF',
    marginVertical: 30,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    minHeight: 70,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  suggestionsContent: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 6,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  suggestionText: {
    color: '#2E4F4F',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  typingIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    height: 'auto',
    width: 70,
  },
  typingAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9DB2BF',
    marginHorizontal: 2,
    opacity: 0.7,
  },
  typingDotMiddle: {
    opacity: 0.9,
    transform: [{ scale: 1.1 }],
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  closeModalButton: {
    backgroundColor: '#FF6B6B',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearAlertsButton: {
    backgroundColor: '#4285F4', // Google blue
  },
});

export default HealthMonitoringScreen;