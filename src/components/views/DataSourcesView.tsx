import React from 'react';
import { LocationData } from '../../types';
import { ShieldCheck, CheckCircle2, Globe, FileText, Database } from 'lucide-react';

interface DataSourcesViewProps {
  location: LocationData;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({ location }) => {
  const sources = [
    {
      name: 'OpenStreetMap (OSM) Overpass API',
      type: 'Geographic Infrastructure & Nodes',
      status: 'VERIFIED',
      coverage: `Verified healthcare, police, fire station, and shelter nodes for ${location.displayName}.`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: 'OpenStreetMap Nominatim Geocoding API',
      type: 'Real World Coordinates & Address Search',
      status: 'VERIFIED',
      coverage: `Exact lat/lng bounding box: ${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E.`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: 'OpenWeather / Global Atmospheric Doppler Feed',
      type: 'Atmospheric Weather Metrics',
      status: 'VERIFIED',
      coverage: `Live precipitation (mm/h), wind velocity (km/h), and thermal indices for ${location.displayName}.`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      name: 'Census of India & Spatial Density Datasets',
      type: 'Population & Urban Density Estimates',
      status: 'ESTIMATED',
      coverage: `Approximate population estimate (~${location.estimatedPopulation.toLocaleString()}) for spatial hazard risk modeling.`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      name: 'Google Maps Routes / Traffic Telemetry',
      type: 'Live Road Congestion Stream',
      status: 'UNAVAILABLE / ESTIMATED',
      coverage: 'Estimated road segment congestion based on simulation time-step parameters.',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>DATA SOURCES & METHODOLOGY TRANSPARENCY — {location.displayName.toUpperCase()}</span>
        </h2>
        <p className="text-xs text-slate-500 font-sans font-medium">
          Full audit log of public APIs, verified open GIS datasets, and simulation estimation models.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
          INTEGRATED DATASETS STATUS
        </h3>

        <div className="divide-y divide-slate-200">
          {sources.map((src, idx) => (
            <div key={idx} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm font-sans">{src.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${src.badgeColor}`}>
                    {src.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">{src.type}</div>
                <p className="text-slate-600 text-[11px] font-sans">{src.coverage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
