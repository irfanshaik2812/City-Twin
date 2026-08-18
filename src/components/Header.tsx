import React, { useState } from 'react';
import { Globe, MapPin, Search, Navigation, Flame, Compass, Layers, Bot, FileText, Download, AlertTriangle } from 'lucide-react';
import { LocationData, LocationMode } from '../types';
import { reverseGeocodeLocation } from '../services/locationService';

export type ActiveTab =
  | 'overview'
  | 'digital_twin'
  | 'simulator'
  | 'what_if'
  | 'evacuation'
  | 'risk'
  | 'ai_insights'
  | 'reports'
  | 'export_data';

interface HeaderProps {
  location: LocationData;
  locationMode: LocationMode;
  gpsAccuracy?: number | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onChangeLocation: () => void;
  onSelectLocation: (location: LocationData, mode: LocationMode, accuracy?: number | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  locationMode = 'searched',
  activeTab,
  onTabChange,
  onChangeLocation,
  onSelectLocation,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Globe className="w-4 h-4" /> },
    { id: 'digital_twin', label: 'Digital Twin GIS', icon: <MapPin className="w-4 h-4" /> },
    { id: 'simulator', label: 'Disaster Simulator', icon: <Flame className="w-4 h-4" /> },
    { id: 'what_if', label: 'What-If Lab', icon: <Layers className="w-4 h-4" /> },
    { id: 'evacuation', label: 'Evacuation & Resources', icon: <Compass className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk Intelligence', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'ai_insights', label: 'AI Decision Support', icon: <Bot className="w-4 h-4 text-cyan-600" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'export_data', label: 'Export Data', icon: <Download className="w-4 h-4 text-emerald-600" /> },
  ];

  const isGpsMode = locationMode === 'gps';

  const handleHeaderUseGps = () => {
    if (!navigator.geolocation) {
      setGpsNotification('Location is not supported by your browser.');
      setTimeout(() => setGpsNotification(null), 4000);
      return;
    }

    setIsLocating(true);
    setGpsNotification(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const gpsLoc = await reverseGeocodeLocation(latitude, longitude);
          onSelectLocation(gpsLoc, 'gps', Math.round(accuracy));
          setIsLocating(false);
          setGpsNotification('Location updated to your real device coordinates.');
          setTimeout(() => setGpsNotification(null), 4000);
        } catch (err) {
          setIsLocating(false);
          setGpsNotification('Unable to determine your current location.');
          setTimeout(() => setGpsNotification(null), 4000);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsNotification('Location access was not granted.');
        } else {
          setGpsNotification('Unable to determine your current location.');
        }
        setTimeout(() => setGpsNotification(null), 4000);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Active Location Indicator */}
      <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-xs font-sans">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {isGpsMode ? (
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold uppercase tracking-wider shrink-0 font-mono">
              <Navigation className="w-3.5 h-3.5 animate-pulse" />
              <span>📍 YOUR LOCATION:</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-cyan-400 font-bold uppercase tracking-wider shrink-0 font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>📍 ACTIVE LOCATION:</span>
            </span>
          )}

          <span className="font-bold text-slate-100 truncate text-xs">{location.displayName || location.name}</span>
          <span className="text-slate-400 text-[11px] hidden md:inline shrink-0 font-mono">
            ({location.name})
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-3">
          {/* Small unobtrusive Use My Location button */}
          <button
            onClick={handleHeaderUseGps}
            disabled={isLocating}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium flex items-center space-x-1 transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
            title="Request browser location permission"
          >
            <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
            <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
          </button>

          {/* Change Location Button */}
          <button
            onClick={onChangeLocation}
            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
          >
            <Search className="w-3 h-3" />
            <span>CHANGE LOCATION</span>
          </button>
        </div>
      </div>

      {/* GPS Notification Toast */}
      {gpsNotification && (
        <div className="bg-cyan-900 text-cyan-100 text-[11px] font-mono px-6 py-1.5 flex items-center justify-between border-b border-cyan-800 animate-fadeIn">
          <span>ℹ️ {gpsNotification}</span>
          <button onClick={() => setGpsNotification(null)} className="text-cyan-300 hover:text-white font-bold text-xs">✕</button>
        </div>
      )}

      {/* Main Brand & Status */}
      <div className="max-w-7xl mx-auto px-6 pt-3">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-600 text-white font-bold text-sm shadow-xs">
              CT
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>CITYTWIN</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  REAL-WORLD GIS
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Digital Twin Disaster Intelligence Platform</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GIS Layer Connected</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              OpenStreetMap Topography
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto border-t border-slate-200 pt-1 pb-1 custom-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-100 text-cyan-800 border-b-2 border-cyan-600 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};


