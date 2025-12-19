import React, { useState, useEffect } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform 
} from 'react-native';
// Replaces localStorage
import AsyncStorage from "@react-native-async-storage/async-storage"; 
// Replaces MUI Select/MenuItem
import { Picker } from '@react-native-picker/picker'; 

// --- Configuration ---
// IMPORTANT: Use your local IP address here
const BASE_URL = "http://192.168.55.58:3007"; 

// --- 1. Type Definitions for Data Structures (FIXED) ---
// Define a type for the car models structure to satisfy TypeScript indexer
type CarModels = {
    [key: string]: string[]; 
};

// Define the shape of the data that comes into the component (from CarDetails)
interface VehicleData {
    id: string;
    brand: string;
    model: string;
    license_plate: string;
    year: number;
    vehicle_type: string;
    fuel_type: string;
    fuelType?: string; // For normalized value
    kilometers: number;
    vin: string;
    phone_number: string;
    name: string;
    surname: string;
}

interface EditCarDetailsProps {
    open: boolean;
    handleClose: () => void;
    vehicle: VehicleData;
    onUpdate: (updatedData: VehicleData) => void;
}

// --- Data Definitions (Now correctly typed with CarModels) ---
const carModels: CarModels = {
    "Chrysler": ["300 C", "300 M", "Concorde", "Crossfire", "LHS", "Neon", "PT Cruiser", "Sebring", "Stratus"],
    "Audi": [
        "100", "80", "A1", "A2", "A3", "A3 Cabriolet", "A4", "A4 Allroad",
        "A4 Avant", "A4 Cabriolet", "A5", "A5 Avant", "A5 Cabriolet",
        "A6 Allroad", "A6 Avant", "A6 e-tron Avant", "A6 Saloon", "A6 Unspecified",
        "A7", "A8", "Allroad", "Cabriolet", "Coupe", "e-tron", "e-tron GT",
        "e-tron S", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8",
        "Q8 e-tron", "quattro", "R8", "RS3", "RS4", "RS4 Avant",
        "RS4 Cabriolet", "RS5", "RS6", "RS6 Avant", "RS7", "RS e-tron GT",
        "RS Q3", "RSQ8", "S1", "S3", "S4", "S4 Avant", "S4 Cabriolet",
        "S5", "S5 Avant", "S6 Avant", "S6 e-tron Avant", "S6 Saloon", "S7",
        "S8", "S e-tron GT", "SQ2", "SQ5", "SQ6 e-tron", "SQ7", "SQ8",
        "SQ8 e-tron", "TT", "TT RS", "TTS"],
    "Alfa Romeo": ["156 Sportwagon", "159", "159 Sportwagon", "164", "166", "2000", "4C", "Alfasud", "Brera", "Giulia", "Giulietta", "GT", "GTV", "Junior", "MiTo", "Spider", "Stelvio", "Tonale"],
    "BMW": ["1 Series", "2 Series", "2 Series Active Tourer", "2 Series Gran Coupe", "2 Series Gran Tourer", "3 Series", "3 Series Gran Turismo", "4 Series", "4 Series Gran Coupe", "5 Series", "5 Series Gran Turismo", "6 Series", "6 Series Gran Turismo", "7 Series", "7 Series Gran Turismo", "8 Series", "8 Series Gran Coupe", "Alpina B10", "Alpina B3", "Alpina B4 Gran Coupe", "Alpina B5", "Alpina B6", "Alpina B8 \"Gran Coupe\"", "Alpina D3", "Alpina D4", "Alpina D4 Gran Coupe", "Alpina D5", "Alpina Roadster", "Alpina Unspecified Models", "Alpina XD3",
        "i3", "i4", "i5", "i7", "i8", "Isetta", "iX", "iX1", "iX2", "iX3", "M2", "M3", "M4", "M5", "M6", "M6 Gran Coupe", "M8", "M8 Gran Coupe", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z3", "Z4", "Z4 M", "Z8"],
    "Chevrolet": [
        "Astro", "Aveo", "Belair", "C10", "Camaro", "Captiva", "Corvette",
        "Corvette Stingray", "Cruze", "Kalos", "Lacetti", "Matiz", "Orlando",
        "Silverado", "Spark", "SSR", "Suburban", "Tacuma", "Trax"],
    "Citroen": [
        "2 CV", "Ami", "AX", "Berlingo", "BX", "C1", "C2", "C3", "C3 Aircross",
        "C3 Picasso", "C3 Pluriel", "C4", "C4 Cactus", "C4 Picasso",
        "C4 SpaceTourer", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "C8",
        "C-Crosser", "C-Zero", "Dispatch", "DS3", "DS3 Cabrio", "DS4", "DS5",
        "e-Berlingo", "e-C3", "e-C3 Aircross", "e-C4", "e-C4 X",
        "e-SpaceTourer", "Grand C4 Picasso", "Grand C4 SpaceTourer", "Holidays",
        "Nemo Multispace", "Relay", "Saxo", "SpaceTourer", "Xantia", "Xsara",
        "Xsara Picasso"],
    "Maybach": ["57", "62"],
    "Acura": ["Integra", "RSX"],
    "Peugeot": ["1007", "106", "107", "108", "2008", "205", "206", "206 CC", "206 SW", "207", "207 CC", "207 SW", "208", "3008", "306", "307", "307 CC", "307 SW", "308", "308 CC", "308 SW", "309", "4007", "406", "407", "407 SW", "408",
        "5008", "508", "508 SW", "807", "Bipper Tepee", "Boxer", "E-2008", "E-208", "E-3008", "E-308", "E-308 SW",
        "E-5008", "e-Partner", "e-Rifter", "e-Traveller", "Expert", "Expert Tepee", "Horizon", "iOn", "Partner", "Partner Tepee", "RCZ", "Rifter", "Traveller"],
    "Renault": ["Laguna", "Master", "Megane", "Megane E-Tech", "Modus", "Rafale", "Scenic", "Scenic E-Tech", "Scenic RX4", "Scenic Xmod", "Spider", "Symbioz", "Trafic", "Twingo", "Twizy", "Wind", "Zoe"],
    "Subaru": ["BRZ", "Crosstrek", "Exiga", "Forester", "Impreza", "Justy", "Legacy", "Levorg", "Outback", "Solterra", "Tribeca", "WRX STI", "XT", "XV"],
    "Mazda": ["323", "626", "B2500", "Bongo", "BT-50", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-80", "Demio", "Eunos", "Mazda2", "Mazda2 HYBRID", "Mazda3", "Mazda5", "Mazda6", "MPV", "MX-30", "MX-5", "MX-5 RF", "MX-6", "RX-7", "RX-8"],
    "Lexus": ["CT", "ES", "GS", "GS F", "GX", "IS", "IS F", "LBX", "LC", "LFA", "LM", "LS", "LX", "NX", "RC", "RC F", "RX", "RX L", "RZ", "SC", "UX"],
    "Mercedes-Benz": ["AMG", "AMG GT", "AMG ONE", "A Class", "B Class", "C-Class", "CE Class", "CL", "CLC Class", "CLE", "CLK", "CLS", "CLA", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "eVito", "G Class",
        "GLA", "GLB", "GLC", "GL Class", "GLE", "GLS", "Maybach GLS", "Maybach S Class", "M Class", "R Class",
        "S Class", "SEC Series", "SL", "SLC", "SLK", "SLR McLaren", "SLS", "Sprinter", "Traveliner", "Vaneo", "V Class", "Viano", "Vito", "X Class"],
    "Toyota": ["Alphard", "Aqua", "Aristo", "Auris", "Avensis", "Avensis Verso", "AYGO", "Aygo X", "BB", "Blade", "bZ4X", "Camry", "Carina E", "Celica", "Celsior", "Century", "C-HR", "Corolla",
        "Corolla Verso", "Crown", "Estima", "Estima Aeras G", "FJ Cruiser", "GR86", "Granvia", "GT86", "Harrier", "Hiace", "Highlander", "Hilux", "Ipsum", "iQ",
        "Land Cruiser", "Land Cruiser Amazon", "Land Cruiser Colorado",
        "Mark X", "MR2", "Noah", "Paseo", "Picnic", "Porte", "Previa", "Prius", "Prius+", "PROACE", "PROACE CITY Verso", "PROACE Verso", "Progres",
        "Raum", "RAV4", "Sienta", "Soarer", "Starlet", "Starlet Glanza V", "Starlet GT", "Supra", "Surf", "Tacoma", "Townace", "Tundra", "Urbancruiser", "Vellfire", "Verso", "Verso S", "Vitz", "Voxy", "Wish", "Yaris", "Yaris Cross", "Yaris Verso"],
    "Volkswagen": ["Amarok", "Arteon", "Beetle", "Bora", "Caddy", "Caddy California Maxi", "Caddy Life", "Caddy Maxi", "Caddy Maxi Life", "California", "Campervan", "Caravelle", "CC", "Corrado", "e-Golf", "Eos", "e-Transporter", "e-up!", "Fox", "Golf", "Golf Plus", "Golf SV", "Grand California",
        "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Jetta", "Karmann", "Lupo", "Multivan", "Passat", "Phaeton", "Polo", "Scirocco",
        "Sharan", "Taigo", "T-Cross", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter", "Transporter Shuttle", "Transporter Sportline", "T-Roc", "up!", "XL1"],
    "Kia": ["Carens", "Ceed", "Cerato", "EV3", "EV6", "EV9", "Magentis", "Niro", "Optima", "Picanto", "ProCeed", "Rio", "Sedona", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Venga", "XCeed"],
    "Jaguar": ["E-PACE", "E-Type", "F-PACE", "F-Type", "I-PACE", "Mark I", "Mark II", "S-Type", "XE", "XF", "XFR-S", "XJ", "XJR", "XJR-S", "XJS", "XK", "XK120", "XK140", "XK150", "XK8", "XKR", "XKR-S", "X-Type"],
    "Infiniti": ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX56", "QX70"],
    "Hyundai": ["Accent", "Amica", "Atoz", "BAYON", "Coupe", "Genesis", "Getz", "i10", "i20", "i30", "i40", "i800", "iLoad", "IONIQ", "IONIQ 5", "IONIQ 6", "ix20", "ix35", "KONA", "Matrix", "NEXO", "Pony X2", "Santa Fe", "Sonata", "Terracan", "Trajet", "TUCSON", "Veloster"],
    "Honda": ["Accord", "Beat", "Civic", "Crossroad", "CR-V", "CR-X", "CR-Z", "e:Ny1", "Elysion", "Fit", "Freed", "FR-V", "Honda E", "HR-V", "Insight", "Integra", "Jazz", "Legend", "Mobilio", "N-Box", "NSX", "Odyssey", "Prelude", "Ridgeline", "S2000", "S660", "Shuttle", "Stepwagon", "Stream", "ZR-V"],
    "Fiat": ["124 Spider", "126", "500", "500C", "500e", "500e C", "500L", "500 Topolino", "500X", "500X Dolcevita", "600", "600e", "Barchetta", "Brava", "Bravo", "Coupe", "Doblo", "Ducato", "Fiorino", "Fullback", "Grande Punto", "Idea", "Multipla", "Panda", "Punto", "Punto Evo", "Qubo", "Scudo", "Sedici", "Seicento", "Spider", "Stilo", "Strada", "Talento", "Tipo", "Ulysse", "Uno"],
    "Dodge": ["Avenger", "Caliber", "Challenger", "Charger", "Coronet", "Journey", "Nitro", "RAM", "Viper"],
    "Ford": ["Anglia", "B-Max", "Bronco", "Capri", "C-Max", "Consul", "Cortina", "Cougar", "Custom Cab", "EcoSport", "Edge", "Escort", "E-Tourneo Custom", "E-Transit", "E-Transit Custom", "Excursion", "Explorer", "F1", "F150", "F-250", "F350", "Fiesta", "Fiesta Van", "Focus", "Focus CC", "Focus C-Max", "Fusion", "Galaxy", "Granada", "Grand C-Max", "Grand Tourneo Connect", "GT", "Ka", "Ka+", "Kuga", "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Orion", "Prefect", "Probe", "Puma", "Ranger", "Scorpio", "Sierra", "S-Max", "Streetka", "Thunderbird", "Tourneo Connect", "Tourneo Courier", "Tourneo Custom", "Transit", "Transit Connect", "Transit Courier", "Transit Custom", "Zephyr"],
    "Nissan": ["350 Z", "370 Z", "Almera", "Altima", "Bluebird", "Cedric", "Cube", "Datsun", "Skyline", "Sunny", "Tiida", "X-Trail"]
};


const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 26 }, (_, i) => String(currentYear - i)).reverse(); // 1999 to current year


const EditCarDetails = ({ open, handleClose, vehicle, onUpdate }: EditCarDetailsProps) => {
    // Note: formData remains 'any' for simplicity due to the way it handles string vs number fields initially,
    // but the key part is asserting the indexer below.
    const [formData, setFormData] = useState<any>({}); 
    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    
    // 🛑 FIX: Use type assertion on formData.brand to allow indexing the typed carModels object
    const availableModels = carModels[formData.brand as string] || []; 

    // Load vehicle data into form state when the component receives a 'vehicle' prop
    useEffect(() => {
        if (vehicle) {
            setFormData({
                name: vehicle.name || '',
                surname: vehicle.surname || '',
                phoneNumber: vehicle.phone_number || '',
                vin: vehicle.vin || '',
                licensePlate: vehicle.license_plate || '',
                brand: vehicle.brand || '',
                model: vehicle.model || '',
                // Normalize keys for the form
                vehicleType: vehicle.vehicle_type || '', 
                fuelType: vehicle.fuelType || vehicle.fuel_type || '', 
                year: String(vehicle.year) || String(currentYear), // Ensure year is a string for the Picker
                kilometers: String(vehicle.kilometers) || '0', // Ensure kilometers is a string for TextInput
            });
            setErrors({});
        }
    }, [vehicle]);

    const handleChange = (name: string, value: string) => {
        // Reset model if brand changes
        if (name === "brand") {
            setFormData((prev: any) => ({ ...prev, brand: value, model: "" }));
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value }));
        }
        setErrors((prev: any) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors: any = {};
        const kilometers = parseFloat(formData.kilometers);
        const year = parseInt(formData.year);

        if (kilometers < 0 || isNaN(kilometers)) {
            newErrors.kilometers = "Kilometers must be a positive number.";
        }
        if (year > currentYear || year < 1900 || isNaN(year)) {
            newErrors.year = `Year must be valid.`;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    interface ApiError {
    message: string;
}

    const handleSubmit = async () => {
        if (loading || !validate()) return;
        
        setLoading(true);
        
        // Use AsyncStorage instead of localStorage
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert("Authentication failed", "Please re-login.");
            handleClose();
            setLoading(false);
            return;
        }

        try {
            // Prepare data for API (convert kilometers and year back to number)
            const payload = {
                ...formData,
                kilometers: parseFloat(formData.kilometers),
                year: parseInt(formData.year),
            };

            // Use the BASE_URL with the correct IP
            const response = await fetch(`${BASE_URL}/api/vehicles/${vehicle.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result: VehicleData = await response.json();

           if (response.ok) {
            // If successful, the result is VehicleData
            const result: VehicleData = await response.json();
            Alert.alert("Success", "Vehicle updated successfully!");
            onUpdate(result); // Update the parent component
            handleClose();
        } else {
            // If it failed, the result is the error object (ApiError)
            const errorResult: ApiError = await response.json();
            
            // Access the message property safely using the defined ApiError type
            Alert.alert("Update failed", errorResult.message || "Unknown error occurred.");
        }

        // --- FIX END ---
        
    } catch (err) {
        console.error("API error during update:", err);
        Alert.alert("Server Error", "An error occurred while updating the vehicle.");
    } finally {
        setLoading(false);
    }
};
    
    // Prevent rendering the modal if vehicle data hasn't loaded yet
    if (!vehicle) return null; 

    return (
        // Replaces MUI Dialog with RN Modal and KeyboardAvoidingView
        <Modal
            visible={open}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={styles.centeredView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Replaces DialogPaperProps styling */}
                    <View style={styles.modalView}>
                        
                        {/* Replaces DialogTitle */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Edit Vehicle Details</Text>
                            <Text style={styles.subtitle}>{vehicle.brand} {vehicle.model}</Text>
                        </View>
                        
                        {/* Replaces DialogContent */}
                        <View style={styles.content}>
                            
                            {/* Customer Details */}
                            <Text style={styles.sectionTitle}>Customer Info</Text>
                            <RNTextInput 
                                label="Name" name="name" 
                                value={formData.name || ''} 
                                onChangeText={(val) => handleChange('name', val)} 
                            />
                            <RNTextInput 
                                label="Surname" name="surname" 
                                value={formData.surname || ''} 
                                onChangeText={(val) => handleChange('surname', val)} 
                            />
                            <RNTextInput 
                                label="Phone Number" name="phoneNumber" 
                                value={formData.phoneNumber || ''} 
                                onChangeText={(val) => handleChange('phoneNumber', val)} 
                                keyboardType="phone-pad"
                            />
                            
                            {/* Vehicle Details */}
                            <Text style={styles.sectionTitle}>Vehicle Info</Text>
                            <RNTextInput 
                                label="VIN Number" name="vin" 
                                value={formData.vin || ''} 
                                onChangeText={(val) => handleChange('vin', val)} 
                            />
                            <RNTextInput 
                                label="License Plate" name="licensePlate" 
                                value={formData.licensePlate || ''} 
                                onChangeText={(val) => handleChange('licensePlate', val)} 
                            />
                            
                            {/* Brand Select (Picker) */}
                            <RNPicker 
                                label="Brand" 
                                name="brand"
                                selectedValue={formData.brand}
                                onValueChange={(val) => handleChange('brand', val)}
                            >
                                {Object.keys(carModels).map((brand) => (<Picker.Item key={brand} label={brand} value={brand} style={styles.pickerItem} />))}
                            </RNPicker>
                            
                            {/* Model Select (Picker) */}
                            <RNPicker 
                                label="Model" 
                                name="model"
                                selectedValue={formData.model}
                                onValueChange={(val) => handleChange('model', val)}
                                enabled={!!formData.brand}
                            >
                                <Picker.Item label="Select Model" value="" style={styles.pickerItem} />
                                {availableModels.map((model) => (<Picker.Item key={model} label={model} value={model} style={styles.pickerItem} />))}
                            </RNPicker>

                            {/* Vehicle Type Select (Picker) */}
                            <RNPicker 
                                label="Vehicle Type" 
                                name="vehicleType"
                                selectedValue={formData.vehicleType}
                                onValueChange={(val) => handleChange('vehicleType', val)}
                            >
                                {vehicleTypes.map((type) => (<Picker.Item key={type} label={type} value={type} style={styles.pickerItem} />))}
                            </RNPicker>

                            {/* Fuel Type Select (Picker) */}
                            <RNPicker 
                                label="Fuel Type" 
                                name="fuelType"
                                selectedValue={formData.fuelType}
                                onValueChange={(val) => handleChange('fuelType', val)}
                            >
                                {fuelTypes.map((fuel) => (<Picker.Item key={fuel} label={fuel} value={fuel} style={styles.pickerItem} />))}
                            </RNPicker>

                            {/* Year and Kilometers */}
                            <RNPicker 
                                label="Year" 
                                name="year"
                                selectedValue={formData.year}
                                onValueChange={(val) => handleChange('year', val)}
                            >
                                {years.map((year) => (<Picker.Item key={year} label={year} value={year} style={styles.pickerItem} />))}
                            </RNPicker>
                            
                            <RNTextInput 
                                label="Kilometers" 
                                name="kilometers" 
                                value={formData.kilometers} 
                                onChangeText={(val) => handleChange('kilometers', val)} 
                                keyboardType="numeric"
                                error={errors.kilometers}
                            />

                        </View>
                        
                        {/* Replaces DialogActions */}
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSubmit} style={styles.saveButton} disabled={loading}>
                                <Text style={styles.saveButtonText}>
                                    {loading ? "Saving..." : "Save Changes"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// --- Custom RN Input Component (to mimic MUI TextField) ---
interface RNTextInputProps {
    label: string;
    name: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
    error?: string;
}

const RNTextInput: React.FC<RNTextInputProps> = ({ label, value, onChangeText, keyboardType = 'default', error }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholderTextColor="#888"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
);

// --- Custom RN Picker Component (to mimic MUI Select) ---
interface RNPickerProps {
    label: string;
    name: string;
    selectedValue: string;
    onValueChange: (value: any) => void;
    children: React.ReactNode;
    enabled?: boolean;
}

const RNPicker: React.FC<RNPickerProps> = ({ label, selectedValue, onValueChange, children, enabled = true }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.input, styles.pickerWrapper, !enabled && styles.pickerDisabled]}>
            <Picker
                selectedValue={selectedValue}
                onValueChange={onValueChange}
                style={styles.picker}
                mode="dropdown"
                enabled={enabled}
            >
                {children}
            </Picker>
        </View>
    </View>
);


// --- Stylesheet for React Native ---
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)', // Dark semi-transparent background for modal
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        width: '100%',
    },
    modalView: {
        margin: 20,
        backgroundColor: '#1e1e1e', // Matches PaperProps background
        borderRadius: 12,
        padding: 0,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00bcd4', // Matches DialogTitle color
    },
    subtitle: {
        fontSize: 16,
        color: 'white',
        marginTop: 5,
    },
    content: {
        padding: 20,
        gap: 15, // Replaces MUI gap: 2
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00bcd4',
        marginTop: 10,
        marginBottom: 5,
    },
    inputContainer: {
        width: '100%',
    },
    inputLabel: {
        color: '#ccc',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        color: 'white',
        backgroundColor: '#2b2b2b',
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
    pickerWrapper: {
        height: 50,
        justifyContent: 'center',
        padding: 0,
    },
    picker: {
        color: 'white',
    },
    pickerItem: {
        color: 'black', // Picker items often default to system style, but this is a hint
    },
    pickerDisabled: {
        backgroundColor: '#3a3a3a',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#333',
        gap: 10,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#00bcd4',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#1e1e1e', // Dark text on light background
        fontWeight: 'bold',
    },
});

export default EditCarDetails;