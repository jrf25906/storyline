import React from 'react';
import { View, ScrollView, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileStackScreenProps } from '@types/navigation';
import { useTheme } from '@context/ThemeContext';
import { withErrorBoundary } from '@components/common/withErrorBoundary';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import { Theme } from '@theme/types';
import { 
  H1,
  H2,
  H3,
  Body,
  BodySM,
  Caption
} from '@components/common/Typography';

type AboutScreenProps = ProfileStackScreenProps<'About'>;

const AboutScreen = ({ navigation }: AboutScreenProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const handleSupport = () => {
    Linking.openURL('mailto:support@nextchapterapp.com');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://nextchapterapp.com/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://nextchapterapp.com/terms');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <View style={styles.logoContainer}>
            <MaterialIcons 
              name="work-outline" 
              size={64} 
              color={theme.colors.primary} 
            />
          </View>
          
          <H2 style={styles.appName}>
            Next Chapter
          </H2>
          
          <Caption style={styles.version}>
            Version 1.0.0
          </Caption>
          
          <Body style={styles.description}>
            Your companion for navigating career transitions with confidence and clarity.
          </Body>
        </Card>

        <Card style={styles.card}>
          <H3 style={styles.sectionTitle}>
            Our Mission
          </H3>
          <Body style={styles.missionText}>
            We believe everyone deserves support during career transitions. Next Chapter 
            provides structured guidance, emotional support, and practical tools to help 
            you land your next role within 90 days.
          </Body>
        </Card>

        <View style={styles.buttonGroup}>
          <Button
            title="Contact Support"
            onPress={handleSupport}
            variant="outline"
            icon={<MaterialIcons name="email" size={20} color={theme.colors.primary} />}
            style={styles.button}
          />
          
          <Button
            title="Privacy Policy"
            onPress={handlePrivacy}
            variant="outline"
            icon={<MaterialIcons name="lock" size={20} color={theme.colors.primary} />}
            style={styles.button}
          />
          
          <Button
            title="Terms of Service"
            onPress={handleTerms}
            variant="outline"
            icon={<MaterialIcons name="description" size={20} color={theme.colors.primary} />}
            style={styles.button}
          />
        </View>

        <Caption style={styles.copyright}>
          © 2025 Next Chapter. All rights reserved.
        </Caption>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    card: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    appName: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizes.h2,
      fontWeight: theme.typography.fontWeights.bold,
      marginBottom: theme.spacing.xs,
    },
    version: {
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
    },
    description: {
      color: theme.colors.textPrimary,
      textAlign: 'center',
      lineHeight: 24,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizes.h3,
      fontWeight: theme.typography.fontWeights.semibold,
      marginBottom: theme.spacing.md,
      alignSelf: 'flex-start',
    },
    missionText: {
      color: theme.colors.textPrimary,
      lineHeight: 24,
    },
    buttonGroup: {
      gap: theme.spacing.sm,
    },
    button: {
      marginBottom: theme.spacing.sm,
    },
    copyright: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.lg,
    },
  });

export default withErrorBoundary(AboutScreen);