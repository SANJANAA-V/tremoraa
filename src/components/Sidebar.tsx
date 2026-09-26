import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  LayoutDashboard,
  Map,
  Box,
  Flame,
  TrendingUp,
  AlertOctagon,
  FileText,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, nodes } = useTelemetry();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Operational Dashboard',
      sublabel: 'Overview & telemetry KPIs',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'network-map',
      label: 'Node Network Map',
      sublabel: '2D geospatial telemetry',
      icon: Map,
      badge: '15 Live',
      badgeColor: 'border-slate-300 bg-slate-100 text-slate-700',
    },
    {
      id: 'terrain-3d',
      label: '3D Terrain Comparison',
      sublabel: 'Mar 2024 vs Mar 2025 mesh',
      icon: Box,
      badge: null,
    },
    {
      id: 'prediction-forecasting',
      label: 'Expected vs Actual Subsidence',
      sublabel: 'Knothe physics vs measured',
      icon: TrendingUp,
      badge: 'New',
      badgeColor: 'border-blue-300 bg-blue-100 text-blue-900 font-semibold',
    },
    {
      id: 'subsidence-heatmap',
      label: 'Subsidence Heatmap',
      sublabel: 'IDW spatial interpolation',
      icon: Flame,
      badge: null,
    },
    {
      id: 'alerts-reports',
      label: 'Alerts & Reports',
      sublabel: 'Statutory log & CSV export',
      icon: AlertOctagon,
      badge: '2',
      badgeColor: 'border-red-300 bg-red-100 text-red-800 font-bold',
    },
    {
      id: 'about-methodology',
      label: 'About & Methodology',
      sublabel: 'Physics formulation & specs',
      icon: FileText,
      badge: null,
    },
  ];

  const onlineNodes = nodes.filter((n) => n.status === 'ONLINE').length;

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between text-slate-700 select-none flex-shrink-0 z-20">
      <div className="p-3 space-y-3">
        {/* Active Sector Jurisdiction Card */}
        <div className="p-2.5 bg-white border border-slate-200 rounded font-mono text-[11px] space-y-1 shadow-2xs">
          <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-800" />
            <span>ACTIVE SECTOR JURISDICTION</span>
          </div>
          <div className="font-bold text-slate-900 text-xs">Korba Coalfield</div>
          <div className="text-slate-600 text-[10px]">SECL Sector-VII • Area IV</div>
          <div className="text-slate-600 text-[10px] pt-0.5 border-t border-slate-200">
            22.3678°N, 82.6322°E • Seam IV
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 font-sans text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded text-left transition-all ${
                  isActive
                    ? 'bg-blue-50/90 border-l-4 border-l-blue-800 border-y border-r border-slate-200 text-blue-950 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      isActive ? 'text-blue-800' : 'text-slate-600'
                    }`}
                  />
                  <div className="truncate">
                    <div className={`leading-tight ${isActive ? 'text-blue-950 font-bold' : 'text-slate-800 font-medium'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ml-1 flex-shrink-0 ${
                      item.badgeColor || 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Station Telemetry Health Box */}
      <div className="p-3 border-t border-slate-200 bg-white text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-slate-600 pb-1 border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
            <span>STATION TELEMETRY HEALTH</span>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
        </div>

        <div className="space-y-1 text-slate-700 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Online Stations:</span>
            <span className="text-slate-900 font-bold">{onlineNodes} / {nodes.length} (100%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sampling Interval:</span>
            <span className="text-slate-700">15 min (Cyclic)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Uplink Protocol:</span>
            <span className="text-slate-900 font-semibold" title="Wi-SUN NLN0721 IN865 + 4G MQTT">
              Wi-SUN + 4G MQTT
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
