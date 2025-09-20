# BLE POC App - react-native-ble-manager実用性検証

React Native Bluetooth Low Energy (BLE) 通信のプルーフオブコンセプトアプリケーション。`react-native-ble-manager`ライブラリの実用性とパフォーマンスを検証することを目的としています。

## プロジェクト概要

このプロジェクトは、React NativeでBLE通信機能を実装し、以下の要素を検証するために作成されました：

- BLEデバイスのスキャン・発見機能
- デバイスとの接続・切断処理
- プラットフォーム固有の権限管理
- パフォーマンスと安定性
- 実際のアプリケーションでの利用可能性

## 技術スタック

- **React Native**: 0.81.4
- **TypeScript**: TypeScriptによる型安全な開発
- **react-native-ble-manager**: BLE通信ライブラリ
- **react-native-safe-area-context**: セーフエリア対応

## 機能概要

### 実装済み機能

1. **BLEスキャニング機能**
   - 周辺のBLEデバイスを検索
   - RSSI値による信号強度表示
   - 10秒間のスキャンタイムアウト

2. **デバイス接続管理**
   - 発見されたデバイスへの接続
   - 接続状態の管理と表示
   - デバイスの切断処理

3. **権限管理**
   - Android: 位置情報権限、Bluetooth権限（API31+対応）
   - iOS: Bluetooth使用権限、位置情報権限

4. **ユーザーインターフェース**
   - デバイス一覧表示（接続済み・発見済み）
   - リアルタイムスキャン状態表示
   - 直感的な接続・切断ボタン

## アーキテクチャ設計

```
App.tsx (メインコンポーネント)
├── BLE初期化処理
├── 権限管理システム
├── デバイススキャン管理
├── 接続状態管理
└── UI コンポーネント
    ├── スキャンボタン
    ├── 接続済みデバイス一覧
    └── 発見済みデバイス一覧
```

### 主要コンポーネント構成

1. **BLE Manager初期化**
   ```typescript
   const initializeBLE = async () => {
     await BleManager.start({ showAlert: false });
     // プラットフォーム固有の権限要求
   }
   ```

2. **デバイススキャン**
   ```typescript
   const startScan = async () => {
     await BleManager.scan([], 10, false);
     // 10秒後に自動停止して結果取得
   }
   ```

3. **権限管理**
   - Android: PermissionsAndroidによる動的権限要求
   - iOS: Info.plistでの事前権限設定

## セットアップ手順

### 前提条件

React Native開発環境が構築済みであること：
- Node.js (v18以上推奨)
- Android Studio / Xcode
- React Native CLI

### インストール

```bash
# 依存関係のインストール
npm install

# iOS依存関係のインストール
cd ios && pod install && cd ..
```

### 実行

```bash
# Metro server起動
npm start

# Android実行
npm run android

# iOS実行
npm run ios
```

## 権限設定

### Android (AndroidManifest.xml)

```xml
<!-- 基本BLE権限 -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Android 12+ BLE権限 -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

<!-- 必須機能 -->
<uses-feature android:name="android.hardware.bluetooth_le" android:required="true" />
```

### iOS (Info.plist)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location to discover nearby Bluetooth devices</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to connect to nearby devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app uses Bluetooth to connect to peripheral devices</string>
```

## 検証項目

### 機能検証
- [x] BLEデバイスの検出能力
- [x] 接続・切断の安定性
- [x] 権限管理の動作確認
- [ ] データ通信の実装
- [ ] 複数デバイス同時接続
- [ ] バックグラウンド動作

### パフォーマンス検証
- [ ] スキャン処理の負荷測定
- [ ] メモリ使用量の監視
- [ ] バッテリー消費の評価
- [ ] 接続レスポンス時間

### 実用性検証
- [ ] 実機での動作確認
- [ ] 様々なBLEデバイスとの互換性
- [ ] エラーハンドリングの堅牢性
- [ ] ユーザビリティの評価

## 既知の制限事項

1. **Android 12+での権限要求**
   - 新しいBluetooth権限への対応が必要
   - 位置情報権限も併せて必要

2. **iOS制限**
   - バックグラウンドでのBLE操作に制限
   - Core Bluetooth固有の制約

3. **プラットフォーム差異**
   - AndroidとiOSでのBLE動作の違い
   - 権限管理の実装差異

## 今後の拡張予定

1. **データ通信機能**
   - Characteristic読み書き
   - Notification購読
   - カスタムサービス対応

2. **デバイス管理強化**
   - ペアリング状態管理
   - 自動再接続機能
   - 接続履歴保存

3. **監視・ログ機能**
   - 通信ログ記録
   - パフォーマンス計測
   - エラー追跡

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 参考資料

- [react-native-ble-manager Documentation](https://github.com/innoveit/react-native-ble-manager)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Bluetooth Low Energy Developer Guide](https://developer.android.com/guide/topics/connectivity/bluetooth/ble)
- [Core Bluetooth Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/)