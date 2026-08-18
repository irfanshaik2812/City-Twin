import React, { useState } from 'react';
import { LocationData, UrbanAsset, RoadSegment, ScenarioConfig } from '../../types';
import { RealWorldMap } from '../RealWorldMap';
import { Layers, MapPin, Building2, CheckCircle2, Search, SlidersHorizontal, AlertTriangle, ShieldCheck, ArrowLeft } from 'lucide-react';

interface DigitalTwinGisViewProps {
  location: LocationData;
  assets: UrbanAsset[];
  roads: RoadSegment[];
  activeScenario?: ScenarioConfig | null;
  onBack?: () => void;
}

export const DigitalTwinGisView: React.FC<DigitalTwinGisViewProps> = ({
  location,
  assets = [],
  roads = [],
  activeScenario,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<UrbanAsset | null>(assets[0] || null);

  const [layers, setLayers] = useState({
    hospitals: true,
    police: true,
    fire: true,
    shelters: true,
    bridges: true,
    infrastructure: true,
    roads: true,
    disasterZone: true,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-200 pb-3">
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
            <Layers className="w-5 h-5 text-cyan-600" />
            <span>GIS DIGITAL TWIN WORKSPACE — {location.displayName.toUpperCase()}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Interactive OpenStreetMap infrastructure layers & verified spatial asset nodes.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            🟢 OpenStreetMap Live Layer
          </span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Layer Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 font-mono text-xs shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
              <span>MAP LAYERS</span>
            </h3>
            <span className="text-[10px] text-slate-400">Toggle GIS Visibility</span>
          </div>

          <div className="space-y-2">
            {[
              { key: 'hospitals' as const, label: '🏥 Hospitals & Trauma Centers', color: 'text-rose-600' },
              { key: 'shelters' as const, label: '⛺ Evacuation Relief Shelters', color: 'text-amber-600' },
              { key: 'fire' as const, label: '🚒 Fire & Rescue Stations', color: 'text-red-600' },
              { key: 'police' as const, label: '👮 Police Headquarters', color: 'text-blue-600' },
              { key: 'bridges' as const, label: '🌉 Bridges & River Crossings', color: 'text-indigo-600' },
              { key: 'infrastructure' as const, label: '⚡ Power & Water Utilities', color: 'text-purple-600' },
              { key: 'roads' as const, label: '🛣️ Road Network Topography', color: 'text-emerald-600' },
              { key: 'disasterZone' as const, label: '🌊 Disaster Inundation Ring', color: 'text-cyan-600' },
            ].map(layer => (
              <label
                key={layer.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all"
              >
                <span className={`font-semibold ${layer.color}`}>{layer.label}</span>
                <input
                  type="checkbox"
                  checked={layers[layer.key]}
                  onChange={() => toggleLayer(layer.key)}
                  className="accent-cyan-600 cursor-pointer w-4 h-4"
                />
              </label>
            ))}
          </div>

          {/* Quick Search Assets */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <span className="font-bold text-slate-700 block uppercase text-[10px]">Find Asset by Name:</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search hospital, shelter..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-600"
              />
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {filteredAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`w-full p-2 text-left transition-colors cursor-pointer flex items-center justify-between ${
                    selectedAsset?.id === asset.id ? 'bg-cyan-50 text-cyan-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate max-w-[140px] text-[11px]">{asset.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    {asset.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right 3 Cols: Real Map & Asset Inspector */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-[520px]">
            <RealWorldMap
              location={location}
              assets={assets}
              roads={roads}
              activeScenario={activeScenario}
              selectedAssetId={selectedAsset?.id}
              onSelectAsset={setSelectedAsset}
              visibleLayers={layers}
            />
          </div>

          {/* Asset Context Inspector Card */}
          {selectedAsset && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm font-mono text-xs space-y-3">
              <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-cyan-700 uppercase block">Selected GIS Node</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedAsset.name}</h3>
                  <p className="text-xs text-slate-500">{selectedAsset.address || location.displayName}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                    🟢 OpenStreetMap Verified Node
                  </span>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    selectedAsset.status === 'operational' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedAsset.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Resilience Rating</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">{selectedAsset.resilienceScore}/100</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Distance from Center</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">{selectedAsset.distanceKm} km</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Capacity</span>
                  <span className="text-lg font-black text-slate-900 mt-0.5 block">
                    {selectedAsset.capacity ? selectedAsset.capacity.toLocaleString() : 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block">Coordinates</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {selectedAsset.lat.toFixed(4)}°, {selectedAsset.lng.toFixed(4)}°
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
