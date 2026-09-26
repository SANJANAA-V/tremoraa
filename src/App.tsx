import React from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Map2D } from './components/Map2D';
import { Terrain3D } from './components/Terrain3D';
import { OperationalDashboard } from './components/OperationalDashboard';
import { SubsidenceHeatmap } from './components/SubsidenceHeatmap';
import { PredictionForecasting } from './components/PredictionForecasting';
import { AlertsReports } from './components/AlertsReports';
import { AboutMethodology } from './components/AboutMethodology';

const MainContent: React.FC = () => {
  const { activeTab } = useTelemetry();

  return (
    <main className="flex-1 h-full overflow-hidden flex relative bg-slate-100 text-slate-900">
      {activeTab === 'dashboard' && <OperationalDashboard />}
      {activeTab === 'network-map' && <Map2D />}
      {activeTab === 'terrain-3d' && <Terrain3D />}
      {activeTab === 'prediction-forecasting' && <PredictionForecasting />}
      {activeTab === 'subsidence-heatmap' && <SubsidenceHeatmap />}
      {activeTab === 'alerts-reports' && <AlertsReports />}
      {activeTab === 'about-methodology' && <AboutMethodology />}
    </main>
  );
};

export default function App() {
  return (
    <TelemetryProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans select-none">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <MainContent />
        </div>
      </div>
    </TelemetryProvider>
  );
}
