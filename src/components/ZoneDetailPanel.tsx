import React from 'react';
import { MiningZone, SensorNode } from '../types';
import { X, Layers, AlertCircle, TrendingDown, Drill } from 'lucide-react';
import { formatCoord } from '../utils/geo';

interface ZoneDetailPanelProps {
  zone: MiningZone;
  nodes: SensorNode[];
  onSelectNode: (node: SensorNode) => void;
  onClose: () => void;
}

export const ZoneDetailPanel: React.FC<ZoneDetailPanelProps> = ({
  zone,
  nodes,
  onSelectNode,
  onClose,
}) => {
  const zoneNodes = nodes.filter((n) => zone.nodeIds.includes(n.id));
  const isCritical = zone.riskLevel === 'critical';
  const isModerate = zone.riskLevel === 'moderate';

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
                ZONE {zone.id}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 font-bold">
                {zone.panelCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-[210px]">{zone.name}</p>
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
              STATUS: {zone.status.toUpperCase()}
            </span>
            <span className="font-bold">{zone.averageSubsidenceRateMmYr} mm/yr avg</span>
          </div>
          <p className="text-[10px] mt-1 opacity-90">
            {isCritical
              ? 'CRITICAL ALERT: Accelerated caving settlement observed. Strict DGMS safety monitoring enforced.'
              : isModerate
              ? 'MODERATE: Normal secondary consolidation phase following longwall retreat.'
              : 'STABLE: Elastic overburden response within statutory permissible limits.'}
          </p>
        </div>

        {/* Geological & Mining Parameters */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2">
          <div className="text-[10px] font-mono text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Drill className="w-3.5 h-3.5 text-blue-800" />
            <span>Geological &amp; Mining Parameters</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">OVERBURDEN DEPTH</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {zone.overburdenDepthM} <span className="text-xs font-normal text-slate-500">m</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">SEAM THICKNESS</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {zone.seamThicknessM} <span className="text-xs font-normal text-slate-500">m</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">PANEL AREA</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {zone.areaHectares} <span className="text-[10px] text-slate-500">Ha</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">EXTRACTION RATE</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {zone.extractionRateTonsDay} <span className="text-[10px] text-slate-500">t/day</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-700 pt-1 flex justify-between border-t border-slate-200">
            <span className="text-slate-500">Zone Centroid:</span>
            <span className="text-slate-900 font-bold">{formatCoord(zone.center[0], zone.center[1])}</span>
          </div>
        </div>

        {/* Subsidence Extremes */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2 font-mono">
          <div className="text-[10px] text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-blue-800" />
            <span>Zone Subsidence Summary</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">MAX SUBSIDENCE</div>
              <div className="text-base font-bold text-red-700 mt-0.5">
                {zone.maxSubsidenceRecordedMm} <span className="text-xs font-normal text-slate-500">mm</span>
              </div>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">ACTIVE NODES</div>
              <div className="text-base font-bold text-blue-900 mt-0.5">
                {zoneNodes.length} <span className="text-xs font-normal text-slate-500">Masts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Installed Surface Masts in this Zone */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2">
          <div className="text-[10px] font-mono text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-800" />
            <span>Assigned Surface Telemetry Nodes</span>
          </div>

          <div className="space-y-1.5">
            {zoneNodes.map((node) => {
              const nodeCritical = node.subsidenceRateMmYr >= 25.0;
              const nodeModerate = node.subsidenceRateMmYr >= 10.0 && node.subsidenceRateMmYr < 25.0;

              return (
                <button
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className="w-full p-2 bg-white border border-slate-200 hover:border-blue-400 rounded text-left transition-colors flex items-center justify-between font-mono shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        nodeCritical ? 'bg-red-600' : nodeModerate ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                    />
                    <div>
                      <div className="text-slate-900 font-bold text-xs">NODE {node.id}</div>
                      <div className="text-[10px] text-slate-500">{node.currentElevation.toFixed(2)} m MSL</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-bold ${
                        nodeCritical ? 'text-red-700' : nodeModerate ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {node.subsidenceRateMmYr} mm/yr
                    </div>
                    <div className="text-[10px] text-slate-500">-{node.totalSubsidenceMm} mm</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Radio Link Protocol */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-600">
          <div className="text-blue-900 font-bold mb-1">Telemetry Backhaul:</div>
          <div>All nodes in Zone {zone.id} utilize Wi-SUN Mesh Relay (NLN0721, IN865 MHz) transmitting via HUB-{zone.id} to Central Gateway #01.</div>
        </div>
      </div>
    </div>
  );
};
