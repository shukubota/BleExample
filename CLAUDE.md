# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native BLE (Bluetooth Low Energy) proof-of-concept application using `react-native-ble-manager` to validate the library's practicality and performance for real-world applications.

## Development Commands

```bash
# Install dependencies
npm install

# iOS dependencies
cd ios && pod install && cd ..

# Development server
npm start

# Platform-specific builds
npm run android
npm run ios

# Code quality
npm run lint
npm test
```

## Architecture

### Core Structure

The application is built as a single-file React Native app (`App.tsx`) with a flat component architecture:

- **BLE Manager Initialization**: Platform-specific permission handling and BleManager setup
- **Device Scanning**: 10-second scanning with automatic timeout and device discovery
- **Connection Management**: Connect/disconnect functionality with state tracking
- **Permission System**: Dynamic Android permissions (API 31+ support) and iOS Info.plist configuration

### Key Components

1. **App Component**: Main container with SafeAreaProvider
2. **AppContent Component**: Core BLE functionality and UI
3. **Device Lists**: Separate rendering for connected and discovered devices
4. **Permission Handler**: Platform-specific permission requests

### State Management

Uses React hooks for local state:
- `isScanning`: Tracks scanning state
- `connectedDevices`: Array of connected BluetoothDevice objects
- `discoveredDevices`: Array of discovered BluetoothDevice objects

### BLE Integration

- **Library**: `react-native-ble-manager` v12.2.0
- **Scanning**: 10-second timeout with peripheral discovery
- **Permissions**: Comprehensive Android 12+ and iOS permission handling
- **Device Interface**: Custom BluetoothDevice type with id, name, and rssi

## Platform Configuration

### Android Permissions (AndroidManifest.xml)
- Basic BLE: BLUETOOTH, BLUETOOTH_ADMIN, LOCATION permissions
- Android 12+: BLUETOOTH_SCAN, BLUETOOTH_CONNECT, BLUETOOTH_ADVERTISE
- Hardware requirement: bluetooth_le feature

### iOS Permissions (Info.plist)
- NSBluetoothAlwaysUsageDescription
- NSBluetoothPeripheralUsageDescription  
- NSLocationWhenInUseUsageDescription

## Dependencies

**Core**: React Native 0.81.4, TypeScript, react-native-ble-manager, react-native-safe-area-context

**Dev Tools**: ESLint, Jest, Prettier, TypeScript 5.8.3

## Known Limitations

- Data communication (read/write characteristics) not yet implemented
- Single device connection pattern (though multiple connections supported in state)
- Android 12+ requires location permissions even with neverForLocation flag
- iOS background BLE operations have platform restrictions

## Development Notes

- BLE initialization happens in useEffect with cleanup
- Platform-specific permission handling in `requestAndroidPermissions()`
- RSSI values displayed for discovered devices
- Connection state managed through React state, not BleManager state persistence