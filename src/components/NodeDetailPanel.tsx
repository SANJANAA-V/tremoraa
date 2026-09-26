import React from 'react';
import { SensorNode } from '../types';
import { formatCoord } from '../utils/geo';
import {
  X,
  Radio,
  ArrowRight,
  TrendingDown,
  Compass,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface NodeDetailPanelProps {
  node: SensorNode;
  onClose: () => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onClose }) => {
  const isCritical = node.subsidenceRateMmYr >= 25.0;
  const isModerate = node.subsidenceRateMmYr >= 10.0 && node.subsidenceRateMmYr < 25.0;

  return (
    <div className="w-96 bg-white border-l border-slate-300 shadow-xl flex flex-col h-full z-20 text-slate-800 overflow-y-auto font-sans flex-shrink-0">
      {/* Header bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isCritical
                ? 'bg-red-600'
                : isModerate
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900 tracking-wide">
                NODE {node.id}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 font-bold">
                ZONE {node.zoneId}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[210px]">{node.name}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="Close detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-4 text-xs">
        {/* Risk Level Badge */}
        <div
          className={`p-2.5 rounded border ${
            isCritical
              ? 'bg-red-50 border-red-300 text-red-900'
              : isModerate
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between font-mono font-semibold">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              STATUS: {isCritical ? 'CRITICAL EXCEEDANCE' : isModerate ? 'MODERATE SETTLEMENT' : 'STABLE BASELINE'}
            </span>
            <span className="font-bold">{node.subsidenceRateMmYr} mm/yr</span>
          </div>
          <p className="text-[10px] mt-1 opacity-90">
            Threshold: Critical ≥ 25 mm/yr • Moderate 10-25 mm/yr • Stable &lt; 10 mm/yr
          </p>
        </div>

        {/* Primary Geodetic & Subsidence Telemetry */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2">
          <div className="text-[10px] font-mono text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-blue-800" />
            <span>Geodetic &amp; Subsidence Telemetry</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">TOTAL SUBSIDENCE</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {node.totalSubsidenceMm} <span className="text-xs font-normal text-slate-500">mm</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">SUBSIDENCE RATE</div>
              <div
                className={`text-base font-bold mt-0.5 ${
                  isCritical ? 'text-red-700' : isModerate ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {node.subsidenceRateMmYr} <span className="text-xs font-normal text-slate-500">mm/yr</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">CURRENT ELEVATION</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {node.currentElevation.toFixed(3)} <span className="text-[10px] text-slate-500">m (MSL)</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">BASELINE DATUM</div>
              <div className="text-sm font-semibold text-slate-700 mt-0.5">
                {node.baselineElevation.toFixed(3)} <span className="text-[10px] text-slate-500">m (MSL)</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-700 pt-1 flex justify-between border-t border-slate-200">
            <span className="text-slate-500">GPS Coordinates:</span>
            <span className="text-slate-900 font-bold">{formatCoord(node.lat, node.lng)}</span>
          </div>
        </div>

        {/* Dual-Axis Tilt & Inertial Dynamics */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2">
          <div className="text-[10px] font-mono text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-800" />
            <span>Dual-Axis MEMS Tilt Deflection</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">TILT X (EAST-WEST)</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {node.tiltX > 0 ? `+${node.tiltX.toFixed(2)}` : node.tiltX.toFixed(2)}°
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">TILT Y (NORTH-SOUTH)</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {node.tiltY > 0 ? `+${node.tiltY.toFixed(2)}` : node.tiltY.toFixed(2)}°
              </div>
            </div>
          </div>
        </div>

        {/* Hardware & Mesh Network Route Path */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2 font-mono text-[11px]">
          <div className="text-[10px] text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-800" />
            <span>Wi-SUN Mesh Routing Path</span>
          </div>

          <div className="p-2 bg-white border border-slate-200 rounded space-y-1.5 shadow-2xs">
            <div className="flex items-center text-slate-500 text-[10px] font-bold">
              <span>NODE → GATEWAY → CLOUD ROUTE:</span>
            </div>
            <div className="space-y-1 text-slate-800">
              {node.routePath.map((step, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 text-blue-900 flex items-center justify-center text-[9px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] truncate">{step}</span>
                  {idx < node.routePath.length - 1 && (
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400 ml-auto flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-[9px] text-blue-900 font-bold pt-1 border-t border-slate-200">
              Connection: Wi-SUN Mesh Relay (NLN0721, IN865 MHz)
            </div>
          </div>

          {/* Node Health Metrics */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
            <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block text-[9px]">BATTERY</span>
              <span className="font-bold text-emerald-800">{node.batteryVoltage.toFixed(2)} V</span>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block text-[9px]">CURRENT</span>
              <span className="font-bold text-slate-900">{node.currentDrawMa.toFixed(1)} mA</span>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200 shadow-2xs">
              <span className="text-slate-500 block text-[9px]">RSSI</span>
              <span className="font-bold text-blue-900">{node.signalRssi} dBm</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 flex justify-between pt-1">
            <span>Hop Count: {node.hopCount} {node.hopCount === 1 ? '(Direct)' : '(1 Hop)'}</span>
            <span>Sampling: 3.2s Cyclic</span>
          </div>
        </div>

        {/* 12-Month Historical Telemetry Table */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2">
          <div className="text-[10px] font-mono text-blue-900 font-bold uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-800" />
              <span>Historical Elevation (12 Months)</span>
            </span>
            <span className="text-[9px] text-slate-500 font-normal">Monthly Datum</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded bg-white">
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-1 px-1.5">Period</th>
                  <th className="py-1 px-1.5 text-right">Elev (m)</th>
                  <th className="py-1 px-1.5 text-right">Sub (mm)</th>
                  <th className="py-1 px-1.5 text-right">Rate (mm/y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {node.historicalReadings.slice(-6).map((reading, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1 px-1.5 text-slate-700">{reading.month.split(' ')[0]}</td>
                    <td className="py-1 px-1.5 text-right text-slate-900 font-medium">{reading.elevationM.toFixed(3)}</td>
                    <td className="py-1 px-1.5 text-right font-bold text-blue-900">
                      -{reading.subsidenceMm.toFixed(1)}
                    </td>
                    <td
                      className={`py-1 px-1.5 text-right font-bold ${
                        reading.rateMmYr >= 25 ? 'text-red-700' : reading.rateMmYr >= 10 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {reading.rateMmYr.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radio Hardware Summary */}
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
          <div className="text-slate-900 font-bold uppercase text-[10px]">Transceiver Architecture</div>
          <div>{node.hardware.module}</div>
          <div>RF Band: {node.hardware.band}</div>
          <div>Processor: {node.hardware.soc}</div>
          <div>Certification: {node.hardware.certification}</div>
        </div>
      </div>
    </div>
  );
};
