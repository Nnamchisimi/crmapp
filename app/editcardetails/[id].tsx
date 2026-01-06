import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TextInput, 
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; 
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 



const BASE_URL = "http://192.168.55.58:3007"; 
const PRIMARY_COLOR = '#00bcd4';
const BACKGROUND_COLOR = '#000';
const CARD_BG = 'rgba(255,255,255,0.05)';
const TEXT_COLOR = 'white';
const SUBTLE_TEXT_COLOR = 'rgba(255,255,255,0.7)';
const INPUT_BORDER = '#333';
const ERROR_COLOR = 'red';


interface CarModelsMap {
    [key: string]: string[]; 
}

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

interface FormDataState {
    name: string;
    surname: string;
    phone_number: string;
    vin: string;
    license_plate: string;
    brand: string;
    model: string;
    vehicle_type: string;
    fuel_type: string;
    year: string;
    kilometers: string;
}


const carModels: CarModelsMap = {

    "Chrysler": ["300 C", "300 M", "Concorde", "Crossfire", "LHS", "Neon", "PT Cruiser", "Sebring", "Stratus"],
    "Audi": [ "100", "80", "A1", "A2", "A3", "A3 Cabriolet", "A4", "A4 Allroad", "A4 Avant", "A4 Cabriolet", "A5", "A5 Avant", "A5 Cabriolet", "A6 Allroad", "A6 Avant", "A6 e-tron Avant", "A6 Saloon", "A6 Unspecified", "A7", "A8", "Allroad", "Cabriolet", "Coupe", "e-tron", "e-tron GT", "e-tron S", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "quattro", "R8", "RS3", "RS4", "RS4 Avant", "RS4 Cabriolet", "RS5", "RS6", "RS6 Avant", "RS7", "RS e-tron GT", "RS Q3", "RSQ8", "S1", "S3", "S4", "S4 Avant", "S4 Cabriolet", "S5", "S5 Avant", "S6 Avant", "S6 e-tron Avant", "S6 Saloon", "S7", "S8", "S e-tron GT", "SQ2", "SQ5", "SQ6 e-tron", "SQ7", "SQ8", "SQ8 e-tron", "TT", "TT RS", "TTS"],
    "Alfa Romeo": ["156 Sportwagon", "159", "159 Sportwagon", "164", "166", "2000", "4C", "Alfasud", "Brera", "Giulia", "Giulietta", "GT", "GTV", "Junior", "MiTo", "Spider", "Stelvio", "Tonale"],
    "BMW": ["1 Series", "2 Series", "2 Series Active Tourer", "2 Series Gran Coupe", "2 Series Gran Tourer", "3 Series", "3 Series Gran Turismo", "4 Series", "4 Series Gran Coupe", "5 Series", "5 Series Gran Turismo", "6 Series", "6 Series Gran Turismo", "7 Series", "7 Series Gran Turismo", "8 Series", "8 Series Gran Coupe", "Alpina B10", "Alpina B3", "Alpina B4 Gran Coupe", "Alpina B5", "Alpina B6", "Alpina B8 \"Gran Coupe\"", "Alpina D3", "Alpina D4", "Alpina D4 Gran Coupe", "Alpina D5", "Alpina Roadster", "Alpina Unspecified Models", "Alpina XD3", "i3", "i4", "i5", "i7", "i8", "Isetta", "iX", "iX1", "iX2", "iX3", "M2", "M3", "M4", "M5", "M6", "M6 Gran Coupe", "M8", "M8 Gran Coupe", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z3", "Z4", "Z4 M", "Z8"],
    "Chevrolet": ["Astro", "Aveo", "Belair", "C10", "Camaro", "Captiva", "Corvette", "Corvette Stingray", "Cruze", "Kalos", "Lacetti", "Matiz", "Orlando", "Silverado", "Spark", "SSR", "Suburban", "Tacuma", "Trax"],
    "Citroen": ["2 CV", "Ami", "AX", "Berlingo", "BX", "C1", "C2", "C3", "C3 Aircross", "C3 Picasso", "C3 Pluriel", "C4", "C4 Cactus", "C4 Picasso", "C4 SpaceTourer", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "C8", "C-Crosser", "C-Zero", "Dispatch", "DS3", "DS3 Cabrio", "DS4", "DS5", "e-Berlingo", "e-C3", "e-C3 Aircross", "e-C4", "e-C4 X", "e-SpaceTourer", "Grand C4 Picasso", "Grand C4 SpaceTourer", "Holidays", "Nemo Multispace", "Relay", "Saxo", "SpaceTourer", "Xantia", "Xsara", "Xsara Picasso"],
    "Maybach": ["57", "62"],
    "Acura": ["Integra", "RSX"],
    "Peugeot": ["1007", "106", "107", "108", "2008", "205", "206", "206 CC", "206 SW", "207", "207 CC", "207 SW", "208", "3008", "306", "307", "307 CC", "307 SW", "308", "308 CC", "308 SW", "309", "4007", "406", "407", "407 SW", "408", "5008", "508", "508 SW", "807", "Bipper Tepee", "Boxer", "E-2008", "E-208", "E-3008", "E-308", "E-308 SW", "E-5008", "e-Partner", "e-Rifter", "e-Traveller", "Expert", "Expert Tepee", "Horizon", "iOn", "Partner", "Partner Tepee", "RCZ", "Rifter", "Traveller"],
    "Renault": ["Laguna", "Master", "Megane", "Megane E-Tech", "Modus", "Rafale", "Scenic", "Scenic E-Tech", "Scenic RX4", "Scenic Xmod", "Spider", "Symbioz", "Trafic", "Twingo", "Twizy", "Wind", "Zoe"],
    "Subaru": ["BRZ", "Crosstrek", "Exiga", "Forester", "Impreza", "Justy", "Legacy", "Levorg", "Outback", "Solterra", "Tribeca", "WRX STI", "XT", "XV"],
    "Mazda": ["323", "626", "B2500", "Bongo", "BT-50", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-80", "Demio", "Eunos", "Mazda2", "Mazda2 HYBRID", "Mazda3", "Mazda5", "Mazda6", "MPV", "MX-30", "MX-5", "MX-5 RF", "MX-6", "RX-7", "RX-8"],
    "Lexus": ["CT", "ES", "GS", "GS F", "GX", "IS", "IS F", "LBX", "LC", "LFA", "LM", "LS", "LX", "NX", "RC", "RC F", "RX", "RX L", "RZ", "SC", "UX"],
    "Mercedes-Benz": ["AMG", "AMG GT", "AMG ONE", "A Class", "B Class", "C-Class", "CE Class", "CL", "CLC Class", "CLE", "CLK", "CLS", "CLA", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "eVito", "G Class", "GLA", "GLB", "GLC", "GL Class", "GLE", "GLS", "Maybach GLS", "Maybach S Class", "M Class", "R Class", "S Class", "SEC Series", "SL", "SLC", "SLK", "SLR McLaren", "SLS", "Sprinter", "Traveliner", "Vaneo", "V Class", "Viano", "Vito", "X Class"],
    "Toyota": ["Alphard", "Aqua", "Aristo", "Auris", "Avensis", "Avensis Verso", "AYGO", "Aygo X", "BB", "Blade", "bZ4X", "Camry", "Carina E", "Celica", "Celsior", "Century", "C-HR", "Corolla", "Corolla Verso", "Crown", "Estima", "Estima Aeras G", "FJ Cruiser", "GR86", "Granvia", "GT86", "Harrier", "Hiace", "Highlander", "Hilux", "Ipsum", "iQ", "Land Cruiser", "Land Cruiser Amazon", "Land Cruiser Colorado", "Mark X", "MR2", "Noah", "Paseo", "Picnic", "Porte", "Previa", "Prius", "Prius+", "PROACE", "PROACE CITY Verso", "PROACE Verso", "Progres", "Raum", "RAV4", "Sienta", "Soarer", "Starlet", "Starlet Glanza V", "Starlet GT", "Supra", "Surf", "Tacoma", "Townace", "Tundra", "Urbancruiser", "Vellfire", "Verso", "Verso S", "Vitz", "Voxy", "Wish", "Yaris", "Yaris Cross", "Yaris Verso"],
    "Volkswagen": ["Amarok", "Arteon", "Beetle", "Bora", "Caddy", "Caddy California Maxi", "Caddy Life", "Caddy Maxi", "Caddy Maxi Life", "California", "Campervan", "Caravelle", "CC", "Corrado", "e-Golf", "Eos", "e-Transporter", "e-up!", "Fox", "Golf", "Golf Plus", "Golf SV", "Grand California", "ID.3", "ID.4", "ID.5", "ID.7", "ID. Buzz", "Jetta", "Karmann", "Lupo", "Multivan", "Passat", "Phaeton", "Polo", "Scirocco", "Sharan", "Taigo", "T-Cross", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter", "Transporter Shuttle", "Transporter Sportline", "T-Roc", "up!", "XL1"],
    "Kia": ["Carens", "Ceed", "Cerato", "EV3", "EV6", "EV9", "Magentis", "Niro", "Optima", "Picanto", "ProCeed", "Rio", "Sedona", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Venga", "XCeed"],
    "Jaguar": ["E-PACE", "E-Type", "F-PACE", "F-Type", "I-PACE", "Mark I", "Mark II", "S-Type", "XE", "XF", "XFR-S", "XJ", "XJR", "XJR-S", "XJS", "XK", "XK120", "XK140", "XK150", "XK8", "XKR", "XKR-S", "X-Type"],
    "Infiniti": ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX56", "QX70"],
    "Hyundai": ["Accent", "Amica", "Atoz", "BAYON", "Coupe", "Genesis", "Getz", "i10", "i20", "i30", "i40", "i800", "iLoad", "IONIQ", "IONIQ 5", "IONIQ 6", "ix20", "ix35", "KONA", "Matrix", "NEXO", "Pony X2", "Santa Fe", "Sonata", "Terracan", "Trajet", "TUCSON", "Veloster"],
    "Honda": ["Accord", "Beat", "Civic", "Crossroad", "CR-V", "CR-X", "CR-Z", "e:Ny1", "Elysion", "Fit", "Freed", "FR-V", "Honda E", "HR-V", "Insight", "Integra", "Jazz", "Legend", "Mobilio", "N-Box", "NSX", "Odyssey", "Prelude", "Ridgeline", "S2000", "S660", "Shuttle", "Stepwagon", "Stream", "ZR-V"],
    "Fiat": ["124 Spider", "126", "500", "500C", "500e", "500e C", "500L", "500X", "500X Dolcevita", "600", "600e", "Barchetta", "Brava", "Bravo", "Coupe", "Doblo", "Ducato", "Fiorino", "Fullback", "Grande Punto", "Idea", "Multipla", "Panda", "Punto", "Punto Evo", "Qubo", "Scudo", "Sedici", "Seicento", "Spider", "Stilo", "Strada", "Talento", "Tipo", "Ulysse", "Uno"],
    "Dodge": ["Avenger", "Caliber", "Challenger", "Charger", "Coronet", "Journey", "Nitro", "RAM", "Viper"],
    "Ford": ["Anglia", "B-Max", "Bronco", "Capri", "C-Max", "Consul", "Cortina", "Cougar", "Custom Cab", "EcoSport", "Edge", "Escort", "E-Tourneo Custom", "E-Transit", "E-Transit Custom", "Excursion", "Explorer", "F1", "F150", "F-250", "F350", "Fiesta", "Fiesta Van", "Focus", "Focus CC", "Focus C-Max", "Fusion", "Galaxy", "Granada", "Grand C-Max", "Grand Tourneo Connect", "GT", "Ka", "Ka+", "Kuga", "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Orion", "Prefect", "Probe", "Puma", "Ranger", "Scorpio", "Sierra", "S-Max", "Streetka", "Thunderbird", "Tourneo Connect", "Tourneo Courier", "Tourneo Custom", "Transit", "Transit Connect", "Transit Courier", "Transit Custom", "Zephyr"],
    "Nissan": ["350 Z", "370 Z", "Almera", "Altima", "Bluebird", "Cedric", "Cube", "Datsun", "Skyline", "Sunny", "Tiida", "X-Trail"]
};


const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe", "Hatchback"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 26 }, (_, i) => String(currentYear - i)).reverse(); 




interface CustomPickerProps {
    label: string;
    selectedValue: string;
    onValueChange: (itemValue: string) => void;
    items: string[];
    name: keyof FormDataState;
    disabled?: boolean;
}

const CustomPicker: React.FC<CustomPickerProps> = ({ 
    label, 
    selectedValue, 
    onValueChange, 
    items, 
    disabled = false 
}) => {
    return (
        <View style={styles.pickerContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={[styles.pickerWrapper, disabled && styles.pickerDisabled]}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    style={styles.pickerStyle}
                    enabled={!disabled}
                    dropdownIconColor={PRIMARY_COLOR}
                >
                    <Picker.Item label={`Select ${label}...`} value="" color={SUBTLE_TEXT_COLOR} />
                    {items.map((item) => (
                        <Picker.Item key={item} label={item} value={item} color={TEXT_COLOR} />
                    ))}
                </Picker>
            </View>
        </View>
    );
};




const EditCarDetailsScreen = () => {
    const router = useRouter(); 
    const params = useLocalSearchParams();
    const vehicleId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentVehicle, setCurrentVehicle] = useState<VehicleData | null>(null);

    const [formData, setFormData] = useState<Partial<FormDataState>>({});
    const [errors, setErrors] = useState<Partial<FormDataState>>({});


    const getAvailableModels = useCallback((brand: string | undefined): string[] => {
        if (!brand) return [];
      
        return carModels[brand] || []; 
    }, []);

    const availableModels = getAvailableModels(formData.brand);



    const fetchVehicleDetails = useCallback(async () => {
        if (!vehicleId) {
            Alert.alert("Error", "No vehicle ID provided.");
            router.back();
            return;
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert("Authentication Error", "Please log in.");
            router.replace('/signin');
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Server error.' }));
                throw new Error(errorData.message || `Failed to fetch vehicle ${vehicleId}.`);
            }

            const data: VehicleData = await response.json();
            setCurrentVehicle(data);
            
     
            setFormData({
                name: data.name || '',
                surname: data.surname || '',
                phone_number: data.phone_number || '',
                vin: data.vin || '',
                license_plate: data.license_plate || '',
                brand: data.brand || '',
                model: data.model || '',
                vehicle_type: data.vehicle_type || '', 
                fuel_type: data.fuel_type || '', 
                year: String(data.year || currentYear),
                kilometers: String(data.kilometers || 0),
            });
        } catch (err: any) {
            Alert.alert("Error", err.message || "Could not load vehicle data.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [vehicleId, router]);

    useEffect(() => {
        fetchVehicleDetails();
    }, [fetchVehicleDetails]);


  
    const handleChange = (name: keyof FormDataState, value: string) => {
        
       
        if (name === "brand") {
            setFormData(prev => ({ ...prev, brand: value, model: "" }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const validate = (): boolean => {
        const newErrors: Partial<FormDataState> = {};
        const kmValue = Number(formData.kilometers);
        const yearValue = Number(formData.year);

        if (kmValue < 0 || isNaN(kmValue)) {
            newErrors.kilometers = "Kilometers must be a positive number.";
        }
        if (yearValue > currentYear || yearValue < 1900 || isNaN(yearValue)) {
            newErrors.year = `Year must be between 1900 and ${currentYear}.`;
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


 
    const handleSubmit = async () => {
        if (!validate() || isSubmitting || !vehicleId) return;
        
        setIsSubmitting(true);
        const token = await AsyncStorage.getItem('token');

        try {
            const response = await fetch(`${BASE_URL}/api/vehicles/${vehicleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData), 
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Vehicle updated successfully!");
              
                router.back(); 
            } else {
                Alert.alert("Update Failed", result.message || "Unknown error occurred.");
            }
        } catch (err) {
            console.error("API error during update:", err);
            Alert.alert("Server Error", "Could not connect to the server.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    
    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={styles.text}>Loading vehicle data for editing...</Text>
            </View>
        );
    }
    
    if (!currentVehicle) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.text}>Vehicle not found.</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
       
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isSubmitting}>
                    <MaterialIcons name="arrow-back" size={24} color={TEXT_COLOR} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle} numberOfLines={1}>Edit Vehicle Details</Text>
                    <Text style={styles.headerSubtitle}>{currentVehicle.brand} {currentVehicle.model}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
          
                <Text style={styles.sectionTitle}>Customer Info</Text>
                <TextInput
                    style={styles.input} placeholder="Name" placeholderTextColor={SUBTLE_TEXT_COLOR}
                    value={formData.name} onChangeText={(v) => handleChange('name', v)}
                />
                <TextInput
                    style={styles.input} placeholder="Surname" placeholderTextColor={SUBTLE_TEXT_COLOR}
                    value={formData.surname} onChangeText={(v) => handleChange('surname', v)}
                />
                <TextInput
                    style={styles.input} placeholder="Phone Number" placeholderTextColor={SUBTLE_TEXT_COLOR}
                    value={formData.phone_number} onChangeText={(v) => handleChange('phone_number', v)}
                    keyboardType="phone-pad"
                />
                
             
                <Text style={styles.sectionTitle}>Vehicle Info</Text>
                <TextInput
                    style={styles.input} placeholder="VIN Number" placeholderTextColor={SUBTLE_TEXT_COLOR}
                    value={formData.vin} onChangeText={(v) => handleChange('vin', v)}
                />
                <TextInput
                    style={styles.input} placeholder="License Plate" placeholderTextColor={SUBTLE_TEXT_COLOR}
                    value={formData.license_plate} onChangeText={(v) => handleChange('license_plate', v)}
                />
                
             
                <CustomPicker 
                    label="Brand" 
                    name="brand"
                    selectedValue={formData.brand || ''} 
                    onValueChange={(v) => handleChange('brand', v)}
                    items={Object.keys(carModels)}
                />
                <CustomPicker 
                    label="Model" 
                    name="model"
                    selectedValue={formData.model || ''} 
                    onValueChange={(v) => handleChange('model', v)}
                    items={availableModels}
                    disabled={!formData.brand || availableModels.length === 0}
                />
                <CustomPicker 
                    label="Vehicle Type" 
                    name="vehicle_type"
                    selectedValue={formData.vehicle_type || ''} 
                    onValueChange={(v) => handleChange('vehicle_type', v)}
                    items={vehicleTypes}
                />
                <CustomPicker 
                    label="Fuel Type" 
                    name="fuel_type"
                    selectedValue={formData.fuel_type || ''} 
                    onValueChange={(v) => handleChange('fuel_type', v)}
                    items={fuelTypes}
                />
                
        
                <View style={styles.row}>
                    <View style={styles.halfWidth}>
                        <CustomPicker 
                            label="Year" 
                            name="year"
                            selectedValue={formData.year || ''} 
                            onValueChange={(v) => handleChange('year', v)}
                            items={years}
                        />
                        {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
                    </View>
                    <View style={styles.halfWidth}>
                        <Text style={styles.inputLabel}>Kilometers</Text>
                        <TextInput
                            style={[styles.inputInline, errors.kilometers && styles.inputError]} 
                            placeholder="Kilometers (km)" placeholderTextColor={SUBTLE_TEXT_COLOR}
                            value={formData.kilometers} 
                            onChangeText={(v) => handleChange('kilometers', v)}
                            keyboardType="numeric"
                        />
                        {errors.kilometers && <Text style={styles.errorText}>{errors.kilometers}</Text>}
                    </View>
                </View>

         
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton} disabled={isSubmitting}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmit} style={styles.saveButton} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <ActivityIndicator color={TEXT_COLOR} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BACKGROUND_COLOR, },
    center: { justifyContent: 'center', alignItems: 'center', },
    scrollContent: { padding: 20, },
    text: { color: SUBTLE_TEXT_COLOR, marginTop: 10, },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 40, backgroundColor: CARD_BG, borderBottomWidth: 1, borderBottomColor: INPUT_BORDER, marginBottom: 10, },
    backButton: { paddingRight: 15, },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: TEXT_COLOR, },
    headerSubtitle: { fontSize: 14, color: PRIMARY_COLOR, },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: PRIMARY_COLOR, marginTop: 15, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: INPUT_BORDER, paddingBottom: 5, },
    input: { height: 50, backgroundColor: CARD_BG, borderColor: INPUT_BORDER, borderWidth: 1, borderRadius: 8, color: TEXT_COLOR, paddingHorizontal: 15, marginBottom: 15, fontSize: 16, },
    inputLabel: { color: SUBTLE_TEXT_COLOR, fontSize: 12, marginBottom: 4, },
    inputError: { borderColor: ERROR_COLOR, borderWidth: 2, },
    errorText: { color: ERROR_COLOR, fontSize: 12, marginTop: -10, marginBottom: 15, },
    pickerContainer: { marginBottom: 15, },
    pickerWrapper: { height: 50, backgroundColor: CARD_BG, borderColor: INPUT_BORDER, borderWidth: 1, borderRadius: 8, justifyContent: 'center', overflow: 'hidden', },
    pickerDisabled: { opacity: 0.5, },
    pickerStyle: { color: TEXT_COLOR, height: 50, },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, },
    halfWidth: { width: '48%', },
    inputInline: { height: 50, backgroundColor: CARD_BG, borderColor: INPUT_BORDER, borderWidth: 1, borderRadius: 8, color: TEXT_COLOR, paddingHorizontal: 15, fontSize: 16, marginTop: 4, },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30, gap: 10, },
    cancelButton: { padding: 12, borderRadius: 8, borderColor: SUBTLE_TEXT_COLOR, borderWidth: 1, backgroundColor: 'transparent', flex: 1, alignItems: 'center', },
    cancelButtonText: { color: SUBTLE_TEXT_COLOR, fontWeight: 'bold', fontSize: 16, },
    saveButton: { padding: 12, borderRadius: 8, backgroundColor: PRIMARY_COLOR, flex: 1, alignItems: 'center', justifyContent: 'center', },
    saveButtonText: { color: TEXT_COLOR, fontWeight: 'bold', fontSize: 16, },
});

export default EditCarDetailsScreen;