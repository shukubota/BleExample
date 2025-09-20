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
  ScrollView,
} from 'react-native';
import BleManager from 'react-native-ble-manager';

interface BluetoothDevice {
  id: string;
  name?: string;
  rssi?: number;
}

interface ReceivedData {
  timestamp: string;
  data: string;
  characteristic: string;
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
  const [receivedData, setReceivedData] = useState<ReceivedData[]>([]);

  useEffect(() => {
    initializeBLE();
    setupBLEListeners();
    return () => {
      BleManager.stopScan();
    };
  }, []);

  const setupBLEListeners = () => {
    // Listen for data updates from connected devices
    BleManager.addListener('BleManagerDidUpdateValueForCharacteristic', (data) => {
      console.log('📨 Received BLE data:', data);
      
      const receivedDataItem: ReceivedData = {
        timestamp: new Date().toLocaleTimeString(),
        data: data.value ? `${arrayToHexString(data.value)} (${arrayToString(data.value)})` : 'No data',
        characteristic: `${data.service}/${data.characteristic}`,
      };
      
      console.log('📋 Formatted data:', receivedDataItem);
      setReceivedData(prev => [receivedDataItem, ...prev.slice(0, 19)]); // Keep last 20 items
    });

    // Listen for connection events
    BleManager.addListener('BleManagerConnectPeripheral', (data) => {
      console.log('🔗 Device connected:', data);
    });

    BleManager.addListener('BleManagerDisconnectPeripheral', (data) => {
      console.log('🔌 Device disconnected:', data);
    });
  };

  const arrayToHexString = (array: number[]): string => {
    return array.map(byte => byte.toString(16).padStart(2, '0')).join(' ').toUpperCase();
  };

  const arrayToString = (array: number[]): string => {
    try {
      return String.fromCharCode(...array);
    } catch (error) {
      return 'Binary Data';
    }
  };

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
        
        // Discover services and characteristics
        await discoverServicesAndCharacteristics(deviceId);
        
        Alert.alert('Success', `Connected to ${device.name}`);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  const discoverServicesAndCharacteristics = async (deviceId: string) => {
    try {
      console.log(`🔍 Discovering services for device: ${deviceId}`);
      
      // Wait a bit for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Retrieve services first
      const serviceAndCharacteristics = await BleManager.retrieveServices(deviceId);
      console.log(`📋 Retrieved services:`, serviceAndCharacteristics);
      
      if (serviceAndCharacteristics && serviceAndCharacteristics.characteristics) {
        console.log(`🔧 Found ${serviceAndCharacteristics.characteristics.length} characteristics`);
        
        // Filter for notify/indicate characteristics only
        const notifyCharacteristics = serviceAndCharacteristics.characteristics.filter(char => {
          const properties = char.properties ? Object.keys(char.properties) : [];
          return properties.includes('Notify') || properties.includes('Indicate');
        });
        
        console.log(`🔔 Found ${notifyCharacteristics.length} notify/indicate characteristics`);
        
        // Start with only the first characteristic to test
        if (notifyCharacteristics.length > 0) {
          const char = notifyCharacteristics[0];
          const properties = char.properties ? Object.keys(char.properties) : [];
          
          console.log(`📡 Testing first characteristic: Service: ${char.service}, Characteristic: ${char.characteristic}`);
          console.log(`   Properties: ${properties.join(', ')}`);
          
          try {
            console.log(`🔔 Attempting to start notification for ${char.service}/${char.characteristic}`);
            await BleManager.startNotification(deviceId, char.service, char.characteristic);
            console.log(`✅ Started notifications for ${char.service}/${char.characteristic}`);
            console.log(`💡 Ready to receive data! Send something from iPhone.`);
          } catch (notifyError) {
            console.log(`❌ Failed to start notification for ${char.characteristic}:`, notifyError);
          }
        } else {
          console.log('❌ No notify/indicate characteristics found');
        }
        
        console.log(`📋 Available services: ${serviceAndCharacteristics.services.map(s => s.uuid).join(', ')}`);
      } else {
        console.log('❌ No characteristics found after retrieveServices');
      }
    } catch (error) {
      console.error('❌ Service discovery failed:', error);
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

  const renderReceivedData = ({ item }: { item: ReceivedData }) => (
    <View style={styles.dataItem}>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
      <Text style={styles.characteristic}>{item.characteristic}</Text>
      <Text style={styles.dataValue}>{item.data}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
        <Text style={styles.sectionTitle}>Connected Devices ({connectedDevices.length})</Text>
        <FlatList
          data={connectedDevices}
          renderItem={renderConnectedDevice}
          keyExtractor={(item) => `connected-${item.id}`}
          style={styles.deviceList}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>Received Data ({receivedData.length})</Text>
        <FlatList
          data={receivedData}
          renderItem={renderReceivedData}
          keyExtractor={(item, index) => `data-${index}`}
          style={styles.dataList}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />

        <Text style={styles.sectionTitle}>Discovered Devices ({discoveredDevices.length})</Text>
        <FlatList
          data={discoveredDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => `discovered-${item.id}`}
          style={styles.discoveredDeviceList}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />
      </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
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
    maxHeight: 150,
    marginBottom: 20,
  },
  discoveredDeviceList: {
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
  dataList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  dataItem: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  characteristic: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  dataValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    marginTop: 4,
    backgroundColor: '#f0f0f0',
    padding: 4,
    borderRadius: 3,
  },
});

export default App;
