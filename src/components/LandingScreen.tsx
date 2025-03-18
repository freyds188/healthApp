import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
    Landing: undefined;
    Home: undefined;
    Appointment: undefined;
    Messages: undefined;
    Login: undefined;
};

type LandingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Landing'>;

type Props = {
    navigation: LandingScreenNavigationProp;
};

// Mock recent health data - replace with actual data from storage
const recentHealthData = {
    bloodPressure: '120/80',
    heartRate: '72',
    temperature: '36.8',
    weight: '70.5',
    lastUpdated: '2 hours ago',
};

// Add mock doctors data
const doctors = [
    {
        id: '1',
        name: 'Dr. Livogoshtov',
        specialization: 'Senior Cardiologist and Neurologist',
        avatar: null,
        availableSlots: {
            morning: ['8:00', '10:00', '12:00'],
            afternoon: ['13:00', '15:00', '17:00'],
            evening: ['19:00', '21:00', '22:00'],
        }
    },
    {
        id: '2',
        name: 'Dr. Sarah Wilson',
        specialization: 'General Practitioner',
        avatar: null,
        availableSlots: {
            morning: ['9:00', '11:00'],
            afternoon: ['14:00', '16:00'],
            evening: ['18:00', '20:00'],
        }
    },
    {
        id: '3',
        name: 'Dr. James Chen',
        specialization: 'Pediatrician',
        avatar: null,
        availableSlots: {
            morning: ['8:30', '10:30'],
            afternoon: ['13:30', '15:30'],
            evening: ['18:30', '20:30'],
        }
    }
];

const LandingScreen: React.FC<Props> = ({ navigation }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const slideAnim = useState(new Animated.Value(-280))[0];

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).toUpperCase();

    // Get current month dates
    const getDates = () => {
        const dates = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
        
        for (let i = today.getDate(); i <= daysInMonth; i++) {
            dates.push(i);
        }
        return dates;
    };

    const toggleMenu = () => {
        const toValue = showMenu ? -280 : 0;
        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: true,
            damping: 15,
            mass: 0.8,
        }).start();
        setShowMenu(!showMenu);
    };

    const handleTabPress = (tabName: string) => {
        setActiveTab(tabName);
        if (tabName === 'appointment') {
            navigation.navigate('Appointment');
        }
    };

    const handleLogout = () => {
        navigation.navigate('Login');
    };

    return (
        <View style={styles.mainContainer}>
            <ScrollView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.profileSection}>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={toggleMenu}
                        >
                            <Ionicons name="menu-outline" size={28} color="#4A4A4A" />
                        </TouchableOpacity>
                        <Text style={styles.date}>{formattedDate}</Text>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="notifications-outline" size={24} color="#4A4A4A" />
                    </TouchableOpacity>
                </View>

                {/* Greeting with Profile Icon */}
                <View style={styles.greetingContainer}>
                    <View style={styles.greetingContent}>
                        <TouchableOpacity style={styles.profileIcon}>
                            <Ionicons name="person-circle-outline" size={40} color="#4A4A4A" />
                        </TouchableOpacity>
                        <Text style={styles.greeting}>Good day, User!</Text>
                    </View>
                </View>

                {/* AI Health Assessment */}
                <TouchableOpacity style={styles.assessmentCard}>
                    <Text style={styles.assessmentText}>AI Health Assessment</Text>
                </TouchableOpacity>

                {/* Track Your Health */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Track Your Health</Text>
                    <TouchableOpacity
                        style={styles.trackHealthCard}
                        onPress={() => navigation.navigate('Home')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.trackHealthContent}>
                            <Ionicons name="fitness-outline" size={40} color="#fff" />
                            <View style={styles.trackHealthTextContainer}>
                                <Text style={styles.trackHealthTitle}>Health Monitoring</Text>
                                <Text style={styles.trackHealthSubtitle}>Track your vital signs and health metrics</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Recent Health Metrics */}
                    <View style={styles.recentMetricsContainer}>
                        <View style={styles.recentMetricsHeader}>
                            <Text style={styles.recentMetricsTitle}>Recent Health Metrics</Text>
                            <Text style={styles.lastUpdated}>Last updated: {recentHealthData.lastUpdated}</Text>
                        </View>
                        <View style={styles.metricsGrid}>
                            <View style={styles.metricItem}>
                                <Ionicons name="heart-outline" size={24} color="#FF4B4B" />
                                <Text style={styles.metricValue}>{recentHealthData.bloodPressure}</Text>
                                <Text style={styles.metricLabel}>Blood Pressure</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Ionicons name="pulse-outline" size={24} color="#4CAF50" />
                                <Text style={styles.metricValue}>{recentHealthData.heartRate}</Text>
                                <Text style={styles.metricLabel}>Heart Rate</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Ionicons name="thermometer-outline" size={24} color="#FF9800" />
                                <Text style={styles.metricValue}>{recentHealthData.temperature}°C</Text>
                                <Text style={styles.metricLabel}>Temperature</Text>
                            </View>
                            <View style={styles.metricItem}>
                                <Ionicons name="scale-outline" size={24} color="#2196F3" />
                                <Text style={styles.metricValue}>{recentHealthData.weight} kg</Text>
                                <Text style={styles.metricLabel}>Weight</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Trends */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trends</Text>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.trendsScroll}
                    >
                        <View style={styles.trendCard} />
                        <View style={styles.trendCard} />
                        <View style={styles.trendCard} />
                    </ScrollView>
                    <View style={styles.paginationDots}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'home' && styles.activeTab]}
                    onPress={() => handleTabPress('home')}
                >
                    <Ionicons
                        name={activeTab === 'home' ? "home" : "home-outline"}
                        size={24}
                        color={activeTab === 'home' ? "#4CAF50" : "#4A4A4A"}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'home' && styles.activeTabText
                    ]}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'appointment' && styles.activeTab]}
                    onPress={() => handleTabPress('appointment')}
                >
                    <Ionicons
                        name={activeTab === 'appointment' ? "calendar" : "calendar-outline"}
                        size={24}
                        color={activeTab === 'appointment' ? "#4CAF50" : "#4A4A4A"}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'appointment' && styles.activeTabText
                    ]}>Appointment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'messages' && styles.activeTab]}
                    onPress={() => handleTabPress('messages')}
                >
                    <Ionicons
                        name={activeTab === 'messages' ? "chatbox" : "chatbox-outline"}
                        size={24}
                        color={activeTab === 'messages' ? "#4CAF50" : "#4A4A4A"}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'messages' && styles.activeTabText
                    ]}>Messages</Text>
                </TouchableOpacity>
            </View>

            {showMenu && (
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={toggleMenu}
                />
            )}

            <Animated.View
                style={[
                    styles.sideMenu,
                    {
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <View style={styles.drawerHeader}>
                    <View style={styles.logoContainer}>
                        <View style={styles.appIconCircle}>
                            <Ionicons name="heart" size={24} color="#fff" />
                        </View>
                        <Text style={styles.drawerTitle}>Health Care App</Text>
                    </View>
                </View>

                <ScrollView style={styles.menuItems}>
                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="person-outline" size={22} color="#4A4A4A" />
                        <Text style={styles.menuItemText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="shield-checkmark-outline" size={22} color="#4A4A4A" />
                        <Text style={styles.menuItemText}>Privacy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="settings-outline" size={22} color="#4A4A4A" />
                        <Text style={styles.menuItemText}>System Setting</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="document-text-outline" size={22} color="#4A4A4A" />
                        <Text style={styles.menuItemText}>Terms & Conditions</Text>
                    </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={22} color="#fff" style={styles.logoutIcon} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
        backgroundColor: '#98D8AA',
        zIndex: 4,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        marginRight: 10,
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 4,
    },
    date: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A4A4A',
    },
    greetingContainer: {
        padding: 20,
        paddingTop: 15,
    },
    greetingContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileIcon: {
        marginRight: 12,
        padding: 5,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4A4A4A',
    },
    assessmentCard: {
        backgroundColor: '#fff',
        margin: 20,
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    assessmentText: {
        fontSize: 16,
        color: '#4A4A4A',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 20,
        marginBottom: 10,
        color: '#4A4A4A',
    },
    trackHealthCard: {
        backgroundColor: '#4CAF50',
        margin: 20,
        height: 100,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    trackHealthContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    trackHealthTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    trackHealthTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    trackHealthSubtitle: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.9,
    },
    trendsScroll: {
        height: 120,
    },
    trendCard: {
        width: Dimensions.get('window').width - 80,
        height: 100,
        backgroundColor: '#DDDDDD',
        marginHorizontal: 20,
        borderRadius: 10,
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DDDDDD',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#4A4A4A',
    },
    recentMetricsContainer: {
        backgroundColor: '#fff',
        margin: 20,
        marginTop: 10,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recentMetricsHeader: {
        marginBottom: 15,
    },
    recentMetricsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A4A4A',
        marginBottom: 4,
    },
    lastUpdated: {
        fontSize: 12,
        color: '#888',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    metricItem: {
        width: '48%',
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A4A4A',
        marginVertical: 8,
    },
    metricLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2,
    },
    sideMenu: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 280,
        backgroundColor: '#fff',
        zIndex: 3,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    drawerHeader: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    appIconCircle: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: '#4CAF50',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    drawerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
        letterSpacing: 0.5,
    },
    menuItems: {
        flex: 1,
        paddingTop: 30,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 25,
        marginBottom: 8,
    },
    menuItemText: {
        fontSize: 16,
        color: '#4A4A4A',
        fontWeight: '500',
        marginLeft: 15,
    },
    logoutItem: {
        backgroundColor: '#4CAF50',
        marginHorizontal: 20,
        marginBottom: 30,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingBottom: 25, // Extra padding for bottom safe area
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    activeTab: {
        borderRadius: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    tabText: {
        fontSize: 12,
        marginTop: 4,
        color: '#4A4A4A',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#4CAF50',
        fontWeight: '600',
    },
});

export default LandingScreen; 