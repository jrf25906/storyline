module.exports = {
  AES: {
    encrypt: jest.fn((text) => ({ 
      toString: () => `encrypted-${text}` 
    })),
    decrypt: jest.fn((text) => ({ 
      toString: (encoding) => text.replace('encrypted-', '') 
    }))
  },
  enc: {
    Utf8: {}
  }
};