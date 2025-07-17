# Next Chapter - Setup Guide

## What We've Built

You now have a solid foundation for your Next Chapter app with:

### ✅ **Core Architecture**
- **Expo + React Native** project structure
- **TypeScript** configuration with path aliases
- **Navigation** system (Auth → Onboarding → Main App)
- **Offline-first** architecture preparation
- **Accessibility-compliant** theme system (WCAG 2.1 AA)

### ✅ **Key Features Framework**
- **Theme System**: Dark/light modes, high contrast, minimum font sizes
- **Authentication**: Supabase integration ready
- **Context Providers**: Auth, Theme, Offline state management
- **Component Library**: Accessible Button, Input, Loading components
- **Navigation**: Tab navigation with proper accessibility labels
- **Push Notifications**: Expo notifications setup

### ✅ **Offline-First Preparation**
- WatermelonDB integration points
- Sync conflict resolution strategy
- Network state management
- Offline banner component

## Quick Start

### 1. **Clone and Install**
```bash
# Run the setup commands from the first artifact
npm install
```

### 2. **Configure Environment**
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your actual keys:
# - Supabase URL and anon key
# - OpenAI API key
```

### 3. **Set Up Services**

**Supabase Setup:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your URL and anon key from Project Settings → API
3. Update your `.env` file

**OpenAI Setup:**
1. Get an API key from [OpenAI](https://platform.openai.com)
2. Add to your `.env` file

### 4. **Run the App**
```bash
# Start the development server
npx expo start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - 'w' for web browser
```

## What Works Right Now

- ✅ **App launches** with proper navigation structure
- ✅ **Theme switching** (light/dark/high contrast)
- ✅ **Authentication flow** (login/signup screens exist)
- ✅ **Accessibility** features (proper touch targets, font sizes)
- ✅ **Offline detection** with banner

## What Needs Implementation

### **Priority 1: Core Screens (Week 1)**
1. **Onboarding Wizard Screens**
   - Welcome screen with app intro
   - Layoff details form (date, role, state)
   - Goals selection screen
   - Setup complete confirmation

2. **Authentication Screens**
   - Login form with validation
   - Signup form with validation
   - Password reset flow

### **Priority 2: Bounce Plan Engine (Week 2)**
1. **Daily Task System**
   - Task data model and storage
   - Daily task generation logic
   - Progress tracking
   - Skip/complete functionality

2. **Home Dashboard**
   - Current task display
   - Progress overview
   - Quick actions

### **Priority 3: Core Features (Week 3-4)**
1. **Coach Chat System**
   - OpenAI integration
   - Message history
   - Tone switching
   - Token usage tracking

2. **Application Tracker**
   - Job application CRUD
   - Kanban board interface
   - Status management

3. **Budget Tool**
   - Income/expense forms
   - Runway calculation
   - Visual progress bars

## Database Schema Needed

Create these tables in Supabase:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  layoff_date DATE,
  role TEXT,
  state TEXT,
  goal TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Bounce plan tasks
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_index INTEGER,
  title TEXT,
  description TEXT,
  completed_at TIMESTAMP,
  skipped_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Job applications
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT,
  title TEXT,
  status TEXT DEFAULT 'applied',
  notes TEXT,
  applied_at DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Coach messages
CREATE TABLE coach_messages (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT, -- 'user' or 'assistant'
  content TEXT,
  tone TEXT,
  token_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Budget entries
CREATE TABLE budget_entries (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  monthly_income DECIMAL,
  monthly_expenses DECIMAL,
  savings DECIMAL,
  severance DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Mood tracking
CREATE TABLE mood_entries (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT,
  valence_score INTEGER, -- 1-5 scale
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id)
);
```

## Recommended Development Flow

### **Phase 1: Get Basic App Running (Days 1-2)**
1. Set up Supabase database with schema above
2. Implement basic authentication screens
3. Create simple onboarding flow
4. Test navigation between auth → onboarding → main app

### **Phase 2: Build MVP Features (Weeks 1-2)**
1. Onboarding wizard with data collection
2. Daily task system (hardcoded tasks first)
3. Basic coach chat (OpenAI integration)
4. Simple application tracker

### **Phase 3: Polish and Test (Week 3)**
1. Offline sync implementation
2. Push notifications for daily tasks
3. Budget calculator
4. Mood tracking

## Pro Tips for Development

1. **Start Simple**: Hardcode the daily tasks initially, add dynamic generation later
2. **Test Offline**: Frequently test with airplane mode to verify offline functionality
3. **Accessibility**: Use the device accessibility settings to test your implementation
4. **Real Data**: Test with actual layoff scenarios to validate the user experience

## Ready for Claude Code?

You're now ready to start building with Claude Code! Your next command should be:

```bash
claude-code "Implement the onboarding wizard screens starting with the Welcome screen"
```

The foundation is solid - time to build the features that will help people bounce back! 🚀