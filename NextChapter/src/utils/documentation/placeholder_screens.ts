// src/components/common/PlaceholderScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';

interface PlaceholderScreenProps {
  title: string;
  description?: string;
  features?: string[];
  onActionPress?: () => void;
  actionTitle?: string;
}

export default function PlaceholderScreen({
  title,
  description,
  features = [],
  onActionPress,
  actionTitle = 'Coming Soon',
}: PlaceholderScreenProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: theme.typography.sizes.h2,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    description: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.body,
    },
    featuresContainer: {
      width: '100%',
      maxWidth: 300,
      marginBottom: theme.spacing.xl,
    },
    featureItem: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
    },
    featuresBullet: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.bold,
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{title}</Text>
      
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {features.length > 0 && (
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>
              <Text style={styles.featuresBullet}>• </Text>
              {feature}
            </Text>
          ))}
        </View>
      )}

      {onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="large"
        />
      )}
    </ScrollView>
  );
}

// src/screens/main/HomeScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Dashboard"
      description="Your personal command center for getting back on track after a layoff"
      features={[
        'Current Bounce Plan task',
        'Progress overview',
        'Quick actions',
        'Upcoming deadlines',
        'Mood and budget snapshot',
      ]}
      onActionPress={() => console.log('Dashboard action pressed')}
      actionTitle="Get Started"
    />
  );
}

// src/screens/main/BouncePlanScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function BouncePlanScreen() {
  return (
    <PlaceholderScreen
      title="Bounce Plan"
      description="Your structured 30-day plan to get back on your feet with daily 10-minute tasks"
      features={[
        'Daily task delivery',
        'Progress tracking',
        'Task completion streaks',
        'Skip/snooze options',
        'Personalized timeline',
      ]}
      onActionPress={() => console.log('Bounce Plan action pressed')}
      actionTitle="View Today's Task"
    />
  );
}

// src/screens/main/CoachScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function CoachScreen() {
  return (
    <PlaceholderScreen
      title="AI Coach"
      description="Get personalized career advice and emotional support with adaptive tone"
      features={[
        'Instant career guidance',
        'Multi-tone responses (Hype, Pragmatist, Tough-Love)',
        'Resume and email help',
        'Confidence boosting',
        '10 free messages per day',
      ]}
      onActionPress={() => console.log('Coach action pressed')}
      actionTitle="Start Chatting"
    />
  );
}

// src/screens/main/TrackerScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function TrackerScreen() {
  return (
    <PlaceholderScreen
      title="Job Tracker"
      description="Organize and track your job applications with a simple Kanban board interface"
      features={[
        'Drag & drop job stages',
        'Application notes',
        'Interview scheduling',
        'Follow-up reminders',
        'Success metrics',
      ]}
      onActionPress={() => console.log('Tracker action pressed')}
      actionTitle="Add First Job"
    />
  );
}

// src/screens/main/BudgetScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function BudgetScreen() {
  return (
    <PlaceholderScreen
      title="Budget Snapshot"
      description="Calculate your financial runway and track expenses during your job search"
      features={[
        'Runway calculator',
        'Income and expense tracking',
        'Severance integration',
        'Unemployment benefits estimator',
        'Survival budget mode',
      ]}
      onActionPress={() => console.log('Budget action pressed')}
      actionTitle="Calculate Runway"
    />
  );
}

// src/screens/main/WellnessScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function WellnessScreen() {
  return (
    <PlaceholderScreen
      title="Wellness"
      description="Track your mood and access mental health resources during this challenging time"
      features={[
        'Daily mood logging',
        '2-minute breathing exercises',
        'Sleep hygiene tips',
        'Crisis support resources',
        'Progress visualization',
      ]}
      onActionPress={() => console.log('Wellness action pressed')}
      actionTitle="Log Today's Mood"
    />
  );
}

// src/screens/main/SettingsScreen.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export default function SettingsScreen() {
  const { theme, themeType, setThemeType, isHighContrast, setIsHighContrast } = useTheme();
  const { signOut } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    button: {
      marginBottom: theme.spacing.md,
    },
  });

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(themeType);
    const nextIndex = (currentIndex + 1) % themes.length;
    setThemeType(themes[nextIndex]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Button
          title={`Theme: ${themeType}`}
          onPress={toggleTheme}
          variant="outline"
          style={styles.button}
        />
        
        <Button
          title={`High Contrast: ${isHighContrast ? 'On' : 'Off'}`}
          onPress={() => setIsHighContrast(!isHighContrast)}
          variant="outline"
          style={styles.button}
        />
      </View>

      <View style={styles.section}>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { validateEmail } from '../../utils/helpers';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      justifyContent: 'center',
    },
    title: {
      fontSize: theme.typography.sizes.h1,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    subtitle: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    form: {
      marginBottom: theme.spacing.xl,
    },
  });

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue your journey</Text>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          testID="login-email-input"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          error={errors.password}
          testID="login-password-input"
        />
      </View>

      <Button
        title="Sign In"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
        size="large"
        testID="login-submit-button"
      />
    </ScrollView>
  );
}

// src/screens/auth/SignupScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { validateEmail } from '../../utils/helpers';

export default function SignupScreen() {
  const { theme } = useTheme();
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: theme.spacing.lg,
      justifyContent: 'center',
    },
    title: {
      fontSize: theme.typography.sizes.h1,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    subtitle: {
      fontSize: theme.typography.sizes.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    form: {
      marginBottom: theme.spacing.xl,
    },
  });

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      await signUp(email, password);
      Alert.alert('Success', 'Account created! Please check your email to verify your account.');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Get Started</Text>
      <Text style={styles.subtitle}>Create your account to begin your bounce back</Text>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          testID="signup-email-input"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          secureTextEntry
          error={errors.password}
          testID="signup-password-input"
        />

        <Input
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          secureTextEntry
          error={errors.confirmPassword}
          testID="signup-confirm-password-input"
        />
      </View>

      <Button
        title="Create Account"
        onPress={handleSignup}
        loading={isLoading}
        disabled={isLoading}
        size="large"
        testID="signup-submit-button"
      />
    </ScrollView>
  );
}

// src/screens/onboarding/WelcomeScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function WelcomeScreen() {
  return (
    <PlaceholderScreen
      title="Welcome to Next Chapter"
      description="We're here to help you bounce back from your layoff with a structured plan, AI coaching, and practical tools."
      features={[
        '30-day structured Bounce Plan',
        'AI career coach with adaptive tone',
        'Job application tracker',
        'Budget and runway calculator',
        'Mental wellness support',
      ]}
      onActionPress={() => console.log('Welcome action pressed')}
      actionTitle="Let's Get Started"
    />
  );
}

// src/screens/onboarding/LayoffDetailsScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function LayoffDetailsScreen() {
  return (
    <PlaceholderScreen
      title="Tell Us About Your Situation"
      description="Help us personalize your experience by sharing some details about your layoff."
      features={[
        'Layoff date for timeline calculation',
        'Previous role information',
        'Location for benefits info',
        'Personalized deadline tracking',
      ]}
      onActionPress={() => console.log('Layoff details action pressed')}
      actionTitle="Continue Setup"
    />
  );
}

// src/screens/onboarding/GoalsScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function GoalsScreen() {
  return (
    <PlaceholderScreen
      title="What's Your Goal?"
      description="Let us know what you're looking to achieve so we can tailor your Bounce Plan."
      features={[
        'Find similar role',
        'Switch industries',
        'Get promoted to senior level',
        'Start freelancing',
        'Take a career break',
        'Start own business',
      ]}
      onActionPress={() => console.log('Goals action pressed')}
      actionTitle="Set My Goal"
    />
  );
}

// src/screens/onboarding/SetupCompleteScreen.tsx
import React from 'react';
import PlaceholderScreen from '../../components/common/PlaceholderScreen';

export default function SetupCompleteScreen() {
  return (
    <PlaceholderScreen
      title="You're All Set!"
      description="Your personalized Bounce Plan is ready. Let's start your journey to getting back on track."
      features={[
        'Daily tasks customized for you',
        'Benefits deadlines calculated',
        'AI coach ready to help',
        'Progress tracking enabled',
      ]}
      onActionPress={() => console.log('Setup complete action pressed')}
      actionTitle="Start My Bounce Plan"
    />
  );
}