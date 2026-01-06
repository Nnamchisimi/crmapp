import React, { useState, useEffect, useCallback, useRef } from 'react';
import { router } from "expo-router";
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

interface Campaign {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | string;
  brand: string;
  model: string;
  year: number;
  discount: string | null;
  validUntil: string;
  bookedByUser: boolean;
}

type RootStackParamList = {
  signin: undefined;
  dashboard: undefined;
  campaigns: undefined;
  newsletter: undefined;
  notifications: undefined;
  booking: undefined;
};

type CampaignsProps = NativeStackScreenProps<RootStackParamList, 'campaigns'>;

const PRIMARY_COLOR = '#00bcd4';
const BACKGROUND_COLOR = '#000';
const CARD_BG = 'rgba(255,255,255,0.05)';
const BORDER_COLOR = 'rgba(255,255,255,0.1)';
const TEXT_COLOR = 'white';
const SUBTLE_TEXT_COLOR = 'rgba(255,255,255,0.7)';
const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.7;

const BASE_URL = "http://192.168.55.73:3007";

const CustomChip: React.FC<{ label: string, color: string, style?: any }> = ({ label, color, style }) => (
  <View style={[styles.chip, { backgroundColor: color }, style]}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

const CampaignsPage: React.FC<CampaignsProps> = ({ navigation }) => {

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
        pathname: "/vehicles/[id]",
        params: { id },
      });
    }
    if (path === '/dashboard') return router.push('/dashboard');
    if (path === '/') return router.push('/dashboard');

    console.warn(`Navigation path not handled: ${path}`);
  }, []);

  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        setUserEmail(email);
      } catch (e) {
        console.error("Failed to load user email:", e);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!userEmail) return;

      try {
        const res = await fetch(`${BASE_URL}/api/campaigns?email=${userEmail}`);

        if (!res.ok) {
          console.error(`API Error: ${res.status}`);
          return;
        }

        const data: any[] = await res.json();

        const mapped: Campaign[] = data.map(c => ({
          id: c.id,
          title: c.campaign_title || c.title,
          description: c.description,
          type: c.maintenance_type || 'General',
          priority: c.priority,
          brand: c.brand_filter || 'All',
          model: c.model_filter || 'All',
          year: c.year_filter || 0,
          discount: c.discount_percent ? `${c.discount_percent}% OFF` : null,
          validUntil: c.validUntil,
          bookedByUser: !!c.bookedByUser,
        }));

        setActiveCampaigns(mapped.filter(c => c.bookedByUser));
        setAllCampaigns(mapped.filter(c => !c.bookedByUser));
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        Alert.alert("Error", "Failed to connect to the campaign service.");
      }
    };

    fetchCampaigns();
  }, [userEmail]);

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high": return "#e53935";
      case "medium": return "#fb8c00";
      case "low": return "#4caf50";
      default: return "#9e9e9e";
    }
  };

  const bookCampaign = async (campaign: Campaign) => {
    if (!userEmail) return Alert.alert("Error", "User not logged in.");
    try {
      const res = await fetch(`${BASE_URL}/api/campaigns/${campaign.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await res.json();

      if (!res.ok) {
        return Alert.alert("Booking Error", result.message || "Failed to book campaign");
      }

      setAllCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      setActiveCampaigns(prev => [
        ...prev,
        { ...campaign, bookedByUser: true }
      ]);
      Alert.alert("Success", "Appointment booked successfully!");

    } catch (err) {
      console.error("Failed to book campaign:", err);
      Alert.alert("Error", "Failed to connect to the booking service.");
    }
  };

  const cancelCampaign = async (campaign: Campaign) => {
    if (!userEmail) return Alert.alert("Error", "User not logged in.");
    try {
      const res = await fetch(`${BASE_URL}/api/campaigns/${campaign.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await res.json();

      if (!res.ok) return Alert.alert("Cancellation Error", result.message);

      setActiveCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      setAllCampaigns(prev => [...prev, { ...campaign, bookedByUser: false }]);
      Alert.alert("Success", "Appointment cancelled successfully.");

    } catch (err) {
      console.error("Failed to cancel campaign:", err);
      Alert.alert("Error", "Failed to cancel campaign.");
    }
  };

  const sidebarItems = [
    { text: "Home", icon: "home", path: "/" },
    { text: "Dashboard", icon: "dashboard", path: "/dashboard" },
    { text: "Campaigns", icon: "campaign", path: "/campaigns" },
    { text: "Newsletter", icon: "email", path: "/newsletter" },
    { text: "Notifications", icon: "notifications", path: "/notifications" },
    { text: "Booking", icon: "calendar-month", path: "/booking" },
    { text: "Sign Out", icon: "exit-to-app", path: "/signin" },
  ];

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
          <Text style={styles.headerTitle}>Service Campaigns</Text>
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
            <MaterialIcons name="menu" size={30} color={TEXT_COLOR} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.mainContent}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigate("/dashboard")}>
            <MaterialIcons name="arrow-back" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.backButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.userInfoContainer}>
            <CustomChip
              label={userEmail || 'Loading...'}
              color={CARD_BG}
              style={{ borderColor: PRIMARY_COLOR, borderWidth: 1 }}
            />
          </View>

          <Text style={styles.pageTitle}>Service Campaigns</Text>
          <Text style={styles.subTitle}>Active campaigns and all available campaigns for your vehicles</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Your Active Campaigns</Text>
          <View style={styles.campaignsGrid}>
            {activeCampaigns.length === 0 && <Text style={styles.emptyText}>No active campaigns currently.</Text>}
            {activeCampaigns.map(c => (
              <View key={c.id} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <Text style={styles.campaignTitle} numberOfLines={1}>{c.title}</Text>
                  <CustomChip label={c.priority} color={getPriorityColor(c.priority)} style={{ color: 'white' }} />
                </View>
                <Text style={styles.campaignDescription} numberOfLines={2}>{c.description}</Text>
                {c.discount && <Text style={styles.campaignDiscount}>{c.discount}</Text>}
                <Text style={styles.subtleText}>Valid until: {c.validUntil}</Text>

                <TouchableOpacity style={styles.cancelButton} onPress={() => cancelCampaign(c)}>
                  <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { marginVertical: 30 }]} />

          <Text style={styles.sectionTitle}>All Available Campaigns</Text>
          <View style={styles.campaignsGrid}>
            {allCampaigns.map(c => (
              <View key={c.id} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <Text style={styles.campaignTitle} numberOfLines={1}>{c.title}</Text>
                  <CustomChip label={c.priority} color={getPriorityColor(c.priority)} style={{ color: 'white' }} />
                </View>
                <Text style={styles.campaignDescription} numberOfLines={2}>{c.description}</Text>
                {c.discount && <Text style={styles.campaignDiscount}>{c.discount}</Text>}
                <Text style={styles.subtleText}>
                  Filters: {c.brand} ({c.year})
                </Text>
                <Text style={styles.subtleText}>Valid until: {c.validUntil}</Text>

                <TouchableOpacity style={styles.bookButton} onPress={() => bookCampaign(c)}>
                  <Text style={styles.bookButtonText}>Book Appointment</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {mobileOpen && (
        <Animated.View style={[styles.mobileDrawer, { transform: [{ translateX: drawerAnim }] }]}>
          {DrawerContent}
          <TouchableOpacity style={styles.drawerCloseButton} onPress={closeDrawer}>
            <MaterialIcons name="close" size={30} color={TEXT_COLOR} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {mobileOpen && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          onPress={closeDrawer}
        />
      )}
    </View>
  );
};

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
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
  },
  menuButton: {
    padding: 5,
  },
  mainContent: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButtonText: {
    color: PRIMARY_COLOR,
    marginLeft: 5,
    fontSize: 16,
  },
  userInfoContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 5,
  },
  subTitle: {
    color: SUBTLE_TEXT_COLOR,
    marginBottom: 20,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 15,
  },

  campaignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  campaignCard: {
    width: Platform.OS === 'web' ? '48%' : (screenWidth / 2) - 30,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    minHeight: 180,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    flexShrink: 1,
    marginRight: 8,
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
  subtleText: {
    color: SUBTLE_TEXT_COLOR,
    fontSize: 12,
    marginBottom: 2,
  },
  emptyText: {
    color: SUBTLE_TEXT_COLOR,
    padding: 15,
  },

  cancelButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e53935',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: TEXT_COLOR,
    fontWeight: 'bold',
  },
  bookButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: BACKGROUND_COLOR,
    fontWeight: 'bold',
  },

  chip: {
    borderRadius: 15,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  chipText: {
    color: TEXT_COLOR,
    fontSize: 11,
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginVertical: 10,
  },
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
});

export default CampaignsPage;