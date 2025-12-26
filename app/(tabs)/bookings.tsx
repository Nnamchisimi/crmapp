import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    SafeAreaView,
    Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker"; // Necessary for Date/Time picker

// --------------------------------------------------
// CONFIG
// --------------------------------------------------
const API_BASE_URL = "http://192.168.55.73:3007";
const PRIMARY_COLOR = "#00bcd4";
const BACKGROUND_COLOR = "#1a1a1a";
const CARD_BG = "rgba(255,255,255,0.05)";

// --------------------------------------------------
// TYPES (Full definitions for clarity)
// --------------------------------------------------
interface Vehicle {
    id: number;
    brand: string;
    model: string;
    license_plate: string;
    vin: string;
    crm_number?: string;
}
interface Branch {
    id: number;
    name: string;
    address: string;
}
interface Service {
    id: number;
    name: string;
    price: number;
    durationMinutes: number;
}
interface TimeSlot {
    time: string; // e.g., "09:00"
    isAvailable: boolean;
}
interface BookingData {
    vehicle: Vehicle | null;
    branch: Branch | null;
    service: Service | null;
    date: Date | null; // Using Date object for picker
    timeSlot: string | null; 
    userEmail: string | null;
}

const steps = [
    "Select Vehicle",
    "Choose Branch",
    "Select Service",
    "Select Date & Time",
    "Confirmation",
];

// --------------------------------------------------
// SIMPLE NAV MOCK (replace with React Navigation)
// --------------------------------------------------
const useNavigation = () => ({
    navigate: (screen: string, params?: object) =>
        console.log(`Maps → ${screen}`, params),
});

// --------------------------------------------------
// AUTH HOOK (REAL JWT)
// --------------------------------------------------
const useAuth = () => {
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuth = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            const storedEmail = await AsyncStorage.getItem("email");
            setToken(storedToken);
            setEmail(storedEmail);
            setLoading(false);
        };
        loadAuth();
    }, []);

    return { token, email, loading };
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------
const BookService = () => {
    const navigation = useNavigation();
    const { token, email, loading: authLoading } = useAuth();

    const [step, setStep] = useState(0);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleLoading, setVehicleLoading] = useState(true);

    // New States for subsequent steps
    const [branches, setBranches] = useState<Branch[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [dataLoading, setDataLoading] = useState(false); // General data loading

    const [bookingData, setBookingData] = useState<BookingData>({
        vehicle: null,
        branch: null,
        service: null,
        date: null,
        timeSlot: null,
        userEmail: email,
    });
    
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- UTILITY/API MOCKS ---
    const updateBookingData = (key: keyof BookingData, value: any) => {
        setBookingData(prev => ({ ...prev, [key]: value }));
    };

    const handleAuthError = useCallback(() => {
        // ... (Auth error logic remains the same)
        Alert.alert("Session expired", "Please sign in again.", [
            {
                text: "OK",
                onPress: async () => {
                    await AsyncStorage.multiRemove(["token", "email"]);
                    navigation.navigate("SignInScreen");
                },
            },
        ]);
    }, [navigation]);

    // --- FETCH BRANCHES (STEP 1 DATA) ---
    const fetchBranches = useCallback(async () => {
        setDataLoading(true);
        // MOCK FETCH: Replace with real API call (e.g., /api/branches)
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const mockBranches: Branch[] = [
            { id: 1, name: "Downtown Service Center", address: "123 Main St, City" },
            { id: 2, name: "Industrial Park Repair", address: "45 Business Blvd, Town" },
            { id: 3, name: "North Side Quick Lube", address: "789 Highway, Suburb" },
        ];
        setBranches(mockBranches);
        setDataLoading(false);
    }, []);

    // --- FETCH SERVICES (STEP 2 DATA) ---
    const fetchServices = useCallback(async () => {
        setDataLoading(true);
        // MOCK FETCH: Replace with real API call (e.g., /api/services)
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const mockServices: Service[] = [
            { id: 101, name: "Oil Change + Filter", price: 79.99, durationMinutes: 45 },
            { id: 102, name: "Tire Rotation", price: 39.99, durationMinutes: 30 },
            { id: 103, name: "Full Inspection", price: 149.99, durationMinutes: 90 },
            { id: 104, name: "Brake Pad Replacement", price: 250.00, durationMinutes: 120 },
        ];
        setServices(mockServices);
        setDataLoading(false);
    }, []);

    // --- FETCH TIME SLOTS (STEP 3 DATA) ---
    const fetchTimeSlots = useCallback(async (branchId: number, date: Date) => {
        setDataLoading(true);
        // MOCK FETCH: Replace with real API call (e.g., /api/times/branch/date)
        console.log(`Fetching slots for Branch ${branchId} on ${date.toDateString()}`);
        await new Promise(resolve => setTimeout(resolve, 700)); 
        
        const mockTimeSlots: TimeSlot[] = [
            { time: "09:00", isAvailable: true },
            { time: "10:30", isAvailable: false },
            { time: "11:00", isAvailable: true },
            { time: "13:00", isAvailable: true },
            { time: "14:30", isAvailable: false },
            { time: "15:00", isAvailable: true },
        ];
        setTimeSlots(mockTimeSlots);
        setDataLoading(false);
    }, []);
    
    // --- STEP HANDLERS ---
    const handleNextStep = () => {
        setStep(prev => prev < steps.length - 1 ? prev + 1 : prev);
    };

    const handlePrevStep = () => {
        setStep(prev => prev > 0 ? prev - 1 : prev);
    };

    const handleSelectBranch = (branch: Branch) => {
        updateBookingData('branch', branch);
        handleNextStep();
    };

    const handleSelectService = (service: Service) => {
        updateBookingData('service', service);
        handleNextStep();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on Android
        if (selectedDate) {
            updateBookingData('date', selectedDate);
        }
    };
    
    const handleSelectTimeSlot = (time: string) => {
        updateBookingData('timeSlot', time);
        handleNextStep();
    };

    const handleSubmitBooking = async () => {
        if (!bookingData.vehicle || !bookingData.branch || !bookingData.service || !bookingData.date || !bookingData.timeSlot) {
            Alert.alert("Missing Information", "Please complete all steps before confirming.");
            return;
        }

        // MOCK API CALL for booking submission
        setDataLoading(true);
        console.log("Submitting Booking:", bookingData);

        // Replace with real POST request to /api/bookings
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        setDataLoading(false);
        setStep(4); // Move to final confirmation screen

        // Post-submission, you might navigate away or reset the state
    };


    // --- EFFECTS ---
    // Fetch vehicles (Step 0)
    useEffect(() => {
        // ... (Vehicle fetch logic remains the same)
        const fetchVehicles = async () => {
            if (!token) {
                setVehicleLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/vehicles`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (res.status === 401 || res.status === 403) {
                    handleAuthError();
                    return;
                }

                const data = await res.json();
                const fetchedVehicles = Array.isArray(data) ? data : [];
                setVehicles(fetchedVehicles);

                // Auto-select if only one vehicle (optional but helpful UX)
                if (fetchedVehicles.length === 1) {
                    updateBookingData('vehicle', fetchedVehicles[0]);
                }

            } catch (err) {
                Alert.alert("Error", "Failed to load vehicles");
                setVehicles([]);
            } finally {
                setVehicleLoading(false);
            }
        };

        if (!authLoading) {
            fetchVehicles();
        }
    }, [token, authLoading, handleAuthError]);

    // Fetch data for the current step
    useEffect(() => {
        if (step === 1 && branches.length === 0) {
            fetchBranches();
        }
        if (step === 2 && services.length === 0) {
            fetchServices();
        }
        if (step === 3 && bookingData.branch && bookingData.date) {
            // Only fetch time slots if both branch and date are selected
            fetchTimeSlots(bookingData.branch.id, bookingData.date);
        }
    }, [step, branches.length, services.length, bookingData.branch, bookingData.date, fetchBranches, fetchServices, fetchTimeSlots]);


    // --- STEP RENDER FUNCTIONS ---
    const renderStep0Vehicle = () => {
        // ... (Existing Step 0 logic)
        if (vehicles.length === 0) {
            return (
                <View style={styles.center}>
                    <MaterialIcons
                        name="car-rental"
                        size={60}
                        color="rgba(255,255,255,0.4)"
                    />
                    <Text style={styles.text}>
                        No vehicles associated with your account.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate("AddVehicleScreen")}
                    >
                        <Text style={styles.addButtonText}>Add Vehicle</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <ScrollView contentContainerStyle={styles.grid}>
                {vehicles.map((v) => (
                    <TouchableOpacity
                        key={v.id}
                        style={[
                            styles.card,
                            bookingData.vehicle?.id === v.id && styles.cardSelected,
                        ]}
                        onPress={() => updateBookingData('vehicle', v)}
                    >
                        <MaterialIcons
                            name="check-circle"
                            size={18}
                            color={
                                bookingData.vehicle?.id === v.id
                                    ? PRIMARY_COLOR
                                    : "transparent"
                            }
                        />
                        <Text style={styles.cardTitle}>
                            {v.brand} {v.model}
                        </Text>
                        <Text style={styles.cardText}>
                            Plate: {v.license_plate}
                        </Text>
                        <Text style={styles.cardText}>VIN: {v.vin}</Text>
                        <Text style={styles.cardText}>
                            CRM: {v.crm_number || "---"}
                        </Text>
                    </TouchableOpacity>
                ))}
                {/* Manual Navigation */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={bookingData.vehicle ? styles.primaryButton : styles.disabledButton}
                        onPress={handleNextStep}
                        disabled={!bookingData.vehicle}
                    >
                        <Text style={styles.addButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderStep1Branch = () => {
        if (dataLoading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.text}>Loading available branches...</Text>
                </View>
            );
        }
        
        return (
            <ScrollView style={styles.contentArea}>
                <Text style={styles.selectionTitle}>Selected Vehicle: {bookingData.vehicle?.brand} {bookingData.vehicle?.model}</Text>
                
                {branches.map((b) => (
                    <TouchableOpacity
                        key={b.id}
                        style={[
                            styles.cardFull,
                            bookingData.branch?.id === b.id && styles.cardSelected,
                        ]}
                        onPress={() => handleSelectBranch(b)}
                    >
                        <View style={styles.branchIcon}>
                            <MaterialIcons name="location-on" size={24} color={bookingData.branch?.id === b.id ? BACKGROUND_COLOR : PRIMARY_COLOR} />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.cardTitle}>{b.name}</Text>
                            <Text style={styles.cardText}>{b.address}</Text>
                        </View>
                        {bookingData.branch?.id === b.id && <MaterialIcons name="check" size={24} color={BACKGROUND_COLOR} />}
                    </TouchableOpacity>
                ))}
                 <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handlePrevStep}>
                        <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderStep2Service = () => {
        if (dataLoading) {
             return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.text}>Loading services...</Text>
                </View>
            );
        }
        
        return (
            <ScrollView style={styles.contentArea}>
                <Text style={styles.selectionTitle}>Branch: {bookingData.branch?.name}</Text>

                {services.map((s) => (
                    <TouchableOpacity
                        key={s.id}
                        style={[
                            styles.cardFull,
                            bookingData.service?.id === s.id && styles.cardSelected,
                        ]}
                        onPress={() => handleSelectService(s)}
                    >
                        <View style={{flex: 1}}>
                            <Text style={styles.cardTitle}>{s.name}</Text>
                            <Text style={styles.cardText}>Duration: {s.durationMinutes} min</Text>
                        </View>
                        <Text style={[styles.cardTitle, {color: PRIMARY_COLOR, fontSize: 18}]}>
                            ${s.price.toFixed(2)}
                        </Text>
                        {bookingData.service?.id === s.id && <MaterialIcons name="check" size={24} color={BACKGROUND_COLOR} />}
                    </TouchableOpacity>
                ))}

                 <View style={styles.buttonContainerRow}>
                    <TouchableOpacity style={styles.secondaryButtonHalf} onPress={handlePrevStep}>
                        <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={bookingData.service ? styles.primaryButtonHalf : styles.disabledButtonHalf}
                        onPress={handleNextStep}
                        disabled={!bookingData.service}
                    >
                        <Text style={styles.addButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    const renderStep3DateTime = () => {
        const selectedDateText = bookingData.date 
            ? bookingData.date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) 
            : "Select a date";

        return (
            <View style={styles.contentArea}>
                <Text style={styles.selectionTitle}>Service: {bookingData.service?.name}</Text>

                {/* Date Picker Section */}
                <Text style={styles.label}>1. Choose Date</Text>
                <TouchableOpacity 
                    style={styles.inputField} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.inputText}>{selectedDateText}</Text>
                    <MaterialIcons name="calendar-today" size={20} color={PRIMARY_COLOR} />
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={bookingData.date || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? "spinner" : "default"}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                    />
                )}

                {/* Time Slot Section */}
                <Text style={styles.label}>2. Select Time Slot (Duration: {bookingData.service?.durationMinutes} min)</Text>
                
                {dataLoading && <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{marginTop: 10}}/>}

                {bookingData.date && !dataLoading && (
                    <View style={styles.timeGrid}>
                        {timeSlots.map((slot, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.timeCard,
                                    !slot.isAvailable && styles.timeCardUnavailable,
                                    bookingData.timeSlot === slot.time && styles.timeCardSelected,
                                ]}
                                onPress={() => slot.isAvailable && handleSelectTimeSlot(slot.time)}
                                disabled={!slot.isAvailable}
                            >
                                <Text style={styles.timeText}>{slot.time}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                
                {/* Navigation Buttons */}
                <View style={styles.buttonContainerRow}>
                    <TouchableOpacity style={styles.secondaryButtonHalf} onPress={handlePrevStep}>
                        <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={(bookingData.date && bookingData.timeSlot) ? styles.primaryButtonHalf : styles.disabledButtonHalf}
                        onPress={handleSubmitBooking}
                        disabled={!(bookingData.date && bookingData.timeSlot)}
                    >
                        <Text style={styles.addButtonText}>Confirm & Book</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStep4Confirmation = () => {
        const { vehicle, branch, service, date, timeSlot } = bookingData;
        
        return (
            <ScrollView style={styles.contentArea}>
                <View style={styles.confirmationBox}>
                    <MaterialIcons name="check-circle" size={80} color={PRIMARY_COLOR} />
                    <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
                    <Text style={styles.confirmationText}>
                        Your service appointment has been successfully scheduled.
                    </Text>
                </View>

                <Text style={styles.summaryHeader}>Booking Summary</Text>
                {/*  - Visual for data confirmation */}

                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Vehicle:</Text>
                    <Text style={styles.summaryValue}>{vehicle?.brand} {vehicle?.model}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Branch:</Text>
                    <Text style={styles.summaryValue}>{branch?.name} ({branch?.address})</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Service:</Text>
                    <Text style={styles.summaryValue}>{service?.name} (${service?.price.toFixed(2)})</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Date & Time:</Text>
                    <Text style={styles.summaryValue}>
                        {date?.toLocaleDateString()} @ {timeSlot}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.primaryButton, {marginTop: 30}]}
                    onPress={() => navigation.navigate("Home")} // Navigate back home
                >
                    <Text style={styles.addButtonText}>Done</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    // --------------------------------------------------
    // MASTER STEP RENDER
    // --------------------------------------------------
    const renderStep = () => {
        if (vehicleLoading || authLoading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.text}>Loading initial data...</Text>
                </View>
            );
        }

        if (!token) {
            return (
                <View style={styles.center}>
                    <Text style={styles.text}>
                        You must be logged in to book a service.
                    </Text>
                </View>
            );
        }

        switch (step) {
            case 0: // Select Vehicle
                return renderStep0Vehicle();
            case 1: // Choose Branch
                return renderStep1Branch();
            case 2: // Select Service
                // Enforce Step 0 completion before proceeding
                if (!bookingData.vehicle) return <View style={styles.center}><Text style={styles.errorText}>Please select a vehicle first.</Text></View>;
                return renderStep2Service();
            case 3: // Select Date & Time
                // Enforce Step 1 & 2 completion
                if (!bookingData.branch || !bookingData.service) return <View style={styles.center}><Text style={styles.errorText}>Please select branch and service first.</Text></View>;
                return renderStep3DateTime();
            case 4: // Confirmation
                return renderStep4Confirmation();
            default:
                return null;
        }
    };

    // --------------------------------------------------
    // RENDER MAIN STRUCTURE
    // --------------------------------------------------
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.header}>Book Service</Text>

            <View style={styles.stepper}>
                {steps.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i <= step && styles.dotActive,
                        ]}
                    />
                ))}
            </View>

            <Text style={styles.stepLabel}>{steps[step]}</Text>

            {renderStep()}
        </SafeAreaView>
    );
};

export default BookService;

// --------------------------------------------------
// STYLES (Expanded)
// --------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        paddingHorizontal: 16,
    },
    header: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
        paddingTop: 10,
    },
    stepper: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    dotActive: {
        backgroundColor: PRIMARY_COLOR,
    },
    stepLabel: {
        textAlign: "center",
        color: PRIMARY_COLOR,
        marginBottom: 20,
        fontWeight: "bold",
        fontSize: 16,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    text: {
        color: "#fff",
        marginTop: 10,
        textAlign: "center",
        fontSize: 16,
    },
    errorText: {
        color: '#ff4444',
        fontWeight: 'bold',
        fontSize: 18,
    },
    contentArea: {
        flex: 1,
        paddingBottom: 20,
    },
    selectionTitle: {
        color: PRIMARY_COLOR,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: CARD_BG,
        paddingBottom: 5,
    },
    // --- Card Styles (Step 0) ---
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingBottom: 50,
    },
    card: {
        width: "48%",
        backgroundColor: CARD_BG,
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    cardSelected: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: "rgba(0,188,212,0.2)",
    },
    cardTitle: {
        color: "#fff",
        fontWeight: "bold",
        marginTop: 6,
    },
    cardText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
    },
    // --- Full Card Styles (Step 1, 2) ---
    cardFull: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    branchIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: PRIMARY_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    // --- Step 3: Date/Time ---
    label: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 8,
    },
    inputField: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: PRIMARY_COLOR,
    },
    inputText: {
        color: '#fff',
        fontSize: 16,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    timeCard: {
        backgroundColor: CARD_BG,
        padding: 10,
        borderRadius: 6,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    timeCardSelected: {
        backgroundColor: PRIMARY_COLOR,
        borderColor: PRIMARY_COLOR,
    },
    timeCardUnavailable: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderColor: 'rgba(255, 0, 0, 0.3)',
        opacity: 0.6,
    },
    timeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // --- Step 4: Confirmation ---
    confirmationBox: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: CARD_BG,
        borderRadius: 15,
        marginBottom: 20,
    },
    confirmationTitle: {
        color: PRIMARY_COLOR,
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 15,
    },
    confirmationText: {
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 15,
    },
    summaryHeader: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
    },
    summaryValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // --- Button Styles ---
    buttonContainer: {
        width: '100%',
        marginTop: 20,
    },
    buttonContainerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    primaryButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    primaryButtonHalf: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '48%',
    },
    secondaryButton: {
        borderColor: PRIMARY_COLOR,
        borderWidth: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    },
    secondaryButtonHalf: {
        borderColor: PRIMARY_COLOR,
        borderWidth: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '48%',
    },
    disabledButton: {
        backgroundColor: 'rgba(0,188,212,0.5)',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    disabledButtonHalf: {
        backgroundColor: 'rgba(0,188,212,0.5)',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '48%',
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    secondaryButtonText: {
        color: PRIMARY_COLOR,
        fontWeight: "bold",
        fontSize: 16,
    },
});