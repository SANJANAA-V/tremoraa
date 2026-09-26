import React, { createContext, useContext, useEffect, useState } from 'react';
import { CentralGateway, MiningZone, SensorNode, SubsidenceAlert } from '../types';
import { INITIAL_ALERTS, INITIAL_GATEWAY, INITIAL_NODES, INITIAL_ZONES } from '../data/mockData';

interface TelemetryContextType {
  nodes: SensorNode[];
  zones: MiningZone[];
  gateway: CentralGateway;
  alerts: SubsidenceAlert[];
  selectedNode: SensorNode | null;
  selectedZone: MiningZone | null;
  selectNode: (node: SensorNode | null) => void;
  selectZone: (zone: MiningZone | null) => void;
  lastSyncTime: Date;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pulseCounter: number;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<SensorNode[]>(INITIAL_NODES);
  const [zones] = useState<MiningZone[]>(INITIAL_ZONES);
  const [gateway, setGateway] = useState<CentralGateway>(INITIAL_GATEWAY);
  const [alerts] = useState<SubsidenceAlert[]>(INITIAL_ALERTS);
  const [selectedNode, setSelectedNode] = useState<SensorNode | null>(INITIAL_NODES[5]); // B-01 (Zone B) by default
  const [selectedZone, setSelectedZone] = useState<MiningZone | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>('network-map');
  const [pulseCounter, setPulseCounter] = useState<number>(0);

  // Live ticking clock & realistic correlated zone-level fluctuations every 3.2 seconds
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLastSyncTime(new Date());
      setPulseCounter((p) => (p + 1) % 100);
    }, 1000);

    const telemetryInterval = setInterval(() => {
      // Per-zone correlated ground dynamics (so nodes within the same zone move together!)
      const zoneDynamics: Record<string, { tiltX: number; tiltY: number; elevMm: number; vib: number; draw: number }> = {
        A: {
          tiltX: (Math.random() - 0.5) * 0.008,
          tiltY: (Math.random() - 0.5) * 0.008,
          elevMm: (Math.random() - 0.5) * 0.06,
          vib: (Math.random() - 0.5) * 0.006,
          draw: (Math.random() - 0.5) * 0.08,
        },
        B: {
          // Zone B closest to advancing depression: slightly more dynamic
          tiltX: (Math.random() - 0.5) * 0.012,
          tiltY: (Math.random() - 0.5) * 0.012,
          elevMm: (Math.random() - 0.5) * 0.09,
          vib: (Math.random() - 0.5) * 0.010,
          draw: (Math.random() - 0.5) * 0.10,
        },
        C: {
          // Zone C stable barrier pillar: very minimal movement
          tiltX: (Math.random() - 0.5) * 0.003,
          tiltY: (Math.random() - 0.5) * 0.003,
          elevMm: (Math.random() - 0.5) * 0.02,
          vib: (Math.random() - 0.5) * 0.002,
          draw: (Math.random() - 0.5) * 0.04,
        },
      };

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const zd = zoneDynamics[node.zoneId] || { tiltX: 0, tiltY: 0, elevMm: 0, vib: 0, draw: 0 };
          // Tiny local sensor instrument noise (±0.001)
          const localNoiseX = (Math.random() - 0.5) * 0.002;
          const localNoiseY = (Math.random() - 0.5) * 0.002;
          const localNoiseElev = (Math.random() - 0.5) * 0.01;

          const updatedTiltX = parseFloat((node.tiltX + zd.tiltX + localNoiseX).toFixed(3));
          const updatedTiltY = parseFloat((node.tiltY + zd.tiltY + localNoiseY).toFixed(3));
          const updatedCurrentDraw = Math.max(12.0, Math.min(18.0, parseFloat((node.currentDrawMa + zd.draw).toFixed(2))));
          const updatedElev = parseFloat((node.currentElevation + (zd.elevMm + localNoiseElev) / 1000).toFixed(4));
          const updatedVib = Math.max(0.02, parseFloat((node.vibrationMmS + zd.vib).toFixed(2)));

          return {
            ...node,
            tiltX: updatedTiltX,
            tiltY: updatedTiltY,
            currentDrawMa: updatedCurrentDraw,
            currentElevation: updatedElev,
            vibrationMmS: updatedVib,
            lastTelemetry: new Date().toISOString(),
          };
        })
      );

      // Increment gateway packet count
      setGateway((prevGw) => ({
        ...prevGw,
        packetsReceivedToday: prevGw.packetsReceivedToday + Math.floor(Math.random() * 4) + 1,
      }));
    }, 3200);

    return () => {
      clearInterval(clockInterval);
      clearInterval(telemetryInterval);
    };
  }, []);

  const selectNode = (node: SensorNode | null) => {
    setSelectedNode(node);
    if (node) {
      setSelectedZone(null); // clear zone selection to focus on node
    }
  };

  const selectZone = (zone: MiningZone | null) => {
    setSelectedZone(zone);
    if (zone) {
      setSelectedNode(null); // clear node selection to focus on zone
    }
  };

  return (
    <TelemetryContext.Provider
      value={{
        nodes,
        zones,
        gateway,
        alerts,
        selectedNode,
        selectedZone,
        selectNode,
        selectZone,
        lastSyncTime,
        activeTab,
        setActiveTab,
        pulseCounter,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
