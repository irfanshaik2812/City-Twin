import React, { useState } from 'react';
import { LocationData, UrbanAsset, RoadSegment, ScenarioConfig, DisasterType } from '../../types';
import { runCitySimulation } from '../../utils/simulationEngine';
import { Flame, CloudRain, Wind, AlertTriangle, Users, Play, RotateCcw, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

interface DisasterSimulatorViewProps {
  location: LocationData;
  assets: UrbanAsset[];
  roads: RoadSegment[];
  onApplyScenario: (config: ScenarioConfig) => void;
  onBack?: () => void;
}

export const DisasterSimulatorView: React.FC<DisasterSimulatorViewProps> = ({
  location,
  assets = [],
  roads = [],
  onApplyScenario,
  onBack,
}) => {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType>('flood');
  const [intensity, setIntensity] = useState(7);
  const [rainfallMmHr, setRainfallMmHr] = useState(120);
  const [windSpeedKmh, setWindSpeedKmh] = useState(115);
  const [magnitudeRichter, setMagnitudeRichter] = useState(6.8);
  const [timeStepIndex, setTimeStepIndex] = useState(2); // T+30m

  const timeSteps = [
    { label: 'T+0 MIN', minutes: 0 },
    { label: 'T+15 MIN', minutes: 15 },
    { label: 'T+30 MIN', minutes: 30 },
    { label: 'T+1 HR', minutes: 60 },
    { label: 'T+3 HR', minutes: 180 },
    { label: 'T+6 HR', minutes: 360 },
  ];

  const currentMinutes = timeSteps[timeStepIndex].minutes;

  const currentConfig: ScenarioConfig = {
    id: `scenario-${selectedDisaster}-${location.id}`,
    name: `${selectedDisaster.toUpperCase()} SIMULATION — ${location.displayName.toUpperCase()}`,
    type: selectedDisaster,
    locationName: location.displayName,
    centerLat: location.lat,
    centerLng: location.lng,
    intensity: intensity,
    affectedRadiusKm: 1.5 + (intensity * 0.4),
    timeStepMinutes: currentMinutes,
    timeIndex: timeStepIndex,
    parameters: {
      rainfallIntensityMm: rainfallMmHr,
      windSpeedKmh: windSpeedKmh,
      magnitudeRichter: magnitudeRichter,
    },
  };

  const simResult = runCitySimulation(currentConfig, currentMinutes, assets, roads);

  const handleRunAndSave = () => {
    onApplyScenario(currentConfig);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center space-x-1 mb-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
          )}
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Flame className="w-5 h-5 text-red-600" />
            <span>DISASTER SIMULATION ENGINE — {location.displayName.toUpperCase()}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Simulate hazard propagation over real OpenStreetMap topography & evaluate impact over time.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
            🌊 Simulated Hazard Layer
          </span>
        </div>
      </div>

      {/* Simulator Controls & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Disaster Selection Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
            1. SELECT DISASTER TYPE
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'flood' as const, label: '🌊 Urban Flood', color: 'text-cyan-700' },
              { id: 'cyclone' as const, label: '🌀 Tropical Cyclone', color: 'text-purple-700' },
              { id: 'earthquake' as const, label: '🌋 Earthquake', color: 'text-red-700' },
              { id: 'wildfire' as const, label: '🔥 Wildfire Surge', color: 'text-amber-700' },
              { id: 'landslide' as const, label: '⛰️ Landslide', color: 'text-amber-900' },
              { id: 'extreme_heat' as const, label: '☀️ Extreme Heatwave', color: 'text-rose-700' },
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDisaster(d.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer font-bold ${
                  selectedDisaster === d.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <span>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Intensity Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex justify-between font-bold">
              <span className="text-slate-700 uppercase">HAZARD INTENSITY</span>
              <span className="text-red-600">{intensity} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          {/* Parameter Sliders depending on disaster */}
          {selectedDisaster === 'flood' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Rainfall Rate</span>
                <span className="font-bold text-slate-900">{rainfallMmHr} mm/h</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                value={rainfallMmHr}
                onChange={e => setRainfallMmHr(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>
          )}

          {selectedDisaster === 'cyclone' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Wind Velocity</span>
                <span className="font-bold text-purple-900">{windSpeedKmh} km/h</span>
              </div>
              <input
                type="range"
                min="40"
                max="220"
                value={windSpeedKmh}
                onChange={e => setWindSpeedKmh(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          )}

          {selectedDisaster === 'earthquake' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Richter Magnitude</span>
                <span className="font-bold text-red-900">{magnitudeRichter} M</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="9.0"
                step="0.1"
                value={magnitudeRichter}
                onChange={e => setMagnitudeRichter(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Time-Step Timeline Player */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-sm">
          <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
            2. TEMPORAL EVOLUTION (T+0 TO T+6 HOURS)
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-slate-600 text-[11px]">
              <span>Simulated Time Index:</span>
              <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {timeSteps[timeStepIndex].label}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {timeSteps.map((ts, idx) => (
                <button
                  key={ts.label}
                  onClick={() => setTimeStepIndex(idx)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    timeStepIndex === idx
                      ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="block text-[11px]">{ts.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Output Cards */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase">SIMULATED HAZARD CONSEQUENCES</h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">POPULATION EXPOSED</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  ~{simResult.estimatedPopulationExposed.toLocaleString()}
                </span>
                <span className="text-[9px] text-amber-700 block mt-1">🟡 Model Estimate</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">BLOCKED ROADS</span>
                <span className="text-xl font-black text-red-600 mt-1 block">
                  {simResult.blockedRoadCount} Segments
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">Arterial Bypass</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">INACCESSIBLE HOSPITALS</span>
                <span className="text-xl font-black text-amber-600 mt-1 block">
                  {simResult.inaccessibleHospitalsCount} Facilities
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">Trauma Access</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block">RESPONSE SCORE</span>
                <span className="text-xl font-black text-cyan-700 mt-1 block">
                  {simResult.responseScore}/100
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">Readiness Index</span>
              </div>
            </div>

            <button
              onClick={handleRunAndSave}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>APPLY THIS SIMULATION TO DIGITAL TWIN MAP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
