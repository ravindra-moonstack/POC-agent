# Profiler Frontend

This repository contains both the web dashboard and mobile app for the Profiler system.

## 🏗 Project Structure

- `/web` - Admin Dashboard (Next.js)
- `/mobile` - RM Mobile App (React Native CLI)

## 📱 Mobile App Setup

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Install iOS dependencies:

```bash
cd ios
pod install
cd ..
```

3. Start the development server:

```bash
npm start
```

4. Run on your device:

```bash
# For iOS
npm run ios

# For Android
npm run android
```

## 🎨 Design System

The mobile app uses a custom design system with these core components:

- `AppText` - Typography component
- `AppButton` - Button component
- `AppTextInput` - Text input component

### Color Scheme

```javascript
export const colors = {
  primary: "#A78BFA", // Light Purple
  white: "#FFFFFF",
  background: "#F9FAFB",
  text: "#1F2937",
  border: "#E5E7EB",
  error: "#EF4444",
  success: "#10B981",
};
```

## 🔐 Authentication

The app uses JWT-based authentication. Tokens are securely stored using the device's secure storage.
