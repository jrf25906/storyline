import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileStackScreenProps } from '@types/navigation';
import { useTheme } from '@context/ThemeContext';
import { useAuthStore } from '@stores/authStore';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import Card from '@components/common/Card';
import { createStyles } from '@screens/profile/ProfileScreen.styles';
import { 
  H1,
  H2,
  Body,
  BodySM,
  Caption
} from '@components/common/Typography';

type ProfileScreenProps = ProfileStackScreenProps<'ProfileOverview'>;

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuthStore();

  const menuItems = [
    {
      icon: 'settings' as const,
      title: 'Settings',
      subtitle: 'App preferences and account',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: 'mood' as const,
      title: 'Wellness',
      subtitle: 'Track your mood and wellbeing',
      onPress: () => navigation.navigate('Wellness'),
    },
    {
      icon: 'info' as const,
      title: 'About',
      subtitle: 'App information and support',
      onPress: () => navigation.navigate('About'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <H1 style={styles.title}>Profile</H1>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <MaterialIcons 
                name="person" 
                size={40} 
                color={theme.colors.textSecondary} 
              />
            </View>
            <View style={styles.userInfo}>
              <Body style={styles.userName}>
                {user?.name || 'User'}
              </Body>
              <BodySM style={styles.userEmail}>
                {user?.email || 'No email set'}
              </BodySM>
            </View>
          </View>
        </Card>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
            >
              <View style={styles.menuIcon}>
                <MaterialIcons 
                  name={item.icon} 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </View>
              <View style={styles.menuContent}>
                <Body style={styles.menuTitle}>
                  {item.title}
                </Body>
                <BodySM style={styles.menuSubtitle}>
                  {item.subtitle}
                </BodySM>
              </View>
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default withErrorBoundary(ProfileScreen);