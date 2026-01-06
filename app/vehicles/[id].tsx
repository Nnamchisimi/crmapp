import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    Alert,
    TouchableOpacity,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router'; 
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { MaterialIcons } from '@expo/vector-icons'; 



const BASE_URL = "http://192.168.55.73:3007";
const PRIMARY_COLOR = '#00bcd4';
const BACKGROUND_COLOR = '#000';
const CARD_BG = 'rgba(255,255,255,0.05)';
const TEXT_COLOR = 'white';
const BORDER_COLOR = 'rgba(255,255,255,0.1)';
const SUBTLE_TEXT_COLOR = 'rgba(255,255,255,0.7)';


interface VehicleData {
    id: string;
    brand: string;
    model: string;
    license_plate: string;
    year: number;
    vehicle_type: string;
    fuel_type: string;
    kilometers: number;
    vin: string;
    crm_number: string;
    
    
    name: string; 
    surname: string;
    phone_number: string;
    email: string;

    last_service_date: string;
    notes: string;
    
}



const CarDetailsScreen = () => {

    const params = useLocalSearchParams();
    const vehicleId = params.id;
    const router = useRouter(); 


    const id = Array.isArray(vehicleId) ? vehicleId[0] : vehicleId;

    const [vehicle, setVehicle] = useState<VehicleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVehicleDetails = async () => {
        if (!id) {
            setError("No vehicle ID provided.");
            setLoading(false);
            return;
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert("Authentication Error", "Please log in to view details.");
            router.replace('/signin');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/vehicles/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch vehicle ${id}.`);
            }

            const data: VehicleData = await response.json();
            setVehicle(data);
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError(err.message || "An unexpected error occurred while fetching details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicleDetails();
    }, [id]);


    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.text}>Loading vehicle details...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity onPress={fetchVehicleDetails} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!vehicle) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.text}>Vehicle not found (ID: {id}).</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={TEXT_COLOR} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Vehicle Details</Text>
            </View>
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Vehicle Identification */}
                <View style={styles.card}>
                    <Text style={styles.title}>{vehicle.brand} {vehicle.model} ({vehicle.year})</Text>
                    <Text style={styles.subtitle}>{vehicle.license_plate}</Text>
                    <DetailRow label="CRM Number" value={vehicle.crm_number} />
                    <DetailRow label="VIN" value={vehicle.vin} />
                </View>

                {/* Technical Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Technical Details</Text>
                    <DetailRow label="Type" value={vehicle.vehicle_type} />
                    <DetailRow label="Fuel Type" value={vehicle.fuel_type} />
                    <DetailRow label="Kilometers" value={`${vehicle.kilometers.toLocaleString()} km`} />
                </View>

                {/* Owner Information */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Owner Information</Text>
                    <DetailRow label="Owner" value={`${vehicle.name} ${vehicle.surname}`} />
                    <DetailRow label="Phone" value={vehicle.phone_number} />
                    <DetailRow label="Email" value={vehicle.email} />
                </View>

                {/* Service/Maintenance History */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Maintenance</Text>
                    <DetailRow label="Last Service" value={vehicle.last_service_date || 'N/A'} />
                    <DetailRow label="Notes" value={vehicle.notes || 'No notes available.'} fullWidth={true} />
                </View>

                {/* Action Button: Edit Details */}
                <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => router.push({ 
                        pathname: "/editcardetails/[id]", 
                        params: { id: vehicle.id } 
                    })}
                >  
                    <MaterialIcons name="edit" size={20} color={TEXT_COLOR} />
                    <Text style={styles.editButtonText}> Edit Vehicle Details</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

interface DetailRowProps {
    label: string;
    value: string;
    fullWidth?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, fullWidth = false }) => (
    <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, fullWidth && styles.fullWidthLabel]}>{label}:</Text>
        <Text style={[styles.detailValue, fullWidth && styles.fullWidthValue]}>{value}</Text>
    </View>
);


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR, 
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    text: {
        color: SUBTLE_TEXT_COLOR,
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    retryButton: {
        backgroundColor: PRIMARY_COLOR,
        padding: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: TEXT_COLOR,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 40, 
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    backButton: {
        paddingRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_COLOR,
    },
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: PRIMARY_COLOR,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: TEXT_COLOR,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
        paddingBottom: 10,
    },
    sectionContainer: {
        marginBottom: 20,
        backgroundColor: CARD_BG,
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: TEXT_COLOR,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
        paddingBottom: 5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        flexWrap: 'wrap',
    },
    detailLabel: {
        fontWeight: '600',
        color: SUBTLE_TEXT_COLOR,
        width: '40%', 
    },
    detailValue: {
        color: TEXT_COLOR,
        width: '60%', 
        textAlign: 'right',
    },
    fullWidthLabel: {
        width: '100%',
        marginBottom: 4,
    },
    fullWidthValue: {
        width: '100%',
        color: '#ddd',
        fontStyle: 'italic',
        textAlign: 'left',
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: PRIMARY_COLOR,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    editButtonText: {
        color: TEXT_COLOR,
        fontWeight: 'bold',
        fontSize: 16,
    }
});

export default CarDetailsScreen;