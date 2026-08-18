import React from 'react';
import { LocationData, UrbanAsset, RoadSegment, WeatherData, ScenarioConfig } from '../../types';
import { RealWorldMap } from '../RealWorldMap';
import { MapPin, Users, Building2, Flame, ShieldAlert, CloudRain, Wind, Thermometer, ArrowRight, CheckCircle2, Compass } from 'lucide-react';

interface LocationOverviewViewProps {
  location: LocationData;
  assets: UrbanAsset[];
  roads: RoadSegment[];
  weather: WeatherData;
  onNavigateTab: (tab: any) => void;
  onStartSimulation: (type: ScenarioConfig['type']) => void;
}

export const LocationOverviewView: React.FC<LocationOverviewViewProps> = ({
  location,
  assets = [],
  roads = [],
  weather,
  onNavigateTab,
  onStartSimulation,
}) => {
  const hospitalCount = assets.filter(a => a.type === 'hospital').length;
  const shelterCount = assets.filter(a => a.type === 'shelter').length;
  const fireCount = assets.filter(a => a.type === 'fire_station').length;

  return (
    <div className="space-y-6">
      {/* Location Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-700 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Digital Twin Foundation</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">{location.displayName}</h2>
          <p className="text-xs text-slate-500 font-medium">{location.name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('digital_twin')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <span>EXPLORE GIS DIGITAL TWIN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onStartSimulation('flood')}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md shadow-cyan-600/20"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>SIMULATE FLOOD HAZARD</span>
          </button>
        </div>
      </div>

      {/* FEATURE CARD: FIND A SAFE AREA */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-900 to-slate-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>EMERGENCY EVACUATION PLANNER</span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white">FIND A SAFE AREA</h3>
          <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
            Enter your current location and find nearby evacuation and emergency facilities with distance and route information.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('evacuation')}
          className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-md shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>FIND SAFE AREA</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="uppercase text-[10px]">ESTIMATED POPULATION</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{location.estimatedPopulation.toLocaleString()}</span>
          <span className="text-[10px] text-amber-700 font-medium block mt-1">🟡 Census & Spatial Estimate</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="uppercase text-[10px]">VERIFIED ASSETS</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{assets.length} Nodes</span>
          <span className="text-[10px] text-emerald-700 font-medium block mt-1">🟢 {hospitalCount} Hospitals • {shelterCount} Shelters</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="uppercase text-[10px]">ROAD NETWORK</span>
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{roads.length} Arterials</span>
          <span className="text-[10px] text-slate-500 block mt-1">Real Coordinate Topography</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="uppercase text-[10px]">WEATHER ATMOSPHERE</span>
            <CloudRain className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{weather.temperatureC}°C</span>
          <span className="text-[10px] text-sky-700 font-medium block mt-1">Rain: {weather.rainfallMmHr} mm/h • Wind: {weather.windSpeedKmh} km/h</span>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Quick Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-cyan-600" />
              <span>DIGITAL TWIN GIS PREVIEW — {location.displayName.toUpperCase()}</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              🟢 Interactive Spatial Layer
            </span>
          </div>

          <div className="h-[420px]">
            <RealWorldMap
              location={location}
              assets={assets}
              roads={roads}
            />
          </div>
        </div>

        {/* Right Col: Verified Infrastructure Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 font-mono text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
            CRITICAL INFRASTRUCTURE STATUS
          </h3>

          <div className="space-y-3">
            {assets.slice(0, 6).map(asset => (
              <div key={asset.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 truncate max-w-[180px]">{asset.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    asset.status === 'operational' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {asset.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Resilience Score: <strong className="text-slate-800">{asset.resilienceScore}/100</strong> • Distance: <strong className="text-slate-800">{asset.distanceKm} km</strong>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('digital_twin')}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer text-center"
          >
            VIEW ALL {assets.length} ASSETS IN GIS WORKSPACE →
          </button>
        </div>
      </div>
    </div>
  );
};
