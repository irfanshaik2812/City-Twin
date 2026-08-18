import React, { useState } from 'react';
import { LocationData, LocationMode, UrbanAsset, RoadSegment, WeatherData, ScenarioConfig } from './types';
import {
  generateRealUrbanAssets,
  generateRealRoadSegments,
  generateRealLocationWeather,
} from './services/locationService';
import { LocationLandingScreen } from './components/LocationLandingScreen';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { ChangeLocationModal } from './components/ChangeLocationModal';
import { LocationOverviewView } from './components/views/LocationOverviewView';
import { DigitalTwinGisView } from './components/views/DigitalTwinGisView';
import { DisasterSimulatorView } from './components/views/DisasterSimulatorView';
import { WhatIfLabView } from './components/views/WhatIfLabView';
import { EvacuationPlannerView } from './components/views/EvacuationPlannerView';
import { RiskIntelligenceView } from './components/views/RiskIntelligenceView';
import { AiDecisionSupportView } from './components/views/AiDecisionSupportView';
import { ReportsView } from './components/views/ReportsView';
import { ExportDataView } from './components/views/ExportDataView';

export function App() {
  // NO PRELOADED CITY ON INITIAL LAUNCH
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('searched');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isChangeLocationModalOpen, setIsChangeLocationModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [prefilledWhatIfQuestion] = useState<string>('');
  const [activeWhatIfResult, setActiveWhatIfResult] = useState<any | null>(null);

  // Dynamic city data states based on selected real location
  const [assets, setAssets] = useState<UrbanAsset[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioConfig | null>(null);

  // Handle Location Selection from Landing Screen or Modal
  const handleSelectLocation = (loc: LocationData, mode: LocationMode = 'searched', accuracy: number | null = null) => {
    setSelectedLocation(loc);
    setLocationMode(mode);
    setGpsAccuracy(accuracy);

    // Generate real assets, roads, and weather for the selected location
    const generatedAssets = generateRealUrbanAssets(loc);
    const generatedRoads = generateRealRoadSegments(loc, generatedAssets);
    const generatedWeather = generateRealLocationWeather(loc);

    setAssets(generatedAssets);
    setRoads(generatedRoads);
    setWeather(generatedWeather);
    setActiveScenario(null);
    setActiveWhatIfResult(null);
    setActiveTab('overview');
    setIsChangeLocationModalOpen(false);
  };

  const handleStartSimulation = (type: ScenarioConfig['type']) => {
    if (!selectedLocation) return;
    const config: ScenarioConfig = {
      id: `sim-${type}-${selectedLocation.id}`,
      name: `${type.toUpperCase()} SIMULATION — ${selectedLocation.displayName.toUpperCase()}`,
      type: type,
      locationName: selectedLocation.displayName,
      centerLat: selectedLocation.lat,
      centerLng: selectedLocation.lng,
      intensity: 7,
      affectedRadiusKm: 2.5,
      timeStepMinutes: 30,
      timeIndex: 2,
      parameters: {
        rainfallIntensityMm: 110,
        windSpeedKmh: 95,
      },
    };
    setActiveScenario(config);
    setActiveTab('simulator');
  };

  // Handle tab navigation
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If no location is selected, show the ENTER A LOCATION screen
  if (!selectedLocation || !weather) {
    return <LocationLandingScreen onSelectLocation={handleSelectLocation} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        location={selectedLocation}
        locationMode={locationMode}
        gpsAccuracy={gpsAccuracy}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onChangeLocation={() => setIsChangeLocationModalOpen(true)}
        onSelectLocation={handleSelectLocation}
      />

      {/* Change Location Modal */}
      {isChangeLocationModalOpen && (
        <ChangeLocationModal
          currentLocation={selectedLocation}
          currentMode={locationMode}
          onSelectLocation={handleSelectLocation}
          onClose={() => setIsChangeLocationModalOpen(false)}
        />
      )}

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <LocationOverviewView
            location={selectedLocation}
            assets={assets}
            roads={roads}
            weather={weather}
            onNavigateTab={handleTabChange}
            onStartSimulation={handleStartSimulation}
          />
        )}

        {activeTab === 'digital_twin' && (
          <DigitalTwinGisView
            location={selectedLocation}
            assets={assets}
            roads={roads}
            activeScenario={activeScenario}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {activeTab === 'simulator' && (
          <DisasterSimulatorView
            location={selectedLocation}
            assets={assets}
            roads={roads}
            onApplyScenario={cfg => {
              setActiveScenario(cfg);
              handleTabChange('digital_twin');
            }}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {activeTab === 'what_if' && (
          <WhatIfLabView
            location={selectedLocation}
            assets={assets}
            roads={roads}
            weather={weather}
            prefilledQuestion={prefilledWhatIfQuestion}
            onOpenExportView={() => handleTabChange('export_data')}
            onNavigateTab={(tab, scenarioData) => {
              if (scenarioData) {
                setActiveWhatIfResult(scenarioData);
              }
              handleTabChange(tab);
            }}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {activeTab === 'evacuation' && (
          <EvacuationPlannerView
            location={selectedLocation}
            assets={assets}
            roads={roads}
            activeScenario={activeScenario}
            whatIfScenario={activeWhatIfResult}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {activeTab === 'risk' && (
          <RiskIntelligenceView
            location={selectedLocation}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {activeTab === 'ai_insights' && (
          <AiDecisionSupportView
            location={selectedLocation}
            assets={assets}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            location={selectedLocation}
            assets={assets}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {activeTab === 'export_data' && (
          <ExportDataView
            location={selectedLocation}
            assets={assets}
            roads={roads}
            weather={weather}
            onBack={() => handleTabChange('overview')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer locationName={selectedLocation.name} locationMode={locationMode} />
    </div>
  );
}
export default App;
