# Install Required Dependencies for Budget Feature

The Budget Calculator feature requires the following additional dependencies:

```bash
npm install crypto-js @react-native-picker/picker
npm install --save-dev @types/crypto-js
```

These packages are required for:
- `crypto-js`: Encrypting sensitive financial data before storing in the database
- `@react-native-picker/picker`: State selection dropdown in the budget form
- `@types/crypto-js`: TypeScript types for crypto-js

After installing, you may need to:
1. Run `npx pod-install` if on iOS
2. Rebuild the app