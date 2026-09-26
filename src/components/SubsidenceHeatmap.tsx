import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { Flame, Layers, TrendingDown } from 'lucide-react';

export const SubsidenceHeatmap: React.FC = () => {
  const { nodes, zones } = useTelemetry();
  const [sliceAxis, setSliceAxis] = useState<'TRANSVERSE' | 'LONGITUDINAL'>('TRANSVERSE');

  // Calculate synthetic cross-sectional curve across Korba Goaf & Longwall
  const pointsCount = 40;
  const crossSectionPoints = Array.from({ length: pointsCount }, (_, i) => {
    const distM = i * 25; // 0 to 1000m across mine surface
    const x = distM - 450;
    const trough = 168 * Math.exp(-(x * x) / (2 * 125 * 125));
    const secondary = 74 * Math.exp(-((distM - 200) * (distM - 200)) / (2 * 90 * 90));
    const totalSub = parseFloat((trough + secondary).toFixed(1));
    const surfaceElev = parseFloat((302 - totalSub / 1000).toFixed(3));
    const tensileStrain = parseFloat(((x / (125 * 125)) * trough * 0.1).toFixed(2));

    return {
      distanceM: distM,
      subsidenceMm: totalSub,
      elevationM: surfaceElev,
      tensileStrainMmPerM: tensileStrain,
    };
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 p-4 md:p-6 text-slate-800 font-sans space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>DEFORMATION CONTOUR &amp; INFLUENCE FUNCTION ANALYSIS</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Subsidence Isoline &amp; Trough Profile Analysis
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Continuous Inverse-Distance Weighted (IDW) interpolation over Seam IV longwall &amp; goaf caving panels
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-600 font-bold">Section Profile:</span>
          <button
            onClick={() => setSliceAxis('TRANSVERSE')}
            className={`px-3 py-1.5 rounded border transition-colors font-bold ${
              sliceAxis === 'TRANSVERSE'
                ? 'bg-blue-900 border-blue-900 text-white shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            A-A' Transverse (E-W)
          </button>
          <button
            onClick={() => setSliceAxis('LONGITUDINAL')}
            className={`px-3 py-1.5 rounded border transition-colors font-bold ${
              sliceAxis === 'LONGITUDINAL'
                ? 'bg-blue-900 border-blue-900 text-white shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            B-B' Longitudinal (N-S)
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Contour Field & Cross Sectional Trough */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continuous Spatial Heatmap Canvas */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between font-mono text-xs pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-800" />
              <span>2D Subsidence Isoline Interpolation</span>
            </span>
            <span className="text-slate-600">Anchor: 22.3678° N, 82.6322° E</span>
          </div>

          {/* SVG Heatmap Representation with Isolines */}
          <div className="relative aspect-video w-full bg-slate-50 rounded border border-slate-300 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 600 400" className="w-full h-full">
              <defs>
                <radialGradient id="centralHeat" cx="50%" cy="50%" r="42%">
                  <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#ea580c" stopOpacity="0.65" />
                  <stop offset="65%" stopColor="#ca8a04" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="zoneBHeat" cx="72%" cy="65%" r="30%">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#ca8a04" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="zoneAHeat" cx="50%" cy="26%" r="28%">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#16a34a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background map grid */}
              <rect width="600" height="400" fill="#f8fafc" />

              {/* Grid lines */}
              <line x1="100" y1="0" x2="100" y2="400" stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1="200" y1="0" x2="200" y2="400" stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1="300" y1="0" x2="300" y2="400" stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1="400" y1="0" x2="400" y2="400" stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1="500" y1="0" x2="500" y2="400" stroke="#e2e8f0" strokeDasharray="3,3" />

              {/* Heat zones */}
              <circle cx="300" cy="200" r="170" fill="url(#centralHeat)" />
              <circle cx="430" cy="260" r="120" fill="url(#zoneBHeat)" />
              <circle cx="300" cy="110" r="110" fill="url(#zoneAHeat)" />

              {/* Isoline Contours */}
              <ellipse cx="300" cy="200" rx="140" ry="110" fill="none" stroke="#ca8a04" strokeWidth="1.2" strokeDasharray="3,3" />
              <ellipse cx="300" cy="200" rx="90" ry="70" fill="none" stroke="#ea580c" strokeWidth="1.5" />
              <ellipse cx="300" cy="200" rx="45" ry="35" fill="none" stroke="#b91c1c" strokeWidth="2" />

              {/* Cross-section cutting line */}
              <line x1="40" y1="200" x2="560" y2="200" stroke="#0f172a" strokeWidth="2" strokeDasharray="6,4" />
              <text x="50" y="190" fill="#0f172a" fontSize="12" fontFamily="monospace" fontWeight="bold">A</text>
              <text x="545" y="190" fill="#0f172a" fontSize="12" fontFamily="monospace" fontWeight="bold">A'</text>

              {/* Zone labels */}
              <text x="300" y="205" textAnchor="middle" fill="#7f1d1d" fontSize="11" fontFamily="monospace" fontWeight="bold">
                Central Crater (-168mm)
              </text>
              <text x="430" y="265" textAnchor="middle" fill="#991b1b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                Zone B Goaf (-142mm)
              </text>
              <text x="300" y="115" textAnchor="middle" fill="#9a3412" fontSize="10" fontFamily="monospace" fontWeight="bold">
                Zone A Longwall (-74mm)
              </text>

              {/* Side Gateway Indicator */}
              <rect x="520" y="60" width="12" height="12" fill="#1e3a8a" />
              <text x="475" y="55" fill="#1e3a8a" fontSize="9" fontFamily="monospace" fontWeight="bold">Side Gateway (Mast #01)</text>
            </svg>

            {/* Inset Color Bar */}
            <div className="absolute bottom-2 right-2 p-2 bg-white/95 border border-slate-300 rounded font-mono text-[9px] flex flex-col gap-1 shadow-xs">
              <div className="text-slate-800 font-bold">Total Subsidence (mm)</div>
              <div className="w-32 h-2.5 rounded bg-gradient-to-r from-emerald-600 via-amber-500 via-orange-600 to-red-700 shadow-inner" />
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>0 mm</span>
                <span>50</span>
                <span>100</span>
                <span>168+ mm</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-600 flex items-center justify-between pt-1">
            <span>Grid Resolution: 5.0m mesh</span>
            <span>Sensor inputs: 15 Wi-SUN NLN0721 Nodes (3 Zones)</span>
          </div>
        </div>

        {/* Cross-Sectional Subsidence Trough Curve */}
        <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3 font-mono shadow-xs">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
            <span className="font-bold text-slate-900 uppercase flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-800" />
              <span>Cross-Section Trough Profile (A &ndash; A')</span>
            </span>
            <span className="text-red-700 font-bold">Peak Smax: 168 mm</span>
          </div>

          {/* SVG Chart for Trough Depressions */}
          <div className="aspect-video w-full bg-slate-50 rounded border border-slate-300 p-2 flex flex-col justify-between">
            <div className="flex justify-between text-[10px] text-slate-600 pb-1 border-b border-slate-200">
              <span>Surface Level Datum: 302.0 m MSL</span>
              <span className="text-red-700 font-bold">Max Inflection Tilt: 1.88°</span>
            </div>

            <svg viewBox="0 0 500 200" className="w-full h-full my-1">
              <line x1="40" y1="20" x2="480" y2="20" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1" />

              <text x="10" y="25" fill="#64748b" fontSize="9" fontFamily="monospace">0mm</text>
              <text x="5" y="75" fill="#64748b" fontSize="9" fontFamily="monospace">-50mm</text>
              <text x="0" y="125" fill="#64748b" fontSize="9" fontFamily="monospace">-100mm</text>
              <text x="0" y="175" fill="#64748b" fontSize="9" fontFamily="monospace">-168mm</text>

              {/* Baseline pre-mining surface line (Flat 0mm) */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#1d4ed8" strokeWidth="1.5" strokeDasharray="4,4" />

              {/* Subsidence Curve path */}
              <path
                d={`M 40,20 ${crossSectionPoints
                  .map((pt, i) => {
                    const sx = 40 + (i / (pointsCount - 1)) * 440;
                    const sy = 20 + (pt.subsidenceMm / 180) * 150;
                    return `L ${sx},${sy}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#b91c1c"
                strokeWidth="2.5"
              />

              <circle cx="190" cy="98" r="4" fill="#ca8a04" />
              <text x="170" y="90" fill="#854d0e" fontSize="8" fontFamily="monospace">Inflection Point (d=0.4H)</text>

              <circle cx="280" cy="165" r="4" fill="#b91c1c" />
              <text x="235" y="182" fill="#7f1d1d" fontSize="9" fontWeight="bold" fontFamily="monospace">
                Central Crater (-168mm)
              </text>
            </svg>

            <div className="flex justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200 font-bold">
              <span>0 m (West Barrier)</span>
              <span>450 m (Central Crater)</span>
              <span>1000 m (East Rib)</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 space-y-1">
            <div className="text-blue-900 font-bold text-[10px]">Trough Empirical Parameters (Peck's Formulation):</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>Angle of Draw: <strong>32.5° (Barakar Formation)</strong></div>
              <div>Subsidence Factor ($q$): <strong>0.70</strong></div>
              <div>Inflection Distance ($i$): <strong>78 m from edge</strong></div>
              <div>Maximum Tensile Strain: <strong>2.8 mm/m</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
