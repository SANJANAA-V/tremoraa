import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { AlertCircle, Activity, RotateCw, Shield } from 'lucide-react';
import { MINE_INFO } from '../data/mockData';

export const Header: React.FC = () => {
  const { lastSyncTime, alerts, setActiveTab } = useTelemetry();

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;

  const formattedTime = lastSyncTime.toLocaleTimeString('en-IN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 px-4 py-2.5 shadow-xs flex-shrink-0 z-30">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Institutional & Mine site identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 flex-shrink-0">
            <Shield className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-700 font-bold leading-none">
              GOVERNMENT OF INDIA • DGMS &amp; SECL STATUTORY MONITORING
            </div>
            <div className="text-sm font-bold text-slate-900 font-sans tracking-tight mt-0.5">
              SECL Korba Coalfield • Sector-VII Colliery (Seam IV)
            </div>
          </div>
        </div>

        {/* Right: Last Sync, Live Feed, Alert Breach Badge */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Last Sync */}
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <RotateCw className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-700">Last Sync:</span>
            <span className="text-slate-900 font-semibold">{formattedTime} IST</span>
          </div>

          {/* Live Feed */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[11px] font-semibold">
            <Activity className="w-3.5 h-3.5 text-emerald-800" />
            <span>Live Feed</span>
          </div>

          {/* Alert Breach Banner (Amber/Red strictly reserved for alerts) */}
          <button
            onClick={() => setActiveTab('alerts-reports')}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-[11px] font-bold tracking-wide transition-colors shadow-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-white" />
            <span>ALERT • {criticalCount || 2} BREACH</span>
          </button>
        </div>
      </div>
    </header>
  );
};
