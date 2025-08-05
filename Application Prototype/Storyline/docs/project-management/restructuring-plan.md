# Storyline Project Restructuring Plan

## Executive Summary

This document outlines the recommended changes to improve the Storyline project structure, remove redundancies, and enhance maintainability.

## Immediate Actions (Priority 1)

### 1. Remove Misplaced Directories

```bash
# Remove TypeScript compiler directory
rm -rf ./storyline-app/

# Remove empty Prototype directory
rm -rf ./Prototype/
```

### 2. Update .gitignore

Add the following entries:
```gitignore
# Logs (with proper directory matching)
logs/
*.log

# Build artifacts
dist/
build/
*.tsbuildinfo

# Service-specific logs
services/*/logs/

# Package build outputs
packages/*/dist/
```

### 3. Clean Existing Artifacts

```bash
# Remove all log files
find . -name "*.log" -not -path "*/node_modules/*" -delete
find . -type d -name "logs" -not -path "*/node_modules/*" -exec rm -rf {} +

# Remove dist directories
rm -rf packages/shared-types/dist/
```

## Structural Improvements (Priority 2)

### 1. Standardize Web Components Structure

Move all root-level components into appropriate subdirectories:

```
apps/web/src/components/
├── brand/
│   └── brand-provider.tsx
├── chat/
│   └── chat-message.tsx
├── dashboard/
│   └── dashboard.tsx
├── landing/
│   ├── hero-section.tsx
│   ├── features-section.tsx
│   └── footer.tsx
├── navigation/
│   └── navigation.tsx
├── story/
│   ├── story-editor.tsx
│   ├── story-form.tsx
│   └── suggestion-chip.tsx
├── voice/
│   ├── voice-dashboard.tsx
│   ├── voice-enhanced-editor.tsx
│   ├── voice-panel.tsx
│   └── voice-panel-connected.tsx
└── v0/
    └── v0-style-write-page.tsx
```

### 2. Consolidate Documentation

1. Merge testing strategies:
   - Keep `refreshed-testing-strategy.md` as the current version
   - Archive or remove `testing-strategy.md`

2. Create documentation index:
   ```markdown
   # docs/README.md
   - Link to all major documentation sections
   - Provide clear navigation structure
   ```

### 3. Environment Configuration

Create a clear hierarchy:
```
.env.example          # Base template with all variables
.env                  # Local development (gitignored)
services/
  <service>/.env.example  # Service-specific examples
```

## Long-term Improvements (Priority 3)

### 1. Implement Tools Directory

The `tools/` directory has many empty subdirectories. Either:
- Implement the planned tooling
- Remove empty directories and create as needed
- Document what each tool directory is intended for

### 2. Test Data Organization

Many test data directories are empty. Consider:
- Populating with actual test data
- Using a test data generation script
- Documenting the test data structure

### 3. Package Consolidation

Review if all packages are necessary:
- `ai-client` - Could be merged with services?
- `memory-client` - Could be part of memory service?
- `voice-sdk` - Evaluate standalone need

## Implementation Checklist

- [ ] Remove `storyline-app/` directory
- [ ] Remove `Prototype/` directory
- [ ] Update `.gitignore` with proper patterns
- [ ] Clean all log files and build artifacts
- [ ] Reorganize web components into subdirectories
- [ ] Consolidate testing documentation
- [ ] Create documentation index
- [ ] Standardize environment configuration
- [ ] Review and clean empty directories
- [ ] Add missing `.env.example` files

## Validation Steps

1. Run `git status` to ensure no unwanted files are tracked
2. Verify all services can still build and run
3. Check that development workflow is not disrupted
4. Ensure CI/CD pipelines still function

## Notes

- The core architecture and service structure is solid
- Most issues are related to cleanliness and consistency
- No major architectural changes needed
- Focus is on organization and maintainability