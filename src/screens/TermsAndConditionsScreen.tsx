import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

// Replace the existing RootStackParamList with:
type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'TermsAndConditions'>;
  route: RouteProp<RootStackParamList, 'TermsAndConditions'>;
};

const TermsAndConditionsScreen: React.FC<Props> = ({ navigation, route }) => {
    const { terms } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.description}>
                    By using this application, you agree to the following terms and conditions:
                </Text>

                {terms.map((term, index) => (
                    <View key={index} style={styles.termItem}>
                        <View style={styles.bullet}>
                            <Text style={styles.bulletText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.termText}>{term}</Text>
                    </View>
                ))}

                <Text style={styles.warning}>
                    Violations may result in account termination.
                </Text>
            </ScrollView>

            <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.acceptButtonText}>I Understand</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        padding: 16,
        paddingTop: 40,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 16,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    description: {
        fontSize: 16,
        color: '#4A4A4A',
        marginBottom: 24,
        lineHeight: 24,
    },
    termItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    bullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    bulletText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    termText: {
        flex: 1,
        fontSize: 16,
        color: '#4A4A4A',
        lineHeight: 24,
    },
    warning: {
        fontSize: 16,
        color: '#FF5722',
        marginTop: 24,
        fontWeight: '500',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TermsAndConditionsScreen;