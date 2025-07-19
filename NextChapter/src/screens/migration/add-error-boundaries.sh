#!/bin/bash

# Error Boundary Migration Script for NextChapter React Native App
# This script adds the withErrorBoundary HOC to screens that are missing it

echo "Starting Error Boundary Migration..."
echo "=================================="

# Array of files to migrate
declare -a files=(
  "src/screens/auth/TestAuthScreen.tsx"
  "src/screens/auth/BiometricAuthScreen.tsx"
  "src/screens/profile/ProfileScreen.tsx"
  "src/screens/profile/AboutScreen.tsx"
  "src/screens/budget/BudgetCalculatorScreen.tsx"
  "src/screens/bounce-plan/TaskDetailScreen.tsx"
  "src/screens/BuilderTestScreen.tsx"
  "src/screens/BuilderDemoScreen.tsx"
)

# Function to add error boundary to a file
add_error_boundary() {
  local file=$1
  local filename=$(basename "$file" .tsx)
  
  echo "Processing: $file"
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "  ❌ File not found: $file"
    return 1
  fi
  
  # Check if already has withErrorBoundary
  if grep -q "withErrorBoundary" "$file"; then
    echo "  ✅ Already has error boundary"
    return 0
  fi
  
  # Create backup
  cp "$file" "$file.backup"
  
  # Determine the component name and export pattern
  if grep -q "export default function" "$file"; then
    # Pattern: export default function ComponentName
    component_name=$(grep "export default function" "$file" | sed -E 's/export default function ([A-Za-z0-9]+).*/\1/')
    
    # Add import at the top after other imports
    sed -i '' "/^import.*from/a\\
import { withErrorBoundary } from '@/components/common/withErrorBoundary';
" "$file"
    
    # Replace export default function with const and add export default with HOC
    sed -i '' "s/export default function ${component_name}/const ${component_name}/g" "$file"
    echo "" >> "$file"
    echo "export default withErrorBoundary(${component_name});" >> "$file"
    
  elif grep -q "export const.*: React.FC" "$file"; then
    # Pattern: export const ComponentName: React.FC
    component_name=$(grep "export const.*: React.FC" "$file" | sed -E 's/export const ([A-Za-z0-9]+):.*/\1/')
    
    # Add import at the top after other imports
    sed -i '' "/^import.*from/a\\
import { withErrorBoundary } from '@/components/common/withErrorBoundary';
" "$file"
    
    # Remove export from const declaration
    sed -i '' "s/export const ${component_name}/const ${component_name}/g" "$file"
    
    # Add export default with HOC at the end
    echo "" >> "$file"
    echo "export default withErrorBoundary(${component_name});" >> "$file"
    
  elif grep -q "export default " "$file"; then
    # Pattern: Direct export default
    echo "  ⚠️  Complex export pattern, needs manual migration"
    rm "$file.backup"
    return 1
  fi
  
  echo "  ✅ Successfully added error boundary"
  rm "$file.backup"
  return 0
}

# Process each file
success_count=0
failure_count=0
manual_count=0

for file in "${files[@]}"; do
  if add_error_boundary "$file"; then
    ((success_count++))
  else
    ((failure_count++))
  fi
done

echo ""
echo "=================================="
echo "Migration Summary:"
echo "  ✅ Successfully migrated: $success_count"
echo "  ❌ Failed/Manual needed: $failure_count"
echo "=================================="

# Specific manual migrations needed
echo ""
echo "Manual Migration Instructions:"
echo "=============================="
echo ""
echo "1. ProfileScreen.tsx:"
echo "   - Change: export default function ProfileScreen"
echo "   - To: const ProfileScreen = ..."
echo "   - Add: export default withErrorBoundary(ProfileScreen);"
echo ""
echo "2. AboutScreen.tsx:"
echo "   - Change: export default function AboutScreen"
echo "   - To: const AboutScreen = ..."
echo "   - Add: export default withErrorBoundary(AboutScreen);"
echo ""
echo "Remember to:"
echo "- Run tests after migration"
echo "- Check that all screens render correctly"
echo "- Verify error boundaries work by triggering test errors"