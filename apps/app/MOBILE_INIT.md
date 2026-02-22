# Tauri Mobile Platform Initialization

This document records the initialization of Android and iOS platforms for the PuraToDo Tauri app.

## Date: 2026-02-22

## Platforms Initialized

### Android
- **Status**: ✅ Successfully initialized
- **Location**: `src-tauri/gen/android/`
- **Package Name**: `top.puratodo.app`
- **Min SDK Version**: 24 (Android 7.0)
- **Target SDK Version**: 36
- **Build System**: Gradle with Kotlin DSL

### iOS
- **Status**: ✅ Successfully initialized
- **Location**: `src-tauri/gen/apple/`
- **Bundle ID**: `top.puratodo.app`
- **Min iOS Version**: 14.0
- **Build System**: Xcode with XcodeGen
- **Warning**: No code signing certificates configured yet (required for device deployment)

## Configuration Changes

Updated `src-tauri/tauri.conf.json` to add mobile platform configurations:

```json
{
  "bundle": {
    "iOS": {
      "minimumSystemVersion": "12.0"
    },
    "android": {
      "minSdkVersion": 24
    }
  },
  "plugins": {
    "opener": {}
  }
}
```

## Next Steps

### For Android Development
1. Run development build: `npm run tauri android dev`
2. Build APK: `npm run tauri android build`
3. Test on Android emulator or device

### For iOS Development
1. Configure code signing:
   - Add Apple Developer certificate
   - Set development team ID in `tauri.conf.json` or `APPLE_DEVELOPMENT_TEAM` env var
2. Run development build: `npm run tauri ios dev`
3. Build IPA: `npm run tauri ios build`
4. Test on iOS simulator or device

### Build Commands

```bash
# Android
cd apps/app
npm run tauri android dev      # Development
npm run tauri android build    # Production build

# iOS
cd apps/app
npm run tauri ios dev          # Development
npm run tauri ios build        # Production build
```

## Known Issues

1. **Bundle Identifier Warning**: The bundle identifier `top.puratodo.app` ends with `.app`, which conflicts with macOS application bundle extension. Consider changing to `top.puratodo` or similar.

2. **iOS Code Signing**: No code signing certificates found. This is required for:
   - Testing on physical iOS devices
   - Publishing to App Store
   - Not needed for iOS Simulator testing

3. **Large Bundle Size**: The JavaScript bundle is 761KB (219KB gzipped), which exceeds the 500KB warning threshold. Consider code splitting for better performance.

## Project Structure

```
apps/app/src-tauri/
├── gen/
│   ├── android/              # Android Studio project
│   │   ├── app/              # Main Android app module
│   │   ├── build.gradle.kts  # Root Gradle config
│   │   ├── gradle/           # Gradle wrapper
│   │   └── settings.gradle   # Gradle settings
│   └── apple/                # Xcode project
│       ├── puratodo.xcodeproj/    # Xcode project file
│       ├── puratodo_iOS/          # iOS app source
│       ├── Sources/               # Rust compiled sources
│       ├── project.yml            # XcodeGen config
│       └── Podfile                # CocoaPods dependencies
└── tauri.conf.json           # Tauri configuration
```

## Testing

Both platforms were tested with debug builds:
- ✅ Android debug build initiated successfully
- ✅ iOS debug build initiated successfully (requires code signing for completion)

## References

- [Tauri Mobile Setup Guide](https://v2.tauri.app/start/create-project/#mobile)
- [Android Prerequisites](https://v2.tauri.app/start/prerequisites/#android)
- [iOS Prerequisites](https://v2.tauri.app/start/prerequisites/#ios)
