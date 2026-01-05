import React, { useState, useEffect, useCallback, useRef } from 'react';
import {router} from "expo-router"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Animated,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; 
import type { NativeStackScreenProps } from '@react-navigation/native-stack';


interface Vehicle {
  id: string;
  brand: string;
  model: string;
  vehicle_type: string;
  year: number;
  license_plate: string;
  vin: string;
  fuel_type: string;
  kilometers: number;
  crm_number: string;
}

/**
structure of a Campaign object returned from the API.
 */
interface Campaign {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | string;
  discount: string;
  validUntil: string; // Date string
  bookedByUser: boolean; // Added locally after fetching
}


// --- CONSTANTS & PLACEHOLDERS ---

const PRIMARY_COLOR = '#00bcd4';
const BACKGROUND_COLOR = '#000';
const CARD_BG = 'rgba(255,255,255,0.05)';
const BORDER_COLOR = 'rgba(255,255,255,0.1)';
const TEXT_COLOR = 'white';
const SUBTLE_TEXT_COLOR = 'rgba(255,255,255,0.7)';
const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.7; 


const BASE_URL = "http://192.168.55.73:3007"; // or tunnel URL

// Placeholder component for BrandLogo
const BrandLogo: React.FC<{ brand: string, size: 'lg' | 'sm', showName: boolean }> = ({ brand, size }) => (
  <View style={styles.brandLogoContainer}>
    <Ionicons name="car-sport" size={size === 'lg' ? 30 : 20} color={PRIMARY_COLOR} />
 
  </View>
);

// Custom "Chip" equivalent for RN
const CustomChip: React.FC<{ label: string, color: string }> = ({ label, color }) => (
  <View style={[styles.chip, { backgroundColor: color }]}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);


// --- DASHBOARD COMPONENT ---
const Dashboard: React.FC = () => {
  
  // Helper to convert web paths to RN navigation calls
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


  const [mobileOpen, setMobileOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const drawerAnim = useRef(new Animated.Value(screenWidth)).current;

  // --- DRAWER LOGIC ---
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


  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const email = await AsyncStorage.getItem('userEmail');
        const name = await AsyncStorage.getItem('userName');
        setUserToken(token);
        setUserEmail(email);
        setUserName(name);

        if (!token) {
          console.error("User not authenticated, redirecting.");
          navigate("/signin");
        }
      } catch (e) {
        console.error("Failed to load user data:", e);
      }
    };
    loadUserData();
  }, [navigate]);

  // Calculate upcoming bookings
  const getClosestDateCount = useCallback((): number => {
    if (!activeCampaigns.length) return 0;

    const dates = activeCampaigns
      .map(c => new Date(c.validUntil))
      .filter(d => !isNaN(d.getTime()) && d.getTime() > Date.now()); 

    if (!dates.length) return 0;

    const closestDate = new Date(Math.min(...dates.map(d => d.getTime())));

    const count = dates.filter(d => d.getTime() === closestDate.getTime()).length;
    return count;
  }, [activeCampaigns]);

  const stats = [
    { title: "Total Vehicles", value: vehicles.length },
    { title: "Upcoming Bookings", value: getClosestDateCount() },
    { title: "Active Campaigns", value: activeCampaigns.length },
  ];


  // Fetch vehicles (SECURED)
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!userToken) return;

      try {
        const res = await fetch(`${BASE_URL}/api/vehicles`, {
          headers: {
            "Authorization": `Bearer ${userToken}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          console.error("Authentication failed. Token invalid.");
          await AsyncStorage.multiRemove(["token", "userEmail", "userName"]);
          navigate("/signin");
          return;
        }

        const data: any = await res.json();
        // Handle API response variations
        const fetchedVehicles: Vehicle[] = (Array.isArray(data) ? data : data.vehicles) || []; 
        setVehicles(fetchedVehicles);

      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setVehicles([]);
      }
    };
    fetchVehicles();
  }, [userToken, navigate]);

  // Fetch campaigns (SECURED)
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!userEmail || !userToken) return;

      try {
        const res = await fetch(`${BASE_URL}/api/campaigns?email=${userEmail}`, {
          headers: {
            "Authorization": `Bearer ${userToken}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          console.error("Authentication failed for campaigns.");
          return;
        }

        const data: Campaign[] = await res.json();
   
        const mapped = data.map((c: any) => ({ ...c, bookedByUser: !!c.bookedByUser })) as Campaign[]; 
        setActiveCampaigns(mapped.filter((c) => c.bookedByUser));
        setAllCampaigns(mapped.filter((c) => !c.bookedByUser));
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      }
    };
    fetchCampaigns();
  }, [userEmail, userToken]);

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  const cancelCampaign = async (campaign: Campaign) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`${BASE_URL}/api/campaigns/${campaign.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const result = await res.json();
      if (!res.ok) return Alert.alert("Cancellation Error", result.message);
      
      setActiveCampaigns((prev) => prev.filter((c) => c.id !== campaign.id));
      setAllCampaigns((prev) => [...prev, { ...campaign, bookedByUser: false }]);
      Alert.alert("Success", "Campaign cancelled successfully.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to cancel campaign.");
    }
  };

  // Sidebar items
  const sidebarItems = [
    { text: "Home", icon: "home", path: "/" },
    { text: "Dashboard", icon: "dashboard", path: "/dashboard" },
    { text: "Campaigns", icon: "campaign", path: "/campaigns" },
    { text: "Newsletter", icon: "email", path: "/newsletter" },
    { text: "Notifications", icon: "notifications", path: "/notifications" },
    { text: "Booking", icon: "calendar-month", path: "/bookings" },
    { text: "Sign Out", icon: "exit-to-app", path: "/signin" },
  ];
const CustomChip: React.FC<{ label: string, color: string, style?: any }> = ({ label, color, style }) => (
  <View style={[styles.chip, { backgroundColor: color }, style]}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

  // Drawer Content
  const DrawerContent = (
    <View style={styles.drawerContainer}>
      <Text style={styles.drawerTitle}>AutoCRM</Text>
      <View style={styles.divider} />
      <View>
        {sidebarItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.drawerItem}
            onPress={() => {
              navigate(item.path);
              closeDrawer();
            }}
          >

            <MaterialIcons name={item.icon as any} size={24} color="#ccc" />
            <Text style={styles.drawerItemText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );


  return (
    <View style={styles.appContainer}>

      
<SafeAreaView style={styles.mainWrapper}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <MaterialIcons name="menu" size={30} color={TEXT_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.userInfoContainer}>
       
        </View>

          <View style={styles.userInfoContainer}>
                  <CustomChip 
                    label={userEmail || 'Loading...'} 
                    color={CARD_BG} 
                    style={{ borderColor: PRIMARY_COLOR, borderWidth: 1 }} 
                  />
                </View>

        <Text style={styles.subTitle}>
          Manage your vehicles and track maintenance schedules
        </Text>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* My Vehicles Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigate("/addVehicle")}
          >
            <MaterialIcons name="add-circle-outline" size={20} color={TEXT_COLOR} />
            <Text style={styles.addButtonText}>Add Vehicle</Text>
          </TouchableOpacity>

          <View style={styles.vehicleList}>
            {vehicles.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.subtleText}>No vehicles registered yet.</Text>
              </View>
            ) : (
              vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleHeader}>
                    <BrandLogo brand={vehicle.brand} size="lg" showName={false} />
                    <View style={styles.vehicleHeaderText}>
                      <Text style={styles.vehicleName} numberOfLines={1}>
                        {vehicle.brand || "---"} {vehicle.model || "---"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View>
                    <Text style={styles.subtleText}>
                      {vehicle.vehicle_type || "---"} • {vehicle.year || "---"} • {vehicle.license_plate || "---"}
                    </Text>
                    <Text style={styles.subtleText}>VIN: {vehicle.vin || "---"}</Text>
                    <Text style={styles.subtleText}>Fuel: {vehicle.fuel_type || "---"}</Text>
                    <Text style={styles.subtleText}>Kilometers: {vehicle.kilometers?.toLocaleString() || 0} km</Text>
                    <Text style={styles.subtleText}>CRM Number: {vehicle.crm_number || "---"}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    <Text style={styles.detailsButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Bookings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <View style={styles.campaignsList}>
            {activeCampaigns.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.campaignCard}
                onPress={() => navigate("/campaigns")}
              >
                <View style={styles.campaignHeader}>
                  <Text style={styles.campaignTitle} numberOfLines={1}>{c.title}</Text>
                  <CustomChip label={c.priority} color={getPriorityColor(c.priority)} />
                </View>
                <Text style={styles.campaignDescription} numberOfLines={2}>{c.description}</Text>
                {c.discount && <Text style={styles.campaignDiscount}>{c.discount}</Text>}
                <Text style={styles.subtleText}>Valid until: {c.validUntil}</Text>
                <TouchableOpacity 
                    style={styles.cancelButton}
                    // Prevent propagation to the parent TouchableOpacity (the card)
                    onPress={(e) => { e.stopPropagation(); cancelCampaign(c); }} 
                >
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
      </SafeAreaView>

      {/* Custom Animated Drawer */}
      {mobileOpen && (
        <Animated.View style={[styles.mobileDrawer, { transform: [{ translateX: drawerAnim }] }]}>
          {DrawerContent}
          {/* Close button outside the content for better UX */}
          <TouchableOpacity style={styles.drawerCloseButton} onPress={closeDrawer}>
            <MaterialIcons name="close" size={30} color={TEXT_COLOR} />
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Drawer Overlay */}
      {mobileOpen && (
        <TouchableOpacity 
          style={styles.drawerOverlay} 
          onPress={closeDrawer} 
        />
      )}
    </View>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
    mainWrapper: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 20, 
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  menuButton: {
    padding: 5,
  },
  mainContent: {
    padding: 20,
  },
  userInfoContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  subTitle: {
    color: SUBTLE_TEXT_COLOR,
    marginBottom: 20,
    fontSize: 16,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCard: {
    width: '30%', 
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginTop: 5,
  },

  // Sections
  sectionContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 10,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: TEXT_COLOR,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Vehicles
  vehicleList: {
    flexDirection: 'column', 
  },
  vehicleCard: {
    width: '100%', 
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15, 
  },
  emptyCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  vehicleHeaderText: {
    marginLeft: 10,
    flexShrink: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  detailsButton: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: TEXT_COLOR,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: TEXT_COLOR,
    fontWeight: '600',
  },
  
  // Campaigns/Bookings
  campaignsList: {
    flexDirection: 'column',
  },
  campaignCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    flexShrink: 1,
    marginRight: 10,
  },
  campaignDescription: {
    color: SUBTLE_TEXT_COLOR,
    marginBottom: 5,
  },
  campaignDiscount: {
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 5,
  },
  cancelButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'darkred',
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: TEXT_COLOR,
    fontWeight: '600',
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

  // Common styles
  divider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 10,
  },
  subtleText: {
    color: SUBTLE_TEXT_COLOR,
    fontSize: 14,
    marginBottom: 2,
  },

  // Drawer Styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  mobileDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 1000,
    paddingTop: Platform.OS === 'android' ? 40 : 20, 
  },
  drawerContainer: {
    flex: 1,
    padding: 20,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 10,
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
  drawerCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 20,
    left: 10,
    padding: 5,
  },
  brandLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Dashboard;