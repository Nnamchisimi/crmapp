import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Platform,
    StyleProp,
    ViewStyle,
    TextStyle
} from "react-native";
import { useRouter, Link } from "expo-router";
// Ensure you have run: expo install @react-native-picker/picker
import { Picker } from "@react-native-picker/picker";
// Ensure you have run: expo install @expo/vector-icons
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

// --- TYPE DEFINITIONS ---
interface SelectOption {
    label: string;
    value: string;
}

type FormFieldChangeHandler = (e: { target: { name: keyof VehicleFormData, value: string } }) => void;

interface FormFieldProps {
    label: string;
    // We now use keyof VehicleFormData for the name prop, which is compatible
    name: keyof VehicleFormData; 
    value: string;
    // The onChange prop now uses the strongly typed handler
    onChange: FormFieldChangeHandler; 
    error?: string;
    // The keyboardType prop now ONLY accepts the defined literals, which is correct
    keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address'; 
    selectOptions?: SelectOption[];
    disabled?: boolean;
    isSelect?: boolean;
}




interface VehicleFormData {
    name: string;
    surname: string;
    phoneNumber: string;
    vin: string;
    licensePlate: string;
    brand: string;
    model: string;
    vehicleType: string;
    fuelType: string;
    year: string;
    kilometers: string;
}

interface SidebarItem {
    text: string;
    icon: React.ReactNode;
    path?: string;
    action?: () => void;
}

// --- MOCK UI COMPONENTS (Using explicit types for style props) ---

const Box: React.FC<{ children: React.ReactNode, style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
    <View style={style}>{children}</View>
);
const Paper: React.FC<{ children: React.ReactNode, style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
    <View style={style}>{children}</View>
);
const Typography: React.FC<{ children: React.ReactNode, style?: StyleProp<TextStyle> }> = ({ children, style }) => (
    <Text style={style}>{children}</Text>
);
const Button: React.FC<{ children: React.ReactNode, onPress: () => void, style?: StyleProp<ViewStyle> }> = ({ children, onPress, style }) => (
    <TouchableOpacity onPress={onPress} style={style}>{children}</TouchableOpacity>
);
const Divider: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
    <View style={style} />
);

// FormField component is where the original error occurred.
const FormField: React.FC<FormFieldProps> = ({ 
    label, 
    name, 
    value, 
    onChange, 
    error, 
    keyboardType = 'default', 
    selectOptions = [], 
    disabled = false, 
    isSelect = false 
}) => {
    // Correctly typed handler for Picker/TextInput onChange
    const onChangeHandler = (newValue: string) => {
        onChange({ target: { name, value: newValue } });
    };

    return (
        <View style={styles.formGroup}>
            <Text style={styles.label}>{label}</Text>
            {isSelect ? (
                <View style={[styles.input, styles.pickerContainer, disabled && styles.pickerDisabled]}>
                    <Picker<string>
                        selectedValue={value}
                        onValueChange={(itemValue) => onChangeHandler(itemValue)}
                        style={styles.picker}
                        enabled={!disabled}
                        dropdownIconColor="#ccc" 
                    >
                        <Picker.Item label={`Select ${label}`} value="" style={{ color: '#888' }} />
                        {/* THE ERROR IS RESOLVED because selectOptions is typed as SelectOption[] */}
                        {selectOptions.map((option) => (
                            <Picker.Item 
                                key={option.value || option.label} 
                                label={option.label} 
                                value={option.value || option.label} 
                                style={{ color: '#fff' }} 
                            />
                        ))}
                    </Picker>
                </View>
            ) : (
                <TextInput
                    style={[styles.input, error && styles.inputError]}
                    placeholder={label}
                    placeholderTextColor="#888"
                    value={value}
                    onChangeText={onChangeHandler}
                    keyboardType={keyboardType}
                />
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

// --- MOCK LOGIC FUNCTIONS ---
const BrandLogo: React.FC<{ brand: string, size: number, showName: boolean }> = ({ brand }) => (
    <Text style={{ color: '#fff', fontWeight: 'bold' }}>
        {brand.substring(0, 1)}
    </Text>
);
const getBrandLogo = (brand: string, size: number) => <AntDesign name="car" size={18} color="#00bcd4" style={{ marginRight: 8 }} />;
const getBrandDisplayName = (brand: string) => brand;

// --- CAR MODELS (Remains the same structure) ---
const carModels: { [key: string]: string[] } = {
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
    "Fiat": ["124 Spider", "126", "500", "500C", "500e", "500e C", "500L", "500X", "500X Dolcevita", "600", "600e", "Barchetta", "Brava", "Bravo", "Coupe", "Doblo", "Ducato", "Fiorino", "Fullback", "Grande Punto", "Idea", "Multipla", "Panda", "Punto", "Punto Evo", "Qubo", "Scudo", "Sedici", "Seicento", "Spider", "Stilo", "Strada", "Talento", "Tipo", "Ulysse", "Uno"],
    "Dodge": ["Avenger", "Caliber", "Challenger", "Charger", "Coronet", "Journey", "Nitro", "RAM", "Viper"],
    "Ford": ["Anglia", "B-Max", "Bronco", "Capri", "C-Max", "Consul", "Cortina", "Cougar", "Custom Cab", "EcoSport", "Edge", "Escort", "E-Tourneo Custom", "E-Transit", "E-Transit Custom", "Excursion", "Explorer", "F1", "F150", "F-250", "F350", "Fiesta", "Fiesta Van", "Focus", "Focus CC", "Focus C-Max", "Fusion", "Galaxy", "Granada", "Grand C-Max", "Grand Tourneo Connect", "GT", "Ka", "Ka+", "Kuga", "Maverick", "Mondeo", "Mustang", "Mustang Mach-E", "Orion", "Prefect", "Probe", "Puma", "Ranger", "Scorpio", "Sierra", "S-Max", "Streetka", "Thunderbird", "Tourneo Connect", "Tourneo Courier", "Transit", "Transit Connect", "Transit Courier", "Transit Custom", "Zephyr"],
    "Nissan": ["350 Z", "370 Z", "Almera", "Altima", "Bluebird", "Cedric", "Cube", "Datsun", "Skyline", "Sunny", "Tiida", "X-Trail"]
};

// --- MAIN COMPONENT ---
const AddVehicle: React.FC = () => {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const initialFormData: VehicleFormData = {
        name: "",
        surname: "",
        phoneNumber: "",
        vin: "",
        licensePlate: "",
        brand: "",
        model: "",
        vehicleType: "",
        fuelType: "",
        year: "",
        kilometers: "",
    };

    const [formData, setFormData] = useState<VehicleFormData>(initialFormData);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const currentYear = new Date().getFullYear();

    const brands = Object.keys(carModels).sort();
    const vehicleTypes = ["Sedan", "SUV", "Truck", "Van", "Coupe"];
    const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];
    const years = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014",
        "2013", "2012", "2011", "2010", "2009"];

    const availableModels = carModels[formData.brand] || [];

    // Correctly typed handler
    const handleChange = ({ target }: { target: { name: keyof VehicleFormData, value: string } }) => {
        const { name, value } = target;

        if (name === "brand") {
            setFormData({ ...formData, brand: value, model: "" });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        setErrors({ ...errors, [name]: "" });
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        
        const yearInt = parseInt(formData.year);
        if (formData.year && (yearInt < 1900 || yearInt > currentYear)) {
            newErrors.year = `Year must be between 1900 and ${currentYear}`;
        }
        
        const kilometersFloat = parseFloat(formData.kilometers);
        if (formData.kilometers && kilometersFloat < 0) {
            newErrors.kilometers = "Kilometers cannot be negative";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        // Using type assertion for localStorage (Web only)
        const userEmail = Platform.OS === 'web' ? (localStorage.getItem("userEmail") as string) : "mockUser@example.com";
        const authToken = Platform.OS === 'web' ? (localStorage.getItem("token") as string) : "mockAuthToken123";

        if (!userEmail || !authToken || userEmail === 'mockUser@example.com') {
            Alert.alert("Authentication Required", "Please sign in again.");
            router.push("/signin");
            return;
        }

        const vehicleData = { ...formData, email: userEmail };

        try {
            const response = await fetch("http://localhost:3007/api/vehicles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`,
                },
                body: JSON.stringify(vehicleData),
            });

            const data: { message?: string; error?: string } = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Vehicle registered successfully!");
                router.push("/dashboard");
            } else {
                if (response.status === 401) {
                    Alert.alert("Error", "Session expired or access denied. Please re-login.");
                    router.push("/signin");
                } else {
                    Alert.alert("Error", data.message || data.error || "Unknown error");
                }
            }
        } catch (err) {
            console.error("Fetch error:", err);
            Alert.alert("Error", "Server connection failed or unknown error.");
        }
    };


    const handleSignOut = () => {
        if (Platform.OS === 'web') {
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userRole");
            localStorage.removeItem("token");
        }
        router.replace("/signin");
    };

    const sidebarItems: SidebarItem[] = [
        { text: "Home", icon: <MaterialIcons name="home" size={24} color="#ccc" />, path: "/" },
        { text: "Dashboard", icon: <MaterialIcons name="dashboard" size={24} color="#ccc" />, path: "/dashboard" },
        { text: "Campaigns", icon: <MaterialIcons name="campaign" size={24} color="#ccc" />, path: "/campaigns" },
        { text: "Newsletter", icon: <MaterialIcons name="email" size={24} color="#ccc" />, path: "/newsletter" },
        { text: "Notifications", icon: <MaterialIcons name="notifications" size={24} color="#ccc" />, path: "/notifications" },
        { text: "Sign Out", icon: <MaterialIcons name="exit-to-app" size={24} color="#ccc" />, action: handleSignOut },
    ];

    const sidebar = (
        <Box style={styles.sidebar}>
            <Typography style={styles.sidebarTitle}>
                AutoCRM
            </Typography>
            <Divider style={styles.sidebarDivider} />
            <View>
                {sidebarItems.map((item, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={styles.sidebarItem}
                        onPress={() => {
                          if (item.path) router.push(item.path as any);
                            if (item.action) item.action();
                            setMobileOpen(false);
                        }}
                    >
                        {item.icon}
                        <Text style={styles.sidebarItemText}>{item.text}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Box>
    );

    return (
        <Box style={styles.container}>
            {Platform.OS === 'web' && <View style={styles.desktopSidebar}>{sidebar}</View>}

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Paper style={styles.formContainer}>

                    <Link href="/dashboard" asChild>
                        <TouchableOpacity style={styles.backButton}>
                            <Text style={styles.backButtonText}>← Back to Dashboard</Text>
                        </TouchableOpacity>
                    </Link>

                    <Typography style={styles.header}>
                        Register Your Vehicle
                    </Typography>
                    <Typography style={styles.subheader}>
                        Add your vehicle details to generate a unique CRM number
                    </Typography>

                    <View>
                        {[
                            { label: "Name", name: "name" as keyof VehicleFormData },
                            { label: "Surname", name: "surname" as keyof VehicleFormData },
                            { label: "Phone Number", name: "phoneNumber" as keyof VehicleFormData, keyboardType: 'phone-pad' },
                            { label: "VIN Number", name: "vin" as keyof VehicleFormData },
                            { label: "License Plate", name: "licensePlate" as keyof VehicleFormData },
                        ].map((field) => (
                            <FormField
                                key={field.name}
                                label={field.label}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                         
                          
                            />
                        ))}

                        <FormField
                            isSelect
                            selectOptions={brands.map(b => ({ label: getBrandDisplayName(b), value: b }))}
                            label="Brand"
                            name="brand"
                            value={formData.brand}
                            onChange={handleChange}
                        />

                        <FormField
                            isSelect
                            selectOptions={availableModels.map(m => ({ label: m, value: m }))}
                            label="Model"
                            name="model"
                            value={formData.model}
                            onChange={handleChange}
                            disabled={!formData.brand}
                        />

                        <FormField
                            isSelect
                            selectOptions={vehicleTypes.map(t => ({ label: t, value: t }))}
                            label="Vehicle Type"
                            name="vehicleType"
                            value={formData.vehicleType}
                            onChange={handleChange}
                        />

                        <FormField
                            isSelect
                            selectOptions={fuelTypes.map(f => ({ label: f, value: f }))}
                            label="Fuel Type"
                            name="fuelType"
                            value={formData.fuelType}
                            onChange={handleChange}
                        />

                        <FormField
                            isSelect
                            selectOptions={years.map(y => ({ label: y, value: y }))}
                            label="Year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            error={errors.year}
                        />

                        <FormField
                            label="Kilometers"
                            name="kilometers"
                            value={formData.kilometers}
                            onChange={handleChange}
                            keyboardType="numeric"
                            error={errors.kilometers}
                        />

                        <Button
                            onPress={handleSubmit}
                            style={styles.submitButton}
                        >
                            <Text style={styles.submitButtonText}>
                                Register Vehicle
                            </Text>
                        </Button>
                    </View>

                </Paper>
            </ScrollView>
        </Box>
    );
};

// --- STYLESHEET ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        backgroundColor: "#111",
    },
    desktopSidebar: {
        width: 250,
        display: 'flex',
    },
    sidebar: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRightWidth: 1,
        borderRightColor: "rgba(255,255,255,0.1)",
        padding: 24,
    },
    sidebarTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#00bcd4",
    },
    sidebarDivider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginBottom: 16,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    sidebarItemText: {
        color: "#ccc",
        marginLeft: 16,
        fontSize: 16,
    },
    contentContainer: {
        flexGrow: 1,
        padding: 20,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    formContainer: {
        padding: 20,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        width: "100%",
        maxWidth: 1000,
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonText: {
        color: "#00bcd4",
        fontSize: 16,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: 8,
    },
    subheader: {
        color: "rgba(255,255,255,0.7)",
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 10,
    },
    label: {
        color: "#ccc",
        fontSize: 14,
        marginBottom: 5,
    },
    input: {
        height: 50,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 4,
        paddingHorizontal: 15,
        color: "white",
        fontSize: 16,
        borderWidth: 1,
        borderColor: "transparent",
    },
    inputError: {
        borderColor: "red",
    },
    errorText: {
        color: "red",
        marginTop: 5,
        fontSize: 12,
    },
    pickerContainer: {
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 0,
        overflow: 'hidden',
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 4,
    },
    picker: {
        color: 'white',
        backgroundColor: 'transparent',
    },
    pickerDisabled: {
        opacity: 0.5,
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    submitButton: {
        marginTop: 20,
        backgroundColor: "#00bcd4",
        borderRadius: 4,
        paddingVertical: 15,
        alignItems: "center",
    },
    submitButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
    },
});

export default AddVehicle;