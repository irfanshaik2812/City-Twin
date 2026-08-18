import React, { useState } from 'react';
import { Search, MapPin, Navigation, Sparkles, CheckCircle2, Globe, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { LocationData, LocationMode } from '../types';
import { FEATURED_REAL_LOCATIONS, searchRealLocation, reverseGeocodeLocation } from '../services/locationService';
import { Footer } from './Footer';

interface LocationLandingScreenProps {
  onSelectLocation: (location: LocationData, mode: LocationMode, accuracy?: number | null) => void;
}

export const LocationLandingScreen: React.FC<LocationLandingScreenProps> = ({
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<LocationData | null>(FEATURED_REAL_LOCATIONS[0]);
  const [selectedMode, setSelectedMode] = useState<LocationMode>('searched');
  const [selectedAccuracy, setSelectedAccuracy] = useState<number | null>(null);

  const [isBuildingTwin, setIsBuildingTwin] = useState(false);
  const [buildingStep, setBuildingStep] = useState(0);

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setGpsError(null);

    if (val.trim().length > 1) {
      const results = await searchRealLocation(val);
      setSearchResults(results);
      if (results.length > 0) {
        setSelectedCandidate(results[0]);
        setSelectedMode('searched');
        setSelectedAccuracy(null);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleUseMyLocation = () => {
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
          setSelectedCandidate(gpsLoc);
          setSelectedMode('gps');
          setSelectedAccuracy(Math.round(accuracy));
          setIsLocating(false);
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

  const handleBuildDigitalTwin = () => {
    if (!selectedCandidate) return;

    setIsBuildingTwin(true);
    setBuildingStep(1);

    setTimeout(() => setBuildingStep(2), 400);
    setTimeout(() => setBuildingStep(3), 800);
    setTimeout(() => setBuildingStep(4), 1200);
    setTimeout(() => setBuildingStep(5), 1600);

    setTimeout(() => {
      onSelectLocation(selectedCandidate, selectedMode, selectedAccuracy);
    }, 1900);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center space-x-2">
                <span>CITYTWIN</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  REAL-WORLD GIS
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Digital Twin Disaster Intelligence & Simulation Platform</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-3 text-xs font-medium text-slate-600">
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>OpenStreetMap Engine</span>
            </span>
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
              <span>Real Geocoding</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        {isBuildingTwin ? (
          /* Animated Building Twin Progress Modal */
          <div className="w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 mx-auto flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8 animate-spin text-cyan-600" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">CONSTRUCTING DIGITAL TWIN</h2>
              <p className="text-sm font-bold text-cyan-700 mt-1">{selectedCandidate?.displayName}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCandidate?.name}</p>
            </div>

            {/* Sequence steps */}
            <div className="space-y-2.5 text-left font-mono text-xs">
              {[
                { step: 1, label: 'Resolving Geocoding Coordinates & Bounding Box...' },
                { step: 2, label: 'Querying OpenStreetMap Healthcare & Emergency Infrastructure...' },
                { step: 3, label: 'Generating Real Road Network Topography...' },
                { step: 4, label: 'Connecting Atmospheric Weather Feed...' },
                { step: 5, label: 'Digital Twin Ready for Disaster Simulation!' },
              ].map(s => (
                <div
                  key={s.step}
                  className={`p-3 rounded-xl flex items-center justify-between border transition-all ${
                    buildingStep > s.step
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : buildingStep === s.step
                      ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white border shrink-0">
                      {s.step}
                    </span>
                    <span>{s.label}</span>
                  </span>
                  {buildingStep > s.step && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Single Clean Location Selector Card */
          <div className="space-y-6">
            {/* Hero Heading */}
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 tracking-wider uppercase font-mono">
                Location Selection
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Select Analysis Location
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                Search for any city, area, landmark, college, or PIN code worldwide, or use your current device location.
              </p>
            </div>

            {/* Main Search Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
              {/* Search Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  🔎 SEARCH FOR ANY CITY OR PLACE
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="e.g. Hyderabad, Nagercoil, Visakhapatnam, Chennai, Bengaluru..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white shadow-xs"
                    autoFocus
                  />

                  {/* Autocomplete */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-300 shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {searchResults.map(loc => (
                        <button
                          key={loc.id}
                          onClick={() => {
                            setSelectedCandidate(loc);
                            setSelectedMode('searched');
                            setSelectedAccuracy(null);
                            setSearchQuery(loc.name);
                            setSearchResults([]);
                          }}
                          className="w-full p-3 text-left hover:bg-cyan-50 flex items-center justify-between transition-colors cursor-pointer"
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

              {/* Search Examples Pills */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                  Popular Locations:
                </span>
                <div className="flex flex-wrap gap-2">
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
                  ].map(ex => (
                    <button
                      key={ex}
                      onClick={async () => {
                        setSearchQuery(ex);
                        const res = await searchRealLocation(ex);
                        if (res.length > 0) {
                          setSelectedCandidate(res[0]);
                          setSelectedMode('searched');
                          setSelectedAccuracy(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 text-slate-800 text-xs font-medium transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Search className="w-3 h-3 text-cyan-600" />
                      <span>{ex}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center py-2">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">OR</span>
              </div>

              {/* Use My Location Option */}
              <div className="space-y-2">
                <button
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>REQUESTING DEVICE GPS POSITION...</span>
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

              {/* Selected Candidate Box */}
              {selectedCandidate && (
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-lg mt-6">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <div className="flex items-center space-x-2 font-mono text-[10px]">
                        {selectedMode === 'gps' ? (
                          <span className="px-2 py-0.5 rounded font-bold bg-emerald-500 text-white uppercase tracking-wider">
                            📍 YOUR DEVICE LOCATION
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-bold bg-cyan-600 text-white uppercase tracking-wider">
                            📍 SEARCHED LOCATION
                          </span>
                        )}
                        {selectedAccuracy && (
                          <span className="text-emerald-300">
                            (±{selectedAccuracy}m)
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white mt-1.5">{selectedCandidate.displayName}</h3>
                      <p className="text-xs text-slate-300 font-sans">{selectedCandidate.name}</p>
                    </div>

                    <div className="text-right text-xs font-mono text-slate-300">
                      <div>Lat: <span className="font-bold text-cyan-300">{selectedCandidate.lat.toFixed(4)}° N</span></div>
                      <div>Lng: <span className="font-bold text-cyan-300">{selectedCandidate.lng.toFixed(4)}° E</span></div>
                    </div>
                  </div>

                  <button
                    onClick={handleBuildDigitalTwin}
                    className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/30"
                  >
                    <span>BUILD DIGITAL TWIN FOR {selectedCandidate.displayName.toUpperCase()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center font-mono text-[11px] text-slate-600 flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Privacy Guarantee: Device location is accessed only when you explicitly click &quot;Use My Current Location&quot;.</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

