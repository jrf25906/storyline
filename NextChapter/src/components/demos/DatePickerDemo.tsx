import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { DatePicker, DatePickerProps } from '@components/common';
import { useTheme } from '@theme';
import { Container } from '@components/common/Container';
import { H2, Body, Caption } from '@components/common/Typography';

export const DatePickerDemo: React.FC = () => {
  const theme = useTheme();
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(new Date());
  const [constrainedDate, setConstrainedDate] = useState<Date | undefined>();

  // Date constraints for demo
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 100, 0, 1); // 100 years ago
  const maxDate = new Date(today.getFullYear() + 1, 11, 31); // Next year end
  const futureMinDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

  return (
    <ScrollView style={styles.container}>
      <Container>
        <H2 style={styles.title}>DatePicker Component Demo</H2>
        <Body style={styles.description}>
          The DatePicker component provides a stress-friendly calendar interface with 
          accessibility support, date constraints, and gentle animations.
        </Body>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Basic Usage</H2>
          
          <DatePicker
            label="Birth Date"
            value={birthDate}
            onChange={setBirthDate}
            placeholder="Select your birth date"
            hint="Choose the date you were born"
            maximumDate={today}
          />

          <DatePicker
            label="Employment Start Date"
            value={startDate}
            onChange={setStartDate}
            placeholder="When did you start working?"
            required
            hint="Your first day at your previous job"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Variants</H2>
          
          <DatePicker
            label="Default Variant"
            value={appointmentDate}
            onChange={setAppointmentDate}
            variant="default"
            hint="Standard date picker styling"
          />

          <DatePicker
            label="Success Variant"
            value={appointmentDate}
            onChange={() => {}}
            variant="success"
            hint="Great choice!"
          />

          <DatePicker
            label="Warning Variant"
            value={appointmentDate}
            onChange={() => {}}
            variant="warning"
            hint="Please double-check this date"
          />

          <DatePicker
            label="Gentle Variant"
            value={undefined}
            onChange={() => {}}
            variant="gentle"
            placeholder="Take your time..."
            hint="No pressure to choose right now"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Sizes</H2>
          
          <DatePicker
            label="Small Size"
            value={appointmentDate}
            onChange={setAppointmentDate}
            size="small"
            placeholder="Small date picker"
          />

          <DatePicker
            label="Medium Size (Default)"
            value={appointmentDate}
            onChange={setAppointmentDate}
            size="medium"
            placeholder="Medium date picker"
          />

          <DatePicker
            label="Large Size"
            value={appointmentDate}
            onChange={setAppointmentDate}
            size="large"
            placeholder="Large date picker"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Date Constraints</H2>
          
          <DatePicker
            label="Past Dates Only"
            value={endDate}
            onChange={setEndDate}
            placeholder="Select a past date"
            maximumDate={today}
            hint="Only dates up to today are allowed"
          />

          <DatePicker
            label="Future Dates Only"
            value={constrainedDate}
            onChange={setConstrainedDate}
            placeholder="Select a future date"
            minimumDate={futureMinDate}
            hint="Only dates from tomorrow onwards"
          />

          <DatePicker
            label="Limited Date Range"
            value={constrainedDate}
            onChange={setConstrainedDate}
            placeholder="Select within range"
            minimumDate={minDate}
            maximumDate={maxDate}
            hint="Between 100 years ago and next year"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>States</H2>
          
          <DatePicker
            label="Error State"
            value={undefined}
            onChange={() => {}}
            error="Please select a valid date"
            placeholder="Select a date"
            required
          />

          <DatePicker
            label="Disabled State"
            value={appointmentDate}
            onChange={() => {}}
            disabled
            hint="This field is currently disabled"
          />

          <DatePicker
            label="Custom Accessibility"
            value={appointmentDate}
            onChange={setAppointmentDate}
            accessibilityLabel="Important deadline picker"
            accessibilityHint="Choose a deadline for your project completion"
            hint="This picker has custom accessibility labels"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Locale Support</H2>
          
          <DatePicker
            label="US English (Default)"
            value={appointmentDate}
            onChange={setAppointmentDate}
            locale="en-US"
            hint="Format: MMM DD, YYYY"
          />

          <DatePicker
            label="UK English"
            value={appointmentDate}
            onChange={setAppointmentDate}
            locale="en-GB"
            hint="Format: DD/MM/YYYY"
          />

          <DatePicker
            label="European Format"
            value={appointmentDate}
            onChange={setAppointmentDate}
            locale="de-DE"
            hint="Format: DD.MM.YYYY"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Current Values</H2>
          <Caption>Birth Date: {birthDate ? birthDate.toLocaleDateString() : 'Not selected'}</Caption>
          <Caption>Start Date: {startDate ? startDate.toLocaleDateString() : 'Not selected'}</Caption>
          <Caption>End Date: {endDate ? endDate.toLocaleDateString() : 'Not selected'}</Caption>
          <Caption>Appointment: {appointmentDate ? appointmentDate.toLocaleDateString() : 'Not selected'}</Caption>
          <Caption>Constrained: {constrainedDate ? constrainedDate.toLocaleDateString() : 'Not selected'}</Caption>
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Accessibility Features</H2>
          <Body style={styles.featureText}>
            • Screen reader support with proper ARIA labels{'\n'}
            • Keyboard navigation with arrow keys{'\n'}
            • Voice announcements for date selection{'\n'}
            • High contrast support{'\n'}
            • Focus management and proper tab order{'\n'}
            • Today highlighting for orientation{'\n'}
            • Clear disabled state indicators
          </Body>
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Stress-Friendly Design</H2>
          <Body style={styles.featureText}>
            • Gentle animations that respect reduced motion{'\n'}
            • Calming color palette{'\n'}
            • Clear visual hierarchy{'\n'}
            • Non-intimidating error messages{'\n'}
            • Today button for quick selection{'\n'}
            • Large touch targets (48px minimum){'\n'}
            • Simplified navigation controls
          </Body>
        </View>
      </Container>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    opacity: 0.8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  featureText: {
    lineHeight: 22,
    opacity: 0.9,
  },
});