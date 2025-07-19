# Service Layer Architecture

This service layer implements a comprehensive interface abstraction following SOLID principles to ensure maintainability, testability, and flexibility.

## Architecture Overview

### Core Principles

1. **Dependency Inversion Principle (DIP)**: All services depend on interfaces, not concrete implementations
2. **Interface Segregation Principle (ISP)**: Interfaces are small and focused on specific responsibilities
3. **Single Responsibility Principle (SRP)**: Each service handles one specific concern
4. **Open/Closed Principle (OCP)**: Services are open for extension but closed for modification
5. **Liskov Substitution Principle (LSP)**: All implementations can be substituted without breaking functionality

### Key Components

#### 1. Interfaces (`/interfaces`)
- **Data Services**: CRUD operations, storage, caching, querying
- **AI Services**: Chat completion, content analysis, moderation
- **Auth Services**: Authentication, biometrics, session management
- **Notification Services**: Push notifications, scheduling, local notifications
- **Analytics Services**: Event tracking, user properties, performance monitoring
- **Network Services**: Connectivity, offline queue, synchronization
- **Security Services**: Encryption, key management, content moderation

#### 2. Adapters (`/adapters`)
Concrete implementations that adapt external libraries to our interfaces:
- `AsyncStorageAdapter`: Implements `IKeyValueStorage`
- `SupabaseAuthAdapter`: Implements `IAuthService`
- `OpenAIAdapter`: Implements `IChatCompletionService`
- `WatermelonDBAdapter`: Implements `IDataService`

#### 3. Service Container
Dependency injection container for managing service instances and dependencies.

## Usage Examples

### Basic Service Usage

```typescript
import { services } from '@/services/ServiceContainer';

// Using authentication service
const authResult = await services.auth.signIn({
  email: 'user@example.com',
  password: 'password'
});

if (authResult.isOk()) {
  const session = authResult.value;
  console.log('Signed in:', session.user.email);
} else {
  console.error('Auth error:', authResult.error);
}

// Using storage service
const storageResult = await services.storage.set('user_preference', 'dark_mode');
if (storageResult.isErr()) {
  console.error('Storage error:', storageResult.error);
}
```

### Error Handling with Result Type

```typescript
import { services } from '@/services/ServiceContainer';
import { getUserFriendlyMessage } from '@/services/interfaces/common/errors';

// Chain operations with Result type
const result = await services.auth
  .getCurrentUser()
  .flatMap(user => {
    if (!user) return err(new UnauthorizedError());
    return services.storage.get(`preferences_${user.id}`);
  })
  .map(preferences => {
    return preferences || getDefaultPreferences();
  });

// Pattern matching
const preferences = result.match({
  ok: (value) => value,
  err: (error) => {
    showToast(getUserFriendlyMessage(error));
    return getDefaultPreferences();
  }
});
```

### Implementing a New Service

```typescript
// 1. Define the interface
export interface IWeatherService {
  getCurrentWeather(location: string): Promise<Result<Weather>>;
  getForecast(location: string, days: number): Promise<Result<Forecast[]>>;
}

// 2. Implement the adapter
export class OpenWeatherAdapter implements IWeatherService {
  constructor(private apiKey: string) {}

  async getCurrentWeather(location: string): Promise<Result<Weather>> {
    return tryCatch(
      async () => {
        const response = await fetch(`/weather?q=${location}&key=${this.apiKey}`);
        if (!response.ok) throw new ExternalServiceError('OpenWeather', response.statusText);
        return await response.json();
      },
      (error) => new ExternalServiceError('OpenWeather', String(error))
    );
  }

  async getForecast(location: string, days: number): Promise<Result<Forecast[]>> {
    // Implementation
  }
}

// 3. Register in service container
import { ServiceContainer } from '@/services/ServiceContainer';

ServiceContainer.getInstance().register(
  'weather',
  () => new OpenWeatherAdapter(process.env.WEATHER_API_KEY!),
  { singleton: true }
);

// 4. Use the service
const weatherResult = await services.resolve<IWeatherService>('weather')
  .getCurrentWeather('New York');
```

### Testing with Mock Services

```typescript
// Create mock implementation
class MockAuthService implements IAuthService {
  async signIn(credentials: SignInCredentials): Promise<Result<AuthSession>> {
    if (credentials.email === 'test@example.com') {
      return ok({
        user: { id: '1', email: credentials.email, emailVerified: true },
        accessToken: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000)
      });
    }
    return err(new UnauthorizedError('Invalid credentials'));
  }
  // ... other methods
}

// Use in tests
beforeEach(() => {
  ServiceContainer.getInstance().reset();
  ServiceContainer.getInstance().register('auth', () => new MockAuthService());
});

test('should authenticate user', async () => {
  const result = await services.auth.signIn({
    email: 'test@example.com',
    password: 'any'
  });
  
  expect(result.isOk()).toBe(true);
  expect(result.unwrap().user.email).toBe('test@example.com');
});
```

### Offline Support

```typescript
// Configure offline queue
services.register('offlineQueue', () => new IndexedDBQueueAdapter());

// Use with network-aware operations
const syncService = services.sync;

// Enable auto-sync on reconnection
services.network.onNetworkStateChange((state) => {
  if (state.isOnline) {
    syncService.syncAll();
  }
});

// Queue operations when offline
const result = await services.dataService('jobApplications')
  .create(applicationData);

if (result.isErr() && result.error instanceof OfflineError) {
  await services.offlineQueue.enqueue({
    type: 'create_job_application',
    payload: applicationData
  });
}
```

### Security Best Practices

```typescript
// Encrypt sensitive data before storage
const encryptedResult = await services.encryption
  .encrypt(JSON.stringify(sensitiveData));

if (encryptedResult.isOk()) {
  await services.storage.setSecureItem('sensitive_key', encryptedResult.value);
}

// Use field-level encryption for databases
const userProfile = {
  name: 'John Doe',
  ssn: '123-45-6789', // Will be encrypted
  email: 'john@example.com'
};

const encryptedProfile = await services.encryption
  .encryptObject(userProfile, ['ssn']);
```

## Architecture Benefits

1. **Testability**: Easy to mock any service for unit testing
2. **Flexibility**: Switch implementations without changing consumer code
3. **Type Safety**: Full TypeScript support with proper error handling
4. **Offline First**: Built-in support for offline operations and sync
5. **Security**: Encryption and key management built into the architecture
6. **Scalability**: Easy to add new services or extend existing ones
7. **Error Recovery**: Consistent error handling with Result types

## Migration Guide

To migrate existing code to use the new service layer:

1. Replace direct imports with service container usage
2. Update error handling to use Result types
3. Add proper offline support where needed
4. Implement proper encryption for sensitive data

Example migration:

```typescript
// Before
import { supabase } from '@/services/api/supabase';

const { data, error } = await supabase.auth.signIn({
  email, password
});
if (error) throw error;

// After
import { services } from '@/services/ServiceContainer';

const result = await services.auth.signIn({ email, password });
if (result.isErr()) {
  showError(getUserFriendlyMessage(result.error));
  return;
}
const session = result.value;
```

## Future Enhancements

1. **Service Discovery**: Automatic service registration via decorators
2. **Circuit Breaker**: Automatic fallback for failing services
3. **Rate Limiting**: Built-in rate limiting for external services
4. **Caching Strategy**: Configurable caching policies per service
5. **Metrics Collection**: Automatic performance metrics for all services