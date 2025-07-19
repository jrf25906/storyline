# NextChapter Documentation

## Overview

NextChapter is a React Native app designed to help recently laid-off professionals regain stability and secure their next role within 90 days. This documentation provides comprehensive guides for developers, contributors, and maintainers.

## 📚 Documentation Structure

### Getting Started
- **[Project Overview](../CLAUDE.md)** - Core features, tech stack, and development guidelines
- **[Quick Start Guide](../README.md)** - Installation and basic setup
- **[Development Workflow](./DEVELOPMENT_WORKFLOW.md)** - Daily development processes

### 📋 `/requirements`
Product requirement documents and specifications
- PRDs (Product Requirement Documents)
- Product takeaways and notes

### 🔍 `/analysis`
Market research and competitive analysis
- Competitive teardowns
- Market analysis

### 🛠️ `/technical`
All technical documentation organized by category:

#### Phase-by-Phase Implementation
- **[Phase 1: Foundation](./technical/PHASE_1_FOUNDATION.md)** - Project setup and core architecture
- **[Phase 2: Feature Development](./technical/PHASE_2_FEATURES.md)** - Core feature implementation
- **[Phase 3: Code Quality](./technical/PHASE_3_COMPLETION_REPORT.md)** - Error handling and quality improvements ✅
- **[Phase 4: Testing & Optimization](./technical/PHASE_4_TESTING.md)** - Comprehensive testing strategy
- **[Phase 5: Production](./technical/PHASE_5_PRODUCTION.md)** - Deployment and monitoring

#### Core Systems
- **[Error Handling System](./technical/PHASE_3_ERROR_HANDLING_SYSTEM.md)** - Comprehensive error management
- **[Error Handling Quick Reference](./technical/ERROR_HANDLING_QUICK_REFERENCE.md)** - Developer quick start
- **[Design System Implementation](./DESIGN_SYSTEM_IMPLEMENTATION.md)** - UI/UX standards
- **[TypeScript Patterns](./technical/TYPESCRIPT_PATTERNS.md)** - Code patterns and best practices

#### Architecture & Planning
- **[Refactoring Plan 2025](./technical/REFACTORING_PLAN_2025.md)** - SOLID principles implementation
- **[Agent Automation Strategy](./technical/AGENT_AUTOMATION_STRATEGY.md)** - AI-assisted development

#### `/development`
Development guides and conventions
- PATH_ALIASES_GUIDE.md

#### `/features`
Feature-specific documentation
- HOME_DASHBOARD_SUMMARY.md

#### `/services`
Service layer documentation
- `/analytics` - Analytics service implementation
- `/notifications` - Push notification handling
- `/database` - Database service docs

#### `/setup`
Installation and setup guides
- INSTALL_DEPENDENCIES.md
- README_SETUP_STATUS.md
- Environment setup guides

#### `/testing`
Test plans and testing documentation
- TEST_AUTH_INSTRUCTIONS.md
- TEST_PLAN.md
- TEST_SETUP_SUMMARY.md
- `/database` - Database test documentation
- `/resume` - Resume service test coverage

#### `/troubleshooting`
Solutions to common problems
- METRO_FIX_SUMMARY.md
- TEST_BLOCKERS_FIX_SUMMARY.md

### 📅 `/planning`
Project planning and task management
- (Future location for project planning docs)

## 🎯 Current Status (January 2025)

### ✅ **Phase 3 Complete: Code Quality & Error Handling**
- **Error Handling System**: Production-ready empathetic error management
- **TypeScript Standards**: Strict mode compliance and import standardization
- **Testing Foundation**: Comprehensive error handling test coverage
- **Developer Experience**: 650+ try-catch blocks → 8 standardized wrappers

### 🚧 **Next Priority: Phase 4 - Testing & Optimization**
- Enhanced test coverage building on error handling patterns
- Performance optimization using error analytics
- Bundle size optimization and code splitting
- User acceptance testing with crisis-aware features

## 🔧 For Developers

### Quick References
- **[Error Handling Quick Reference](./technical/ERROR_HANDLING_QUICK_REFERENCE.md)** - Common patterns and examples
- **[TypeScript Patterns](./technical/TYPESCRIPT_PATTERNS.md)** - Type definitions and patterns
- **Main To-Do List**: `/tasks/todo.md`

### Code Quality
- **ESLint Configuration**: Comprehensive rules for imports, accessibility, and React Native
- **TypeScript Strict Mode**: Full type safety with path alias support
- **Error Handling Standards**: Empathetic, crisis-aware error management
- **Testing Patterns**: TDD with comprehensive error scenario coverage

### Development Tools
```bash
# Start development server
npm start

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Linting with auto-fix
npm run lint -- --fix

# Error handling tests
npm test -- --testPathPattern="errorHandling"
```

## 🚨 Crisis Intervention Features

NextChapter includes critical mental health and crisis intervention features. Special care is required when working on:

- **Crisis keyword detection** - Always use `withCrisisOperation()`
- **Emergency resource access** - CRITICAL severity error handling
- **Suicide prevention features** - Mandatory fallback mechanisms
- **Mental health assessments** - Privacy-enhanced error logging

See [Crisis Intervention Protocol](./UX_CRISIS_INTERVENTION.md) for detailed guidelines.

## 📊 Key Metrics & Success Criteria

### Technical Health
- ✅ **TypeScript Compilation**: 100% successful
- ✅ **Test Coverage**: 100% for error handling, expanding to 80% overall
- ✅ **Import Consistency**: 90% using path aliases
- ✅ **Error Handling**: Zero silent failures for crisis features

### User Experience
- 🎯 **Day-2 Activation**: ≥60% target
- 🎯 **Task Adherence**: ≥17 tasks completed per 30 days
- 🎯 **Interview Progress**: ≥25% log interview within 60 days
- 🎯 **Crisis Feature Reliability**: 99.9% uptime

## 🤝 Contributing

### Before Contributing
1. Read the [Project Overview](../CLAUDE.md) for context and mission
2. Review [Error Handling Guidelines](./technical/ERROR_HANDLING_QUICK_REFERENCE.md)
3. Check [TypeScript Patterns](./technical/TYPESCRIPT_PATTERNS.md) for code standards
4. Understand Crisis Intervention Protocol for safety-critical features

### Code Standards
- **All new features** must use error wrapper system
- **Crisis features** require `withCrisisOperation()` wrapper
- **TypeScript strict mode** - no `any` types allowed
- **Accessibility** - WCAG 2.1 AA compliance required
- **Testing** - TDD approach with comprehensive error scenarios

### Pull Request Process
1. **Error handling** - Use appropriate wrapper functions
2. **Testing** - Include error scenarios and edge cases
3. **Documentation** - Update relevant docs
4. **Accessibility** - Verify screen reader compatibility
5. **Crisis safety** - Extra review for crisis-related features

## 📞 Support & Resources

### Internal Resources
- **Migration Examples**: `src/utils/errorHandling/migrationExamples.ts`
- **Test Patterns**: All `__tests__/` directories
- **Error Analytics**: Dashboard queries in error handling docs

### External Resources
- **React Native Documentation**: [reactnative.dev](https://reactnative.dev)
- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Crisis Intervention Guidelines**: National Suicide Prevention Lifeline resources

### Getting Help
- **Technical Issues**: Create GitHub issue with `bug` label
- **Error Handling Questions**: Use `error-handling` label
- **Crisis Feature Development**: Use `crisis-intervention` label
- **Documentation Updates**: Use `documentation` label

---

## 🎯 Mission Alignment

Every technical decision in NextChapter should prioritize:

1. **User wellbeing** during crisis moments
2. **Reliability** for safety-critical features
3. **Empathy** in all user interactions
4. **Privacy** and data protection
5. **Accessibility** for all users

This documentation reflects our commitment to supporting people through one of life's most challenging transitions with technology that truly cares.

---

*Last updated: January 19, 2025 - Phase 3 Completion*