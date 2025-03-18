import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

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
  type: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight';
  value: string;
  unit: string;
  timestamp: Date;
};

const HealthMonitoringScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI health assistant. I\'ll help you track your vital signs and health metrics.',
      sender: 'ai',
      timestamp: new Date(),
    },
    {
      id: '2',
      text: 'Let\'s start by checking your health metrics. Which would you like to record?\n\n1. Blood Pressure\n2. Heart Rate\n3. Temperature\n4. Weight',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [currentMetric, setCurrentMetric] = useState<string | null>(null);

  const handleHealthMetricResponse = (userInput: string) => {
    let aiResponse: Message;
    
    // Check if we're waiting for a specific metric value
    if (currentMetric) {
      // Validate and process the metric value
      const isValid = validateMetricValue(currentMetric, userInput);
      
      if (isValid) {
        aiResponse = {
          id: Date.now().toString(),
          text: `Great! I've recorded your ${currentMetric} as ${userInput}.\n\nWould you like to record another metric?\n\n1. Blood Pressure\n2. Heart Rate\n3. Temperature\n4. Weight\n\nOr type "done" if you're finished.`,
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
          setCurrentMetric('weight');
          aiResponse = {
            id: Date.now().toString(),
            text: 'Please enter your weight in kilograms (e.g., 70.5):',
            sender: 'ai',
            timestamp: new Date(),
          };
          break;
          
        case 'done':
          aiResponse = {
            id: Date.now().toString(),
            text: 'Thank you for updating your health metrics! Is there anything else you\'d like to know about your health data?',
            sender: 'ai',
            timestamp: new Date(),
          };
          break;
          
        default:
          aiResponse = {
            id: Date.now().toString(),
            text: 'I didn\'t understand that. Please choose a number or type the metric name:\n\n1. Blood Pressure\n2. Heart Rate\n3. Temperature\n4. Weight',
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
        return /^\d{2,3}\/\d{2,3}$/.test(value);
      case 'heart rate':
        return /^\d{2,3}$/.test(value) && Number(value) > 30 && Number(value) < 220;
      case 'temperature':
        return /^\d{2}(\.\d)?$/.test(value) && Number(value) >= 35 && Number(value) <= 42;
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

      // Get AI response based on health metric logic
      const aiResponse = handleHealthMetricResponse(userMessage.text);
      
      // Add AI response with a slight delay
      setTimeout(() => {
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
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

            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#2E4F4F" />
              <View style={styles.notificationBadge} />
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
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            keyboardVisible && { paddingBottom: 10 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
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
                <Text style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.timestamp,
                  message.sender === 'user' ? styles.userTimestamp : styles.aiTimestamp
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

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
  notificationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    borderWidth: 1,
    borderColor: '#fff',
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
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  message: {
    maxWidth: '75%',
    padding: 15,
    borderRadius: 20,
    marginBottom: 5,
  },
  userMessage: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  aiMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
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
});

export default HealthMonitoringScreen;