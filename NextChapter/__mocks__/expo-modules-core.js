// Mock for expo-modules-core
const React = require('react');

// Mock Native Module
class NativeModule {
  constructor(name) {
    this.name = name;
  }
}

// Mock EventEmitter
class EventEmitter {
  constructor(nativeModule) {
    this.nativeModule = nativeModule;
    this.listeners = {};
  }

  addListener(eventName, listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
    
    return {
      remove: () => {
        const index = this.listeners[eventName].indexOf(listener);
        if (index > -1) {
          this.listeners[eventName].splice(index, 1);
        }
      }
    };
  }

  removeAllListeners(eventName) {
    if (eventName) {
      delete this.listeners[eventName];
    } else {
      this.listeners = {};
    }
  }

  removeSubscription(subscription) {
    subscription.remove();
  }

  emit(eventName, ...args) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(listener => listener(...args));
    }
  }
}

// Mock Platform utilities
const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
};

// Mock UUID
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Mock Native View Manager
const requireNativeViewManager = (viewName) => {
  const View = require('react-native').View;
  return React.forwardRef((props, ref) => 
    React.createElement(View, { ...props, ref, testID: props.testID || viewName })
  );
};

// Mock Native Module Registry
const NativeModulesProxy = new Proxy({}, {
  get(target, prop) {
    return target[prop] || {};
  }
});

// Mock Permissions
const PermissionStatus = {
  DENIED: 'denied',
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined',
};

module.exports = {
  NativeModule,
  EventEmitter,
  Platform,
  uuid: { v4: uuidv4 },
  requireNativeViewManager,
  NativeModulesProxy,
  PermissionStatus,
  // Deprecated but might still be used
  UnavailabilityError: Error,
  CodedError: Error,
  // Hooks
  useReleasingSharedObject: (object) => {
    React.useEffect(() => {
      return () => {
        if (object && typeof object.release === 'function') {
          object.release();
        }
      };
    }, [object]);
  },
};