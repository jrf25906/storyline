import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

type Style = ViewStyle | TextStyle | ImageStyle;
type StyleProp = Style | Style[] | undefined | null | false;

/**
 * Flattens React Native style arrays/objects into a single object for testing
 * @param style The style prop from a component (can be array, object, or falsy)
 * @returns A flattened style object
 */
export const flattenStyle = (style: StyleProp): Style => {
  if (!style) {
    return {};
  }
  
  if (Array.isArray(style)) {
    // Filter out falsy values and flatten recursively
    const validStyles = style.filter(Boolean).map(s => flattenStyle(s));
    return Object.assign({}, ...validStyles);
  }
  
  // If it's already an object, return it
  return style as Style;
};

/**
 * Helper to test if a component's style contains expected properties
 * @param componentStyle The style prop from the component
 * @param expectedStyle The expected style properties
 * @returns boolean indicating if all expected properties match
 */
export const styleContains = (
  componentStyle: StyleProp,
  expectedStyle: Partial<Style>
): boolean => {
  const flattened = flattenStyle(componentStyle);
  
  for (const [key, value] of Object.entries(expectedStyle)) {
    if (flattened[key as keyof Style] !== value) {
      return false;
    }
  }
  
  return true;
};

/**
 * Jest matcher for style testing
 * Usage: expect(element.props.style).toMatchStyle({ backgroundColor: 'red' })
 */
export const toMatchStyle = (
  received: StyleProp,
  expected: Partial<Style>
) => {
  const flattened = flattenStyle(received);
  const pass = styleContains(received, expected);
  
  if (pass) {
    return {
      pass: true,
      message: () => `expected style not to contain ${JSON.stringify(expected)}`,
    };
  } else {
    return {
      pass: false,
      message: () => {
        const mismatches: string[] = [];
        for (const [key, value] of Object.entries(expected)) {
          const actualValue = flattened[key as keyof Style];
          if (actualValue !== value) {
            mismatches.push(
              `  ${key}: expected ${JSON.stringify(value)}, received ${JSON.stringify(actualValue)}`
            );
          }
        }
        return `expected style to match:\n${mismatches.join('\n')}\n\nFull style: ${JSON.stringify(flattened, null, 2)}`;
      },
    };
  }
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchStyle(expected: Partial<Style>): R;
    }
  }
}

// Add the matcher to Jest
if (typeof expect !== 'undefined' && expect.extend) {
  expect.extend({ toMatchStyle });
}