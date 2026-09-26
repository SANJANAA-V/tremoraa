export type RiskLevel = 'stable' | 'moderate' | 'critical';

export interface HistoricalReading {
  month: string;
  elevationM: number;
  subsidenceMm: number;
  rateMmYr: number;
}

export interface NodeHardwareInfo {
  module: string;
  band: string;
  soc: string;
  certification: string;
  topology: string;
  range: string;
  uplink: string;
}

export interface SensorNode {
  id: string;
  zoneId: 'A' | 'B' | 'C';
  name: string;
  lat: number;
  lng: number;
  baselineElevation: number; // in meters (MSL)
  currentElevation: number; // in meters
  totalSubsidenceMm: number; // in mm
  subsidenceRateMmYr: number; // in mm/yr
  batteryVoltage: number; // in Volts (e.g. 3.65V)
  currentDrawMa: number; // in mA (e.g. 14.8 mA)
  signalRssi: number; // in dBm (e.g. -68 dBm)
  tiltX: number; // degrees
  tiltY: number; // degrees
  vibrationMmS: number; // RMS vibration velocity (mm/s)
  lastTelemetry: string; // ISO string
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  hopCount: number;
  relayThrough: string | null;
  routePath: string[];
  historicalReadings: HistoricalReading[];
  hardware: NodeHardwareInfo;
}

export interface MiningZone {
  id: 'A' | 'B' | 'C';
  name: string;
  panelCode: string;
  status: 'Active Extraction' | 'Goaf Caving Stage' | 'Depillaring In-Progress' | 'Continuous Miner Panel';
  riskLevel: RiskLevel;
  overburdenDepthM: number;
  seamThicknessM: number;
  areaHectares: number;
  extractionRateTonsDay: number;
  averageSubsidenceRateMmYr: number;
  maxSubsidenceRecordedMm: number;
  nodeIds: string[];
  polygonCoords: [number, number][]; // [lat, lng]
  center: [number, number];
  hubCoords: [number, number]; // [lat, lng] of local zone hub point
  hubName: string;
}

export interface CentralGateway {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevationM: number;
  hardware: string;
  band: string;
  soc: string;
  ipAddress: string;
  pdrPercent: number;
  packetsReceivedToday: number;
  status: 'ONLINE' | 'FAILOVER' | 'MAINTENANCE';
  uplinkProtocol: string;
}

export interface MeshConnection {
  fromId: string;
  toId: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  distanceMeters: number;
  rssi: number;
  status: 'ACTIVE' | 'RELAY' | 'BACKUP';
}

export interface SubsidenceAlert {
  id: string;
  timestamp: string;
  nodeId: string;
  zoneId: 'A' | 'B' | 'C';
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  type: 'RATE_EXCEEDANCE' | 'ACCELERATED_TILT' | 'BATTERY_LOW' | 'SIGNAL_DEGRADATION';
  message: string;
  currentValue: string;
  thresholdValue: string;
  dgmsReference: string;
}
