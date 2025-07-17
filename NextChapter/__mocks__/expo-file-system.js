const FileSystem = {
  readAsStringAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64'
  }
};

// For namespace import (import * as FileSystem)
module.exports = FileSystem;