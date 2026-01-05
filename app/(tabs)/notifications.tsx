import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Dimensions,
    Platform,
    Animated,
    SafeAreaView
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";

const API_BASE_URL = "http://localhost:3007";
const PRIMARY_COLOR = "#00bcd4";
const BACKGROUND_COLOR = "#000";
const CARD_BG = "rgba(255,255,255,0.05)";
const WHITE_TEXT = "#ffffff";
const SECONDARY_TEXT = "rgba(255,255,255,0.7)";
const UNREAD_BG = "rgba(0,188,212,0.1)";
const BORDER_COLOR = 'rgba(255,255,255,0.1)';
const { width: screenWidth } = Dimensions.get('window');
const DRAWER_WIDTH = screenWidth * 0.7; 

interface Notification {
    id: number;
    title: string;
    message: string;
    type: "Service" | "Campaign" | "Newsletter" | string;
    is_read: boolean;
}

const sidebarItems: { text: string; icon: keyof typeof MaterialIcons.glyphMap; path: string }[] = [
    { text: "Home", icon: "home", path: "/" },
    { text: "Dashboard", icon: "dashboard", path: "/dashboard" },
    { text: "Campaigns", icon: "campaign", path: "/campaigns" },
    { text: "Newsletter", icon: "email", path: "/newsletter" },
    { text: "Notifications", icon: "notifications", path: "/notifications" },
    { text: "Booking", icon: "event", path: "/bookings" },
    { text: "Sign Out", icon: "exit-to-app", path: "/signin" },
];

const CustomChip: React.FC<{ label: string, style?: any }> = ({ label, style }) => (
    <View style={[styles.chip, style]}>
        <Text style={styles.chipText}>{label}</Text>
    </View>
);

const SidebarItem = ({ text, iconName, onPress, isActive }: { text: string; iconName: keyof typeof MaterialIcons.glyphMap; onPress: () => void; isActive: boolean }) => (
    <TouchableOpacity 
        onPress={onPress} 
        style={[styles.drawerItem, isActive && styles.drawerItemActive]}
    >
        <MaterialIcons name={iconName} size={24} color={isActive ? PRIMARY_COLOR : "#ccc"} />
        <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>{text}</Text>
    </TouchableOpacity>
);

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const drawerAnim = useRef(new Animated.Value(screenWidth)).current;

    const isDesktop = Dimensions.get('window').width >= 768; 

    const navigate = useCallback(async (path: string) => {
        if (path === '/signin') {
            try {
                await AsyncStorage.multiRemove(["email", "token"]);
                console.log("User credentials cleared.");
            } catch (e) {
                console.error("Failed to clear AsyncStorage on sign out:", e);
            }
            return router.replace('/signin');
        }
        
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
        if (path === '/') return router.push('/dashboard');
        
        console.warn(`Navigation path not handled: ${path}`);
    }, []);

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

    const fetchNotifications = useCallback(async () => {
        const email = await AsyncStorage.getItem("email"); 
        const token = await AsyncStorage.getItem("token");
        setUserEmail(email);

        if (!email || !token) {
            setLoading(false);
            console.warn("No authentication data found, redirecting to signin.");
            Alert.alert("Authentication Required", "Please sign in to view notifications.", [
                { text: "OK", onPress: () => navigate("/signin") },
            ]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/${email}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            
            if (res.ok) {
                setNotifications(data || []);
            } else if (res.status === 401 || res.status === 403) {
                await AsyncStorage.multiRemove(["email", "token"]);
                Alert.alert("Session Expired", "Please sign in again.", [
                    { text: "OK", onPress: () => navigate("/signin") },
                ]);
            } else {
                console.error("Failed to fetch notifications:", data);
                Alert.alert("Error", "Failed to load notifications.");
                setNotifications([]);
            }
        } catch (err) {
            console.error("Error fetching notifications:", err);
            Alert.alert("Error", "Network error while fetching notifications.");
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const markAsRead = async (id: number) => {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/mark-read/${id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            } else {
                console.error("Failed to mark as read");
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const filteredNotifications = notifications.filter((n) => {
        if (filter === "All") return true;
        if (filter === "Unread") return !n.is_read;
        return n.type === filter;
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const FilterTabs = () => (
        <View style={styles.tabsContainer}>
            <TouchableOpacity 
                style={[styles.tabButton, filter === "All" && styles.tabButtonActive]}
                onPress={() => setFilter("All")}
            >
                <Text style={[styles.tabText, filter === "All" && styles.tabTextActive]}>
                    All ({notifications.length})
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.tabButton, filter === "Unread" && styles.tabButtonActive]}
                onPress={() => setFilter("Unread")}
            >
                <Text style={[styles.tabText, filter === "Unread" && styles.tabTextActive]}>
                    Unread ({unreadCount})
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.tabButton, filter === "Service" && styles.tabButtonActive]}
                onPress={() => setFilter("Service")}
            >
                <Text style={[styles.tabText, filter === "Service" && styles.tabTextActive]}>
                    Service
                </Text>
            </TouchableOpacity>

             <TouchableOpacity 
                style={[styles.tabButton, filter === "Campaign" && styles.tabButtonActive]}
                onPress={() => setFilter("Campaign")}
            >
                <Text style={[styles.tabText, filter === "Campaign" && styles.tabTextActive]}>
                    Campaigns
                </Text>
            </TouchableOpacity>
        </View>
    );

    const NotificationList = () => {
        if (loading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                    <Text style={styles.text}>Loading notifications...</Text>
                </View>
            );
        }

        if (filteredNotifications.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.secondaryText}>
                        No notifications to show for this filter.
                    </Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.listPaper}>
                {filteredNotifications.map((notif) => (
                    <View
                        key={notif.id}
                        style={[
                            styles.listItem,
                            !notif.is_read && styles.listItemUnread,
                        ]}
                    >
                        <View style={styles.listItemContent}>
                            <Text 
                                style={[
                                    styles.listItemTitle, 
                                    !notif.is_read && styles.listItemTitleUnread
                                ]}
                            >
                                [{notif.type}] {notif.title}
                            </Text>
                            <Text style={styles.listItemMessage}>
                                {notif.message}
                            </Text>
                        </View>
                        
                        {!notif.is_read && (
                            <TouchableOpacity
                                onPress={() => markAsRead(notif.id)}
                                style={styles.markReadButton}
                            >
                                <MaterialIcons name="done" size={24} color={PRIMARY_COLOR} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
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
                            isActive={item.path === '/notifications'}
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


    return (
        <View style={styles.appContainer}>
            
            {isDesktop && (
                <View style={styles.desktopSidebar}>
                    {DrawerContent}
                </View>
            )}

            <SafeAreaView style={styles.mainWrapper}>
                 <View style={styles.header}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {!isDesktop ? (
                        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
                            <MaterialIcons name="menu" size={30} color={WHITE_TEXT} />
                        </TouchableOpacity>
                    ) : (
                         <CustomChip 
                            label={userEmail || 'Loading...'} 
                            style={{ borderColor: PRIMARY_COLOR, borderWidth: 1 }} 
                        />
                    )}
                </View>

                <Text style={styles.secondaryHeader}>
                    Stay updated with your vehicle maintenance, service alerts, and newsletters.
                </Text>

                <FilterTabs />
                
                <NotificationList />
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
        paddingTop: 10,
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
        marginBottom: 5,
        paddingHorizontal: Platform.OS === 'web' ? 0 : 5,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: WHITE_TEXT,
    },
    secondaryHeader: {
        color: SECONDARY_TEXT,
        fontSize: 14,
        marginBottom: 20,
        paddingHorizontal: 5,
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
        justifyContent: 'center',
    },
    chipText: {
        color: PRIMARY_COLOR,
        fontSize: 12,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: SECONDARY_TEXT,
        marginBottom: 20,
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    tabButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: PRIMARY_COLOR,
    },
    tabText: {
        color: SECONDARY_TEXT,
        fontSize: 16,
    },
    tabTextActive: {
        color: PRIMARY_COLOR,
        fontWeight: 'bold',
    },
    listPaper: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        maxHeight: '65%',
        padding: 10,
    },
    center: {
        padding: 20,
        alignItems: 'center',
    },
    text: {
        color: SECONDARY_TEXT,
        fontSize: 16,
        marginTop: 10,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    secondaryText: {
        color: SECONDARY_TEXT,
        fontSize: 16,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 8,
        borderRadius: 8,
        padding: 15,
    },
    listItemUnread: {
        backgroundColor: UNREAD_BG,
    },
    listItemContent: {
        flex: 1,
        marginRight: 10,
    },
    listItemTitle: {
        color: WHITE_TEXT,
        fontSize: 16,
        fontWeight: 'normal',
        marginBottom: 4,
    },
    listItemTitleUnread: {
        fontWeight: 'bold',
    },
    listItemMessage: {
        color: SECONDARY_TEXT,
        fontSize: 14,
    },
    markReadButton: {
        padding: 5,
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
        borderRadius: 5,
    },
     drawerItemActive: {
        backgroundColor: 'rgba(0,188,212,0.1)',
    },
    drawerItemText: {
        color: '#ccc',
        marginLeft: 15,
        fontSize: 16,
    },
    drawerItemTextActive: {
        color: PRIMARY_COLOR,
        fontWeight: 'bold',
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

export default NotificationsPage;