# GymRush - Fitness Tracking App

A modern React Native application for gym members to track workouts, receive updates, and manage their fitness journey.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/              # Base UI components (Button, Input, Card, etc.)
├── constants/           # App constants (theme, config)
├── context/             # React Context providers (Auth)
├── hooks/               # Custom React hooks
├── navigation/          # Navigation configuration
├── screens/             # Screen components
│   ├── auth/            # Authentication screens (Login, Register)
│   └── main/            # Main app screens (Dashboard, Workouts, etc.)
├── services/            # API services and storage
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🎯 Features

- **Authentication**
  - Login with email/password
  - User registration
  - Forgot password flow
  - Secure token storage
  - Auto-login on app restart

- **Dashboard**
  - Quick check-in/check-out
  - Workout statistics
  - Recent activity
  - Upcoming bookings

- **Workout Tracking**
  - Session history
  - Duration tracking
  - Notes and details

- **Updates**
  - Browse gym announcements
  - Receive alerts and news

- **Profile Management**
  - View/edit profile
  - Membership status
  - Settings

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- npm or yarn
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Install iOS pods (iOS only):
\`\`\`bash
cd ios && pod install && cd ..
\`\`\`

3. Start Metro bundler:
\`\`\`bash
npm start
\`\`\`

4. Run the app:
\`\`\`bash
# iOS
npm run ios

# Android
npm run android
\`\`\`

## 🔧 Configuration

### API Configuration

Update the API base URL in \`src/constants/config.ts\`:

\`\`\`typescript
export const API_CONFIG = {
  BASE_URL: 'http://your-api-url.com',
  TIMEOUT: 30000,
};
\`\`\`

### Theme Customization

Modify colors and styles in \`src/constants/theme.ts\`.

## 📱 Screens Overview

### Auth Screens
- **Login Screen** - Modern dark theme with gradient accents
- **Register Screen** - Clean multi-field form
- **Forgot Password** - Simple recovery flow

### Main Screens
- **Dashboard** - Stats, check-in, recent activity
- **Workouts** - Session history list
- **Updates** - See announcements and alerts
- **Profile** - User settings and info

## 🏛️ Architecture

### Separation of Concerns

- **Screens**: Only render UI, minimal logic
- **Hooks**: Business logic and state management
- **Services**: API calls and data fetching
- **Context**: Global state (auth)
- **Components**: Reusable UI elements

### Navigation Structure

\`\`\`
RootNavigator
├── AuthNavigator (when not logged in)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
└── MainNavigator (when logged in)
    ├── DashboardScreen
    ├── WorkoutsScreen
    └── ProfileScreen
\`\`\`

## 🔐 Security

- JWT tokens stored securely with AsyncStorage
- Auto token refresh on 401 responses
- Secure password handling
- Protected routes based on auth state

## 📦 Key Dependencies

- **@react-navigation** - Navigation
- **@react-native-async-storage/async-storage** - Local storage
- **axios** - HTTP client
- **react-native-gesture-handler** - Gestures
- **react-native-safe-area-context** - Safe area handling

## 📄 License

This project is licensed under the MIT License.
