import React, { useState, useEffect,useCallback, useRef } from "react";
import {router} from "expo-router"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView, 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { MaterialIcons } from "@expo/vector-icons"; 

const PRIMARY_COLOR = '#00bcd4';
const BACKGROUND_COLOR = '#000';
const CARD_BG = 'rgba(255,255,255,0.05)';
const BORDER_COLOR = 'rgba(255,255,255,0.1)';
const TEXT_COLOR = 'white';
const SUBTLE_TEXT_COLOR = 'rgba(255,255,255,0.7)';
const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.7; 

interface FormData {
  phone: string;
  notifications: { email: boolean; sms: boolean; phone: boolean };
  preferences: { weeklyDigest: boolean; monthlyOffers: boolean; reminders: boolean };
}

const useLoggedInEmail = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getEmail = async () => {
      const userEmail = await AsyncStorage.getItem("userEmail");
      if (userEmail) {
        setEmail(userEmail);
      }
      setIsLoading(false);
    };
    getEmail();
  }, []);

  return { loggedInEmail: email, isLoading };
};


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

const SidebarItem = ({ text, iconName, onPress }: { text: string; iconName: keyof typeof MaterialIcons.glyphMap; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.drawerItem}>
    <MaterialIcons name={iconName} size={24} color="#ccc" />
    <Text style={styles.drawerItemText}>{text}</Text>
  </TouchableOpacity>
);


const CustomCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <TouchableOpacity onPress={onChange} style={styles.checkboxContainer}>
    <MaterialIcons 
      name={checked ? "check-box" : "check-box-outline-blank"} 
      size={24} 
      color="white" 
    />
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const CustomChip: React.FC<{ label: string, style?: any }> = ({ label, style }) => (
  <View style={[styles.chip, style]}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const Newsletter: React.FC = () => {

  const [mobileOpen, setMobileOpen] = useState(false);
  const { loggedInEmail, isLoading: isEmailLoading } = useLoggedInEmail();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    phone: "",
    notifications: { email: true, sms: true, phone: true },
    preferences: { weeklyDigest: true, monthlyOffers: true, reminders: true },
  });
  
  const drawerAnim = useRef(new Animated.Value(screenWidth)).current;

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

  const handleChange = (name: keyof Omit<FormData, 'notifications' | 'preferences'>, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleNotificationChange = (key: keyof FormData['notifications']) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handlePreferenceChange = (key: keyof FormData['preferences']) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!loggedInEmail) {
      Alert.alert("Error", "You must be logged in to subscribe.");
      return;
    }
    
    setIsSubmitting(true);

    const payload = {
      ...formData,
      email: loggedInEmail,
    };

    try {
      const response = await fetch("http://localhost:3007/api/newsletter", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Thank you for subscribing!");
      } else {
        Alert.alert("Error", data.message || "Unknown error");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Server Error", "Could not connect to the server, please try again.");
    } finally {
      setIsSubmitting(false);
      setFormData({
        phone: "",
        notifications: { email: true, sms: false, phone: false },
        preferences: { weeklyDigest: true, monthlyOffers: false, reminders: false },
      });
    }
  };

    const sidebarItems: { text: string; icon: keyof typeof MaterialIcons.glyphMap; path: string }[] = [
      { text: "Home", icon: "home", path: "/" },
      { text: "Dashboard", icon: "dashboard", path: "/dashboard" },
      { text: "Campaigns", icon: "campaign", path: "/campaigns" },
      { text: "Newsletter", icon: "email", path: "/newsletter" },
      { text: "Notifications", icon: "notifications", path: "/notifications" },
      { text: "Booking", icon: "event", path: "/bookings" },
      { text: "Sign Out", icon: "exit-to-app", path: "/signin" },
    ];
  
    const DrawerContent = (
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
    );

    const isDesktop = Dimensions.get('window').width >= 768; 

    if (isEmailLoading) {
      return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={PRIMARY_COLOR} /></View>;
    }

    return (
      <View style={styles.appContainer}>
        
        {isDesktop && (
            <View style={styles.desktopSidebar}>
                {DrawerContent}
            </View>
        )}

        <SafeAreaView style={styles.mainWrapper}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discount Newsletter</Text>
                {!isDesktop && (
                    <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
                        <MaterialIcons name="menu" size={30} color={TEXT_COLOR} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.mainContentContainer} style={styles.scrollViewFlex}>
                <View style={styles.userInfoContainer}>
                    <CustomChip 
                      label={loggedInEmail || 'Loading...'} 
                      style={{ borderColor: PRIMARY_COLOR, borderWidth: 1 }} 
                    />
                </View>

                <Text style={styles.title}>Discount Newsletter</Text>
                <Text style={styles.subtitle}>
                  Subscribe to receive exclusive service discounts, maintenance tips, and special offers.
                </Text>

                <View style={styles.cardContainer}>
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Newsletter Subscription</Text>
                    <Text style={styles.cardSubtitle}>
                      Stay informed about the latest offers and service campaigns.
                    </Text>

                    <TextInput
                      style={[styles.input, styles.readOnlyInput]}
                      value={loggedInEmail || "Not Logged In"}
                      editable={false}
                      placeholderTextColor={SUBTLE_TEXT_COLOR}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone Number (Optional)"
                      placeholderTextColor={SUBTLE_TEXT_COLOR}
                      value={formData.phone}
                      onChangeText={(text) => handleChange("phone", text)}
                      keyboardType="phone-pad"
                    />

                    <Text style={styles.sectionTitle}>Notification Preferences</Text>
                    <CustomCheckbox
                      label="Email Notifications"
                      checked={formData.notifications.email}
                      onChange={() => handleNotificationChange("email")}
                    />
                    <CustomCheckbox
                      label="SMS Notifications"
                      checked={formData.notifications.sms}
                      onChange={() => handleNotificationChange("sms")}
                    />
                    <CustomCheckbox
                      label="Phone Notifications"
                      checked={formData.notifications.phone}
                      onChange={() => handleNotificationChange("phone")}
                    />

                    <Text style={styles.sectionTitle}>Content Preferences</Text>
                    <CustomCheckbox
                      label="Weekly Service Digest"
                      checked={formData.preferences.weeklyDigest}
                      onChange={() => handlePreferenceChange("weeklyDigest")}
                    />
                    <CustomCheckbox
                      label="Monthly Special Offers"
                      checked={formData.preferences.monthlyOffers}
                      onChange={() => handlePreferenceChange("monthlyOffers")}
                    />
                    <CustomCheckbox
                      label="Service Reminders"
                      checked={formData.preferences.reminders}
                      onChange={() => handlePreferenceChange("reminders")}
                    />

                    <TouchableOpacity 
                      style={styles.submitButton} 
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text style={styles.submitButtonText}>Subscribe to Newsletter</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardContainer}>
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>What You'll Receive</Text>
                    <View style={styles.listContainer}>
                      <Text style={styles.listItem}>• Exclusive service discounts up to 30% off</Text>
                      <Text style={styles.listItem}>• Early access to seasonal maintenance campaigns</Text>
                      <Text style={styles.listItem}>• Expert maintenance tips and vehicle care advice</Text>
                      <Text style={styles.listItem}>• Priority booking for service appointments</Text>
                    </View>
                  </View>
                </View>
                
                <View style={{ height: 50 }} />
            </ScrollView>
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
  },
  scrollViewFlex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND_COLOR,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: CARD_BG,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  menuButton: {
    padding: 5,
  },
  desktopSidebar: {
    width: 250,
    backgroundColor: CARD_BG,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
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
  mainContentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  userInfoContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  chip: {
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderColor: PRIMARY_COLOR,
    borderWidth: 1,
    backgroundColor: CARD_BG, 
  },
  chipText: {
    color: PRIMARY_COLOR,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28, 
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: SUBTLE_TEXT_COLOR,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 700,
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  formCard: {
    width: '100%', 
    maxWidth: 500, 
    padding: 25,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    fontSize: 22, 
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 5,
  },
  cardSubtitle: {
    color: SUBTLE_TEXT_COLOR,
    marginBottom: 20,
    fontSize: 14,
  },
  input: {
    height: 50,
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 15,
    marginBottom: 20,
    color: TEXT_COLOR,
    fontSize: 16,
  },
  readOnlyInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', 
  },
  sectionTitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginTop: 15,
    marginBottom: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    color: TEXT_COLOR,
    marginLeft: 10,
    fontSize: 16,
  },
  submitButton: {
    height: 50,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingLeft: 10,
  },
  listItem: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    marginBottom: 5,
  },
});

export default Newsletter;