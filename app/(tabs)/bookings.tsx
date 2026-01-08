import React, { useState, useEffect, useCallback, useRef } from "react";
import { router } from "expo-router";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    SafeAreaView,
    Dimensions,
    Animated,
    Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const API_BASE_URL = "http://192.168.55.73:3007";
const PRIMARY_COLOR = "#00bcd4";
const BACKGROUND_COLOR = "#000";
const CARD_BG = "rgba(255,255,255,0.05)";
const WHITE_TEXT = "#ffffff";
const SECONDARY_TEXT = "rgba(255,255,255,0.7)";
const DISABLED_COLOR = "rgba(0,188,212,0.3)";
const ERROR_COLOR = '#ff4d4f'; 
const BORDER_COLOR = 'rgba(255,255,255,0.1)';
const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.75; 

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
 
}
interface Service {
    id: number;
    label: string;
    cost: number;
    durationMinutes: number;
}
interface TimeSlot {
    slot_time: string;
    is_available: boolean;
    remaining_quota: number;
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

const SidebarItem = ({ text, iconName, onPress }: { text: string; iconName: keyof typeof MaterialIcons.glyphMap; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.drawerItem}>
        <MaterialIcons name={iconName} size={24} color="#ccc" />
        <Text style={styles.drawerItemText}>{text}</Text>
    </TouchableOpacity>
);

const CustomChip: React.FC<{ label: string, style?: any }> = ({ label, style }) => (
    <View style={[styles.chip, style]}>
        <Text style={styles.chipText}>{label}</Text>
    </View>
);

const navigate = useCallback((path: string) => {
    if (path === '/signin') return router.replace('/signin');
    if (path === '/addVehicle') return router.push('/addVehicle');
    if (path === '/campaigns') return router.push('/campaigns');
    if (path === '/bookings') return router.push('/bookings');
    if (path === '/notifications') return router.push('/notifications');
    if (path === '/newsletter') return router.push('/newsletter');
    if (path.startsWith('/vehicles/')) {
        const id = path.split('/')[2];
        return router.push({
            pathname:"/vehicles/[id]",
            params:{id},
        });
    }

    if (path === '/dashboard') return router.push('/dashboard');
    if (path === '/') return router.push('/dashboard')
    
    console.warn(`Navigation path not handled: ${path}`);
}, []);

const sidebarItems: { text: string; icon: keyof typeof MaterialIcons.glyphMap; path: string }[] = [
    { text: "Home", icon: "home", path: "/" },
    { text: "Dashboard", icon: "dashboard", path: "/dashboard" },
    { text: "Campaigns", icon: "campaign", path: "/campaigns" },
    { text: "Newsletter", icon: "email", path: "/newsletter" },
    { text: "Notifications", icon: "notifications", path: "/notifications" },
    { text: "Booking", icon: "event", path: "/bookings" },
    { text: "Sign Out", icon: "exit-to-app", path: "/signin" },
];

const BookService = () => {
    const { token, email, loading: authLoading } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const drawerAnim = useRef(new Animated.Value(screenWidth)).current;

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
    const isDesktop = Dimensions.get('window').width >= 768; 

    const openDrawer = () => {
        setMobileOpen(true);
        Animated.timing(drawerAnim, {
            toValue: screenWidth - DRAWER_WIDTH,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeDrawer = () => {
        Animated.timing(drawerAnim, {
            toValue: screenWidth,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setMobileOpen(false));
    };

    const DrawerContent = (
        <ScrollView style={{flex: 1}}>
            <View style={styles.drawerContainerContent}>
                <Text style={styles.drawerTitle}>AutoCRM</Text>
                <View style={styles.divider} />
                <View>
                    {sidebarItems.map((item, idx) => (
                        <SidebarItem
                            key={idx}
                            text={item.text}
                            iconName={item.icon}
                            onPress={() => {
                                navigate(item.path);
                                closeDrawer();
                            }}
                        />
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const updateBookingData = (key: keyof BookingData, value: any) => {
        setBookingData(prev => ({ ...prev, [key]: value }));
    };

    const handleAuthError = useCallback(() => {
        Alert.alert("Session expired", "Please sign in again.", [
            {
                text: "OK",
                onPress: async () => {
                    await AsyncStorage.multiRemove(["token", "email"]);
                    router.replace("/signin"); 
                },
            },
        ]);
    }, []);

    const fetchTimeSlots = useCallback(
        async (branchId: number, date: Date) => {
            setDataLoading(true);
            setTimeSlots([]); 

            try {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`; 

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

                    const data = await res.json() as TimeSlot[];

                    if (!Array.isArray(data)) {
                        setTimeSlots([]);
                        return;
                    }
                    
                    setTimeSlots(data);
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
        setStep(prev => {
            const nextStep = prev < steps.length - 1 ? prev + 1 : prev;

            if (nextStep === 3 && !bookingData.date && bookingData.branch && bookingData.service) {
                const today = new Date();
                today.setHours(0, 0, 0, 0); 
                
                setBookingData(currentData => ({ ...currentData, date: today }));
            }
            return nextStep;
        });
    };

    const handlePrevStep = () => {
        setStep(prev => prev > 0 ? prev - 1 : prev);
    };

    const handleSelectBranch = (branch: Branch) => {
        updateBookingData('branch', branch);
        updateBookingData('service', null);
        updateBookingData('date', null); 
        updateBookingData('timeSlot', null);
        handleNextStep();
    };

    const handleSelectService = (service: Service) => {
        updateBookingData('service', service);
        updateBookingData('date', null); 
        updateBookingData('timeSlot', null);
        handleNextStep();
    };
    
    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        
        if (selectedDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const selectedDay = new Date(selectedDate);
            selectedDay.setHours(0, 0, 0, 0);

            if (selectedDay < today) {
                Alert.alert("Invalid Date", "Please select today or a future date.");
                return;
            }

            setBookingData(prev => ({
                ...prev,
                date: selectedDate,
                timeSlot: null,
            }));
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
                const errorMessage = errorBody.message || `Booking failed with status: ${res.status}`;
                throw new Error(errorMessage);
            }

            const successResponse = await res.json();
            Alert.alert("Success", successResponse.message || "Your appointment has been successfully scheduled.");

            if (bookingData.branch && bookingData.date) {
                await fetchTimeSlots(bookingData.branch.id, bookingData.date);
            }
            
            setStep(4);
            

        } catch (err) {
            console.error("Error submitting booking:", err);
            Alert.alert("Booking Failed", (err as Error).message);
            
            if (bookingData.branch && bookingData.date && (err as Error).message.includes('quota')) {
                 await fetchTimeSlots(bookingData.branch.id, bookingData.date);
            }
        } finally {
            setDataLoading(false);
        }
    };


    useEffect(() => {
        const fetchBranches = async () => { 
            setBranchLoading(true);
            if (!token) { setBranchLoading(false); return; }
            try {
                const res = await fetch(`${API_BASE_URL}/api/branch`, { headers: { "Authorization": `Bearer ${token}` } });
                if (res.status === 401 || res.status === 403) { handleAuthError(); return; }
                if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }
                const data = await res.json();
                setBranches(data);
            } catch (err) {
                console.error("Error fetching branches:", err);
                Alert.alert("Error", "Failed to load branches.");
            } finally { setBranchLoading(false); }
        };
        if (!authLoading) { fetchBranches(); }
    }, [token, authLoading, handleAuthError]);

    useEffect(() => {
        const fetchServiceTypes = async () => {
            setServiceLoading(true);
            if (!token) { setServiceLoading(false); return; }
            try {
                const res = await fetch(`${API_BASE_URL}/api/servicetype`, { headers: { "Authorization": `Bearer ${token}` } });
                if (res.status === 401 || res.status === 403) { handleAuthError(); return; }
                if (!res.ok) { throw new Error(`HTTP error! status: ${res.status}`); }
                const data = await res.json();
                const parsedServices = data.map((s: any) => ({
                    ...s,
                    cost: parseFloat(s.cost), 
                }));
                setServiceTypes(parsedServices);
            } catch (err) {
                console.error("Error fetching service types:", err);
                Alert.alert("Error", "Failed to load service types.");
            } finally { setServiceLoading(false); }
        };
        if (!authLoading) { fetchServiceTypes(); }
    }, [token, authLoading, handleAuthError]);


    useEffect(() => {
        const fetchVehicles = async () => {
            setVehicleLoading(true);
            if (!token) { setVehicleLoading(false); return; }

            try {
                const res = await fetch(`${API_BASE_URL}/api/vehicles`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (res.status === 401 || res.status === 403) { handleAuthError(); return; }

                const data = await res.json();
                const fetchedVehicles = Array.isArray(data) ? data : [];
                setVehicles(fetchedVehicles);

                if (fetchedVehicles.length === 1) {
                    updateBookingData('vehicle', fetchedVehicles[0]);
                }

            } catch (err) {
                Alert.alert("Error", "Failed to load vehicles");
                setVehicles([]);
            } finally { setVehicleLoading(false); }
        };

        if (!authLoading) { fetchVehicles(); }
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
                        onPress={() => navigate("/addVehicle")}
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
                            style={styles.checkIcon}
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
                            <MaterialIcons name="location-on" size={24} color={PRIMARY_COLOR} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{b.name}</Text>
                        </View>
                        {bookingData.branch?.id === b.id && <MaterialIcons name="check" size={24} color={PRIMARY_COLOR} />}
                    </TouchableOpacity>
                ))}
                <View style={styles.buttonContainerRow}>
                     <TouchableOpacity style={styles.secondaryButtonHalf} onPress={handlePrevStep}>
                        <Text style={styles.secondaryButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={bookingData.branch ? styles.primaryButtonHalf : styles.disabledButtonHalf}
                        onPress={handleNextStep}
                        disabled={!bookingData.branch}
                    >
                        <Text style={styles.addButtonText}>Next</Text>
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
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 9);

        const availableSlotsCount = timeSlots.filter(slot => slot.is_available).length;
        
        const isDateFullyBooked = bookingData.date && !dataLoading && availableSlotsCount === 0;

        const selectedDateText = bookingData.date
            ? bookingData.date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
            : "Select a date";

        const dateInputFieldStyle = [
            styles.inputField,
            isDateFullyBooked && styles.inputFieldDisabled
        ];

        return (
            <ScrollView style={styles.contentArea}>
                <Text style={styles.selectionTitle}>Service: {bookingData.service?.label}</Text>

                <Text style={styles.label}>1. Choose Date</Text>
                <TouchableOpacity
                    style={dateInputFieldStyle}
                    onPress={() => setShowDatePicker(true)}
                    
                >
                    <Text style={styles.inputText}>{selectedDateText}</Text>
                    <MaterialIcons name="calendar-today" size={20} color={PRIMARY_COLOR} />
                </TouchableOpacity>
                
                {isDateFullyBooked && (
                    <Text style={styles.fullyBookedWarning}>This date is fully booked. Please select another date.</Text>
                )}

                {showDatePicker && (
                    <DateTimePicker
                        value={bookingData.date || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? "spinner" : "default"}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                        maximumDate={tenDaysFromNow} 
                    />
                )}

                <Text style={styles.label}>
                    2. Select Time Slot (Duration: {bookingData.service?.durationMinutes} min)
                </Text>
                
                {bookingData.date && dataLoading && (
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{ marginTop: 10 }} />
                )}
                
                {bookingData.date && !dataLoading && (
                    <View>
                        <Text style={styles.timeSlotInfoText}>
                            Available Slots Today: **{availableSlotsCount}**
                        </Text>
                        <View style={styles.timeGrid}>
                            {timeSlots.map((slot, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.timeCard,
                                        !slot.is_available && styles.timeCardUnavailable,
                                        bookingData.timeSlot === slot.slot_time && styles.timeCardSelected,
                                    ]}
                                    onPress={() => slot.is_available && handleSelectTimeSlot(slot.slot_time)}
                                    disabled={!slot.is_available}
                                >
                                    <Text style={styles.timeText}>
                                        {slot.slot_time}
                                    </Text>
                                    <Text style={styles.timeQuotaText}>
                                        ({slot.remaining_quota} left)
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            {availableSlotsCount === 0 && (
                                <Text style={[styles.text, {textAlign: 'left', marginLeft: 5, flexBasis: '100%'}]}>
                                    All time slots are currently booked for this date.
                                </Text>
                            )}
                        </View>
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
            </ScrollView>
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
                    <Text style={styles.summaryValue}>{branch?.name} </Text>
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
                    onPress={() => navigate("/dashboard")}
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
                if (!bookingData.vehicle) return <View style={styles.center}><Text style={styles.errorText}>Please select a vehicle first.</Text></View>;
                return renderStep1Branch();
            case 2:
                if (!bookingData.branch) return <View style={styles.center}><Text style={styles.errorText}>Please select a branch first.</Text></View>;
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
        <View style={styles.appContainer}>
            
            {isDesktop && (
                <View style={styles.desktopSidebar}>
                    {DrawerContent}
                </View>
            )}

            <SafeAreaView style={styles.mainWrapper}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Book Service</Text>
                    {!isDesktop ? (
                        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
                            <MaterialIcons name="menu" size={30} color={WHITE_TEXT} />
                        </TouchableOpacity>
                    ) : (
                         <CustomChip 
                            label={email || 'Guest User'} 
                            style={{ borderColor: PRIMARY_COLOR, borderWidth: 1 }} 
                        />
                    )}
                </View>
            
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

            {mobileOpen && (
                <>
                    <TouchableOpacity 
                        style={styles.overlay} 
                        onPress={closeDrawer} 
                        activeOpacity={1}
                    />
                    
                    <Animated.View
                        style={[
                            styles.animatedDrawer,
                            { transform: [{ translateX: drawerAnim }] },
                        ]}
                    >
                        {DrawerContent}
                        <TouchableOpacity style={styles.drawerCloseButton} onPress={closeDrawer}>
                            <MaterialIcons name="close" size={30} color="#ccc" />
                        </TouchableOpacity>
                    </Animated.View>
                </>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    appContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: BACKGROUND_COLOR,
    },
    mainWrapper: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
        paddingHorizontal: 20,
    },
    desktopSidebar: {
        width: 250,
        backgroundColor: CARD_BG,
        borderRightWidth: 1,
        borderRightColor: BORDER_COLOR,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
        paddingHorizontal: Platform.OS === 'web' ? 0 : 5, 
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: WHITE_TEXT,
    },
    menuButton: {
        padding: 5,
    },
    chip: {
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderColor: PRIMARY_COLOR,
        borderWidth: 1,
        backgroundColor: 'rgba(0,188,212,0.1)',
    },
    chipText: {
        color: PRIMARY_COLOR,
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    dot: {
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: SECONDARY_TEXT,
        opacity: 0.3,
    },
    dotActive: {
        backgroundColor: PRIMARY_COLOR,
        opacity: 1,
    },
    stepLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: PRIMARY_COLOR,
        marginBottom: 20,
        textAlign: 'center',
    },
    contentArea: {
        flex: 1,
        paddingBottom: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        color: SECONDARY_TEXT,
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
    },
    errorText: {
        color: ERROR_COLOR,
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 20, 
    },
    card: {
        width: '48%', 
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: PRIMARY_COLOR,
        backgroundColor: 'rgba(0,188,212,0.1)',
    },
    checkIcon: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
    cardTitle: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardText: {
        color: SECONDARY_TEXT,
        fontSize: 12,
    },
    selectionTitle: {
        color: SECONDARY_TEXT,
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center',
    },
    cardFull: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BG,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    branchIcon: {
        padding: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(0,188,212,0.1)',
        marginRight: 15,
    },
    label: {
        color: WHITE_TEXT,
        fontSize: 16,
        marginTop: 20,
        marginBottom: 10,
        fontWeight: '500',
    },
    inputField: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        backgroundColor: CARD_BG,
        borderRadius: 8,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputFieldDisabled: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: ERROR_COLOR,
    },
    inputText: {
        color: WHITE_TEXT,
        fontSize: 16,
    },
    fullyBookedWarning: {
        color: ERROR_COLOR,
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    timeSlotInfoText: {
        color: SECONDARY_TEXT,
        fontSize: 14,
        marginBottom: 10,
    },
    timeCard: {
        backgroundColor: CARD_BG,
        padding: 10,
        borderRadius: 8,
        margin: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        minWidth: 90,
    },
    timeCardSelected: {
        backgroundColor: PRIMARY_COLOR,
        borderColor: PRIMARY_COLOR,
    },
    timeCardUnavailable: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.05)',
        opacity: 0.5,
    },
    timeText: {
        color: WHITE_TEXT,
        fontWeight: 'bold',
        fontSize: 14,
    },
    timeQuotaText: {
        color: SECONDARY_TEXT,
        fontSize: 10,
        marginTop: 2,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    buttonContainerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
    },
    primaryButton: {
        width: '100%',
        height: 50,
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    primaryButtonHalf: {
        flex: 1,
        height: 50,
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    disabledButton: {
        width: '100%',
        height: 50,
        backgroundColor: DISABLED_COLOR,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButtonHalf: {
        flex: 1,
        height: 50,
        backgroundColor: DISABLED_COLOR,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    secondaryButton: {
        width: '100%',
        height: 50,
        backgroundColor: 'transparent',
        borderColor: SECONDARY_TEXT,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    secondaryButtonHalf: {
        flex: 1,
        height: 50,
        backgroundColor: 'transparent',
        borderColor: SECONDARY_TEXT,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    addButtonText: {
        color: WHITE_TEXT,
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: SECONDARY_TEXT,
        fontSize: 18,
        fontWeight: 'bold',
    },
    confirmationBox: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: CARD_BG,
        borderRadius: 10,
        marginBottom: 20,
    },
    confirmationTitle: {
        color: PRIMARY_COLOR,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    confirmationText: {
        color: SECONDARY_TEXT,
        fontSize: 16,
        textAlign: 'center',
    },
    summaryHeader: {
        color: WHITE_TEXT,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 10,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
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
    },
    drawerContainerContent: {
        flex: 1,
        padding: 20,
        backgroundColor: 'transparent',
    },
    drawerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PRIMARY_COLOR, 
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 10,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
    },
    drawerItemText: {
        color: '#ccc',
        marginLeft: 15,
        fontSize: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10,
    },
    animatedDrawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: DRAWER_WIDTH,
        backgroundColor: 'rgba(0,0,0,0.95)',
        zIndex: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
    },
    drawerCloseButton: {
        position: 'absolute',
        top: Platform.OS === 'android' ? 40 : 20,
        right: 15,
        padding: 5,
        zIndex: 30,
    },
});

export default BookService;