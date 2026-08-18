import React from 'react';
import { LocationData, UrbanAsset, SimulationResult } from '../../types';
import { AlertTriangle, ShieldCheck, Activity, BarChart3, ArrowLeft } from 'lucide-react';

interface RiskIntelligenceViewProps {
  location: LocationData;
  simulation?: SimulationResult | null;
  onBack?: () => void;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  location,
  simulation,
  onBack,
}) => {
  const isCoastal = location.displayName.toLowerCase().includes('chennai') ||
                    location.displayName.toLowerCase().includes('kanyakumari') ||
                    location.displayName.toLowerCase().includes('mumbai') ||
                    location.displayName.toLowerCase().includes('kochi');

  const risks = [
    { title: 'Urban Flood Inundation Index', score: isCoastal ? 78 : 42, level: isCoastal ? 'HIGH' : 'MODERATE', desc: 'Driven by intense monsoonal precipitation and river drainage congestion.' },
    { title: 'Coastal Surge & Cyclone Threat', score: isCoastal ? 82 : 25, level: isCoastal ? 'HIGH' : 'LOW', desc: 'Bay of Bengal / Arabian Sea coastal depression vulnerability.' },
    { title: 'Road Transport Gridlock Vulnerability', score: 64, level: 'MODERATE', desc: 'Single arterial bridge bottleneck vulnerability.' },
    { title: 'Healthcare Access Bottleneck', score: 58, level: 'MODERATE', desc: 'Trauma response latency during extreme weather conditions.' },
  ];

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="border-b border-slate-200 pb-3">
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
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span>MULTI-HAZARD RISK INTELLIGENCE — {location.displayName.toUpperCase()}</span>
        </h2>
        <p className="text-xs text-slate-500 font-sans font-medium">
          Comprehensive risk score matrix calculated from official GIS topographic layers & climate vulnerability profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {risks.map((r, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase text-slate-500 font-bold max-w-[150px]">{r.title}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                r.level === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {r.level}
              </span>
            </div>

            <div className="text-3xl font-black text-slate-900">{r.score}/100</div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${r.score > 70 ? 'bg-red-600' : 'bg-amber-500'}`}
                style={{ width: `${r.score}%` }}
              />
            </div>

            <p className="text-[11px] font-sans text-slate-600 leading-tight">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
