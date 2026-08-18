import React, { useState } from 'react';
import { Search, MapPin, Navigation, X, Shield, AlertTriangle } from 'lucide-react';
import { LocationData, LocationMode } from '../types';
import { searchRealLocation, reverseGeocodeLocation } from '../services/locationService';

interface ChangeLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationData, mode: LocationMode, accuracy?: number | null) => void;
  currentLocation?: LocationData | null;
  currentMode?: LocationMode;
}

export const ChangeLocationModal: React.FC<ChangeLocationModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length > 1) {
      setIsSearching(true);
      const results = await searchRealLocation(val);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchLoc = (loc: LocationData) => {
    onSelectLocation(loc, 'searched', null);
    onClose();
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const gpsLoc = await reverseGeocodeLocation(latitude, longitude);
          onSelectLocation(gpsLoc, 'gps', Math.round(accuracy));
          setIsLocating(false);
          onClose();
        } catch (err) {
          setIsLocating(false);
          setGpsError('Unable to determine your current location.');
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location access was not granted.');
        } else {
          setGpsError('Unable to determine your current location.');
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-600 text-white font-bold text-xs">
              CT
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">CHANGE ANALYSIS LOCATION</h2>
              <p className="text-[11px] text-slate-300 font-mono">
                Currently Active: <strong className="text-cyan-300">{currentLocation?.displayName || currentLocation?.name || 'None'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Search Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              🔎 SEARCH A LOCATION
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search city, area, landmark, college, hospital, PIN code..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white shadow-xs"
                autoFocus
              />

              {isSearching && (
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 animate-spin">
                  ⌛
                </span>
              )}

              {/* Autocomplete dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-300 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectSearchLoc(loc)}
                      className="w-full p-3 text-left hover:bg-cyan-50 transition-colors flex items-center justify-between cursor-pointer font-sans"
                    >
                      <div className="flex items-center space-x-2.5">
                        <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{loc.displayName}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">{loc.name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 shrink-0 font-bold">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Popular Places Examples */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
              Popular Cities & Places:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Hyderabad',
                'Nagercoil',
                'Visakhapatnam',
                'Chennai',
                'Bengaluru',
                'Mumbai',
                'Delhi',
                'Amrita Vishwa Vidyapeetham',
                'Charminar, Hyderabad',
              ].map((exampleName) => (
                <button
                  key={exampleName}
                  onClick={async () => {
                    setSearchQuery(exampleName);
                    setIsSearching(true);
                    const res = await searchRealLocation(exampleName);
                    setIsSearching(false);
                    if (res.length > 0) {
                      handleSelectSearchLoc(res[0]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 text-slate-800 font-sans text-[11px] font-medium transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Search className="w-3 h-3 text-cyan-600" />
                  <span>{exampleName}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">OR</span>
          </div>

          {/* Option: Use My Device Location */}
          <div className="space-y-2.5">
            <button
              onClick={handleUseGps}
              disabled={isLocating}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ACQUIRING DEVICE GPS POSITION...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>📍 USE MY CURRENT LOCATION</span>
                </>
              )}
            </button>

            {gpsError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono flex items-center justify-between">
          <p className="flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy-First: GPS requested only on click.</span>
          </p>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-sans font-bold text-[11px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

