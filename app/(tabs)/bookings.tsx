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
import DateTimePicker from "@react-native-community/datetimepicker";

import { useNavigation } from "@react-navigation/native";

const API_BASE_URL = "http://192.168.55.73:3007";
const PRIMARY_COLOR = "#00bcd4";
const BACKGROUND_COLOR = "#1a1a1a";
const CARD_BG = "rgba(255,255,255,0.05)";
const WHITE_TEXT = "#ffffff";
const SECONDARY_TEXT = "rgba(255,255,255,0.7)";
const DISABLED_COLOR = "rgba(0,188,212,0.3)";

const CustomChip: React.FC<{ label: string, color: string, style?: any }> = ({ label, color, style }) => (
  <View style={[styles.chip, { backgroundColor: color }, style]}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);
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
    label: string;
    cost: number;
    durationMinutes: number;
}
interface TimeSlot {
    time: string;
    isAvailable: boolean;
    remainingQuota: number;
}

interface BookingData {
    vehicle: Vehicle | null;
    branch: Branch | null;
    service: Service | null;
    date: Date | null;
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

const BookService = () => {
    const navigation = useNavigation<any>();
    const { token, email, loading: authLoading } = useAuth();

    const [step, setStep] = useState(0);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleLoading, setVehicleLoading] = useState(true);

    const [branches, setBranches] = useState<Branch[]>([]);
    const [branchesLoading, setBranchLoading] = useState(true);

    const [services, setServiceTypes] = useState<Service[]>([]);
    const [serviceLoading, setServiceLoading] = useState(true);

    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    const [bookingData, setBookingData] = useState<BookingData>({
        vehicle: null,
        branch: null,
        service: null,
        date: null,
        timeSlot: null,
        userEmail: email,
    });

    const [showDatePicker, setShowDatePicker] = useState(false);

    const updateBookingData = (key: keyof BookingData, value: any) => {
        setBookingData(prev => ({ ...prev, [key]: value }));
    };

    const handleAuthError = useCallback(() => {
        Alert.alert("Session expired", "Please sign in again.", [
            {
                text: "OK",
                onPress: async () => {
                    await AsyncStorage.multiRemove(["token", "email"]);
                    navigation.navigate("signin");
                },
            },
        ]);
    }, [navigation]);


    const fetchTimeSlots = useCallback(
        async (branchId: number, date: Date) => {
            if (!token) return;

            setDataLoading(true);
            setTimeSlots([]);
            updateBookingData('timeSlot', null);

            try {
                const formattedDate = date.toISOString().split("T")[0];

                const res = await fetch(
                    `${API_BASE_URL}/api/timeslots?branchId=${branchId}&date=${formattedDate}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (res.status === 401 || res.status === 403) {
                    handleAuthError();
                    return;
                }

                if (!res.ok) {
                    throw new Error(`Failed to fetch time slots (${res.status})`);
                }

                const data = await res.json();

                if (!Array.isArray(data) || data.length === 0) {
                    setTimeSlots([]);
                    return;
                }

                const mappedSlots: TimeSlot[] = data.map((slot: any) => ({
                    time: slot.slot_time,
                    isAvailable: slot.is_available,
                    remainingQuota: slot.remaining_quota,
                }));

                setTimeSlots(mappedSlots);
            } catch (err) {
                console.error("Error fetching time slots:", err);
                Alert.alert("Error", "Unable to load time slots for this date.");
                setTimeSlots([]);
            } finally {
                setDataLoading(false);
            }
        },
        [token, handleAuthError]
    );

    const handleNextStep = () => {
        setStep(prev => prev < steps.length - 1 ? prev + 1 : prev);
    };

    const handlePrevStep = () => {
        setStep(prev => prev > 0 ? prev - 1 : prev);
    };

    const handleSelectBranch = (branch: Branch) => {
        updateBookingData('branch', branch);
        updateBookingData('service', null);
        handleNextStep();
    };

    const handleSelectService = (service: Service) => {
        updateBookingData('service', service);
        handleNextStep();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'ios' || selectedDate) {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const selectedDay = new Date(selectedDate);
            selectedDay.setHours(0, 0, 0, 0);

            if (selectedDay < today) {
                Alert.alert("Invalid Date", "Please select today or a future date.");
                return;
            }

            updateBookingData("date", selectedDate); 
            updateBookingData("timeSlot", null);
            setTimeSlots([]);
        }
    };

    const handleSelectTimeSlot = (time: string) => {
        updateBookingData('timeSlot', time);
    };

    const handleSubmitBooking = async () => {
        if (!bookingData.vehicle || !bookingData.branch || !bookingData.service || !bookingData.date || !bookingData.timeSlot || !token) {
            Alert.alert("Missing Information", "Please complete all steps and ensure you are logged in before confirming.");
            return;
        }

        setDataLoading(true);
        
        const submissionData = {
            vehicleId: bookingData.vehicle.id,
            serviceTypeId: bookingData.service.id, 
            branchId: bookingData.branch.id,
            
            appointmentDate: bookingData.date.toISOString().split("T")[0], 
            
            appointmentTime: bookingData.timeSlot,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, 
                },
                body: JSON.stringify(submissionData),
            });

            if (res.status === 401 || res.status === 403) {
                handleAuthError();
                return;
            }

            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({})); 
                throw new Error(errorBody.message || `Booking failed with status: ${res.status}`);
            }

            const successResponse = await res.json();
            Alert.alert("Success", successResponse.message || "Your appointment has been successfully scheduled.");
            setStep(4);

        } catch (err) {
            console.error("Error submitting booking:", err);
            Alert.alert("Booking Failed", (err as Error).message);
        } finally {
            setDataLoading(false);
        }
    };


    useEffect(() => {
        const fetchBranches = async () => { 
            setBranchLoading(true);
            if (!token) {
                setBranchLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/api/branch`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (res.status === 401 || res.status === 403) {
                    handleAuthError();
                    return;
                }
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setBranches(data);
            } catch (err) {
                console.error("Error fetching branches:", err);
                Alert.alert("Error", "Failed to load branches.");
            } finally {
                setBranchLoading(false);
            }
        };
        if (!authLoading) {
            fetchBranches();
        }
    }, [token, authLoading, handleAuthError]);

    useEffect(() => {
        const fetchServiceTypes = async () => {
            setServiceLoading(true);
            if (!token) {
                setServiceLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/api/servicetype`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (res.status === 401 || res.status === 403) {
                    handleAuthError();
                    return;
                }
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                
                const parsedServices = data.map((s: any) => ({
                    ...s,
                    cost: parseFloat(s.cost), 
                }));
                
                setServiceTypes(parsedServices);
                
            } catch (err) {
                console.error("Error fetching service types:", err);
                Alert.alert("Error", "Failed to load service types.");
            } finally {
                setServiceLoading(false);
            }
        };
        if (!authLoading) {
            fetchServiceTypes();
        }
    }, [token, authLoading, handleAuthError]);


    useEffect(() => {
        const fetchVehicles = async () => {
            setVehicleLoading(true);
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

    useEffect(() => {
        if (step === 3 && bookingData.branch && bookingData.date) {
            fetchTimeSlots(bookingData.branch.id, bookingData.date);
        }
    }, [step, bookingData.branch, bookingData.date, fetchTimeSlots]);


    const renderStep0Vehicle = () => {
        if (vehicleLoading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.text}>Loading vehicles...</Text>
                </View>
            );
        }

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
                        onPress={() => navigation.navigate("addVehicle")}
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
        if (branchesLoading) {
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
                        <View style={[styles.branchIcon, bookingData.branch?.id === b.id && {backgroundColor: BACKGROUND_COLOR}]}>
                            <MaterialIcons name="location-on" size={24} color={bookingData.branch?.id === b.id ? PRIMARY_COLOR : PRIMARY_COLOR} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{b.name}</Text>
                            <Text style={styles.cardText}>{b.address}</Text>
                        </View>
                        {bookingData.branch?.id === b.id && <MaterialIcons name="check" size={24} color={PRIMARY_COLOR} />}
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
        if (serviceLoading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.text}>Loading services...</Text>
                </View>
            );
        }

        if (!services || services.length === 0) {
            return (
                <View style={styles.center}>
                    <Text style={styles.cardTitle}>No Services Available</Text>
                    <Text style={styles.cardText}>Please choose another branch or contact support.</Text>
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
                        
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{s.label}</Text>
                            <Text style={styles.cardText}>Duration: {s.durationMinutes} min</Text>
                        </View>

                        <Text style={[styles.cardTitle, {marginRight: 10}]}>
                            ${s.cost.toFixed(2)}
                        </Text>

                        {bookingData.service?.id === s.id && <MaterialIcons name="check" size={24} color={PRIMARY_COLOR} />}
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
                <Text style={styles.selectionTitle}>Service: {bookingData.service?.label}</Text>

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

                <Text style={styles.label}>2. Select Time Slot (Duration: {bookingData.service?.durationMinutes} min)</Text>

                {dataLoading && !bookingData.timeSlot && <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{ marginTop: 10 }} />}

                {bookingData.date && !dataLoading && (
                    <View style={styles.timeGrid}>
                        {timeSlots.length > 0 ? (
                            timeSlots.map((slot, index) => (
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
                            ))
                        ) : (
                            <Text style={[styles.text, {textAlign: 'left', marginLeft: 5}]}>No available slots for this date.</Text>
                        )}
                    </View>
                )}
                   <View style={styles.buttonContainerRow}>
                    <TouchableOpacity style={styles.secondaryButtonHalf} onPress={handlePrevStep}>
                        <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={
                            (bookingData.date && bookingData.timeSlot && !dataLoading) 
                                ? styles.primaryButtonHalf 
                                : styles.disabledButtonHalf
                        }
                        onPress={handleSubmitBooking}
                        disabled={!(bookingData.date && bookingData.timeSlot) || dataLoading}
                    >
                        {dataLoading ? (
                            <ActivityIndicator color={WHITE_TEXT} />
                        ) : (
                            <Text style={styles.addButtonText}>Confirm & Book</Text>
                        )}
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
                    <Text style={styles.summaryValue}>{service?.label} (${service?.cost.toFixed(2)})</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Date & Time:</Text>
                    <Text style={styles.summaryValue}>
                        {date?.toLocaleDateString()} @ {timeSlot}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.primaryButton, { marginTop: 30 }]}
                    onPress={() => navigation.navigate("dashboard")}
                >
                    <Text style={styles.addButtonText}>Done</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderStep = () => {
        if (vehicleLoading || authLoading || branchesLoading || serviceLoading) {
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
            case 0:
                return renderStep0Vehicle();
            case 1:
                return renderStep1Branch();
            case 2:
                if (!bookingData.vehicle) return <View style={styles.center}><Text style={styles.errorText}>Please select a vehicle first.</Text></View>;
                return renderStep2Service();
            case 3:
                if (!bookingData.branch || !bookingData.service) return <View style={styles.center}><Text style={styles.errorText}>Please select branch and service first.</Text></View>;
                return renderStep3DateTime();
            case 4:
                return renderStep4Confirmation();
            default:
                return null;
        }
    };

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


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        paddingHorizontal: 20,
    },


    
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: WHITE_TEXT,
        marginBottom: 20,
        marginTop: Platform.OS === 'android' ? 10 : 0,
    },
    stepper: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: SECONDARY_TEXT,
    },
    dotActive: {
        backgroundColor: PRIMARY_COLOR,
    },
    stepLabel: {
        fontSize: 18,
        color: PRIMARY_COLOR,
        fontWeight: "600",
        marginBottom: 10,
    },
    contentArea: {
        flex: 1,
        paddingHorizontal: 0,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        color: SECONDARY_TEXT,
        fontSize: 16,
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginTop: 10,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    card: {
        width: "48%",
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "transparent",
        justifyContent: 'space-between',
        minHeight: 150,
    },
    cardFull: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "transparent",
    },
    cardSelected: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: "rgba(0, 188, 212, 0.1)",
    },
    cardTitle: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    cardText: {
        color: SECONDARY_TEXT,
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: PRIMARY_COLOR,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        width: '100%',
    },
    primaryButtonHalf: {
        backgroundColor: PRIMARY_COLOR,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
        marginLeft: 10,
    },
    disabledButton: {
        backgroundColor: DISABLED_COLOR,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        width: '100%',
    },
    disabledButtonHalf: {
        backgroundColor: DISABLED_COLOR,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
        marginLeft: 10,
    },
    addButtonText: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: "bold",
    },
    secondaryButton: {
        borderColor: PRIMARY_COLOR,
        borderWidth: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        width: '100%',
    },
    secondaryButtonHalf: {
        borderColor: PRIMARY_COLOR,
        borderWidth: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    secondaryButtonText: {
        color: PRIMARY_COLOR,
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonContainer: {
        width: '100%',
        marginTop: 20,
    },
    buttonContainerRow: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'space-between',
        width: '100%',
    },
    branchIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,188,212,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    selectionTitle: {
        color: SECONDARY_TEXT,
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
        paddingVertical: 10,
        backgroundColor: CARD_BG,
        borderRadius: 8,
    },
    label: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    inputField: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: CARD_BG,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: PRIMARY_COLOR,
    },
    inputText: {
        color: WHITE_TEXT,
        fontSize: 16,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    timeCard: {
        width: '31%',
        padding: 12,
        backgroundColor: CARD_BG,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    timeCardSelected: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: "rgba(0, 188, 212, 0.2)",
    },
    timeCardUnavailable: {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        opacity: 0.5,
        borderColor: 'transparent',
    },
    timeText: {
        color: WHITE_TEXT,
        fontSize: 14,
        fontWeight: '500',
    },
    confirmationBox: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: CARD_BG,
        borderRadius: 10,
        marginBottom: 20,
        marginTop: 20,
    },
    confirmationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
        marginTop: 15,
        marginBottom: 10,
    },
    confirmationText: {
        color: SECONDARY_TEXT,
        textAlign: 'center',
        fontSize: 16,
    },
    summaryHeader: {
        fontSize: 20,
        color: WHITE_TEXT,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: SECONDARY_TEXT,
        paddingBottom: 5,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: CARD_BG,
    },
      // Chip
  chip: {
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
  },
  chipText: {
    color: PRIMARY_COLOR,
    fontSize: 12,
    fontWeight: 'bold',
  },

    summaryLabel: {
        color: SECONDARY_TEXT,
        fontSize: 16,
    },
    summaryValue: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: '500',
        maxWidth: '70%',
        textAlign: 'right',
    }
});


export default BookService;