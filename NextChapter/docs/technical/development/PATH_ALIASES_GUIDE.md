# Path Aliases Configuration Guide

## ✅ Path aliases have been successfully configured!

### What was done:
1. Installed `babel-plugin-module-resolver` for React Native alias support
2. Updated `babel.config.js` with alias configuration
3. Updated `tsconfig.json` for TypeScript support
4. Updated `jest.config.js` for test support
5. Removed redundant metro.config.js alias configuration

### Available Aliases:
- `@/` → `src/`
- `@components/` → `src/components/`
- `@screens/` → `src/screens/`
- `@services/` → `src/services/`
- `@utils/` → `src/utils/`
- `@hooks/` → `src/hooks/`
- `@context/` → `src/context/`
- `@types/` → `src/types/`
- `@styles/` → `src/styles/`
- `@navigation/` → `src/navigation/`
- `@config/` → `src/config/`
- `@stores/` → `src/stores/`
- `@constants/` → `src/constants/`
- `@test-utils/` → `src/test-utils/`

### Example Usage:

**Before (relative imports):**
```typescript
import { useAuth } from '../../context/AuthContext';
import TaskCard from '../../components/feature/bounce-plan/TaskCard';
import { BOUNCE_PLAN_TASKS } from '../../constants/bouncePlanTasks';
```

**After (with aliases):**
```typescript
import { useAuth } from '@context/AuthContext';
import TaskCard from '@components/feature/bounce-plan/TaskCard';
import { BOUNCE_PLAN_TASKS } from '@constants/bouncePlanTasks';
```

### To Apply to All Files:
You can use this script to update all imports in the codebase (run from project root):

```bash
# This is a dry-run command to preview changes
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from '\.\." | head -5
```

### Next Steps:
1. Clear Metro bundler cache: `npx expo start -c`
2. Update imports in files as you work on them
3. All new files should use the alias imports

### Benefits:
- ✨ Cleaner imports
- 🚀 Easier refactoring
- 📁 No more counting directory levels (../../)
- 🔧 Better IDE support with auto-imports