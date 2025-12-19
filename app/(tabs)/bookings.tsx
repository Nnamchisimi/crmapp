import React, { useState, useEffect, useCallback } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    SafeAreaView, 
    Dimensions,
    Platform
} from 'react-native';

// Use Expo's Vector Icons (recommended for Expo projects)
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

// Replace react-router-dom with React Navigation (Using a mock navigate function for simplicity)
// In a real app, you would import { useNavigation } from '@react-navigation/native';
const useMockNavigation = () => {
    return {
        navigate: (screenName) => console.log(`Navigating to: ${screenName}`),
        // Placeholder function for demonstration
    };
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Configuration & Constants ---
const API_BASE_URL = "http://localhost:3007/api";

const defaultAppointmentDate = null;

const steps = [
    "Select Vehicle",
    "Choose Branch",
    "Choose Service",
    "Pick Date & Time",
    "Review & Confirm",
];

// Mock User Token and Email (Replaces localStorage)
const MOCK_USER_TOKEN = "mock-auth-token-123";
const MOCK_USER_EMAIL = "user@example.com";

// Helper to map icon names to Expo Vector Icons
const getIconComponent = (iconName, size = 24, color = '#00bcd4') => {
    const defaultIcon = <MaterialIcons name="build" size={size} color={color} />;
    switch (iconName) {
        case "Build": return <MaterialIcons name="build" size={size} color={color} />;
        case "Tune": return <MaterialIcons name="tune" size={size} color={color} />;
        case "FlashOn": return <MaterialIcons name="flash-on" size={size} color={color} />;
        case "TireRepair": return <MaterialIcons name="tire-repair" size={size} color={color} />;
        case "LocalGasStation": return <MaterialIcons name="local-gas-station" size={size} color={color} />;
        case "CarRental": return <MaterialIcons name="directions-car" size={size} color={color} />;
        case "LocationOn": return <MaterialIcons name="location-on" size={size} color={color} />;
        default: return defaultIcon;
    }
};

// --- Custom Calendar Mock Component (Converted to React Native) ---
const CalendarMock = ({ selectedDate, onDateSelect }) => {
    const dates = [];
    const today = new Date();

    for (let i = 1; dates.length < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // 0 is Sunday. We exclude 0.
        if (d.getDay() !== 0) {
            dates.push(d);
        }
    }

    return (
        <View style={styles.calendarContainer}>
            <Text style={styles.calendarTitle}>
                Select Date (Next 7 working days, excluding Sunday)
            </Text>
            <View style={styles.dateGrid}>
                {dates.map((date, index) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                    const dayOfMonth = date.getDate();

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onDateSelect(date)}
                            style={[
                                styles.datePill,
                                isSelected ? styles.datePillSelected : styles.datePillUnselected
                            ]}
                        >
                            <Text style={[styles.dateText, styles.dateDay, isSelected ? styles.textBlack : styles.textWhite]}>
                                {dayName}
                            </Text>
                            <Text style={[styles.dateText, styles.dateNumber, isSelected ? styles.textBlack : styles.textWhite]}>
                                {dayOfMonth}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

// --- Main Component (Converted to React Native) ---
const BookServiceScreen = () => {
    const navigate = useMockNavigation().navigate;
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [vehicles, setVehicles] = useState([]); 
    const [vehicleLoading, setVehicleLoading] = useState(true); 
    const [serviceTypes, setServiceTypes] = useState([]);
    const [serviceLoading, setServiceLoading] = useState(true); 
    const [branches, setBranches] = useState([]);
    const [branchLoading, setBranchLoading] = useState(true);

    // Time Slots States
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotsError, setSlotsError] = useState(null);

    // Form Data State
    const [formData, setFormData] = useState({
        vehicle: null,
        branch: null,
        service: null,
        date: defaultAppointmentDate,
        timeSlot: null,
        userEmail: MOCK_USER_EMAIL, // Use mock email
    });

    const isDateSelected = !!formData.date;
    const userToken = MOCK_USER_TOKEN; // Use mock token

    // Helper to handle authentication and redirection
    const handleAuthError = useCallback(() => {
        Alert.alert("Authentication Error", "You are not logged in. Please sign in again.");
        // In a real app, this would trigger a logout/navigation to signin
        // navigate("SignIn"); 
    }, [navigate]);

    // --- Data Fetching Hooks (Converted to RN style) ---

    // 1. Fetch Vehicle Data
    useEffect(() => {
        const fetchVehicles = async () => {
            setVehicleLoading(true);
            if (!userToken) { setVehicleLoading(false); return; }
            try {
                const res = await fetch(`${API_BASE_URL}/vehicles`, {
                    headers: { "Authorization": `Bearer ${userToken}` },
                });

                if (res.status === 401 || res.status === 403) { handleAuthError(); return; }

                const data = await res.json();
                const fetchedVehicles = Array.isArray(data) ? data : Array.isArray(data.vehicles) ? data.vehicles : [];
                setVehicles(fetchedVehicles);
                
                if (fetchedVehicles.length === 1) {
                    setFormData((prev) => ({ ...prev, vehicle: fetchedVehicles[0] }));
                }
            } catch (err) {
                console.error("Error fetching vehicles:", err);
                setVehicles([]);
            } finally {
                setVehicleLoading(false);
            }
        };
        fetchVehicles();
    }, [userToken, handleAuthError]);

    // 2. Fetch Branch Data
    useEffect(() => {
        const fetchBranches = async () => {
            setBranchLoading(true);
            if (!userToken) { setBranchLoading(false); return; }
            try {
                const res = await fetch(`${API_BASE_URL}/branch`, {
                    headers: { "Authorization": `Bearer ${userToken}` },
                }); 
                if (res.status === 401 || res.status === 403) { handleAuthError(); return; }
                if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }

                const data = await res.json();
                setBranches(data);
            } catch (err) {
                console.error("Error fetching branches:", err);
            } finally {
                setBranchLoading(false);
            }
        };
        fetchBranches();
    }, [userToken, handleAuthError]); 

    // 3. Fetch Service Type Data
    useEffect(() => {
        const fetchServiceTypes = async () => {
            setServiceLoading(true);
            if (!userToken) { setServiceLoading(false); return; }
            try {
                const res = await fetch(`${API_BASE_URL}/servicetype`, {
                    headers: { "Authorization": `Bearer ${userToken}` },
                }); 
                if (res.status === 401 || res.status === 403) { handleAuthError(); return; }
                if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }

                const data = await res.json();
                setServiceTypes(data);
            } catch (err) {
                console.error("Error fetching service types:", err);
            } finally {
                setServiceLoading(false);
            }
        };
        fetchServiceTypes();
    }, [userToken, handleAuthError]); 

    // 4. Fetch Available Time Slots based on selected date
    useEffect(() => {
        const fetchTimeSlots = async () => {
            if (!formData.date || !userToken) {
                setAvailableTimeSlots([]);
                if (!formData.date && formData.timeSlot) {
                    setFormData(prev => ({ ...prev, timeSlot: null }));
                }
                return;
            }

            setFormData(prev => ({ ...prev, timeSlot: null }));
            setLoadingSlots(true);
            setSlotsError(null);

            try {
                const dateString = formData.date.toISOString().split('T')[0]; 
                const response = await fetch(`${API_BASE_URL}/timeslots?date=${dateString}`, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 401 || response.status === 403) { handleAuthError(); return; }
                if (!response.ok) { throw new Error('Failed to fetch available time slots.'); }

                const slots = await response.json();
                setAvailableTimeSlots(slots);
                
                const firstAvailableSlot = slots.find(s => s.is_available);
                const newTimeSlot = firstAvailableSlot ? firstAvailableSlot.slot_time : null;
                
                setFormData(prev => ({ ...prev, timeSlot: newTimeSlot }));

            } catch (error) {
                console.error("Error fetching time slots:", error);
                setSlotsError("Could not load available slots for this date.");
                setAvailableTimeSlots([]);
                setFormData(prev => ({ ...prev, timeSlot: null }));
            } finally {
                setLoadingSlots(false);
            }
        };

        const handler = setTimeout(fetchTimeSlots, 100); 
        return () => clearTimeout(handler); 
        
    }, [formData.date, userToken, handleAuthError]); 

    // --- Handlers ---
    const handleNext = () => setStep((prevActiveStep) => prevActiveStep + 1);
    const handleBack = () => setStep((prevActiveStep) => prevActiveStep - 1);

    const handleBooking = async () => {
        if (!userToken) {
            Alert.alert("Error", "Authentication failed. Please sign in again.");
            navigate("/signin");
            return;
        }

        setLoading(true);

        if (!formData.date || !formData.timeSlot || !formData.service || !formData.branch || !formData.vehicle) {
            Alert.alert("Error", "Please complete all required fields before confirming.");
            setLoading(false);
            return;
        }

        const appointmentDate = formData.date.toISOString().split('T')[0];
        const appointmentTime = formData.timeSlot.substring(0, 5);

        const bookingPayload = {
            vehicleId: formData.vehicle.id,
            serviceTypeId: formData.service.id,
            branchId: formData.branch.id,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime
        };

        console.log("Submitting Booking Payload:", bookingPayload);

        try {
            const res = await fetch(`${API_BASE_URL}/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userToken}`,
                },
                body: JSON.stringify(bookingPayload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to create booking: ${res.statusText}`);
            }

            Alert.alert("Success", "Service Appointment Booked Successfully!");
            navigate("Dashboard"); // Navigate to dashboard in a real app

        } catch (error) {
            console.error("Booking submission error:", error);
            Alert.alert("Error", `Error booking appointment: ${error.message}. Please try again.`);
        }

        setLoading(false);
    };

    // Helper to format date for display
    const formatDate = (date) => {
        if (!date) return "N/A";
        return date.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    // --- Step Validation Logic ---
    const isStepValid = () => {
        if (step === 0 && (vehicleLoading || !userToken)) return false;
        if(step === 1 && (branchLoading || !userToken)) return false; 
        if (step === 2 && (serviceLoading || !userToken)) return false; 
        if (step === 3 && loadingSlots) return false;
        
        switch (step) {
            case 0: return !!formData.vehicle;
            case 1: return !!formData.branch;
            case 2: return !!formData.service;
            case 3: 
                const selectedSlot = availableTimeSlots.find(s => s.slot_time === formData.timeSlot);
                return isDateSelected && !!formData.timeSlot && !!selectedSlot && selectedSlot.is_available;
            case 4: 
                const isStep3Valid = (() => {
                    const slot = availableTimeSlots.find(s => s.slot_time === formData.timeSlot);
                    return isDateSelected && !!formData.timeSlot && !!slot && slot.is_available;
                })();
                return !!formData.vehicle && !!formData.service && !!formData.branch && isStep3Valid;
            default: return false;
        }
    };

    // --- Step Content Renderer (Simplified) ---
    const renderStepContent = () => {
        switch (step) {
            case 0: // Step 1: Select Vehicle
                if (vehicleLoading) {
                    return <ActivityIndicator size="large" color="#00bcd4" style={styles.loader} />;
                }
                if (!userToken) {
                    return <Text style={styles.errorText}>Error: You are not logged in. Please sign in to view your vehicles.</Text>;
                }
                if (vehicles.length === 0) {
                    return (
                        <View>
                            <Text style={styles.fadedText}>No vehicles found associated with your account.</Text>
                            <TouchableOpacity 
                                style={styles.addButton} 
                                onPress={() => navigate("addVehicle")}
                            >
                                <Text style={styles.addButtonText}>Add New Vehicle</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }

                return (
                    <View>
                        <Text style={styles.stepTitle}>Select a Vehicle</Text>
                        <View style={styles.gridContainer}>
                            {vehicles.map((vehicle) => {
                                const isSelected = formData.vehicle?.id === vehicle.id;
                                return (
                                    <TouchableOpacity
                                        key={vehicle.id}
                                        onPress={() => setFormData({ ...formData, vehicle })}
                                        style={[
                                            styles.vehicleCard,
                                            isSelected ? styles.cardSelected : styles.cardUnselected
                                        ]}
                                    >
                                        <MaterialIcons name="directions-car" size={24} color="#00bcd4" style={styles.iconRight} />
                                        <Text style={styles.cardTitle}>{vehicle.brand} {vehicle.model}</Text>
                                        <Text style={styles.cardText}>License: {vehicle.license_plate}</Text>
                                        <Text style={styles.cardText}>VIN: {vehicle.vin}</Text>
                                        <Text style={styles.cardText}>CRM Number: {vehicle.crm_number || "---"}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 1: // Step 2: Choose Branch
                if (branchLoading) {
                    return <ActivityIndicator size="large" color="#00bcd4" style={styles.loader} />;
                }
                if (!userToken) {
                    return <Text style={styles.errorText}>Error: Not authenticated. Cannot load branches.</Text>;
                }
                if (branches.length === 0) {
                    return <Text style={styles.errorText}>Error: No Branches available. Please contact Support</Text>;
                }

                return (
                    <View>
                        <Text style={styles.stepTitle}>Choose a Branch</Text>
                        <View style={styles.gridContainer}>
                            {branches.map((branch) => {
                                const isSelected = formData.branch?.id === branch.id;
                                return (
                                    <TouchableOpacity
                                        key={branch.id}
                                        onPress={() => setFormData({ ...formData, branch })}
                                        style={[
                                            styles.branchCard,
                                            isSelected ? styles.cardSelected : styles.cardUnselected
                                        ]}
                                    >
                                        <View style={styles.radioContainer}>
                                            <View style={[styles.radio, isSelected && styles.radioSelected]} />
                                            <Text style={styles.cardTitle}>{branch.name}</Text>
                                            {getIconComponent('LocationOn', 24, '#00bcd4')}
                                        </View>
                                        <Text style={styles.cardText}>{branch.address || 'Address not available'}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );
            
            case 2: // Step 3: Choose Service
                if (serviceLoading) {
                    return <ActivityIndicator size="large" color="#00bcd4" style={styles.loader} />;
                }
                if (!userToken) {
                    return <Text style={styles.errorText}>Error: Not authenticated. Cannot load services.</Text>;
                }
                if (serviceTypes.length === 0) {
                    return <Text style={styles.errorText}>Error: No services available. Please contact support.</Text>;
                }

                return (
                    <View>
                        <Text style={styles.stepTitle}>Choose Service Type</Text>
                        <View style={styles.gridContainer}>
                            {serviceTypes.map((service) => {
                                const isSelected = formData.service?.id === service.id;
                                return (
                                    <TouchableOpacity
                                        key={service.id}
                                        onPress={() => setFormData({ ...formData, service })}
                                        style={[
                                            styles.serviceCard,
                                            isSelected ? styles.cardSelected : styles.cardUnselected
                                        ]}
                                    >
                                        <View style={styles.iconTopRight}>
                                            {getIconComponent(service.type, 30)}
                                        </View>
                                        <View style={styles.radioContainer}>
                                            <View style={[styles.radio, isSelected && styles.radioSelected]} />
                                            <Text style={styles.cardTitle}>{service.label}</Text>
                                        </View>
                                        <Text style={styles.cardText}>Cost: ${service.cost}</Text>
                                        <Text style={styles.cardText}>{service.description}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );

            case 3: // Step 4: Pick Date & Time
                return (
                    <View>
                        <Text style={styles.stepTitle}>Pick Date & Time</Text>
                        <CalendarMock 
                            selectedDate={formData.date} 
                            onDateSelect={(date) => setFormData({ ...formData, date })} 
                        />

                        {isDateSelected && (
                            <View style={styles.timeSlotSection}>
                                <Text style={styles.timeSlotTitle}>Available Time Slots for {formatDate(formData.date)}</Text>
                                {loadingSlots ? (
                                    <ActivityIndicator size="large" color="#00bcd4" style={styles.loader} />
                                ) : slotsError ? (
                                    <Text style={styles.errorText}>{slotsError}</Text>
                                ) : availableTimeSlots.length === 0 ? (
                                    <Text style={styles.fadedText}>No available slots for this date.</Text>
                                ) : (
                                    <View style={styles.timeSlotGrid}>
                                        {availableTimeSlots.map((slot, index) => {
                                            const isSelected = formData.timeSlot === slot.slot_time;
                                            const isDisabled = !slot.is_available;
                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => !isDisabled && setFormData({ ...formData, timeSlot: slot.slot_time })}
                                                    disabled={isDisabled}
                                                    style={[
                                                        styles.timePill,
                                                        isSelected ? styles.timePillSelected : styles.timePillUnselected,
                                                        isDisabled && styles.timePillDisabled
                                                    ]}
                                                >
                                                    <Text style={[styles.timeText, isSelected ? styles.textBlack : styles.textWhite, isDisabled && styles.textDisabled]}>
                                                        {slot.slot_time.substring(0, 5)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                );

            case 4: // Step 5: Review & Confirm
                const service = formData.service;
                const vehicle = formData.vehicle;
                const branch = formData.branch;
                const appointmentDateTime = formData.date && formData.timeSlot 
                    ? `${formatDate(formData.date)} at ${formData.timeSlot.substring(0, 5)}` 
                    : "N/A";

                return (
                    <View style={styles.reviewContainer}>
                        <Text style={styles.stepTitle}>Review & Confirm Booking</Text>
                        
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryHeader}><MaterialIcons name="directions-car" size={18} color="#00bcd4" /> Vehicle Details</Text>
                            <Text style={styles.summaryText}>**Model:** {vehicle?.brand} {vehicle?.model}</Text>
                            <Text style={styles.summaryText}>**License Plate:** {vehicle?.license_plate}</Text>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryHeader}><MaterialIcons name="build" size={18} color="#00bcd4" /> Service Details</Text>
                            <Text style={styles.summaryText}>**Type:** {service?.label}</Text>
                            <Text style={styles.summaryText}>**Cost:** ${service?.cost}</Text>
                            <Text style={styles.summaryText}>**Estimated Duration:** {service?.duration || 'Unknown'}</Text>
                        </View>
                        
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryHeader}><MaterialIcons name="location-on" size={18} color="#00bcd4" /> Branch Details</Text>
                            <Text style={styles.summaryText}>**Branch Name:** {branch?.name}</Text>
                            <Text style={styles.summaryText}>**Address:** {branch?.address || 'N/A'}</Text>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryHeader}><MaterialIcons name="event-available" size={18} color="#00bcd4" /> Appointment Time</Text>
                            <Text style={styles.summaryText}>**Date & Time:** {appointmentDateTime}</Text>
                        </View>

                        {isStepValid() ? (
                            <Text style={styles.validText}>All set! Click Confirm to book your service.</Text>
                        ) : (
                            <Text style={styles.errorText}>Please complete all steps before confirming.</Text>
                        )}
                    </View>
                );

            default: return <Text style={styles.errorText}>Unknown Step</Text>;
        }
    };

    // --- Stepper UI (Simplified) ---
    const renderStepper = () => (
        <View style={styles.stepperContainer}>
            {steps.map((label, index) => {
                const isActive = index === step;
                const isCompleted = index < step;
                return (
                    <View key={index} style={styles.stepItem}>
                        <View style={[styles.stepDot, isActive && styles.stepDotActive, isCompleted && styles.stepDotCompleted]}>
                            <Text style={styles.stepDotText}>{isCompleted ? <MaterialIcons name="check" size={14} color="#000" /> : index + 1}</Text>
                        </View>
                        <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
                        {index < steps.length - 1 && <View style={styles.stepLine} />}
                    </View>
                );
            })}
        </View>
    );

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Book Service Appointment</Text>
            </View>
            
            <ScrollView style={styles.container}>
                {renderStepper()}
                <View style={styles.contentContainer}>
                    {renderStepContent()}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    onPress={handleBack} 
                    disabled={step === 0 || loading}
                    style={[styles.button, styles.backButton, (step === 0 || loading) && styles.buttonDisabled]}
                >
                    <MaterialIcons name="chevron-left" size={24} color={step === 0 ? "#444" : "white"} />
                    <Text style={[styles.buttonText, step === 0 && styles.textDisabled]}>Back</Text>
                </TouchableOpacity>

                {step === steps.length - 1 ? (
                    <TouchableOpacity 
                        onPress={handleBooking} 
                        disabled={!isStepValid() || loading}
                        style={[styles.button, styles.confirmButton, (!isStepValid() || loading) && styles.buttonDisabled]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <MaterialIcons name="check-circle" size={24} color="#000" />
                                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        onPress={handleNext} 
                        disabled={!isStepValid() || loading}
                        style={[styles.button, styles.nextButton, (!isStepValid() || loading) && styles.buttonDisabled]}
                    >
                        <Text style={[styles.buttonText, (!isStepValid() || loading) && styles.textDisabled]}>Next</Text>
                        <MaterialIcons name="chevron-right" size={24} color={!isStepValid() || loading ? "#444" : "white"} />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

// --- Stylesheet (Converted from MUI sx to React Native StyleSheet) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#121212', // Dark background
    },
    header: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1e1e1e',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#00bcd4', // Teal color
        textAlign: 'center',
    },
    container: {
        flex: 1,
        padding: 15,
    },
    contentContainer: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    loader: {
        marginVertical: 40,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    fadedText: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 15,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00bcd4',
        marginBottom: 20,
        textAlign: 'center',
    },

    // --- Stepper Styles ---
    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        marginBottom: 10,
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
        paddingHorizontal: 5,
    },
    stepItem: {
        flex: 1,
        alignItems: 'center',
    },
    stepDot: {
        width: 25,
        height: 25,
        borderRadius: 12.5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    stepDotActive: {
        backgroundColor: '#00bcd4',
    },
    stepDotCompleted: {
        backgroundColor: '#00bcd4',
    },
    stepDotText: {
        color: 'white',
        fontWeight: 'bold',
    },
    stepLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginTop: 4,
    },
    stepLabelActive: {
        color: '#00bcd4',
        fontWeight: 'bold',
    },
    stepLine: {
        position: 'absolute',
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        top: 12,
        zIndex: -1,
        left: '50%',
        right: '-50%',
    },

    // --- Grid/Card Styles ---
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly', // Adjust to space out items
        marginHorizontal: -5, // Compensate for item margin/padding
    },
    cardBase: {
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        minWidth: SCREEN_WIDTH * 0.45, // About 2 per row
        maxWidth: SCREEN_WIDTH * 0.48, 
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
    },
    vehicleCard: { ...Platform.select({ web: { width: 300, height: 170 }, default: {} }), ...this.cardBase, flexGrow: 1, margin: 5 },
    branchCard: { ...Platform.select({ web: { width: 150, height: 150 }, default: {} }), ...this.cardBase, flexGrow: 1, margin: 5, justifyContent: 'space-between' },
    serviceCard: { ...Platform.select({ web: { width: 150, height: 150 }, default: {} }), ...this.cardBase, flexGrow: 1, margin: 5, position: 'relative' },

    cardUnselected: {
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardSelected: {
        backgroundColor: 'rgba(0,188,212,0.2)',
        borderColor: '#00bcd4',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    cardText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 2,
    },
    iconRight: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    iconTopRight: {
        alignSelf: 'flex-end',
        marginBottom: 10,
    },

    // --- Radio Button Mimic for RN ---
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    radio: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#00bcd4',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        backgroundColor: '#00bcd4',
    },

    // --- Calendar Styles ---
    calendarContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
    },
    calendarTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    dateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    datePill: {
        padding: 8,
        margin: 5,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    datePillSelected: {
        backgroundColor: '#00bcd4',
    },
    datePillUnselected: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dateText: {
        textAlign: 'center',
    },
    textWhite: { color: 'white' },
    textBlack: { color: '#000' },
    dateDay: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    dateNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 20, // To mimic MUI Typography h6 line height
    },

    // --- Time Slot Styles ---
    timeSlotSection: {
        marginTop: 20,
    },
    timeSlotTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    timeSlotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    timePill: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        margin: 5,
        borderRadius: 15,
        borderWidth: 1,
    },
    timePillUnselected: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    timePillSelected: {
        backgroundColor: '#00bcd4',
        borderColor: '#00bcd4',
    },
    timePillDisabled: {
        backgroundColor: 'rgba(50,50,50,1)',
        borderColor: 'rgba(50,50,50,1)',
    },
    timeText: {
        fontWeight: 'bold',
    },
    textDisabled: {
        color: 'rgba(255,255,255,0.3)',
    },

    // --- Review Styles ---
    reviewContainer: {
        padding: 10,
        backgroundColor: '#1e1e1e',
        borderRadius: 10,
    },
    summaryBox: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
    },
    summaryHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00bcd4',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,188,212,0.3)',
        paddingBottom: 5,
    },
    summaryText: {
        fontSize: 14,
        color: 'white',
        lineHeight: 24,
    },
    validText: {
        color: '#4CAF50',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 20,
    },

    // --- Footer/Button Styles ---
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1e1e1e',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
        minWidth: '48%',
        justifyContent: 'center',
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    nextButton: {
        backgroundColor: '#00bcd4',
    },
    confirmButton: {
        backgroundColor: '#00bcd4',
        minWidth: '100%',
    },
    buttonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    confirmButtonText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButton: {
        marginTop: 10,
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#00bcd4',
        alignSelf: 'center',
    },
    addButtonText: {
        color: '#00bcd4',
        fontWeight: 'bold',
    },
});

export default BookServiceScreen;