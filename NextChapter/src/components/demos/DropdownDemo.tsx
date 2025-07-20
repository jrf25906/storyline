import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Dropdown, DropdownOption } from '@components/common';
import { useTheme } from '@theme';
import { Container } from '@components/common/Container';
import { H2, Body, Caption } from '@components/common/Typography';

const countryOptions: DropdownOption[] = [
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'United Kingdom', value: 'UK' },
  { label: 'Australia', value: 'AU' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Spain', value: 'ES' },
  { label: 'Italy', value: 'IT' },
  { label: 'Japan', value: 'JP' },
  { label: 'Brazil', value: 'BR' },
];

const employmentOptions: DropdownOption[] = [
  { label: 'Full-time', value: 'full-time', description: 'Regular full-time employment' },
  { label: 'Part-time', value: 'part-time', description: 'Less than 40 hours per week' },
  { label: 'Contract', value: 'contract', description: 'Fixed-term or project-based' },
  { label: 'Freelance', value: 'freelance', description: 'Self-employed consultant' },
  { label: 'Internship', value: 'internship', description: 'Temporary learning position' },
  { label: 'Not Available', value: 'na', disabled: true },
];

const priorityOptions: DropdownOption[] = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
];

export const DropdownDemo: React.FC = () => {
  const theme = useTheme();
  const [country, setCountry] = useState<string>('');
  const [employment, setEmployment] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');
  const [size, setSize] = useState<string>('');

  return (
    <ScrollView style={styles.container}>
      <Container>
        <H2 style={styles.title}>Dropdown Component Demo</H2>
        <Body style={styles.description}>
          The Dropdown component provides a stress-friendly selection interface with search, 
          accessibility, and various visual states.
        </Body>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Basic Usage</H2>
          
          <Dropdown
            label="Country"
            options={countryOptions}
            value={country}
            onChange={setCountry}
            placeholder="Select your country"
            searchable
            searchPlaceholder="Search countries..."
            hint="Choose the country where you're looking for work"
          />

          <Dropdown
            label="Employment Type"
            options={employmentOptions}
            value={employment}
            onChange={setEmployment}
            placeholder="Select employment type"
            required
            hint="What type of role are you seeking?"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Variants</H2>
          
          <Dropdown
            label="Default Variant"
            options={priorityOptions}
            value={priority}
            onChange={setPriority}
            variant="default"
          />

          <Dropdown
            label="Success Variant"
            options={priorityOptions}
            value="high"
            onChange={() => {}}
            variant="success"
            hint="Great choice!"
          />

          <Dropdown
            label="Warning Variant"
            options={priorityOptions}
            value="low"
            onChange={() => {}}
            variant="warning"
            hint="Consider updating this"
          />

          <Dropdown
            label="Gentle Variant"
            options={priorityOptions}
            value=""
            onChange={() => {}}
            variant="gentle"
            placeholder="Take your time..."
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Sizes</H2>
          
          <Dropdown
            label="Small Size"
            options={priorityOptions}
            value={size}
            onChange={setSize}
            size="small"
            placeholder="Small dropdown"
          />

          <Dropdown
            label="Medium Size (Default)"
            options={priorityOptions}
            value={size}
            onChange={setSize}
            size="medium"
            placeholder="Medium dropdown"
          />

          <Dropdown
            label="Large Size"
            options={priorityOptions}
            value={size}
            onChange={setSize}
            size="large"
            placeholder="Large dropdown"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>States</H2>
          
          <Dropdown
            label="Error State"
            options={priorityOptions}
            value=""
            onChange={() => {}}
            error="Please select a priority level"
            placeholder="Select priority"
          />

          <Dropdown
            label="Disabled State"
            options={priorityOptions}
            value="medium"
            onChange={() => {}}
            disabled
            hint="This field is currently disabled"
          />

          <Dropdown
            label="With Long Options"
            options={[
              { 
                label: 'This is a very long option that demonstrates text truncation in the dropdown', 
                value: 'long1' 
              },
              { 
                label: 'Another extremely long option with lots of text to show how the component handles overflow', 
                value: 'long2',
                description: 'Even the description can be quite long and will be displayed properly'
              },
            ]}
            value=""
            onChange={() => {}}
            placeholder="Select an option"
          />
        </View>

        <View style={styles.section}>
          <H2 style={styles.sectionTitle}>Current Values</H2>
          <Caption>Country: {country || 'Not selected'}</Caption>
          <Caption>Employment: {employment || 'Not selected'}</Caption>
          <Caption>Priority: {priority || 'Not selected'}</Caption>
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
});