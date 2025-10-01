# CannaFlow Advanced - Android APK Build Guide

## Prerequisites

### System Requirements
- Node.js 18.0+ 
- Android Studio (for Android SDK)
- Java JDK 11+
- Git

### Android Development Setup
1. Install Android Studio
2. Install Android SDK
3. Set ANDROID_HOME environment variable
4. Install required SDK components

## Build Process

### Step 1: Clean and Prepare
```bash
# Navigate to project directory
cd Cannaflowadvanced/cannaflow-clean

# Clean previous builds
rm -rf android/build
rm -rf ios/build
rm -rf node_modules/.cache

# Install dependencies
npm install

# Run prebuild to generate native files
npx expo prebuild --clean
```

### Step 2: Configure Build
```bash
# Update app.json with your configuration
# Set your package name, version, etc.
```

### Step 3: Build APK
```bash
# Build Android APK
eas build --platform android --profile production

# Or use Expo CLI (deprecated)
expo build:android
```

## Build Configuration

### app.json Configuration
```json
{
  "expo": {
    "name": "CannaFlow Advanced",
    "slug": "cannaflow-advanced",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a1a"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.cannaflow.advanced"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a1a"
      },
      "package": "com.cannaflow.advanced",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### eas.json Configuration
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

## Build Issues and Solutions

### Common Issues

#### 1. Gradle Build Failures
**Issue**: Build fails with Gradle errors
**Solution**:
```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..

# Reset Gradle wrapper
rm -rf android/.gradle
rm android/gradle/wrapper/gradle-wrapper.jar
```

#### 2. Memory Issues
**Issue**: Out of memory during build
**Solution**:
```bash
# Increase Java heap size
export JAVA_OPTS="-Xmx4g -XX:MaxPermSize=512m"
```

#### 3. Dependency Conflicts
**Issue**: Version conflicts in dependencies
**Solution**:
```bash
# Check for conflicts
npm ls --depth=0

# Force resolution
npm install --force
```

#### 4. Android SDK Issues
**Issue**: Missing Android SDK components
**Solution**:
```bash
# Install required SDK components
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

### Build Optimization

#### Reduce APK Size
```bash
# Enable ProGuard/R8
# Add to app.json android section:
"enableProguardInReleaseBuilds": true,
"enableShrinkResourcesInReleaseBuilds": true
```

#### Improve Build Speed
```bash
# Use parallel builds
export GRADLE_OPTS="-Dorg.gradle.parallel=true -Dorg.gradle.daemon=true"
```

## Testing the Build

### Local Testing
```bash
# Run on Android emulator
npm run android

# Run on connected device
npm run android -- --device
```

### APK Installation
```bash
# Install APK on device
adb install path/to/app-release.apk

# Install on emulator
adb -e install path/to/app-release.apk
```

## Distribution

### Internal Distribution
```bash
# Upload to internal testing
eas build --platform android --profile preview
```

### Production Distribution
```bash
# Build for production
eas build --platform android --profile production
```

## Monitoring and Analytics

### Sentry Integration
The app includes Sentry for error monitoring:
```javascript
// Configure Sentry DSN in sentryConfig.js
export const firebaseConfig = {
  // ... other config
  sentryDsn: 'YOUR_SENTRY_DSN'
};
```

### Performance Monitoring
```javascript
// Track performance
import { startTransaction } from './src/services/sentryConfig';

const transaction = startTransaction('checkout', 'purchase');
// ... perform operation
transaction.finish();
```

## Security Considerations

### Code Signing
- Ensure proper keystore for release builds
- Keep signing keys secure
- Use different keys for different environments

### Data Protection
- Encrypt sensitive data
- Use secure communication protocols
- Implement proper authentication

## Build Verification Checklist

### Pre-Build
- [ ] All dependencies installed correctly
- [ ] No console errors in development
- [ ] All features tested in development
- [ ] App.json configuration correct
- [ ] Firebase/Sentry configuration complete

### Post-Build
- [ ] APK installs successfully
- [ ] App launches without crashes
- [ ] All features work correctly
- [ ] No performance issues
- [ ] Error monitoring active
- [ ] Analytics tracking properly

### Pilot Ready Checklist
- [ ] Age verification working
- [ ] Purchase limits enforced
- [ ] Inventory management functional
- [ ] Staff authentication working
- [ ] Compliance logging active
- [ ] Voice commands responsive
- [ ] Barcode scanner functional
- [ ] Charts and navigation stable
- [ ] Error handling robust
- [ ] Loading states implemented

## Troubleshooting

### Build Logs
```bash
# View build logs
eas build:view [BUILD_ID]

# Download build artifacts
eas build:download [BUILD_ID]
```

### Debug Information
```bash
# Get system info
expo diagnostics

# Check device info
adb devices
adb shell getprop
```

## Support

### Technical Support
- Email: support@cannaflow.com
- Documentation: [Link to docs]
- GitHub Issues: [Repository issues]

### Emergency Contacts
- Build Issues: [CONTACT]
- Deployment Issues: [CONTACT]
- Security Issues: [CONTACT]

---

**Build Date**: 2025-09-30  
**Version**: 1.0.0  
**Status**: Ready for Pilot Deployment

**Next Steps**:
1. Build APK using EAS
2. Test on Android device
3. Deploy to pilot dispensary
4. Monitor performance and feedback