import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Animated,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Award,
  Activity,
  Lock,
  Fingerprint,
  Pencil,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/auth-store';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout, biometricEnabled, setBiometricEnabled, isAdmin } =
    useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSaveName = () => {
    // TODO: persist name update to Supabase profiles table
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(user?.name || '');
    setIsEditingName(false);
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          icon: Settings,
          label: 'Account Settings',
          onPress: () => {},
          showArrow: true,
        },
        {
          icon: Bell,
          label: 'Notifications',
          onPress: () => {},
          toggle: true,
          toggleValue: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Lock,
          label: 'Change Password',
          onPress: () => {},
          showArrow: true,
        },
        {
          icon: Fingerprint,
          label: 'Biometric Login',
          onPress: () => {},
          toggle: true,
          toggleValue: biometricEnabled,
          onToggle: setBiometricEnabled,
        },
        {
          icon: Shield,
          label: 'Privacy Settings',
          onPress: () => {},
          showArrow: true,
        },
      ],
    },
    {
      title: 'App',
      items: [
        {
          icon: Activity,
          label: 'Location Services',
          onPress: () => {},
          toggle: true,
          toggleValue: locationEnabled,
          onToggle: setLocationEnabled,
        },
        {
          icon: HelpCircle,
          label: 'Help & Support',
          onPress: () => {},
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.header}
      >
        <Animated.View
          style={[
            styles.headerContent,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#fff" />
            </View>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Award size={12} color="#fff" />
              </View>
            )}
          </View>

          {isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                selectTextOnFocus
              />
              <TouchableOpacity
                onPress={handleSaveName}
                style={styles.editActionBtn}
              >
                <Check size={18} color="#4ade80" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={styles.editActionBtn}
              >
                <X size={18} color="#f87171" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={styles.editNameBtn}
              >
                <Pencil size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.userEmail}>{user?.email}</Text>
          {isAdmin && (
            <View style={styles.adminTag}>
              <Text style={styles.adminTagText}>Administrator</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Menu Sections */}
      <View style={styles.menuContainer}>
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    index < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={item.toggle ? 1 : 0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <item.icon size={18} color="#e94560" />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.toggleValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#374151', true: '#e94560' }}
                      thumbColor={item.toggleValue ? '#fff' : '#9ca3af'}
                    />
                  ) : (
                    item.showArrow && (
                      <ChevronRight size={16} color="#6b7280" />
                    )
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={20} color="#e94560" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Wildfire Suite v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(233,69,96,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e94560',
  },
  adminBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e94560',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  editNameBtn: {
    padding: 4,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e94560',
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 120,
  },
  editActionBtn: {
    padding: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  adminTag: {
    marginTop: 8,
    backgroundColor: 'rgba(233,69,96,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(233,69,96,0.4)',
  },
  adminTagText: {
    fontSize: 12,
    color: '#e94560',
    fontWeight: '600',
  },
  menuContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(233,69,96,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(233,69,96,0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(233,69,96,0.3)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e94560',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#374151',
    marginTop: 24,
    marginBottom: 8,
  },
});
