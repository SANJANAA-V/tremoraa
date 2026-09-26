import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  AlertOctagon,
  FileText,
  Download,
  Printer,
  Shield,
  Filter,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const AlertsReports: React.FC = () => {
  const { alerts } = useTelemetry();
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const handleExportCSV = () => {
    const headers = ['Alert ID', 'Timestamp', 'Node ID', 'Zone', 'Severity', 'Type', 'Current Value', 'Threshold', 'DGMS Statutory Ref', 'Message'];
    const rows = alerts.map((a) => [
      a.id,
      a.timestamp,
      a.nodeId,
      `Zone ${a.zoneId}`,
      a.severity,
      a.type,
      a.currentValue,
      a.thresholdValue,
      `"${a.dgmsReference}"`,
      `"${a.message}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DGMS_SECL_Korba_Subsidence_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-100 p-4 md:p-6 text-slate-800 font-sans space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <AlertOctagon className="w-4 h-4 text-red-700" />
            <span>DGMS STATUTORY LOGS &amp; OFFICIAL EXCEEDANCE REGISTRY</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Safety Exceedance Logs &amp; Compliance Reports
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Official records maintained in accordance with Coal Mines Regulations (CMR 2017 Reg. 112)
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded flex items-center gap-1.5 transition-colors font-bold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statutory CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded flex items-center gap-1.5 transition-colors font-bold shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {copiedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded font-mono text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>Statutory CSV Export generated and downloaded successfully for DGMS Bilaspur registry.</span>
        </div>
      )}

      {/* Exceedance Log Table */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 space-y-3 font-mono text-xs shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-xs">
            <Shield className="w-4 h-4 text-blue-800" />
            <span>Official DGMS Exceedance Registry ({filteredAlerts.length} Events)</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 flex items-center gap-1 font-bold">
              <Filter className="w-3 h-3 text-slate-600" /> Filter:
            </span>
            <button
              onClick={() => setFilterSeverity('ALL')}
              className={`px-2.5 py-0.5 rounded border font-bold ${
                filterSeverity === 'ALL'
                  ? 'bg-blue-900 border-blue-900 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterSeverity('CRITICAL')}
              className={`px-2.5 py-0.5 rounded border font-bold ${
                filterSeverity === 'CRITICAL'
                  ? 'bg-red-700 border-red-700 text-white'
                  : 'bg-white border-slate-300 text-red-700 hover:bg-red-50'
              }`}
            >
              CRITICAL
            </button>
            <button
              onClick={() => setFilterSeverity('WARNING')}
              className={`px-2.5 py-0.5 rounded border font-bold ${
                filterSeverity === 'WARNING'
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white border-slate-300 text-amber-700 hover:bg-amber-50'
              }`}
            >
              WARNING
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded border space-y-2 ${
                alert.severity === 'CRITICAL'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-700 text-white border border-red-800'
                        : 'bg-amber-600 text-white border border-amber-700'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="font-bold text-slate-900">{alert.id}</span>
                  <span className="text-slate-600 font-semibold">• Node {alert.nodeId} (Zone {alert.zoneId})</span>
                </div>
                <div className="text-slate-600 text-[10px] flex items-center gap-1 font-semibold">
                  <Clock className="w-3 h-3" />
                  <span>{alert.timestamp}</span>
                </div>
              </div>

              <div className="text-xs text-slate-900 font-sans font-medium">{alert.message}</div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-[10px]">
                <div>
                  <span className="text-slate-600">Recorded Reading: </span>
                  <strong className={alert.severity === 'CRITICAL' ? 'text-red-700' : 'text-amber-700'}>
                    {alert.currentValue}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-600">Prescribed Threshold: </span>
                  <strong className="text-slate-900">{alert.thresholdValue}</strong>
                </div>
                <div>
                  <span className="text-slate-600">Statutory Standard: </span>
                  <strong className="text-blue-900 font-bold">{alert.dgmsReference}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Certificate Box */}
      <div className="p-4 bg-white border border-slate-300 rounded-lg space-y-3 font-mono text-xs shadow-xs">
        <div className="text-slate-900 font-bold uppercase pb-2 border-b border-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-800" />
          <span>Statutory DGMS Compliance Endorsement</span>
        </div>
        <p className="text-slate-700 leading-relaxed font-sans text-xs">
          This digital portal serves as the official real-time repository for surface subsidence telemetry at SECL Korba West Seam IV. All transmissions originate from <strong>Nebulae NLN0721 Wi-SUN (IN865 MHz)</strong> surface telemetry nodes certified under WPC regulations, relaying directly to Central Gateway #01.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-600">
          <div>Mine Agent: <strong className="text-slate-900">General Manager (Mining), SECL Korba</strong></div>
          <div>Surveyor in Charge: <strong className="text-slate-900">First Class Mine Surveyor #KB-892</strong></div>
          <div>Inspection Jurisdiction: <strong className="text-slate-900">DGMS Bilaspur Region #1</strong></div>
        </div>
      </div>
    </div>
  );
};
