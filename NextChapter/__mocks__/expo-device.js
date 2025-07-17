const Device = {
  // Device type constants
  DeviceType: {
    UNKNOWN: 0,
    PHONE: 1,
    TABLET: 2,
    DESKTOP: 3,
    TV: 4,
  },
  
  // Properties
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone',
  modelId: 'iPhone14,2',
  designName: 'iPhone 13 Pro',
  productName: 'iPhone',
  deviceYearClass: 2021,
  totalMemory: 6442450944,
  supportedCpuArchitectures: ['arm64'],
  osName: 'iOS',
  osVersion: '16.0',
  osBuildId: '20A362',
  osInternalBuildId: '20A362',
  osBuildFingerprint: null,
  platformApiLevel: null,
  deviceName: 'Test iPhone',
  deviceType: 1, // PHONE
  isDevice: true,
  
  // Methods
  getDeviceTypeAsync: jest.fn(() => Promise.resolve(1)), // PHONE
  getUptimeAsync: jest.fn(() => Promise.resolve(123456)),
  getMaxMemoryAsync: jest.fn(() => Promise.resolve(6442450944)),
  isRootedExperimentalAsync: jest.fn(() => Promise.resolve(false)),
};

module.exports = Device;
module.exports.default = Device;