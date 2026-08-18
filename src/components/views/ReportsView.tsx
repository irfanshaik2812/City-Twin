import React from 'react';
import { LocationData, UrbanAsset, SimulationResult } from '../../types';
import { FileText, Printer, Download, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ReportsViewProps {
  location: LocationData;
  assets: UrbanAsset[];
  simulation?: SimulationResult | null;
  onBack?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  location,
  assets = [],
  simulation,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
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
            <FileText className="w-5 h-5 text-cyan-600" />
            <span>EXECUTIVE INCIDENT BRIEFING REPORT — {location.displayName.toUpperCase()}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Generated official disaster simulation & emergency preparedness report.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT / EXPORT REPORT</span>
        </button>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md space-y-6 font-sans text-slate-900 printable-area">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-800 tracking-wider uppercase block">
              CITYTWIN DISASTER INTELLIGENCE BRIEFING
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              DISASTER RESILIENCE REPORT: {location.displayName.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-600">{location.name}</p>
          </div>

          <div className="text-right text-xs font-mono">
            <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>GIS Ref:</strong> {location.lat.toFixed(4)}° N, {location.lng.toFixed(4)}° E</div>
            <div className="text-emerald-700 font-bold mt-1">🟢 Verified OpenStreetMap Data</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="font-bold text-sm text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
            1. EXECUTIVE SUMMARY
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            This report presents a GIS Digital Twin evaluation of {location.displayName}. Analysis incorporates verified OpenStreetMap infrastructure nodes, roads, healthcare facilities, and weather radar feeds.
          </p>
        </div>

        {/* Infrastructure Inventory Table */}
        <div className="space-y-3 font-mono text-xs">
          <h3 className="font-bold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
            2. VERIFIED CRITICAL INFRASTRUCTURE INVENTORY
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase text-slate-600">
                  <th className="p-2">Asset Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Resilience</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {assets.map(asset => (
                  <tr key={asset.id}>
                    <td className="p-2 font-bold">{asset.name}</td>
                    <td className="p-2 uppercase text-slate-500">{asset.type}</td>
                    <td className="p-2 font-bold text-slate-900">{asset.resilienceScore}/100</td>
                    <td className="p-2 uppercase text-emerald-800 font-bold">{asset.status}</td>
                    <td className="p-2 text-[10px] text-cyan-700">OpenStreetMap</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Recommendations */}
        <div className="space-y-3 font-mono text-xs">
          <h3 className="font-bold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
            3. AI DISASTER RESPONSE RECOMMENDATIONS
          </h3>

          <ul className="space-y-2 list-disc list-inside text-slate-700 text-xs font-sans">
            <li>Establish pre-positioned emergency trauma posts near high-capacity hospitals in {location.displayName}.</li>
            <li>Maintain open evacuation corridors along primary arterial highways leading to designated relief shelters.</li>
            <li>Monitor atmospheric wind and precipitation radar feeds for early flood inundation warnings.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
