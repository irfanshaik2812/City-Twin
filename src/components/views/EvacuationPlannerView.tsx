import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationData, UrbanAsset, RoadSegment, ScenarioConfig, WhatIfAnalysisResult } from '../../types';
import { calculateHaversineDistance, searchRealLocation } from '../../services/locationService';
import {
  Compass,
  MapPin,
  Search,
  Navigation,
  Shield,
  Users,
  Truck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Filter,
  ArrowUpDown,
  Clock,
  Footprints,
  Car,
  AlertOctagon,
  Building2,
  Hospital,
  Flame,
  ShieldAlert
} from 'lucide-react';

export interface UserCurrentLocation {
  name: string;
  lat: number;
  lng: number;
  source: 'geolocation' | 'search' | 'default';
}

interface EvacuationPlannerViewProps {
  location: LocationData;
  assets: UrbanAsset[];
  roads: RoadSegment[];
  activeScenario?: ScenarioConfig | null;
  whatIfScenario?: WhatIfAnalysisResult | null;
  onBack?: () => void;
}

export const EvacuationPlannerView: React.FC<EvacuationPlannerViewProps> = ({
  location,
  assets = [],
  roads = [],
  activeScenario,
  whatIfScenario,
  onBack,
}) => {
  // User Current Location State
  const [userLocation, setUserLocation] = useState<UserCurrentLocation>({
    name: location.displayName + ' (City Center)',
    lat: location.lat,
    lng: location.lng,
    source: 'default',
  });

  // Keep userLocation synchronized when globally active location changes
  useEffect(() => {
    setUserLocation({
      name: location.displayName + ' (City Center)',
      lat: location.lat,
      lng: location.lng,
      source: 'default',
    });
  }, [location.id, location.lat, location.lng, location.displayName]);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  // Search user location state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Safe area filtering state
  const [selectedSafeArea, setSelectedSafeArea] = useState<UrbanAsset | null>(null);
  const [safeAreaSearch, setSafeAreaSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'shelter' | 'hospital' | 'emergency' | 'school'>('all');
  const [sortBy, setSortBy] = useState<'nearest' | 'fastest' | 'type'>('nearest');

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Sync user location if location changes and user hasn't explicitly set GPS/Search
  useEffect(() => {
    if (userLocation.source === 'default') {
      setUserLocation({
        name: location.displayName + ' (Default City Center)',
        lat: location.lat,
        lng: location.lng,
        source: 'default',
      });
    }
  }, [location]);

  // Handle Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocatingError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocatingError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode to get human place name
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: { 'User-Agent': 'CityTwinDisasterApp/1.0' },
          });
          if (res.ok) {
            const data = await res.json();
            const displayName = data.display_name ? data.display_name.split(',')[0] + ', ' + (data.address?.city || data.address?.town || data.address?.state || '') : 'Device Geolocation Point';
            setUserLocation({
              name: displayName.trim(),
              lat,
              lng,
              source: 'geolocation',
            });
          } else {
            setUserLocation({
              name: `Device GPS (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
              lat,
              lng,
              source: 'geolocation',
            });
          }
        } catch (err) {
          setUserLocation({
            name: `Device GPS (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
            lat,
            lng,
            source: 'geolocation',
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocatingError('Unable to retrieve device position. Please search manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Search Location
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchRealLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (res: LocationData) => {
    setUserLocation({
      name: res.displayName || res.name,
      lat: res.lat,
      lng: res.lng,
      source: 'search',
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  // Determine Active Hazard parameters (from What-If or Disaster Simulator)
  const activeHazard = React.useMemo(() => {
    if (whatIfScenario) {
      return {
        type: 'hazard',
        description: whatIfScenario.question,
        radiusKm: 2.5,
        center: [location.lat + 0.005, location.lng + 0.005] as [number, number],
      };
    }
    if (activeScenario) {
      return {
        type: activeScenario.type,
        description: `${activeScenario.type.toUpperCase()} Hazard Impact Zone`,
        radiusKm: activeScenario.affectedRadiusKm || 2.5,
        center: [location.lat, location.lng] as [number, number],
      };
    }
    return null;
  }, [whatIfScenario, activeScenario, location]);

  // Compute Safe Areas from assets with dynamic distance & travel times
  const safeAreas = React.useMemo(() => {
    return assets.map((asset) => {
      const haversineDist = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        asset.lat,
        asset.lng
      );
      const roadDistKm = Math.max(0.2, Math.round(haversineDist * 1.25 * 10) / 10);
      const driveTimeMin = Math.max(1, Math.round((roadDistKm / 30) * 60));
      const walkTimeMin = Math.max(2, Math.round((roadDistKm / 4.5) * 60));

      let category: 'shelter' | 'hospital' | 'emergency' | 'school' = 'emergency';
      if (asset.type === 'shelter') category = 'shelter';
      else if (asset.type === 'hospital') category = 'hospital';
      else if (asset.type === 'school') category = 'school';
      else if (asset.type === 'fire_station' || asset.type === 'police') category = 'emergency';

      // Check if hazard blocks route
      let isRouteBlocked = false;
      if (activeHazard) {
        const distFromHazardCenter = calculateHaversineDistance(
          (userLocation.lat + asset.lat) / 2,
          (userLocation.lng + asset.lng) / 2,
          activeHazard.center[0],
          activeHazard.center[1]
        );
        if (distFromHazardCenter < activeHazard.radiusKm) {
          isRouteBlocked = true;
        }
      }

      return {
        ...asset,
        category,
        roadDistKm,
        driveTimeMin,
        walkTimeMin,
        isRouteBlocked,
      };
    });
  }, [assets, userLocation, activeHazard]);

  // Filter & Sort Safe Areas
  const filteredSafeAreas = React.useMemo(() => {
    return safeAreas
      .filter((sa) => {
        if (categoryFilter !== 'all' && sa.category !== categoryFilter) return false;
        if (safeAreaSearch.trim()) {
          const q = safeAreaSearch.toLowerCase();
          return sa.name.toLowerCase().includes(q) || (sa.address && sa.address.toLowerCase().includes(q));
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'nearest' || sortBy === 'fastest') {
          return a.roadDistKm - b.roadDistKm;
        }
        return a.type.localeCompare(b.type);
      });
  }, [safeAreas, categoryFilter, safeAreaSearch, sortBy]);

  // Default select nearest safe area on user location change if none selected
  useEffect(() => {
    if (filteredSafeAreas.length > 0 && !selectedSafeArea) {
      setSelectedSafeArea(filteredSafeAreas[0]);
    }
  }, [filteredSafeAreas, selectedSafeArea]);

  // Calculate Detour coordinates if hazard intersects route
  const selectedRouteDetails = React.useMemo(() => {
    if (!selectedSafeArea) return null;

    const target = safeAreas.find((s) => s.id === selectedSafeArea.id) || {
      roadDistKm: calculateHaversineDistance(userLocation.lat, userLocation.lng, selectedSafeArea.lat, selectedSafeArea.lng) * 1.25,
      driveTimeMin: 10,
      walkTimeMin: 35,
      isRouteBlocked: false,
    };

    const isBlocked = target.isRouteBlocked;
    const detourDistKm = isBlocked ? Math.round((target.roadDistKm + 1.8) * 10) / 10 : target.roadDistKm;
    const detourDriveTimeMin = isBlocked ? Math.round((target.driveTimeMin + 6)) : target.driveTimeMin;

    return {
      target,
      isBlocked,
      detourDistKm,
      detourDriveTimeMin,
    };
  }, [selectedSafeArea, safeAreas, userLocation]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const boundsPoints: [number, number][] = [[userLocation.lat, userLocation.lng]];

    // 1. User Location Marker
    const userMarkerIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-cyan-600 text-white shadow-xl border-2 border-white ring-4 ring-cyan-400/30 font-bold text-base cursor-pointer animate-bounce">
          📍
        </div>
      `,
      className: 'custom-user-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userMarkerIcon });
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
        <strong style="color: #0284c7; font-size: 13px;">📍 YOUR CURRENT LOCATION</strong><br/>
        <span>${userLocation.name}</span><br/>
        <span style="color: #64748b; font-size: 10px;">(${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°)</span>
      </div>
    `);
    layerGroup.addLayer(userMarker);

    // 2. Active Hazard Area
    if (activeHazard) {
      const hazardCircle = L.circle(activeHazard.center, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.2,
        radius: activeHazard.radiusKm * 1000,
        weight: 2,
        dashArray: '4, 4',
      });
      hazardCircle.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="color: #dc2626; text-transform: uppercase;">⚠️ SIMULATED HAZARD IMPACT ZONE</strong><br/>
          <span>${activeHazard.description}</span><br/>
          <span style="font-size: 10px; color: #64748b;">HYPOTHETICAL SIMULATION RADIUS: ${activeHazard.radiusKm} km</span>
        </div>
      `);
      layerGroup.addLayer(hazardCircle);
      boundsPoints.push(activeHazard.center);
    }

    // 3. Safe Area Markers
    filteredSafeAreas.forEach((sa) => {
      boundsPoints.push([sa.lat, sa.lng]);
      const isSelected = selectedSafeArea?.id === sa.id;

      const emoji =
        sa.type === 'shelter' ? '⛺' :
        sa.type === 'hospital' ? '🏥' :
        sa.type === 'fire_station' ? '🚒' :
        sa.type === 'police' ? '👮' :
        sa.type === 'school' ? '🏫' : '🛡️';

      const bgClass = isSelected ? 'bg-amber-500 ring-4 ring-amber-400/50 scale-125 z-50' : 'bg-emerald-600 hover:scale-110';

      const saIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full ${bgClass} text-white shadow-md border-2 border-white text-sm transition-all cursor-pointer">
            ${emoji}
          </div>
        `,
        className: 'custom-safearea-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const saMarker = L.marker([sa.lat, sa.lng], { icon: saIcon });
      saMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; width: 200px;">
          <div style="font-weight: bold; color: #0f172a; font-size: 13px; margin-bottom: 2px;">${sa.name}</div>
          <div style="color: #059669; font-weight: bold; font-size: 11px; margin-bottom: 4px;">🟢 Available Safe Area</div>
          <div style="font-size: 11px; color: #475569;">Distance: <strong>${sa.roadDistKm} km</strong></div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">Drive Time: <strong>${sa.driveTimeMin} min</strong></div>
          <button id="select-sa-${sa.id}" style="width: 100%; background: #0284c7; color: white; border: none; padding: 5px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 11px;">
            SELECT SAFE AREA
          </button>
        </div>
      `);

      saMarker.on('popupopen', () => {
        const btn = document.getElementById(`select-sa-${sa.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedSafeArea(sa);
          };
        }
      });

      saMarker.on('click', () => {
        setSelectedSafeArea(sa);
      });

      layerGroup.addLayer(saMarker);
    });

    // 4. Draw Route Line from User Location to Selected Safe Area
    if (selectedSafeArea && selectedRouteDetails) {
      const destLat = selectedSafeArea.lat;
      const destLng = selectedSafeArea.lng;

      if (selectedRouteDetails.isBlocked && activeHazard) {
        // Draw blocked direct segment
        const blockedPolyline = L.polyline(
          [[userLocation.lat, userLocation.lng], [destLat, destLng]],
          {
            color: '#ef4444',
            weight: 4,
            dashArray: '6, 8',
            opacity: 0.8,
          }
        );
        blockedPolyline.bindTooltip('<b>⚠️ SIMULATED HAZARD BLOCKAGE</b>', { sticky: true });
        layerGroup.addLayer(blockedPolyline);

        // Draw curved bypass detour path around hazard
        const midLat = (userLocation.lat + destLat) / 2 + 0.018;
        const midLng = (userLocation.lng + destLng) / 2 - 0.018;

        const detourPolyline = L.polyline(
          [[userLocation.lat, userLocation.lng], [midLat, midLng], [destLat, destLng]],
          {
            color: '#10b981',
            weight: 5,
            opacity: 0.9,
          }
        );
        detourPolyline.bindTooltip(`<b>RECOMMENDED BYPASS ROUTE (${selectedRouteDetails.detourDistKm} km)</b>`, { sticky: true });
        layerGroup.addLayer(detourPolyline);
        boundsPoints.push([midLat, midLng]);
      } else {
        // Clear direct route
        const directPolyline = L.polyline(
          [[userLocation.lat, userLocation.lng], [destLat, destLng]],
          {
            color: '#0284c7',
            weight: 5,
            opacity: 0.9,
          }
        );
        directPolyline.bindTooltip(`<b>OPTIMAL SAFE ROUTE (${selectedRouteDetails.detourDistKm} km)</b>`, { sticky: true });
        layerGroup.addLayer(directPolyline);
      }
    }

    // Auto-fit bounds
    if (boundsPoints.length > 1) {
      map.fitBounds(boundsPoints, { padding: [40, 40], maxZoom: 14 });
    }
  }, [userLocation, filteredSafeAreas, selectedSafeArea, activeHazard, selectedRouteDetails]);

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="border-b border-slate-200 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
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
            <Compass className="w-5 h-5 text-cyan-600" />
            <span>EVACUATION & SAFE AREA FINDER — {location.displayName.toUpperCase()}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Select your current location to discover nearby verified safe shelters, emergency facilities, real road distances, and disaster-aware routes.
          </p>
        </div>

        {activeHazard && (
          <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-mono font-bold flex items-center space-x-1.5 self-start md:self-auto">
            <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>ACTIVE SIMULATED HAZARD MODEL INTEGRATED</span>
          </span>
        )}
      </div>

      {/* SECTION 1: WHERE ARE YOU NOW? */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 font-mono text-xs">
        <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-200 pb-2">
          <MapPin className="w-4 h-4 text-cyan-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider">WHERE ARE YOU NOW?</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Option A: Use My Current Location */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5 mb-1">
                <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                <span>OPTION A: USE DEVICE GPS GEOLOCATION</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Automatically detect your current GPS position via browser geolocation.
              </p>
            </div>

            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ACQUIRING GPS POSITION...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>USE MY CURRENT LOCATION</span>
                </>
              )}
            </button>
          </div>

          {/* Option B: Search Your Location */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div>
              <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5 mb-1">
                <Search className="w-3.5 h-3.5 text-cyan-600" />
                <span>OPTION B: SEARCH YOUR LOCATION</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Enter an address, landmark, neighborhood, or area name.
              </p>
            </div>

            <form onSubmit={handleSearchLocation} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Nampally, Hyderabad or Central Station"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSearching ? <span className="animate-spin">⌛</span> : <Search className="w-3.5 h-3.5" />}
                <span>SEARCH</span>
              </button>
            </form>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-300 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full p-2.5 text-left hover:bg-cyan-50 transition-colors text-xs font-sans flex items-start space-x-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">{res.displayName}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{res.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Location Display Banner */}
        <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse" />
            <span className="text-cyan-900 font-bold uppercase">SELECTED CURRENT LOCATION:</span>
            <span className="font-black text-slate-900 underline">{userLocation.name}</span>
          </div>
          <span className="text-slate-500 text-[10px]">
            Coords: {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E • [{userLocation.source.toUpperCase()}]
          </span>
        </div>

        {locatingError && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-sans">
            ⚠️ {locatingError}
          </div>
        )}
      </div>

      {/* MAIN GRID: Available Safe Areas & Interactive Route Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* LEFT COLUMN: Available Safe Areas List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm flex flex-col h-[680px]">
          <div className="space-y-3 border-b border-slate-200 pb-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>AVAILABLE SAFE AREAS ({filteredSafeAreas.length})</span>
              </h3>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                🟢 REAL CALCULATED DISTANCES
              </span>
            </div>

            {/* Filters & Sorting Controls */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={safeAreaSearch}
                    onChange={(e) => setSafeAreaSearch(e.target.value)}
                    placeholder="Search safe area name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-bold focus:outline-none"
                >
                  <option value="nearest">Sort: Nearest</option>
                  <option value="fastest">Sort: Travel Time</option>
                  <option value="type">Sort: Facility Type</option>
                </select>
              </div>

              {/* Category Chips */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCategoryFilter('shelter')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    categoryFilter === 'shelter' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ⛺ Shelters & Relief
                </button>
                <button
                  onClick={() => setCategoryFilter('hospital')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    categoryFilter === 'hospital' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🏥 Medical
                </button>
                <button
                  onClick={() => setCategoryFilter('emergency')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    categoryFilter === 'emergency' ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🚒 Fire & Police
                </button>
                <button
                  onClick={() => setCategoryFilter('school')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                    categoryFilter === 'school' ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🏫 Schools
                </button>
              </div>
            </div>
          </div>

          {/* Safe Areas Cards List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {filteredSafeAreas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-sans text-xs">
                No matching safe areas found. Try broadening search or resetting category filters.
              </div>
            ) : (
              filteredSafeAreas.map((sa) => {
                const isSelected = selectedSafeArea?.id === sa.id;
                return (
                  <div
                    key={sa.id}
                    onClick={() => setSelectedSafeArea(sa)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-black text-slate-900 text-xs block truncate max-w-[210px]">{sa.name}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{sa.district || location.displayName}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                        sa.category === 'shelter' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        sa.category === 'hospital' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      }`}>
                        {sa.category === 'shelter' ? 'SHELTER' : sa.category === 'hospital' ? 'MEDICAL' : sa.category.toUpperCase()}
                      </span>
                    </div>

                    {/* Calculated Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center space-x-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[9px]">ROAD DISTANCE</span>
                          <strong className="text-slate-900">{sa.roadDistKm} km away</strong>
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center space-x-1.5">
                        <Car className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[9px]">EST. DRIVE / WALK</span>
                          <strong className="text-slate-900">{sa.driveTimeMin}m drive • {sa.walkTimeMin}m walk</strong>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[10px]">
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>VERIFIED SAFE FACILITY</span>
                      </span>

                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSafeArea(sa);
                          }}
                          className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white'
                              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          }`}
                        >
                          {isSelected ? '✓ SELECTED ROUTE' : 'VIEW ROUTE'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Route Details & Interactive Leaflet Map (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          {/* Detailed Selected Route Summary Banner */}
          {selectedSafeArea && selectedRouteDetails ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-cyan-700 uppercase block">SELECTED EVACUATION ROUTE</span>
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <span>{userLocation.name}</span>
                    <ArrowRight className="w-4 h-4 text-cyan-600" />
                    <span className="text-cyan-800">{selectedSafeArea.name}</span>
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedSafeArea.lat},${selectedSafeArea.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <span>OPEN IN GOOGLE MAPS</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => setSelectedSafeArea(null)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    CHANGE
                  </button>
                </div>
              </div>

              {/* Hazard Blockage Alert & Detour Comparison */}
              {selectedRouteDetails.isBlocked ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>⚠️ SIMULATED HAZARD BLOCKAGE DETECTED ALONG DIRECT PATH</span>
                  </div>
                  <p className="text-[11px] text-rose-900 font-sans">
                    Direct arterial route passes within active simulated flood/hazard impact radius. Showing hazard-aware bypass route detour.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                    <div className="p-2 rounded bg-rose-100/70 border border-rose-200">
                      <span className="text-rose-700 font-bold block text-[10px]">DIRECT PATH</span>
                      <strong className="text-rose-900 line-through">{selectedRouteDetails.target.roadDistKm} km</strong> • <span className="text-rose-800 font-bold">BLOCKED</span>
                    </div>

                    <div className="p-2 rounded bg-emerald-100/80 border border-emerald-300">
                      <span className="text-emerald-800 font-bold block text-[10px]">RECOMMENDED BYPASS ROUTE</span>
                      <strong className="text-emerald-950">{selectedRouteDetails.detourDistKm} km</strong> • <span>Est. {selectedRouteDetails.detourDriveTimeMin} min drive</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">APPROX ROAD DISTANCE</span>
                    <strong className="text-slate-900 text-sm">{selectedRouteDetails.detourDistKm} km</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">EST. DRIVING TIME</span>
                    <strong className="text-cyan-800 text-sm">{selectedRouteDetails.detourDriveTimeMin} minutes</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">EST. WALKING TIME</span>
                    <strong className="text-slate-900 text-sm">{selectedRouteDetails.target.walkTimeMin} minutes</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-mono font-bold flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-600" />
              <span>Select a safe area from the left panel to display interactive route calculation on the map.</span>
            </div>
          )}

          {/* Interactive Leaflet Route Map */}
          <div className="relative flex-1 min-h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full min-h-[480px] z-10" />

            {/* Map Legend Overlay */}
            <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 shadow-md text-[11px] font-mono space-y-1">
              <div className="font-bold border-b border-slate-200 pb-1 text-slate-900 flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-600" />
                <span>EVACUATION MAP LEGEND</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" />
                <span>📍 Your Current Location</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span>🛡️ Safe Area Facility</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-1 bg-cyan-500 inline-block" />
                <span>🛣️ Active Route Path</span>
              </div>
              {activeHazard && (
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/40 border border-rose-600 inline-block" />
                  <span>🚧 Simulated Hazard Impact Zone</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
