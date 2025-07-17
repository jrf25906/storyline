# Metro Bundler Path Alias Resolution Fix

## Problem
Metro bundler was not properly resolving path aliases like `@context`, `@hooks`, etc., even though they were correctly configured in:
- `tsconfig.json` - TypeScript path mappings
- `babel.config.js` - Babel module resolver plugin

## Solution
Updated `metro.config.js` to include a custom resolver that handles path alias resolution at the Metro bundler level.

## Changes Made

### metro.config.js
Added custom resolver configuration with the following features:

1. **Path Alias Resolution**: Implemented a `resolveRequest` function that:
   - Maps all aliases to their actual filesystem paths
   - Handles both exact matches (`@hooks`) and path prefixes (`@hooks/useAuth`)
   - Falls back to default resolution for non-aliased imports

2. **Watch Folders**: Ensures the `src` directory is included in Metro's watch folders

3. **Additional Extensions**: Added support for `.cjs` files

## How It Works

The resolver intercepts module resolution requests and:
1. Checks if the module name matches any configured alias
2. Replaces the alias with the actual filesystem path
3. Passes the resolved path to Metro's default resolver

## Path Aliases Configured

- `@` → `./src`
- `@components` → `./src/components`
- `@screens` → `./src/screens`
- `@services` → `./src/services`
- `@utils` → `./src/utils`
- `@hooks` → `./src/hooks`
- `@context` → `./src/context`
- `@types` → `./src/types`
- `@styles` → `./src/styles`
- `@navigation` → `./src/navigation`
- `@config` → `./src/config`
- `@stores` → `./src/stores`
- `@constants` → `./src/constants`
- `@test-utils` → `./src/test-utils`

## Testing

To verify the fix works:

1. **Clear Metro cache**: 
   ```bash
   npx expo start -c
   ```

2. **Run the app**:
   ```bash
   npm start
   ```

3. The app should now properly resolve all path aliases without import errors

## Related Configurations

The following files work together for complete alias support:

- **metro.config.js**: Handles runtime module resolution
- **babel.config.js**: Transforms imports during compilation
- **tsconfig.json**: Provides TypeScript IDE support
- **jest.config.js**: Handles test module resolution

All these configurations are now aligned with the same path aliases.