import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  Shield,
  Radio,
  TrendingDown,
  AlertTriangle,
  Layers,
  MapPin,
  CheckCircle,
  ArrowUpRight,
  Maximize2,
  Cpu,
} from 'lucide-react';
import { formatCoord } from '../utils/geo';

export const OperationalDashboard: React.FC = () => {
  const { nodes, zones, gateway, alerts, selectNode, selectZone, setActiveTab } = useTelemetry();

  const maxSubsidenceNode = [...nodes].sort((a, b) => b.totalSubsidenceMm - a.totalSubsidenceMm)[0];
  const maxVelocityNode = [...nodes].sort((a, b) => b.subsidenceRateMmYr - a.subsidenceRateMmYr)[0];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 p-4 md:p-6 text-slate-800 font-sans space-y-6">
      {/* Top Banner: Statutory Portal Heading */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <Shield className="w-4 h-4 text-blue-800" />
            <span>DIRECTORATE GENERAL OF MINES SAFETY (DGMS) • STATUTORY MONITORING</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Subsidence &amp; Telemetry Overview
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Korba Coalfield Underground Seam IV • Longwall &amp; Continuous Miner Caving Sectors • SECL Bilaspur
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('network-map')}
            className="px-3 py-1.5 bg-blue-900 border border-blue-900 text-white hover:bg-blue-800 rounded flex items-center gap-1.5 transition-colors font-bold shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Launch 2D Map</span>
          </button>
          <button
            onClick={() => setActiveTab('terrain-3d')}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded flex items-center gap-1.5 transition-colors font-bold shadow-2xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Launch 3D Terrain</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Maximum Subsidence */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
          <div className="flex justify-between items-start text-slate-600 text-xs font-bold">
            <span>MAX DISPLACEMENT</span>
            <span className="text-[10px] text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
              Zone B Goaf
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {maxSubsidenceNode.totalSubsidenceMm} <span className="text-sm font-normal text-slate-500">mm</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center justify-between">
            <span>Mast {maxSubsidenceNode.id}</span>
            <span className="text-blue-900 font-bold text-[11px]">{maxSubsidenceNode.currentElevation.toFixed(3)} m MSL</span>
          </div>
        </div>

        {/* Peak Velocity */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
          <div className="flex justify-between items-start text-slate-600 text-xs font-bold">
            <span>MAX VELOCITY</span>
            <span className="text-[10px] text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
              Critical ≥25 mm/y
            </span>
          </div>
          <div className="text-2xl font-bold text-red-700 mt-2">
            {maxVelocityNode.subsidenceRateMmYr} <span className="text-sm font-normal text-slate-500">mm/yr</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center justify-between">
            <span>Mast {maxVelocityNode.id}</span>
            <span className="text-amber-800 font-bold text-[11px]">DGMS Alert Active</span>
          </div>
        </div>

        {/* Mesh Network Health */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
          <div className="flex justify-between items-start text-slate-600 text-xs font-bold">
            <span>MESH TELEMETRY PDR</span>
            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
              IN865 WPC
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {gateway.pdrPercent}%
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center justify-between">
            <span>{nodes.length}/{nodes.length} Nodes Online</span>
            <span className="text-slate-600 text-[11px]">{gateway.packetsReceivedToday} pkts</span>
          </div>
        </div>

        {/* Overburden & Seam Specs */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs">
          <div className="flex justify-between items-start text-slate-600 text-xs font-bold">
            <span>SEAM GEOMETRY</span>
            <span className="text-[10px] text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300 font-bold">
              Seam IV
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            6.2 <span className="text-sm font-normal text-slate-500">m thickness</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 flex items-center justify-between">
            <span>Overburden Depth</span>
            <span className="text-slate-800 font-semibold text-[11px]">175 &ndash; 230 m</span>
          </div>
        </div>
      </div>

      {/* Main Two Columns: Zones Summary & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Mining Panels (Zones A-C) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-800" />
              <span>Mining Panels &amp; Surface Sectors (Zones A &ndash; C)</span>
            </h3>
            <span className="text-xs font-mono text-slate-600">Anchor: 22.3678° N, 82.6322° E</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {zones.map((zone) => {
              const isCrit = zone.riskLevel === 'critical';
              const isMod = zone.riskLevel === 'moderate';
              return (
                <div
                  key={zone.id}
                  onClick={() => {
                    selectZone(zone);
                    setActiveTab('network-map');
                  }}
                  className="p-3 bg-white border border-slate-300 hover:border-blue-700 rounded-lg cursor-pointer transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isCrit ? 'bg-red-600' : isMod ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                      />
                      <span className="font-bold text-slate-900 group-hover:text-blue-900">
                        ZONE {zone.id}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isCrit
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isMod
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {zone.riskLevel}
                    </span>
                  </div>

                  <div className="py-2 space-y-1 text-xs text-slate-700">
                    <div className="text-[11px] text-slate-500 font-medium truncate">{zone.name}</div>
                    <div className="flex justify-between font-mono text-[11px] pt-1">
                      <span className="text-slate-500">Panel Status:</span>
                      <span className="text-slate-900 font-medium">{zone.status}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Overburden Depth:</span>
                      <span className="text-slate-900">{zone.overburdenDepthM} m</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Avg Subsidence:</span>
                      <span
                        className={`font-bold ${
                          isCrit ? 'text-red-700' : isMod ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {zone.averageSubsidenceRateMmYr} mm/yr
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Peak Recorded:</span>
                      <span className="text-slate-900 font-bold">{zone.maxSubsidenceRecordedMm} mm</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-600">
                    <span>5 Surface Masts (NLN0721)</span>
                    <span className="text-blue-800 font-bold group-hover:underline flex items-center gap-0.5">
                      Inspect <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Statutory Exceedance Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700" />
              <span>Statutory Alert Log</span>
            </h3>
            <span className="text-xs font-mono text-red-700 font-bold">{alerts.length} Active</span>
          </div>

          <div className="space-y-2.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-xs font-mono space-y-1.5 shadow-2xs ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold tracking-wider">{alert.id}</span>
                  <span className="text-slate-600">{alert.timestamp}</span>
                </div>
                <div className="font-sans font-medium text-slate-900 text-xs">{alert.message}</div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                  <span>Current: <strong>{alert.currentValue}</strong> (Limit: {alert.thresholdValue})</span>
                  <span className="text-slate-600">Node {alert.nodeId}</span>
                </div>
                <div className="text-[9px] text-slate-500 italic">
                  Ref: {alert.dgmsReference}
                </div>
              </div>
            ))}
          </div>

          {/* Wi-SUN Hardware Banner */}
          <div className="p-3 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-700 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-[11px]">
              <Radio className="w-3.5 h-3.5" />
              <span>HARDWARE INTEGRITY CHECK</span>
            </div>
            <p className="text-[11px] text-slate-600">
              All 15 surface masts communicating via <strong>Nebulae NLN0721 Wi-SUN Module (IN865 MHz)</strong> over self-healing 6LoWPAN IPv6 mesh.
            </p>
            <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-700" />
              <span>WPC ETA-SD License Active • 0 Dropped Packets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Nodes Telemetry Matrix (All 15 Nodes) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-800" />
            <span>Live Surface Mast Array Telemetry (15 Nodes Cyclic)</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">Updated every 3.2s</span>
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-lg bg-white shadow-xs">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Node ID</th>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3">Coordinates (WGS84)</th>
                <th className="py-2.5 px-3 text-right">Elevation (m)</th>
                <th className="py-2.5 px-3 text-right">Total Sub (mm)</th>
                <th className="py-2.5 px-3 text-right">Rate (mm/yr)</th>
                <th className="py-2.5 px-3 text-right">Tilt X / Y</th>
                <th className="py-2.5 px-3 text-right">Battery (V)</th>
                <th className="py-2.5 px-3 text-right">RSSI</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {nodes.map((node) => {
                const isCrit = node.subsidenceRateMmYr >= 25.0;
                const isMod = node.subsidenceRateMmYr >= 10.0 && node.subsidenceRateMmYr < 25.0;
                return (
                  <tr key={node.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCrit ? 'bg-red-600' : isMod ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                      />
                      <span>{node.id}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-700">Zone {node.zoneId}</td>
                    <td className="py-2 px-3 text-slate-600 text-[10px]">{formatCoord(node.lat, node.lng)}</td>
                    <td className="py-2 px-3 text-right text-slate-800">{node.currentElevation.toFixed(3)}</td>
                    <td className="py-2 px-3 text-right font-semibold text-blue-900">
                      -{node.totalSubsidenceMm.toFixed(1)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        isCrit ? 'text-red-700' : isMod ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {node.subsidenceRateMmYr}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {node.tiltX > 0 ? `+${node.tiltX.toFixed(2)}` : node.tiltX.toFixed(2)}° / {node.tiltY > 0 ? `+${node.tiltY.toFixed(2)}` : node.tiltY.toFixed(2)}°
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-800 font-semibold">{node.batteryVoltage.toFixed(2)}V</td>
                    <td className="py-2 px-3 text-right text-slate-700">{node.signalRssi} dBm</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => {
                          selectNode(node);
                          setActiveTab('network-map');
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-blue-900 text-[10px] rounded transition-colors font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
