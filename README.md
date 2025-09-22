<div align="center">
  <img src="https://raw.githubusercontent.com/petra-dot/health-tracker/main/assets/icon.png" alt="Health Tracker Logo" width="150">
  <h1 align="center">Health Tracker</h1>
  <p align="center">
    A comprehensive health and fitness tracking mobile application built with React Native and Expo.
  </p>
  <p align="center">
    <a href="https://github.com/petra-dot/health-tracker/blob/main/LICENSE"><img src="https://img.shields.io/github/license/petra-dot/health-tracker?style=for-the-badge" alt="License"></a>
    <a href="https://github.com/petra-dot/health-tracker/releases"><img src="https://img.shields.io/github/v/release/petra-dot/health-tracker?style=for-the-badge" alt="Release"></a>
    <a href="https://github.com/petra-dot/health-tracker"><img src="https://img.shields.io/github/stars/petra-dot/health-tracker?style=for-the-badge" alt="Stars"></a>
    <a href="https://github.com/petra-dot/health-tracker/fork"><img src="https://img.shields.io/github/forks/petra-dot/health-tracker?style=for-the-badge" alt="Forks"></a>
  </p>
</div>

---

## 📜 Table of Contents

- [✨ Features](#-features)
- [🚀 Technologies Used](#-technologies-used)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🛠️ Installation & Setup](#️-installation--setup)
- [📱 How the App Works](#-how-the-app-works)
- [🤖 AI-Generated Code Credit](#-ai-generated-code-credit)
- [🔧 Development](#-development)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)

---

## ✨ Features

### Core Health Tracking

- **📊 Water Intake Tracking**: Monitor daily hydration with goal setting and progress visualization.
- **🍎 Calorie Tracking**: Log calorie intake with preset amounts and custom entries.
- **👟 Step Counter**: Track daily steps with automated logging and goal monitoring.
- **📈 Progress Analytics**: View charts and statistics of health metrics over time.

### User Experience

- **🎨 Dark/Light Theme**: Automatic system theme detection with manual override.
- **👤 Personal Profiles**: User profile management with health goals customization.
- **📱 Cross-Platform**: Native iOS and Android apps plus web version.
- **🔄 Offline-First**: All functionality works without internet connectivity.
- **🔔 Smart Notifications** (Coming Soon): Customizable health reminders and goal alerts.

### Data Management

- **🔒 Privacy-Focused**: All data stored locally, never shared with external services.
- **💾 Data Export**: JSON and CSV export functionality for data analysis.
- **📊 Statistics Dashboard**: Visual charts showing health trends and progress.
- **⚙️ Customizable Goals**: Personalized daily targets for all health metrics.

---

## 🚀 Technologies Used

### Core Framework

- **React Native 0.81.4**: Latest React Native version with New Architecture.
- **Expo SDK 54**: Managed workflow for cross-platform development.
- **React 19.1.0**: Modern React with concurrent features.

### Navigation & UI

- **React Navigation 7.x**: Bottom tab navigation with smooth transitions.
- **React Native Elements**: Pre-built UI components for consistent design.
- **Expo Vector Icons**: Comprehensive icon library.
- **React Native Chart Kit**: Data visualization and progress charts.

### Data Storage

- **Expo SQLite**: Local relational database for structured data storage.
- **AsyncStorage**: Key-value storage for app settings and preferences.
- **JSON-based persistence**: Custom storage abstraction layer.

### Development Tools

- **Jest**: Unit testing framework with React Native support.
- **@testing-library/react-native**: Component testing utilities.
- **Expo CLI**: Development server and build tools.

### State Management

- **React Context API**: Modern state management without external libraries.
- **Custom Hooks**: Reusable logic for context consumers.
- **Error Boundaries**: Comprehensive error handling and recovery.

---

## 🏗️ Architecture Overview

<details>
<summary>Click to expand</summary>

### Application Structure

```
health-tracker/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components (Home, Stats, Settings)
│   ├── contexts/            # React Context providers
│   ├── utils/               # Helper functions and utilities
│   ├── db/                  # Database abstraction layer
│   └── AppNavigator.js      # Navigation configuration
├── assets/                  # Static assets (icons, images)
└── App.js                  # Root application component
```

### Key Architectural Patterns

#### Context-Based State Management

The app uses React Context API for global state management, providing:

- Theme management with system theme detection
- User profile and health goals
- Notification preferences and scheduling

#### Platform-Agnostic Storage

Unified storage layer that abstracts platform differences:

- `localStorage` for web compatibility
- `AsyncStorage` for mobile devices
- Automatic platform detection and fallback handling

#### Component Composition

Screens are built from reusable components:

- Tracker components for health metrics
- Form components for data entry
- Navigation and layout components

</details>

---

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** (LTS version recommended)
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (macOS) or **Android Studio** with emulator

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/petra-dot/health-tracker.git
   cd health-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

4. **Run on specific platform**

   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

### Build Commands

- `npm start` - Start Expo development server
- `npm run android` - Launch Android build
- `npm run ios` - Launch iOS build
- `npm run web` - Launch web build
- `npm test` - Run test suite

---

## 📱 How the App Works

<details>
<summary>Click to expand</summary>

### User Journey

1. **First Launch**: Users are guided through onboarding to set up their profile.
2. **Profile Setup**: Enter personal information and set initial health goals.
3. **Daily Tracking**: Use the main home screen to log health metrics.
4. **Progress Monitoring**: View statistics and trends in the Stats screen.
5. **Customization**: Adjust goals and preferences in Settings.

### Core Workflows

#### Health Data Entry

- Tap buttons for predefined amounts (e.g., +250ml water).
- Use custom input for specific amounts.
- Data automatically saves to local storage.
- Real-time progress updates with visual feedback.

#### Goal Setting

- Customize daily targets for water, calories, and steps.
- Progress bars show completion percentage.
- Visual indicators for goal achievement.

#### Data Persistence

- All data stored locally using JSON format.
- Automatic backup and recovery.
- Data export capabilities for external analysis.

</details>

---

## 🤖 AI-Generated Code Credit

This project was developed with the assistance of **Cline AI** - an AI-powered code editor built for VSCode. The following AI models and tools were utilized:

### AI Tools Used

- **Cline AI Agent**: Primary development assistant in VSCode for code generation, debugging, and architecture planning.
- **Cline Code Supernova**: Advanced code completion and refactoring assistance.
- **Grok Code Fast-1 Model**: Fast and efficient code generation for routine development tasks.

### Development Philosophy

The codebase follows AI-assisted development principles:

- **Clean Architecture**: Structured patterns and modular design.
- **Comprehensive Documentation**: Memory Bank system for project knowledge management.
- **Quality Assurance**: Automated testing and code quality standards.
- **Privacy-Focused**: Local data storage with no external dependencies.

### AI Contribution Highlights

- Complete React Native app architecture implementation.
- Cross-platform compatibility and responsive design.
- Database design and data persistence patterns.
- Component-level and integration testing strategies.
- Performance optimization and error handling patterns.
- Documentation and project maintenance workflows.

---

## 🔧 Development

<details>
<summary>Click to expand</summary>

### Project Structure

The app follows a component-driven architecture with clear separation of concerns. Each module has specific responsibilities:

- **Components**: Reusable UI elements
- **Screens**: Page-level components
- **Contexts**: Global state management
- **Utils**: Business logic and helper functions
- **Database**: Data persistence layer

### Code Quality

- **ESLint**: Code linting and style consistency.
- **Jest**: Unit and component testing.
- **React Native Testing Library**: Component interaction testing.
- **Manual Testing**: Cross-platform compatibility verification.

### Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Make your changes and run tests: `npm test`.
4. Commit your changes: `git commit -am 'Add new feature'`.
5. Push to the branch: `git push origin feature-name`.
6. Submit a pull request.

</details>

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **[Expo Team](https://expo.dev/)**: For the excellent React Native development platform.
- **[React Native Community](https://reactnative.dev/)**: For the comprehensive ecosystem of libraries.
- **Cline AI**: For revolutionary AI-assistance in modern software development.
- **[Open Source Contributors](https://github.com/petra-dot/health-tracker/graphs/contributors)**: For the amazing tools and libraries used in this project.

---

<div align="center">
  <strong>Built with ❤️ using React Native, Expo, and Cline AI</strong>
</div>