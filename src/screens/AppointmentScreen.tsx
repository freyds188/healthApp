import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

interface TimeSlot {
    morning: string[];
    afternoon: string[];
    evening: string[];
}

interface Doctor {
    id: string;
    name: string;
    specialization: string;
    avatar: null;
    availableSlots: TimeSlot;
}

interface Appointment {
    id: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}

// Mock doctors data
const doctors: Doctor[] = [
    {
        id: '1',
        name: 'Dr. John',
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

// Mock appointments data
const mockAppointments: Appointment[] = [
    {
        id: '1',
        doctorId: '1',
        doctorName: 'Dr. John',
        date: 'March 15, 2024',
        time: '10:00',
        status: 'upcoming'
    },
    {
        id: '2',
        doctorId: '2',
        doctorName: 'Dr. Sarah Wilson',
        date: 'March 12, 2024',
        time: '14:00',
        status: 'completed'
    }
];

type RootStackParamList = {
    Appointment: undefined;
    Landing: undefined;
};

type AppointmentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Appointment'>;

interface Props {
    navigation: AppointmentScreenNavigationProp;
}

const AppointmentScreen: React.FC<Props> = ({ navigation }) => {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(doctors[0]);
    const [showDoctorList, setShowDoctorList] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
    const [activeTab, setActiveTab] = useState<'book' | 'appointments'>('book');

    // Get current month dates
    const getDates = () => {
        const dates: number[] = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const daysInMonth = new Date(today.getFullYear(), currentMonth + 1, 0).getDate();
        
        for (let i = today.getDate(); i <= daysInMonth; i++) {
            dates.push(i);
        }
        return dates;
    };

    const handleSelectDoctor = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setSelectedTime(null);
        setShowDoctorList(false);
    };

    const handleBookAppointment = () => {
        if (selectedDate && selectedTime) {
            const newAppointment: Appointment = {
                id: (appointments.length + 1).toString(),
                doctorId: selectedDoctor.id,
                doctorName: selectedDoctor.name,
                date: `March ${selectedDate}, 2024`,
                time: selectedTime,
                status: 'upcoming'
            };

            setAppointments([newAppointment, ...appointments]);

            Alert.alert(
                'Appointment Booked',
                `Your appointment with ${selectedDoctor.name} has been scheduled for March ${selectedDate} at ${selectedTime}`,
                [{ 
                    text: 'OK', 
                    onPress: () => {
                        setSelectedDate(null);
                        setSelectedTime(null);
                        setActiveTab('appointments');
                    }
                }]
            );
        }
    };

    const renderAppointmentItem = ({ item }: { item: Appointment }) => (
        <View style={styles.appointmentItem}>
            <View style={styles.appointmentHeader}>
                <Text style={styles.doctorName}>{item.doctorName}</Text>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'upcoming' ? '#4CAF50' : 
                                    item.status === 'completed' ? '#2196F3' : '#FF5722' }
                ]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.detailText}>{item.date}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.detailText}>{item.time}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Appointments</Text>
            </View>

            {/* Tab Buttons */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'book' && styles.activeTabButton]}
                    onPress={() => setActiveTab('book')}
                >
                    <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>
                        Book Appointment
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'appointments' && styles.activeTabButton]}
                    onPress={() => setActiveTab('appointments')}
                >
                    <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
                        My Appointments
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'book' ? (
                <ScrollView style={styles.bookingContainer}>
                    {/* Doctor Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Doctor</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.doctorList}
                        >
                            {doctors.map((doctor) => (
                                <TouchableOpacity
                                    key={doctor.id}
                                    style={[
                                        styles.doctorCard,
                                        selectedDoctor.id === doctor.id && styles.selectedDoctorCard
                                    ]}
                                    onPress={() => handleSelectDoctor(doctor)}
                                >
                                    <View style={styles.doctorAvatar}>
                                        <Ionicons name="person" size={30} color="#fff" />
                                    </View>
                                    <Text style={styles.doctorCardName}>{doctor.name}</Text>
                                    <Text style={styles.doctorCardSpecialization}>
                                        {doctor.specialization}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Calendar Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Date</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.datesContainer}
                        >
                            {getDates().map((date) => (
                                <TouchableOpacity
                                    key={date}
                                    style={[
                                        styles.dateButton,
                                        selectedDate === date && styles.selectedDateButton
                                    ]}
                                    onPress={() => {
                                        setSelectedDate(date);
                                        setSelectedTime(null);
                                    }}
                                >
                                    <Text style={[
                                        styles.dateText,
                                        selectedDate === date && styles.selectedDateText
                                    ]}>{date}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Time Slots */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Time</Text>
                        <View style={styles.timeSlotsContainer}>
                            {(Object.entries(selectedDoctor.availableSlots) as [keyof TimeSlot, string[]][]).map(([period, slots]) => (
                                <View key={period} style={styles.timeSlotGroup}>
                                    <Text style={styles.timeSlotTitle}>
                                        {period.charAt(0).toUpperCase() + period.slice(1)}
                                    </Text>
                                    <View style={styles.timeSlotButtons}>
                                        {slots.map((time) => (
                                            <TouchableOpacity
                                                key={time}
                                                style={[
                                                    styles.timeSlotButton,
                                                    selectedTime === time && styles.selectedTimeSlot
                                                ]}
                                                onPress={() => setSelectedTime(time)}
                                            >
                                                <Text style={[
                                                    styles.timeSlotText,
                                                    selectedTime === time && styles.selectedTimeText
                                                ]}>{time}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Book Button */}
                    <TouchableOpacity
                        style={[
                            styles.bookButton,
                            (!selectedDate || !selectedTime) && styles.bookButtonDisabled
                        ]}
                        onPress={handleBookAppointment}
                        disabled={!selectedDate || !selectedTime}
                    >
                        <Text style={styles.bookButtonText}>Book Appointment</Text>
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderAppointmentItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.appointmentsList}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#98D8AA',
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#98D8AA',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#98D8AA',
        fontWeight: '600',
    },
    bookingContainer: {
        flex: 1,
    },
    section: {
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#2E4F4F',
    },
    doctorList: {
        flexGrow: 0,
    },
    doctorCard: {
        width: 200,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedDoctorCard: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4CAF50',
    },
    doctorAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#98D8AA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    doctorCardName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E4F4F',
        marginBottom: 5,
    },
    doctorCardSpecialization: {
        fontSize: 14,
        color: '#666',
    },
    datesContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    dateButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedDateButton: {
        backgroundColor: '#98D8AA',
        borderColor: '#4CAF50',
    },
    dateText: {
        fontSize: 16,
        color: '#2E4F4F',
    },
    selectedDateText: {
        color: '#fff',
        fontWeight: '600',
    },
    timeSlotsContainer: {
        flex: 1,
    },
    timeSlotGroup: {
        marginBottom: 20,
    },
    timeSlotTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E4F4F',
        marginBottom: 10,
    },
    timeSlotButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    timeSlotButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        margin: 5,
        minWidth: 80,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedTimeSlot: {
        backgroundColor: '#98D8AA',
        borderColor: '#4CAF50',
    },
    timeSlotText: {
        color: '#2E4F4F',
        fontSize: 16,
    },
    selectedTimeText: {
        color: '#fff',
        fontWeight: '600',
    },
    bookButton: {
        backgroundColor: '#4CAF50',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookButtonDisabled: {
        backgroundColor: '#ccc',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    appointmentsList: {
        padding: 15,
    },
    appointmentItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    appointmentDetails: {
        marginTop: 5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2E4F4F',
        marginBottom: 4,
    },
});

export default AppointmentScreen; 