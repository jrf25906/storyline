# Error Handling Quick Reference

## 🚀 Quick Start

```typescript
import { withApiCall, withDatabaseOperation, withCrisisOperation } from '@utils/errorHandling/errorWrappers';

// API calls with retry
const result = await withApiCall(
  () => fetch('/api/data'),
  3, // retries
  { service: 'api', method: 'getData', userId }
);

// Database operations
const dbResult = await withDatabaseOperation(
  () => db.users.create(userData),
  { table: 'users', operation: 'create', userId }
);

// Crisis features (CRITICAL priority)
const crisisResult = await withCrisisOperation(
  () => detectCrisis(message),
  { feature: 'crisis_detection', userId }
);
```

## 📚 Error Wrapper Functions

| Function | Use Case | Features |
|----------|----------|----------|
| `withApiCall(operation, retries, context)` | REST API calls | Retry logic, exponential backoff |
| `withDatabaseOperation(operation, context)` | Database CRUD | Offline support, transaction safety |
| `withAuthOperation(operation, context)` | Authentication | Token refresh, auto-recovery |
| `withFileOperation(operation, context)` | File upload/download | Progress tracking, size validation |
| `withAIOperation(operation, context)` | AI/LLM calls | Rate limiting, fallback responses |
| `withNavigationOperation(operation, context)` | Navigation actions | Stack management, error boundaries |
| `withStorageOperation(operation, context)` | Local storage | Quota management, encryption |
| `withCrisisOperation(operation, context)` | Crisis features | **CRITICAL** priority, mandatory fallbacks |
| `withValidation(operation, context)` | Form validation | User-friendly error messages |
| `withStateOperation(operation, context)` | State updates | Rollback on failure |

## 🎯 Error Severity Levels

```typescript
enum ErrorSeverity {
  LOW = 'LOW',           // Background logging only
  MEDIUM = 'MEDIUM',     // Standard user notification
  HIGH = 'HIGH',         // Immediate user attention
  CRITICAL = 'CRITICAL'  // Crisis features, emergency protocols
}
```

## 📋 Common Patterns

### 1. **API Call with Retry**
```typescript
const result = await withApiCall(
  async () => {
    const response = await fetch('/api/budget');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  3, // retry count
  {
    service: 'budgetService',
    method: 'fetchBudget',
    userId: user.id
  }
);

if (result.success) {
  setBudgetData(result.data);
} else {
  // Error already handled and user notified
  showOfflineMode();
}
```

### 2. **Database Operation**
```typescript
const saveResult = await withDatabaseOperation(
  () => database.tasks.update(taskId, { completed: true }),
  {
    table: 'tasks',
    operation: 'update',
    userId: user.id
  }
);
```

### 3. **Authentication Flow**
```typescript
const authResult = await withAuthOperation(
  () => supabase.auth.signInWithPassword({ email, password }),
  {
    action: 'login',
    userId: email
  }
);
```

### 4. **Crisis Feature**
```typescript
const crisisResult = await withCrisisOperation(
  () => analyzeMessageForCrisis(message),
  {
    feature: 'crisis_detection',
    userId: user.id
  }
);
```

### 5. **File Upload**
```typescript
const uploadResult = await withFileOperation(
  () => uploadResume(file),
  {
    type: 'upload',
    fileName: file.name,
    userId: user.id
  }
);
```

## 🔄 Migration from Try-Catch

### Before (❌ Don't Do This)
```typescript
try {
  const data = await apiCall();
  setState(data);
} catch (error) {
  console.error(error);
  alert('Something went wrong');
}
```

### After (✅ Do This)
```typescript
const result = await withApiCall(
  () => apiCall(),
  3,
  { service: 'myService', method: 'getData', userId }
);

if (result.success) {
  setState(result.data);
}
// Error handling is automatic
```

## 🚨 Crisis Feature Guidelines

**Always use `withCrisisOperation()` for:**
- Crisis keyword detection
- Emergency resource access
- Suicide prevention features
- Mental health assessments
- Crisis hotline connections

```typescript
// ✅ Correct: Crisis features with CRITICAL handling
const result = await withCrisisOperation(
  () => detectSuicidalIdeation(text),
  { feature: 'crisis_detection', userId }
);

// ❌ Wrong: Never use basic error handling for crisis features
try {
  const result = await detectSuicidalIdeation(text);
} catch (error) {
  // This could fail silently - dangerous for users in crisis
}
```

## 📊 ServiceResult Pattern

All wrapped functions return a `ServiceResult<T>`:

```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;           // Present when success = true
  error?: ServiceError; // Present when success = false
}

// Usage
const result = await withApiCall(operation, retries, context);
if (result.success) {
  // TypeScript knows result.data is available
  console.log(result.data);
} else {
  // TypeScript knows result.error is available
  console.log(result.error.message);
}
```

## ⚙️ Configuration Options

```typescript
interface ErrorHandlingConfig {
  showUserNotification: boolean;  // Show alert to user
  logToAnalytics: boolean;       // Track in analytics
  reportToCrashlytics: boolean;  // Send to crash reporting
  severity: ErrorSeverity;       // Error priority level
  recoveryAction?: () => Promise<void>; // Custom recovery
}

// Custom configuration
const result = await withErrorHandling(
  operation,
  { userId, action: 'custom' },
  {
    severity: ErrorSeverity.HIGH,
    showUserNotification: true,
    recoveryAction: async () => {
      await resetAppState();
    }
  }
);
```

## 🔍 Error Context

Provide meaningful context for better debugging:

```typescript
const context = {
  userId: 'user-123',           // Who encountered the error
  screen: 'BudgetScreen',       // Where it happened
  action: 'calculate_runway',   // What they were doing
  additionalData: {             // Extra context
    budgetAmount: 5000,
    timeframe: '6months'
  }
};
```

## 🧪 Testing Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should handle API failures gracefully', async () => {
    const failingApi = jest.fn().mockRejectedValue(new Error('Network error'));
    
    const result = await withApiCall(failingApi, 1, {
      service: 'test',
      method: 'test',
      userId: 'test'
    });
    
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });
});
```

## 📱 User Experience Guidelines

### Error Message Tone
- ✅ **Empathetic**: "We're having trouble connecting right now"
- ❌ **Technical**: "fetch() failed with status 500"

- ✅ **Reassuring**: "Your data is safe and we'll sync when you're back online"
- ❌ **Alarming**: "Data sync failed, may be lost"

- ✅ **Action-oriented**: "Would you like to try again or continue offline?"
- ❌ **Dead-end**: "An error occurred"

### Crisis Communication
- **Never blame the user** for system errors
- **Always provide alternatives** when features fail
- **Emphasize data safety** and progress preservation
- **Offer human support** for technical issues

## 🔧 Common Issues and Solutions

### Issue: Too many error notifications
**Solution**: Use appropriate severity levels
```typescript
// Don't notify for background operations
await withStorageOperation(operation, context, {
  showUserNotification: false
});
```

### Issue: Network errors causing app crashes
**Solution**: Use `withApiCall` with retry logic
```typescript
const result = await withApiCall(operation, 3, context);
// Automatically handles network failures
```

### Issue: Crisis features failing silently
**Solution**: Always use `withCrisisOperation`
```typescript
// This ensures CRITICAL priority and fallbacks
await withCrisisOperation(operation, { feature: 'crisis_detection', userId });
```

## 📞 Getting Help

- **Migration questions**: See `migrationExamples.ts`
- **Test patterns**: See `__tests__/` directories
- **Custom wrappers**: Extend existing patterns
- **Performance issues**: Check error queue processing

---

*This error handling system is designed specifically for NextChapter's mission of supporting people through crisis situations. Every error interaction should reflect empathy, reliability, and hope.*