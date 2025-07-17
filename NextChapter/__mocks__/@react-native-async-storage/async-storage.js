// Mock for @react-native-async-storage/async-storage
const mockStorage = {};

module.exports = {
  setItem: jest.fn((key, value) => {
    return new Promise((resolve) => {
      mockStorage[key] = value;
      resolve();
    });
  }),
  
  getItem: jest.fn((key) => {
    return new Promise((resolve) => {
      resolve(mockStorage[key] || null);
    });
  }),
  
  removeItem: jest.fn((key) => {
    return new Promise((resolve) => {
      delete mockStorage[key];
      resolve();
    });
  }),
  
  clear: jest.fn(() => {
    return new Promise((resolve) => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      resolve();
    });
  }),
  
  getAllKeys: jest.fn(() => {
    return new Promise((resolve) => {
      resolve(Object.keys(mockStorage));
    });
  }),
  
  multiGet: jest.fn((keys) => {
    return new Promise((resolve) => {
      const result = keys.map(key => [key, mockStorage[key] || null]);
      resolve(result);
    });
  }),
  
  multiSet: jest.fn((keyValuePairs) => {
    return new Promise((resolve) => {
      keyValuePairs.forEach(([key, value]) => {
        mockStorage[key] = value;
      });
      resolve();
    });
  }),
  
  multiRemove: jest.fn((keys) => {
    return new Promise((resolve) => {
      keys.forEach(key => delete mockStorage[key]);
      resolve();
    });
  }),
  
  mergeItem: jest.fn((key, value) => {
    return new Promise((resolve) => {
      const existingValue = mockStorage[key];
      if (existingValue) {
        try {
          const existingObject = JSON.parse(existingValue);
          const newObject = JSON.parse(value);
          mockStorage[key] = JSON.stringify({ ...existingObject, ...newObject });
        } catch (e) {
          mockStorage[key] = value;
        }
      } else {
        mockStorage[key] = value;
      }
      resolve();
    });
  }),
};