export type ConnectionType = 'BLE' | 'Cloud API' | 'Mobile Bridge' | 'Simulator';

export type ConnectionStatus = 
  | 'Searching'
  | 'Pairing'
  | 'Connected'
  | 'Disconnected'
  | 'Reconnecting'
  | 'Failed'
  | 'Unsupported Browser'
  | 'Permission Denied';

export type DeviceHealthState = 
  | 'Excellent'
  | 'Good'
  | 'Weak Signal'
  | 'Needs Sync'
  | 'Low Battery'
  | 'Offline'
  | 'Updating'
  | 'Error';

export type FirmwareStatus = 'Up To Date' | 'Update Available';

export interface SyncAnalytics {
    successRate: number;      // e.g. 98
    avgSyncTime: number;      // e.g. 4.2 seconds
    failedSyncCount: number;
    totalImports: number;
    todayImports: number;
    weeklyImports: number;
    monthlyImports: number;
}

export interface DeviceMetrics {
    heartRate?: number;
    hrv?: number;
    bloodOxygen?: number;
    bodyTemperature?: number;
    sleepHours?: number;
    recoveryScore?: number;
    stressLevel?: number;
    respirationRate?: number;
    caloriesBurned?: number;
    steps?: number;
    workoutMinutes?: number;
    vo2Max?: number;
    restingHeartRate?: number;
    weight?: number;
}

export interface WearableDevice {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    logo: string; // lucide icon name or emoji representation
    connectionType: ConnectionType;
    connectionStatus: ConnectionStatus;
    healthState: DeviceHealthState;
    batteryLevel?: number;
    firmwareVersion?: string;
    latestFirmwareVersion?: string;
    firmwareStatus?: FirmwareStatus;
    lastFirmwareCheck?: string;
    rssi?: number; // signal strength -dBm or index 0-4
    connectionQuality?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'N/A';
    lastSyncTime?: string;
    dataImportedCount?: number;
    supportedMetrics: string[];
    metrics?: DeviceMetrics;
    permissions: Record<string, boolean>;
    syncFrequency: 'Manual' | '15m' | '30m' | '1h' | 'Daily' | 'WiFi-only' | 'Charging-only';
    priorityOrder: number; // For conflict resolution (lower is higher priority)
    syncAnalytics?: SyncAnalytics;
}

export interface SyncLogEntry {
    id: string;
    timestamp: string;
    deviceId: string;
    deviceName: string;
    eventType: 'Connected' | 'Disconnected' | 'Sleep Imported' | 'Workout Synced' | 'Recovery Updated' | 'Battery Low' | 'Firmware Updated' | 'Permission Changed' | 'Sync Success' | 'Sync Failed';
    description: string;
}

export type ConflictResolutionPolicy = 
  | 'Preferred Device' 
  | 'Newest Reading' 
  | 'Highest Value' 
  | 'Merge Values';

export interface WearableAdapter {
    deviceInfo: WearableDevice;
    connect(): Promise<WearableDevice>;
    disconnect(): Promise<WearableDevice>;
    sync(): Promise<WearableDevice>;
    getDiagnostics(): Record<string, any>;
}
