import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocationData, UrbanAsset, RoadSegment, ScenarioConfig } from '../types';

interface RealWorldMapProps {
  location: LocationData;
  assets: UrbanAsset[];
  roads: RoadSegment[];
  activeScenario?: ScenarioConfig | null;
  timeStepIndex?: number;
  selectedAssetId?: string | null;
  onSelectAsset?: (asset: UrbanAsset) => void;
  onAskWhatIfForAsset?: (queryText: string) => void;
  visibleLayers?: {
    hospitals: boolean;
    police: boolean;
    fire: boolean;
    shelters: boolean;
    bridges: boolean;
    infrastructure: boolean;
    roads: boolean;
    disasterZone: boolean;
  };
}

export const RealWorldMap: React.FC<RealWorldMapProps> = ({
  location,
  assets = [],
  roads = [],
  activeScenario,
  selectedAssetId,
  onSelectAsset,
  onAskWhatIfForAsset,
  visibleLayers = {
    hospitals: true,
    police: true,
    fire: true,
    shelters: true,
    bridges: true,
    infrastructure: true,
    roads: true,
    disasterZone: true,
  },
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.lat, location.lng],
        zoom: 13,
        zoomControl: true,
      });

      // OpenStreetMap Light / CartoDB Positron Tile Layer for clean civic tech feel
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([location.lat, location.lng], 13);
    }
  }, [location.lat, location.lng]);

  // Render markers and layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Roads Network
    if (visibleLayers.roads) {
      roads.forEach(road => {
        const strokeColor =
          road.currentTrafficStatus === 'blocked' ? '#ef4444' :
          road.currentTrafficStatus === 'congested' ? '#f59e0b' : '#10b981';

        const polyline = L.polyline([road.fromCoords, road.toCoords], {
          color: strokeColor,
          weight: road.currentTrafficStatus === 'blocked' ? 4 : 3,
          dashArray: road.currentTrafficStatus === 'blocked' ? '6, 6' : undefined,
          opacity: 0.85,
        });

        polyline.bindTooltip(`<b>${road.name}</b><br/>Status: ${road.currentTrafficStatus.toUpperCase()}<br/>Capacity: ${road.capacityVehiclesPerHour.toLocaleString()} veh/hr`, {
          sticky: true,
        });

        layerGroup.addLayer(polyline);
      });
    }

    // 2. Draw Active Disaster Inundation Vector
    if (visibleLayers.disasterZone && activeScenario) {
      const radiusMeters = (activeScenario.affectedRadiusKm || 2.5) * 1000;
      const isFlood = activeScenario.type === 'flood';
      const isCyclone = activeScenario.type === 'cyclone';
      const isEarthquake = activeScenario.type === 'earthquake';

      const circleColor = isFlood ? '#0284c7' : isCyclone ? '#7c3aed' : isEarthquake ? '#dc2626' : '#e11d48';

      const hazardCircle = L.circle([location.lat, location.lng], {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.22,
        radius: radiusMeters,
        weight: 2,
      });

      hazardCircle.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px;">
          <strong style="color: ${circleColor}; text-transform: uppercase;">
            ${activeScenario.type.toUpperCase()} IMPACT ZONE
          </strong><br/>
          <strong>Location:</strong> ${location.displayName}<br/>
          <strong>Intensity:</strong> ${activeScenario.intensity} / 10<br/>
          <strong>Radius:</strong> ${(activeScenario.affectedRadiusKm || 2.5).toFixed(1)} km
        </div>
      `);

      layerGroup.addLayer(hazardCircle);
    }

    // 3. Draw Urban Asset Markers
    const getIconHtml = (type: UrbanAsset['type'], status: UrbanAsset['status']) => {
      const bg = status === 'critical' ? 'bg-red-600' : status === 'warning' ? 'bg-amber-500' : 'bg-slate-800';
      const emoji =
        type === 'hospital' ? '🏥' :
        type === 'police' ? '👮' :
        type === 'fire_station' ? '🚒' :
        type === 'school' ? '🏫' :
        type === 'shelter' ? '⛺' :
        type === 'bridge' ? '🌉' :
        type === 'power_station' ? '⚡' :
        type === 'water_treatment' ? '💧' :
        type === 'railway_station' ? '🚆' : '✈️';

      return `
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${bg} text-white shadow-md border-2 border-white text-sm cursor-pointer transform transition-transform hover:scale-110">
          ${emoji}
        </div>
      `;
    };

    assets.forEach(asset => {
      // Filter layer visibility
      if (asset.type === 'hospital' && !visibleLayers.hospitals) return;
      if (asset.type === 'police' && !visibleLayers.police) return;
      if (asset.type === 'fire_station' && !visibleLayers.fire) return;
      if (asset.type === 'shelter' && !visibleLayers.shelters) return;
      if (asset.type === 'bridge' && !visibleLayers.bridges) return;
      if ((asset.type === 'power_station' || asset.type === 'water_treatment') && !visibleLayers.infrastructure) return;

      const customIcon = L.divIcon({
        html: getIconHtml(asset.type, asset.status),
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([asset.lat, asset.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; width: 210px;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #0f172a;">${asset.name}</div>
          <div style="color: #64748b; margin-bottom: 6px;">${asset.address || location.displayName}</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Resilience Score:</span>
            <strong style="color: ${asset.resilienceScore > 80 ? '#16a34a' : '#d97706'}">${asset.resilienceScore}/100</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Status:</span>
            <strong style="text-transform: uppercase; color: ${asset.status === 'critical' ? '#dc2626' : asset.status === 'warning' ? '#d97706' : '#16a34a'}">${asset.status}</strong>
          </div>
          <div style="font-size: 10px; color: #0284c7; background: #f0f9ff; padding: 4px; border-radius: 4px; border: 1px solid #bae6fd; margin-bottom: 8px;">
            🟢 OpenStreetMap Verified Node
          </div>
          <button id="whatif-btn-${asset.id}" style="width: 100%; background: #0284c7; color: white; border: none; padding: 6px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">
            ❓ ASK WHAT IF
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`whatif-btn-${asset.id}`);
        if (btn && onAskWhatIfForAsset) {
          btn.onclick = () => {
            onAskWhatIfForAsset(`What if ${asset.name} becomes inaccessible?`);
          };
        }
      });

      marker.on('click', () => {
        if (onSelectAsset) {
          onSelectAsset(asset);
        }
      });

      layerGroup.addLayer(marker);
    });

  }, [location, assets, roads, activeScenario, visibleLayers, onSelectAsset]);

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full min-h-[480px] z-10" />

      {/* Map Overlay Badge */}
      <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 shadow-sm text-xs font-mono font-medium flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>OpenStreetMap Live GIS: {location.displayName} ({location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°)</span>
      </div>
    </div>
  );
};
