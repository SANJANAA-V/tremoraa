import React from 'react';
import { Cpu, Radio, BookOpen, Layers, CheckCircle } from 'lucide-react';
import { HARDWARE_PROFILE } from '../data/mockData';

export const AboutMethodology: React.FC = () => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 p-4 md:p-6 text-slate-800 font-sans space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <BookOpen className="w-4 h-4 text-blue-800" />
            <span>INSTITUTIONAL TECHNICAL SPECIFICATION &amp; REGULATORY CHARTER</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Methodology &amp; Hardware Instrumentation
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            DGMS Compliant Surface Subsidence Monitoring System over Underground Mining Panels
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-800 rounded font-semibold">
            DGMS Bilaspur Region
          </span>
          <span className="px-2.5 py-1 bg-blue-100 border border-blue-300 text-blue-900 rounded font-semibold">
            SECL Korba Area
          </span>
        </div>
      </div>

      {/* Hardware Deep Dive Section */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-slate-900 font-bold font-mono text-sm pb-2 border-b border-slate-200">
          <Radio className="w-4 h-4 text-blue-800" />
          <span>Wireless Telemetry &amp; Mesh Hardware: Nebulae NLN0721 Wi-SUN Module</span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-sans">
          All surface telemetry masts deployed across the Korba Coalfield mining panels strictly utilize the <strong>Nebulae NLN0721 Wi-SUN module</strong>. The network operates exclusively within the license-free <strong>IN865 MHz (865 &ndash; 867 MHz)</strong> band allocated under WPC (Wireless Planning &amp; Coordination) regulations in India. Powered by the Silicon Labs <strong>EFR32FG28 Dual-Band Wireless SoC</strong>, each node forms an autonomous, self-healing IPv6 6LoWPAN / Wi-SUN FAN mesh with high-reliability multi-hop relay.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">WIRELESS MODULE</div>
            <div className="text-slate-900 font-bold">{HARDWARE_PROFILE.module}</div>
            <div className="text-[10px] text-blue-800 font-semibold">Industrial RF front-end</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">FREQUENCY BAND</div>
            <div className="text-slate-900 font-bold">{HARDWARE_PROFILE.band}</div>
            <div className="text-[10px] text-emerald-800 font-semibold">WPC (ETA-SD) Certified - India</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">SYSTEM-ON-CHIP (SOC)</div>
            <div className="text-slate-900 font-bold">{HARDWARE_PROFILE.soc}</div>
            <div className="text-[10px] text-slate-600">ARM Cortex-M33 @ 78 MHz</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">MESH TOPOLOGY</div>
            <div className="text-slate-900 font-bold">Wi-SUN FAN / 6LoWPAN IPv6</div>
            <div className="text-[10px] text-blue-800 font-semibold">Star fan-in + trunk relay mesh</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">RANGE &amp; COVERAGE</div>
            <div className="text-slate-900 font-bold">~800 m &ndash; 1 km Line-of-Sight</div>
            <div className="text-[10px] text-slate-600">Surface mast to root gateway</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="text-slate-500 text-[10px] font-bold">UPLINK BACKHAUL</div>
            <div className="text-slate-900 font-bold truncate">Wi-SUN NLN0721 + 4G MQTT</div>
            <div className="text-[10px] text-emerald-800 font-semibold">Redundant cloud gateway uplink</div>
          </div>
        </div>
      </div>

      {/* Sensor Mast Mechanical & Geodetic Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Mast Construction */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-mono text-sm pb-2 border-b border-slate-200">
            <Cpu className="w-4 h-4 text-blue-800" />
            <span>Physical Sensor Mast Construction</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            Each monitoring node consists of a galvanized steel mast firmly anchored into bedrock below the surface weathered layer:
          </p>

          <ul className="space-y-2 text-xs font-sans text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-800 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Circular Base Housing:</strong> Heavily grouted circular foundation flange bolted to 3m deep borehole anchor piles, ensuring zero decouple error from shallow surface shrinkage.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-800 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Structural Steel Mast:</strong> Rigid mast equipped with solar micro-panel collar and high-capacity LiFePO4 battery pack (3.65V nominal).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-800 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Weatherproof Cone Cap / Radome:</strong> Polycarbonate aerodynamic cone cap enclosing multi-band GNSS RTK antenna, dual-axis MEMS inclinometer (±0.01° accuracy), and Nebulae NLN0721 Wi-SUN radio transceiver.
              </span>
            </li>
          </ul>
        </div>

        {/* Geological Profile & Statutory Directives */}
        <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold font-mono text-sm pb-2 border-b border-slate-200">
            <Layers className="w-4 h-4 text-blue-800" />
            <span>Geological Setting &amp; DGMS Directives</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[10px] font-bold">LITHO-STRATIGRAPHY</span>
              <span className="text-slate-900 font-bold">Barakar Formation, Lower Gondwana Supergroup</span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                Massive coarse-grained sandstones interbedded with carbonaceous shales and coal seams.
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[10px] font-bold">SEAM IV SPECIFICATIONS</span>
              <span className="text-slate-900 font-bold">6.2 m Clean Extraction Height @ 175m &ndash; 230m Depth</span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                Underground extraction conducted via mechanized longwall with caving and continuous miner panels.
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[10px] font-bold">STATUTORY DGMS DIRECTIVE</span>
              <span className="text-blue-900 font-bold">DGMS Tech Circular (Safety) No. 04 of 2018</span>
              <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                Mandates continuous surface displacement logging with automatic notification if subsidence velocity exceeds 25.0 mm/year.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
