# Manual Error Boundary Migration Guide

## Files Requiring Manual Migration

### 1. TestAuthScreen.tsx
**Current Export Pattern:**
```typescript
export default function TestAuthScreen() {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Change function declaration
function TestAuthScreen() {
  // component code
}

// Add at end of file
export default withErrorBoundary(TestAuthScreen);
```

### 2. BiometricAuthScreen.tsx
**Current Export Pattern:**
```typescript
export const BiometricAuthScreen: React.FC = () => {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Remove export
const BiometricAuthScreen: React.FC = () => {
  // component code
}

// Add at end of file
export default withErrorBoundary(BiometricAuthScreen);
```

### 3. ProfileScreen.tsx
**Current Export Pattern:**
```typescript
export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Change function declaration
function ProfileScreen({ navigation }: ProfileScreenProps) {
  // component code
}

// Add at end of file
export default withErrorBoundary(ProfileScreen);
```

### 4. AboutScreen.tsx
**Current Export Pattern:**
```typescript
export default function AboutScreen({ navigation }: AboutScreenProps) {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Change function declaration
function AboutScreen({ navigation }: AboutScreenProps) {
  // component code
}

// Add at end of file
export default withErrorBoundary(AboutScreen);
```

### 5. BudgetCalculatorScreen.tsx
**Current Export Pattern:**
```typescript
export const BudgetCalculatorScreen: React.FC = () => {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Remove export
const BudgetCalculatorScreen: React.FC = () => {
  // component code
}

// Add at end of file
export default withErrorBoundary(BudgetCalculatorScreen);
```

### 6. TaskDetailScreen.tsx
**Current Export Pattern:**
```typescript
export const TaskDetailScreen: React.FC = () => {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Remove export
const TaskDetailScreen: React.FC = () => {
  // component code
}

// Add at end of file
export default withErrorBoundary(TaskDetailScreen);
```

### 7. BuilderTestScreen.tsx (Lower Priority)
**Current Export Pattern:**
```typescript
export const BuilderTestScreen: React.FC = () => {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Remove export
const BuilderTestScreen: React.FC = () => {
  // component code
}

// Add at end of file
export default withErrorBoundary(BuilderTestScreen);
```

### 8. BuilderDemoScreen.tsx (Lower Priority)
**Current Export Pattern:**
```typescript
export const BuilderDemoScreen: React.FC = () => {
  // component code
}
```

**Change To:**
```typescript
import { withErrorBoundary } from '@/components/common/withErrorBoundary';

// Remove export
const BuilderDemoScreen: React.FC = () => {
  // component code
}

// Add at end of file
export default withErrorBoundary(BuilderDemoScreen);
```

## Post-Migration Testing

After migrating each screen, test the following:

1. **Basic Rendering**
   - Screen loads without errors
   - All functionality works as expected

2. **Error Boundary Testing**
   - Temporarily add a throw statement to trigger error
   - Verify the empathetic error message appears
   - Test the "Try Again" button functionality

3. **Navigation**
   - Ensure navigation to/from the screen works
   - Check that props are passed correctly

4. **TypeScript**
   - Run `npm run typecheck` to ensure no type errors

5. **Tests**
   - Update any tests that import these screens
   - Ensure all tests pass

## Example Test Error Trigger

To test error boundaries, temporarily add this to any component:

```typescript
// Add inside component to test error boundary
if (Math.random() > 0.5) {
  throw new Error('Test error for error boundary');
}
```

Remember to remove after testing!