import React from 'react';
import { RoadSegment, WeatherData } from '../../types';
import { CloudRain, Wind, Thermometer, Droplets, Compass, Navigation, Sliders, AlertTriangle } from 'lucide-react';

interface TrafficWeatherViewProps {
  roads: RoadSegment[];
  weather: WeatherData;
  onUpdateWeather?: (updated: WeatherData) => void;
  onUpdateRoadStatus?: (roadId: string, status: RoadSegment['currentTrafficStatus']) => void;
}

export const TrafficWeatherView: React.FC<TrafficWeatherViewProps> = ({
  roads = [],
  weather,
  onUpdateWeather,
  onUpdateRoadStatus,
}) => {
  const safeRoads = Array.isArray(roads) ? roads : [];

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div>
          <h2 className="text-xl font-black font-mono tracking-wider text-cyan-300 uppercase flex items-center space-x-2">
            <CloudRain className="w-5 h-5 text-cyan-400" />
            <span>REAL-TIME WEATHER & TRAFFIC FEED SIMULATOR</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic weather radar metrics & live road network congestion redistribution feeds that influence disaster spread & evacuation.
          </p>
        </div>
      </div>

      {/* Dynamic Weather Simulator Controls */}
      <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-200 uppercase flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>DYNAMIC WEATHER ATMOSPHERE FEED</span>
          </span>
          <span className="text-[10px] text-cyan-400">UPDATES INFLUENCE DISASTER MODELS DIRECTLY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rainfall Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center space-x-1">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Precipitation (Rainfall)</span>
              </span>
              <span className="font-bold text-cyan-300">{weather.rainfallMmHr} mm/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="250"
              value={weather.rainfallMmHr}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (onUpdateWeather) {
                  onUpdateWeather({
                    ...weather,
                    rainfallMmHr: val,
                    floodProbabilityPercent: Math.min(100, Math.round(val * 0.45 + 10)),
                  });
                }
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Drives urban flood inundation velocity</span>
          </div>

          {/* Wind Speed Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center space-x-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>Wind Speed</span>
              </span>
              <span className="font-bold text-cyan-300">{weather.windSpeedKmh} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={weather.windSpeedKmh}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (onUpdateWeather) {
                  onUpdateWeather({
                    ...weather,
                    windSpeedKmh: val,
                    stormProbabilityPercent: Math.min(100, Math.round(val * 0.5 + 15)),
                  });
                }
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Drives wildfire spread rate & storm surge</span>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center space-x-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Ambient Temperature</span>
              </span>
              <span className="font-bold text-amber-300">{weather.temperatureC} °C</span>
            </div>
            <input
              type="range"
              min="10"
              max="55"
              value={weather.temperatureC}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (onUpdateWeather) {
                  onUpdateWeather({
                    ...weather,
                    temperatureC: val,
                  });
                }
              }}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Drives thermal stress & power grid overload</span>
          </div>
        </div>
      </div>

      {/* Weather Metrics Display Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">RAINFALL RATE</span>
            <span className="text-2xl font-black text-cyan-300 mt-1 block">{weather.rainfallMmHr} mm/h</span>
          </div>
          <CloudRain className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">WIND VELOCITY</span>
            <span className="text-2xl font-black text-cyan-300 mt-1 block">{weather.windSpeedKmh} km/h</span>
          </div>
          <Wind className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">STORM INDEX</span>
            <span className="text-2xl font-black text-amber-300 mt-1 block">{weather.stormProbabilityPercent}%</span>
          </div>
          <Compass className="w-6 h-6 text-amber-400" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">FLOOD RISK INDEX</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">{weather.floodProbabilityPercent}%</span>
          </div>
          <Droplets className="w-6 h-6 text-rose-400" />
        </div>
      </div>

      {/* Live Traffic Redistribution & Status Controls */}
      <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            LIVE ROAD NETWORK STATUS & CONGESTION CONTROLS
          </h3>
          <span className="text-[10px] text-slate-400">Click a status badge to toggle road traffic flow</span>
        </div>

        <div className="divide-y divide-slate-800">
          {safeRoads.map(road => (
            <div key={road.id} className="py-2.5 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-bold text-slate-200">{road.name}</span>
                <span className="text-[10px] text-slate-400 block">{road.district} • Capacity: {road.capacityVehiclesPerHour.toLocaleString()} veh/hr</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {(['clear', 'congested', 'blocked', 'flooded'] as const).map(st => {
                  const isActive = road.currentTrafficStatus === st;
                  return (
                    <button
                      key={st}
                      onClick={() => onUpdateRoadStatus && onUpdateRoadStatus(road.id, st)}
                      className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                        isActive
                          ? st === 'blocked' || st === 'flooded' 
                            ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                            : st === 'congested'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                            : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

