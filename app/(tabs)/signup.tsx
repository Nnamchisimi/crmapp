import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Alert,
    Platform,
    ActivityIndicator,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MotiView } from "moti";
import { MaterialIcons } from "@expo/vector-icons";

// Define the root navigation type for type safety
type RootStackParamList = {
    signin: undefined;
    dashboard: undefined;
    signup: undefined; // Include this screen itself
};

const API_BASE_URL =  "http://192.168.55.73:3007"; // Use 10.0.2.2 for Android emulator to access localhost
const PRIMARY_COLOR = "#00bcd4";
const BACKGROUND_COLOR = "#1a1a1a";
const CARD_BG = "rgba(255,255,255,0.05)";
const WHITE_TEXT = "#ffffff";
const SECONDARY_TEXT = "#aaa";

export const SignUpScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [isGoogleUser, setIsGoogleUser] = useState(false); // To handle pre-filled data from Google
    const [loading, setLoading] = useState(false);

    // Helper function to show alerts
    const showAlert = (title: string, message: string) => {
        Alert.alert(title, message);
    };

    // --------------------------------------
    // Manual Signup (Backend auto-generates CRM)
    // --------------------------------------
    const handleSubmit = async () => {
        if (loading) return;
        setLoading(true);

        const userData = {
            name,
            surname,
            phoneNumber,
            email,
            username,
            password,
            is_verified: isGoogleUser ? 1 : 0,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                console.log("✅ Signup successful!");
                console.log("Generated CRM Number:", data.crm_number);

                // Store CRM number locally
                await AsyncStorage.setItem("crmNumber", data.crm_number);

                showAlert(
                    "Success",
                    "Sign up successful! Please sign in with your new credentials."
                );
                navigation.navigate("signin");
            } else {
                console.error("❌ Signup failed:", data.error || data.message);
                showAlert(
                    "Signup Failed",
                    data.error || data.message || "An unknown error occurred."
                );
            }
        } catch (err) {
            console.error("❌ Signup error:", err);
            showAlert("Error", "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------
    // Google Signup Placeholder
    // --------------------------------------
    const handleGoogleSuccess = async (
        email: string,
        name: string,
        surname: string
    ) => {
        // In a real app, you would integrate a native Google Sign-in library (e.g., @react-native-google-signin/google-signin)
        // This function would receive a token/credential, which you'd send to your backend.
        setLoading(true);

        try {
            // Placeholder logic: assuming the backend handles the token exchange
            const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Replace with the actual token/credential from the native Google Sign-in flow
                body: JSON.stringify({ token: "MOCK_GOOGLE_TOKEN" }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Pre-fill fields or navigate directly on successful login/registration
                setEmail(data.email || email);
                setName(data.name || name);
                setSurname(data.surname || surname);
                setUsername(data.username || data.email.split("@")[0] || "");
                setIsGoogleUser(true);
                setPassword("GOOGLE_AUTH_PLACEHOLDER"); // Password is not used for Google users

                if (data.crm_number) {
                    await AsyncStorage.setItem("crmNumber", data.crm_number);
                }
                
                // Assuming successful Google sign-up means successful log-in and navigation to Dashboard
                await AsyncStorage.setItem("userEmail", data.email);
                navigation.navigate("dashboard");

            } else {
                showAlert(
                    "Google Sign-up Failed",
                    data.error || data.message || "Please try manual sign-up."
                );
                setIsGoogleUser(false); // Reset in case of failure
            }
        } catch (err) {
            showAlert("Error", "Google sign-up failed. Check server connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        showAlert("Google Login Failed", "Could not complete Google sign-in.");
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <MotiView
                    from={{ opacity: 0, translateY: 40 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 1000 }}
                    style={styles.card}
                >
                    <Text style={styles.title}>Sign up</Text>

                    {/* ---------------------- FORM ---------------------- */}
                    <View style={styles.form}>
                        {/* Name */}
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor={SECONDARY_TEXT}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                        {/* Surname */}
                        <TextInput
                            style={styles.input}
                            placeholder="Surname"
                            placeholderTextColor={SECONDARY_TEXT}
                            value={surname}
                            onChangeText={setSurname}
                            autoCapitalize="words"
                        />
                        {/* Phone Number */}
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor={SECONDARY_TEXT}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                        {/* Email */}
                        <TextInput
                            style={[
                                styles.input,
                                isGoogleUser && styles.inputDisabled,
                            ]}
                            placeholder="Email"
                            placeholderTextColor={SECONDARY_TEXT}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isGoogleUser}
                        />
                        {/* Username */}
                        <TextInput
                            style={[
                                styles.input,
                                isGoogleUser && styles.inputDisabled,
                            ]}
                            placeholder="Username"
                            placeholderTextColor={SECONDARY_TEXT}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            editable={!isGoogleUser}
                        />
                        {/* Password */}
                        <TextInput
                            style={[
                                styles.input,
                                isGoogleUser && styles.inputDisabled,
                            ]}
                            placeholder="Password"
                            placeholderTextColor={SECONDARY_TEXT}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            editable={!isGoogleUser}
                     
                        />

                        {/* Manual Sign up Button */}
                        {!isGoogleUser && (
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator
                                        color={WHITE_TEXT}
                                        size="small"
                                    />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        Sign up
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign In Button (Placeholder) */}
                    <View style={styles.googleButtonContainer}>
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={() =>
                                handleGoogleSuccess(
                                    "example@google.com",
                                    "John",
                                    "Doe"
                                )
                            } // Mocked data
                            disabled={loading}
                        >
                            <MaterialIcons
                                name="mail"
                                size={20}
                                color={WHITE_TEXT}
                                style={{ marginRight: 10 }}
                            />
                            <Text style={styles.googleButtonText}>
                                Sign up with Google
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Go to Sign in */}
                    <Text style={styles.footerText}>
                        Already have an account?{" "}
                        <Text
                            style={styles.linkText}
                            onPress={() => navigation.navigate("signin")}
                        >
                            Sign in
                        </Text>
                    </Text>
                </MotiView>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BACKGROUND_COLOR,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 20,
        // Gradient simulation (React Native doesn't support linear-gradient background directly without a library like expo-linear-gradient)
        backgroundColor: BACKGROUND_COLOR,
    },
    card: {
        width: "100%",
        maxWidth: 500,
        padding: 25,
        borderRadius: 15,
        backgroundColor: CARD_BG,
        // Simulating Paper elevation with shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 30,
        // Simulating the linear-gradient text effect using color for React Native
        color: PRIMARY_COLOR,
    },
    form: {
        gap: 15,
        marginBottom: 10,
    },
    input: {
        height: 50,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: WHITE_TEXT,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputDisabled: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: SECONDARY_TEXT,
        borderColor: SECONDARY_TEXT,
    },
    button: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: "600",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    dividerText: {
        color: "rgba(255,255,255,0.5)",
        marginHorizontal: 10,
        fontSize: 14,
    },
    googleButtonContainer: {
        alignItems: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4285F4', // Google Blue
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '100%',
    },
    googleButtonText: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: '600',
    },
    footerText: {
        color: WHITE_TEXT,
        textAlign: "center",
        marginTop: 20,
        fontSize: 14,
    },
    linkText: {
        color: PRIMARY_COLOR,
        fontWeight: "bold",
    },
});