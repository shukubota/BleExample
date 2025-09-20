/**
 * BLE POC App - Testing react-native-ble-manager functionality
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
} from 'react-native';
import BleManager from 'react-native-ble-manager';

interface BluetoothDevice {
  id: string;
  name?: string;
  rssi?: number;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaView>
  );
}

function AppContent() {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<BluetoothDevice[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>([]);

  useEffect(() => {
    initializeBLE();
    return () => {
      BleManager.stopScan();
    };
  }, []);

  const initializeBLE = async () => {
    try {
      await BleManager.start({ showAlert: false });
      
      if (Platform.OS === 'android') {
        await requestAndroidPermissions();
      }
      
      console.log('BLE initialized successfully');
    } catch (error) {
      console.error('BLE initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize Bluetooth');
    }
  };

  const requestAndroidPermissions = async () => {
    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      if (Platform.Version >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(granted).every(permission => permission === 'granted');
    }
    return true;
  };

  const startScan = async () => {
    if (isScanning) return;

    try {
      setDiscoveredDevices([]);
      setIsScanning(true);
      
      await BleManager.scan([], 10, false);
      
      setTimeout(() => {
        setIsScanning(false);
        handleGetDiscoveredDevices();
      }, 10000);
      
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
      Alert.alert('Error', 'Failed to start scanning');
    }
  };

  const handleGetDiscoveredDevices = async () => {
    try {
      const peripherals = await BleManager.getDiscoveredPeripherals();
      const devices: BluetoothDevice[] = peripherals.map(peripheral => ({
        id: peripheral.id,
        name: peripheral.name || 'Unknown Device',
        rssi: peripheral.rssi,
      }));
      setDiscoveredDevices(devices);
    } catch (error) {
      console.error('Failed to get discovered devices:', error);
    }
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      await BleManager.connect(deviceId);
      const device = discoveredDevices.find(d => d.id === deviceId);
      if (device) {
        setConnectedDevices(prev => [...prev, device]);
        Alert.alert('Success', `Connected to ${device.name}`);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    try {
      await BleManager.disconnect(deviceId);
      setConnectedDevices(prev => prev.filter(device => device.id !== deviceId));
      Alert.alert('Success', 'Device disconnected');
    } catch (error) {
      console.error('Disconnection failed:', error);
      Alert.alert('Error', 'Failed to disconnect device');
    }
  };

  const renderDevice = ({ item }: { item: BluetoothDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        {item.rssi && <Text style={styles.rssi}>RSSI: {item.rssi}</Text>}
      </View>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => connectToDevice(item.id)}
      >
        <Text style={styles.buttonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );

  const renderConnectedDevice = ({ item }: { item: BluetoothDevice }) => (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        <Text style={styles.connectedStatus}>Connected</Text>
      </View>
      <TouchableOpacity
        style={[styles.connectButton, styles.disconnectButton]}
        onPress={() => disconnectDevice(item.id)}
      >
        <Text style={styles.buttonText}>Disconnect</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BLE POC App</Text>
      
      <TouchableOpacity
        style={[styles.scanButton, isScanning && styles.scanningButton]}
        onPress={startScan}
        disabled={isScanning}
      >
        <Text style={styles.buttonText}>
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Connected Devices ({connectedDevices.length})</Text>
      <FlatList
        data={connectedDevices}
        renderItem={renderConnectedDevice}
        keyExtractor={(item) => `connected-${item.id}`}
        style={styles.deviceList}
      />

      <Text style={styles.sectionTitle}>Discovered Devices ({discoveredDevices.length})</Text>
      <FlatList
        data={discoveredDevices}
        renderItem={renderDevice}
        keyExtractor={(item) => `discovered-${item.id}`}
        style={styles.deviceList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanningButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  deviceList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rssi: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  connectedStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  disconnectButton: {
    backgroundColor: '#f44336',
  },
});

export default App;
