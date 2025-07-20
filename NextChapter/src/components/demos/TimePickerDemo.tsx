import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { 
  TimePicker, 
  TimeValue, 
} from '@components/common';

// Simple demo components
const H2: React.FC<{ style?: any; children: React.ReactNode }> = ({ style, children }) => (
  <Text style={[{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }, style]}>{children}</Text>
);

const H3: React.FC<{ style?: any; children: React.ReactNode }> = ({ style, children }) => (
  <Text style={[{ fontSize: 18, fontWeight: '600', marginBottom: 12 }, style]}>{children}</Text>
);

const Body: React.FC<{ style?: any; children: React.ReactNode }> = ({ style, children }) => (
  <Text style={[{ fontSize: 16, marginBottom: 16, color: '#6C757D' }, style]}>{children}</Text>
);

const Button: React.FC<{ title: string; onPress: () => void; testID?: string }> = ({ title, onPress, testID }) => (
  <TouchableOpacity
    style={styles.button}
    onPress={onPress}
    testID={testID}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>
    {children}
  </View>
);

export const TimePickerDemo: React.FC = () => {
  // State for different demo scenarios
  const [basicTime, setBasicTime] = useState<TimeValue | undefined>();
  const [meetingTime, setMeetingTime] = useState<TimeValue>({ hours: 9, minutes: 0, period: 'AM' });
  const [appointmentTime, setAppointmentTime] = useState<TimeValue | undefined>();
  const [constrainedTime, setConstrainedTime] = useState<TimeValue | undefined>();
  const [time24h, setTime24h] = useState<TimeValue | undefined>();
  const [requiredTime, setRequiredTime] = useState<TimeValue | undefined>();

  // Constraint times for business hours example
  const businessHoursMin: TimeValue = { hours: 9, minutes: 0, period: 'AM' };
  const businessHoursMax: TimeValue = { hours: 5, minutes: 0, period: 'PM' };

  const handleSubmit = () => {
    const formatTimeForDisplay = (time?: TimeValue): string => {
      if (!time) return 'Not set';
      const hours = time.period ? time.hours : time.hours.toString().padStart(2, '0');
      const minutes = time.minutes.toString().padStart(2, '0');
      return time.period ? `${hours}:${minutes} ${time.period}` : `${hours}:${minutes}`;
    };

    Alert.alert(
      'Demo Values',
      `Basic Time: ${formatTimeForDisplay(basicTime)}
Meeting Time: ${formatTimeForDisplay(meetingTime)}
Appointment: ${formatTimeForDisplay(appointmentTime)}
Constrained: ${formatTimeForDisplay(constrainedTime)}
24-hour: ${formatTimeForDisplay(time24h)}
Required: ${formatTimeForDisplay(requiredTime)}`
    );
  };

  const resetDemo = () => {
    setBasicTime(undefined);
    setMeetingTime({ hours: 9, minutes: 0, period: 'AM' });
    setAppointmentTime(undefined);
    setConstrainedTime(undefined);
    setTime24h(undefined);
    setRequiredTime(undefined);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
          <H2>TimePicker Component Demo</H2>
          <Body style={{ textAlign: 'center' }}>
            Comprehensive examples of the TimePicker component with different configurations
          </Body>

          {/* Basic TimePicker */}
          <Card>
            <H3>Basic TimePicker</H3>
            <Body>Default 12-hour format with custom placeholder</Body>
            <TimePicker
              value={basicTime}
              onChange={setBasicTime}
              placeholder="Choose your time"
              testID="basic-time-picker"
            />
          </Card>

          {/* Pre-filled with value */}
          <Card>
            <H3>Pre-filled Meeting Time</H3>
            <Body>Started with 9:00 AM as default value</Body>
            <TimePicker
              value={meetingTime}
              onChange={setMeetingTime}
              label="Meeting starts at"
              hint="Select the meeting start time"
              testID="meeting-time-picker"
            />
          </Card>

          {/* With label and required */}
          <Card>
            <H3>Required Field</H3>
            <Body>Required field with validation</Body>
            <TimePicker
              value={requiredTime}
              onChange={setRequiredTime}
              label="Appointment time"
              required
              hint="This field is required"
              testID="required-time-picker"
            />
          </Card>

          {/* Business Hours Constraint */}
          <Card>
            <H3>Business Hours Only</H3>
            <Body>Constrained to business hours (9 AM - 5 PM)</Body>
            <TimePicker
              value={constrainedTime}
              onChange={setConstrainedTime}
              label="Available appointment slot"
              minTime={businessHoursMin}
              maxTime={businessHoursMax}
              hint="Available between 9 AM and 5 PM"
              testID="constrained-time-picker"
            />
          </Card>

          {/* 24-hour format */}
          <Card>
            <H3>24-Hour Format</H3>
            <Body>Military time format without AM/PM</Body>
            <TimePicker
              value={time24h}
              onChange={setTime24h}
              label="Departure time"
              format="24"
              hint="24-hour format (00:00 - 23:59)"
              testID="24h-time-picker"
            />
          </Card>

          {/* Size variants */}
          <Card>
            <H3>Size Variants</H3>
            <Body>Different sizes for various use cases</Body>
            <View style={{ marginBottom: 16 }}>
              <TimePicker
                value={basicTime}
                onChange={setBasicTime}
                label="Small size"
                size="small"
                testID="small-time-picker"
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <TimePicker
                value={basicTime}
                onChange={setBasicTime}
                label="Medium size (default)"
                size="medium"
                testID="medium-time-picker"
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <TimePicker
                value={basicTime}
                onChange={setBasicTime}
                label="Large size"
                size="large"
                testID="large-time-picker"
              />
            </View>
          </Card>

          {/* Disabled state */}
          <Card>
            <H3>Disabled State</H3>
            <Body>Read-only time picker for display purposes</Body>
            <TimePicker
              value={{ hours: 2, minutes: 30, period: 'PM' }}
              onChange={() => {}}
              label="Event scheduled for"
              disabled
              hint="This time slot is already booked"
              testID="disabled-time-picker"
            />
          </Card>

          {/* Color variants */}
          <Card>
            <H3>Color Variants</H3>
            <Body>Different visual styles for various contexts</Body>
            <View style={{ marginBottom: 16 }}>
              <TimePicker
                value={basicTime}
                onChange={setBasicTime}
                label="Success variant"
                variant="success"
                hint="Time successfully validated"
                testID="success-time-picker"
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <TimePicker
                value={basicTime}
                onChange={setBasicTime}
                label="Warning variant"
                variant="warning"
                hint="Please confirm this time"
                testID="warning-time-picker"
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <TimePicker
                value={basicTime}
                onChange={setBasicTime}
                label="Gentle variant"
                variant="gentle"
                hint="Subtle styling for secondary actions"
                testID="gentle-time-picker"
              />
            </View>
          </Card>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Button
              title="Show All Values"
              onPress={handleSubmit}
              testID="submit-demo-button"
            />
            <Button
              title="Reset Demo"
              onPress={resetDemo}
              testID="reset-demo-button"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#2D5A27',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    marginTop: 16,
  },
});