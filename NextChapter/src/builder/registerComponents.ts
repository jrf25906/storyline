import { Builder } from '@builder.io/sdk-react-native';
import { Text, View, TouchableOpacity, Image } from 'react-native';

// Register React Native core components
Builder.registerComponent(Text, {
  name: 'Text',
  inputs: [
    {
      name: 'children',
      type: 'text',
      defaultValue: 'Enter your text here',
    },
    {
      name: 'style',
      type: 'object',
      defaultValue: {
        fontSize: 16,
        color: '#000000',
      },
      subFields: [
        { name: 'fontSize', type: 'number' },
        { name: 'color', type: 'color' },
        { name: 'fontWeight', type: 'string' },
        { name: 'textAlign', type: 'string' },
      ],
    },
  ],
});

Builder.registerComponent(View, {
  name: 'Container',
  inputs: [
    {
      name: 'style',
      type: 'object',
      defaultValue: {
        padding: 20,
        backgroundColor: '#ffffff',
      },
      subFields: [
        { name: 'padding', type: 'number' },
        { name: 'margin', type: 'number' },
        { name: 'backgroundColor', type: 'color' },
        { name: 'borderRadius', type: 'number' },
      ],
    },
  ],
  defaultChildren: [
    {
      component: { name: 'Text', options: { text: 'Add content here' } },
    },
  ],
});

Builder.registerComponent(TouchableOpacity, {
  name: 'Button',
  inputs: [
    {
      name: 'onPress',
      type: 'action',
    },
    {
      name: 'style',
      type: 'object',
      defaultValue: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
      },
    },
  ],
  defaultChildren: [
    {
      component: { 
        name: 'Text', 
        options: { 
          children: 'Click me',
          style: { color: '#ffffff', textAlign: 'center', fontWeight: 'bold' }
        } 
      },
    },
  ],
});

Builder.registerComponent(Image, {
  name: 'Image',
  inputs: [
    {
      name: 'source',
      type: 'object',
      required: true,
      defaultValue: { uri: 'https://via.placeholder.com/300x200' },
    },
    {
      name: 'style',
      type: 'object',
      defaultValue: {
        width: 300,
        height: 200,
      },
      subFields: [
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'borderRadius', type: 'number' },
      ],
    },
    {
      name: 'resizeMode',
      type: 'string',
      enum: ['cover', 'contain', 'stretch', 'repeat', 'center'],
      defaultValue: 'cover',
    },
  ],
});

// Register your custom components
import { CalmingLoadingIndicator } from '../components/common/CalmingLoadingIndicator';
import { EmpathyErrorState } from '../components/common/EmpathyErrorState';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';

Builder.registerComponent(CalmingLoadingIndicator, {
  name: 'NextChapter.LoadingIndicator',
  inputs: [
    {
      name: 'message',
      type: 'text',
      defaultValue: 'Loading...',
    },
  ],
});

Builder.registerComponent(EmpathyErrorState, {
  name: 'NextChapter.ErrorState',
  inputs: [
    {
      name: 'message',
      type: 'text',
      defaultValue: 'Something went wrong',
    },
    {
      name: 'onRetry',
      type: 'action',
    },
  ],
});

Builder.registerComponent(PrimaryButton, {
  name: 'NextChapter.PrimaryButton',
  inputs: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Button',
    },
    {
      name: 'onPress',
      type: 'action',
    },
    {
      name: 'disabled',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'loading',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'variant',
      type: 'string',
      enum: ['default', 'success', 'danger'],
      defaultValue: 'default',
    },
  ],
});

Builder.registerComponent(SecondaryButton, {
  name: 'NextChapter.SecondaryButton',
  inputs: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Button',
    },
    {
      name: 'onPress',
      type: 'action',
    },
    {
      name: 'disabled',
      type: 'boolean',
      defaultValue: false,
    },
  ],
});

// Export for use in other files
export const builderComponentsRegistered = true;