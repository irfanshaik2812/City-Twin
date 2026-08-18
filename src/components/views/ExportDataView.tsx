import React, { useState, useEffect, useMemo } from 'react';
import { LocationData, UrbanAsset, RoadSegment, WeatherData, WhatIfAnalysisResult, ExportFormat, ExportCategory, ExportHistoryItem } from '../../types';
import {
  generateCSV,
  generateJSON,
  generateGeoJSON,
  generateXLSX,
  downloadFile,
  printPDFReport,
  getExportHistory,
  saveExportHistoryItem,
  deleteExportHistoryItem
} from '../../services/exportService';
import { getSavedScenarios, deleteSavedScenario } from '../../services/scenarioService';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Globe,
  Printer,
  CheckSquare,
  Square,
  History,
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  MapPin,
  Database,
  Eye,
  Layers,
  BookmarkCheck,
  Zap,
  Info,
  ArrowLeft
} from 'lucide-react';

interface ExportDataViewProps {
  location: LocationData;
  assets: UrbanAsset[];
  roads: RoadSegment[];
  weather?: WeatherData | null;
  whatIfResult?: WhatIfAnalysisResult | null;
  onBack?: () => void;
}

export const ExportDataView: React.FC<ExportDataViewProps> = ({
  location,
  assets = [],
  roads = [],
  weather = null,
  whatIfResult = null,
  onBack,
}) => {
  const [savedScenarios, setSavedScenarios] = useState<WhatIfAnalysisResult[]>([]);
  const [includeSavedScenarios, setIncludeSavedScenarios] = useState<boolean>(true);

  useEffect(() => {
    setSavedScenarios(getSavedScenarios());
  }, []);

  const handleDeleteSavedScenario = (id: string) => {
    const updated = deleteSavedScenario(id);
    setSavedScenarios(updated);
  };

  const allCategories: { id: ExportCategory; label: string; count: number; status: string }[] = [
    { id: 'location_info', label: 'Location & Geographic Overview', count: 1, status: 'VERIFIED' },
    { id: 'map_geographic', label: 'Map / GIS Coordinates & Bounding Box', count: 1, status: 'VERIFIED' },
    { id: 'roads', label: 'Road Network Segments', count: roads.length, status: 'VERIFIED' },
    { id: 'hospitals', label: 'Hospitals & Healthcare Facilities', count: assets.filter(a => a.type === 'hospital').length, status: 'VERIFIED' },
    { id: 'emergency_facilities', label: 'Police & Fire Rescue Stations', count: assets.filter(a => a.type === 'police' || a.type === 'fire_station').length, status: 'VERIFIED' },
    { id: 'schools', label: 'Schools & Educational Evacuation Nodes', count: assets.filter(a => a.type === 'school').length, status: 'VERIFIED' },
    { id: 'infrastructure', label: 'Power Substation & Water Treatment', count: assets.filter(a => a.type === 'power_station' || a.type === 'water_treatment').length, status: 'VERIFIED' },
    { id: 'population_data', label: 'Demographic & Population Grid Estimates', count: 1, status: 'ESTIMATED' },
    { id: 'weather_data', label: 'Live Weather Observation & Storm Projections', count: 1, status: 'VERIFIED' },
    { id: 'risk_analysis', label: 'Composite Hazard & Risk Intelligence Scores', count: 1, status: 'ESTIMATED' },
    { id: 'disaster_simulation', label: 'Disaster Inundation & Scenario Vector Parameters', count: 1, status: 'SIMULATED' },
    { id: 'what_if_analysis', label: 'What-If Natural-Language Scenario Results', count: (whatIfResult ? 1 : 0) + (includeSavedScenarios ? savedScenarios.length : 0), status: 'SIMULATED' },
    { id: 'evacuation_routes', label: 'Optimized Evacuation Routes & Primary Detours', count: 3 + (includeSavedScenarios ? savedScenarios.length : 0), status: 'SIMULATED' },
    { id: 'ai_insights', label: 'AI Disaster Countermeasure Recommendations', count: 4, status: 'MODELLED' },
    { id: 'data_sources', label: 'Data Sources, Licenses & Methodology Notes', count: 4, status: 'VERIFIED' },
  ];

  const [selectedCats, setSelectedCats] = useState<ExportCategory[]>(allCategories.map(c => c.id));
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('geojson');
  const [filename, setFilename] = useState<string>(`citytwin_${location.displayName.toLowerCase().replace(/\s+/g, '_')}_gis_export_${new Date().toISOString().split('T')[0]}`);
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [showCodeSnippet, setShowCodeSnippet] = useState<boolean>(true);

  useEffect(() => {
    setHistory(getExportHistory());
  }, []);

  const handleSelectAll = () => setSelectedCats(allCategories.map(c => c.id));
  const handleClearAll = () => setSelectedCats([]);

  const toggleCategory = (cat: ExportCategory) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter(c => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  // Calculate Record Count & Data Provenance Breakdown
  const recordBreakdown = useMemo(() => {
    let real = 0;
    let estimated = 0;
    let simulated = 0;

    selectedCats.forEach(cat => {
      const item = allCategories.find(c => c.id === cat);
      if (!item) return;
      if (item.status === 'VERIFIED') real += item.count;
      else if (item.status === 'ESTIMATED') estimated += item.count;
      else simulated += item.count;
    });

    const total = real + estimated + simulated;
    const realPct = total > 0 ? Math.round((real / total) * 100) : 0;
    const estPct = total > 0 ? Math.round((estimated / total) * 100) : 0;
    const simPct = total > 0 ? Math.round((simulated / total) * 100) : 0;

    return { real, estimated, simulated, total, realPct, estPct, simPct };
  }, [selectedCats, savedScenarios, includeSavedScenarios, whatIfResult, assets, roads]);

  // Build Payload & Calculated File Size / Live Snippet Preview
  const exportPayload = useMemo(() => {
    return {
      location,
      assets,
      roads,
      weather,
      whatIfResult,
      savedScenarios: includeSavedScenarios ? savedScenarios : [],
      selectedCategories: selectedCats,
      customFilename: filename,
    };
  }, [location, assets, roads, weather, whatIfResult, savedScenarios, includeSavedScenarios, selectedCats, filename]);

  const previewOutput = useMemo(() => {
    let content = '';
    let ext = selectedFormat;
    let mime = 'text/plain';

    if (selectedFormat === 'geojson') {
      content = generateGeoJSON(exportPayload);
      mime = 'application/geo+json';
    } else if (selectedFormat === 'json') {
      content = generateJSON(exportPayload);
      mime = 'application/json';
    } else if (selectedFormat === 'xlsx') {
      content = generateXLSX(exportPayload);
      mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (selectedFormat === 'pdf') {
      content = `CITYTWIN PDF REPORT PREVIEW\nLocation: ${location.displayName}\nSelected Datasets: ${selectedCats.length}\nRecords Included: ${recordBreakdown.total}\nProvenance: Real (${recordBreakdown.real}), Estimated (${recordBreakdown.estimated}), Simulated (${recordBreakdown.simulated})`;
      mime = 'application/pdf';
    } else {
      content = generateCSV(exportPayload);
      mime = 'text/csv';
    }

    const bytes = new Blob([content]).size;
    const sizeFormatted = bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`;

    // Snippet head
    const snippetLines = content.split('\n').slice(0, 18).join('\n');

    return { content, sizeFormatted, bytes, snippetLines, ext, mime };
  }, [exportPayload, selectedFormat, recordBreakdown]);

  const handleExecuteExport = () => {
    const { content, ext, mime } = previewOutput;

    if (selectedFormat === 'pdf') {
      printPDFReport(exportPayload);
    } else {
      downloadFile(content, `${filename}.${ext}`, mime);
    }

    // Record history
    const historyItem: ExportHistoryItem = {
      id: `exp-${Date.now()}`,
      filename: `${filename}.${ext}`,
      locationName: location.displayName,
      exportType: selectedCats.length === allCategories.length ? 'Full Workspace Export' : 'Custom Subset Export',
      format: selectedFormat,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      recordCount: recordBreakdown.total,
      datasetBreakdown: {
        real: recordBreakdown.real,
        estimated: recordBreakdown.estimated,
        simulated: recordBreakdown.simulated,
      },
    };

    saveExportHistoryItem(historyItem);
    setHistory(getExportHistory());
  };

  const handleDeleteHistory = (id: string) => {
    const updated = deleteExportHistoryItem(id);
    setHistory(updated);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center space-x-1 mb-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </button>
          )}
          <div className="flex items-center space-x-2 text-cyan-700 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4 text-cyan-600" />
            <span>ENTERPRISE DISASTER DATA CENTER</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            EXPORT DATA CENTER
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Download verified GIS GeoJSON vectors, OpenStreetMap nodes, simulation results, and saved What-If scenarios for <strong className="text-slate-800">{location.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>GeoJSON RFC 7946 Enforced</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Dataset Category Selector & Export Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* CATEGORY SELECTOR CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 font-mono text-xs">
              <h3 className="font-bold uppercase text-slate-900 flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-cyan-600" />
                <span>SELECT DATASETS TO EXPORT</span>
              </h3>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className="text-cyan-700 hover:text-cyan-900 font-bold hover:underline cursor-pointer"
                >
                  SELECT ALL
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-slate-500 hover:text-slate-700 font-bold hover:underline cursor-pointer"
                >
                  CLEAR ALL
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              {allCategories.map(cat => {
                const isChecked = selectedCats.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-cyan-50/80 border-cyan-400 text-cyan-950 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3 pr-2">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-cyan-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-bold text-[11px] leading-tight">{cat.label}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold block text-slate-700">
                        {cat.count} records
                      </span>
                      <span className={`text-[8px] font-bold block mt-0.5 uppercase ${
                        cat.status === 'VERIFIED' ? 'text-emerald-700' : cat.status === 'ESTIMATED' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {cat.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXPORT PREVIEW SECTION */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-6 shadow-md border border-slate-800 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
                <Eye className="w-4.5 h-4.5 text-cyan-400" />
                <span>EXPORT PREVIEW & PROVENANCE BREAKDOWN</span>
              </div>
              <button
                onClick={() => setShowCodeSnippet(!showCodeSnippet)}
                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer font-bold"
              >
                {showCodeSnippet ? 'HIDE FILE SNIPPET' : 'SHOW FILE SNIPPET'}
              </button>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">ESTIMATED DATA SIZE</span>
                <span className="text-lg font-black text-cyan-300 block">{previewOutput.sizeFormatted}</span>
                <span className="text-[9px] text-slate-500 block">({previewOutput.bytes.toLocaleString()} bytes)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">TOTAL RECORD COUNT</span>
                <span className="text-lg font-black text-white block">{recordBreakdown.total} records</span>
                <span className="text-[9px] text-slate-500 block">{selectedCats.length} datasets selected</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">EXPORT FORMAT</span>
                <span className="text-lg font-black text-amber-300 uppercase block">{selectedFormat}</span>
                <span className="text-[9px] text-slate-500 block">{previewOutput.mime.split('/')[1] || selectedFormat}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">VERIFIED REAL RATIO</span>
                <span className="text-lg font-black text-emerald-400 block">{recordBreakdown.realPct}%</span>
                <span className="text-[9px] text-slate-500 block">{recordBreakdown.real} verified items</span>
              </div>
            </div>

            {/* DATA STATUS PROVENANCE BREAKDOWN BAR */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                <span className="text-slate-300">DATA PROVENANCE COMPOSITION:</span>
                <span className="text-cyan-400">100% EXPORT TRANSPARENCY</span>
              </div>

              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden flex">
                <div style={{ width: `${recordBreakdown.realPct}%` }} className="bg-emerald-500 h-full transition-all" title="Verified Data" />
                <div style={{ width: `${recordBreakdown.estPct}%` }} className="bg-amber-500 h-full transition-all" title="Estimated Data" />
                <div style={{ width: `${recordBreakdown.simPct}%` }} className="bg-rose-500 h-full transition-all" title="Simulated Data" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="flex items-center space-x-1.5 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Real Verified ({recordBreakdown.real} • {recordBreakdown.realPct}%)</span>
                </div>
                <div className="flex items-center space-x-1.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Estimated Census ({recordBreakdown.estimated} • {recordBreakdown.estPct}%)</span>
                </div>
                <div className="flex items-center space-x-1.5 text-rose-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Simulated Hazard ({recordBreakdown.simulated} • {recordBreakdown.simPct}%)</span>
                </div>
              </div>
            </div>

            {/* LIVE SAMPLE CODE SNIPPET */}
            {showCodeSnippet && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                  <span>LIVE GENERATED {selectedFormat.toUpperCase()} FILE SNIPPET:</span>
                  <span>PREVIEW FIRST 18 LINES</span>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-300 text-[11px] font-mono leading-relaxed overflow-x-auto border border-slate-800 max-h-52 custom-scrollbar">
                  {previewOutput.snippetLines}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Format, Filename & Action */}
        <div className="space-y-6 font-mono text-xs">
          {/* Export Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <h3 className="font-bold uppercase text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
              <Download className="w-4 h-4 text-cyan-600" />
              <span>EXPORT CONFIGURATION</span>
            </h3>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">
                EXPORT FORMAT:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'geojson', label: 'GeoJSON GIS', icon: <Globe className="w-4 h-4 text-cyan-600" /> },
                  { id: 'json', label: 'JSON Payload', icon: <FileCode className="w-4 h-4 text-amber-600" /> },
                  { id: 'csv', label: 'CSV Table', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> },
                  { id: 'xlsx', label: 'Excel XLSX', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> },
                  { id: 'pdf', label: 'PDF Report', icon: <Printer className="w-4 h-4 text-rose-600" /> },
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id as ExportFormat)}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                      selectedFormat === fmt.id
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-900 font-bold shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {fmt.icon}
                    <span className="text-[11px]">{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filename Input */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">
                CUSTOM FILENAME:
              </label>
              <input
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-mono text-xs font-bold focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>

            {/* Saved Scenarios Include Checkbox */}
            {savedScenarios.length > 0 && (
              <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 flex items-center justify-between cursor-pointer" onClick={() => setIncludeSavedScenarios(!includeSavedScenarios)}>
                <div className="flex items-center space-x-2">
                  {includeSavedScenarios ? (
                    <CheckSquare className="w-4 h-4 text-cyan-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold text-cyan-950">
                    Include {savedScenarios.length} Saved What-If Scenarios
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[9px] font-bold">
                  SIMULATED
                </span>
              </div>
            )}

            {/* Execute Export Button */}
            <button
              onClick={handleExecuteExport}
              disabled={selectedCats.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ${
                selectedCats.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <Download className="w-4.5 h-4.5" />
              <span>DOWNLOAD EXPORT FILE ({previewOutput.sizeFormatted})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SAVED WHAT-IF SCENARIOS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
          <h3 className="font-bold uppercase text-slate-900 flex items-center space-x-2">
            <BookmarkCheck className="w-4 h-4 text-cyan-600" />
            <span>SAVED WHAT-IF SCENARIOS ({savedScenarios.length})</span>
          </h3>

          {savedScenarios.length > 0 && (
            <span className="text-[10px] text-slate-500">
              Stored in Local Storage • Embedded in GeoJSON exports with metadata properties <code className="bg-slate-100 px-1 py-0.5 rounded text-cyan-700">dataStatus</code> &amp; <code className="bg-slate-100 px-1 py-0.5 rounded text-cyan-700">source</code>
            </span>
          )}
        </div>

        {savedScenarios.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <BookmarkCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs">No saved What-If scenarios yet. Save scenarios in the What-If Lab to export them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedScenarios.map(scen => (
              <div key={scen.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 relative group hover:border-cyan-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold text-cyan-700 uppercase">
                    {scen.understanding.event || 'SCENARIO'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold uppercase">
                      SIMULATED
                    </span>
                    <button
                      onClick={() => handleDeleteSavedScenario(scen.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete saved scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-xs leading-snug">
                  "{scen.question}"
                </h4>

                <div className="space-y-1 text-[11px] text-slate-700 border-t border-slate-200/80 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary Impact:</span>
                    <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{scen.primaryImpact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Baseline Time:</span>
                    <strong className="text-emerald-700">{scen.beforeVsAfter.primaryRouteBaselineTime}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Simulated Time:</span>
                    <strong className="text-rose-700">{scen.beforeVsAfter.primaryRouteSimulatedTime}</strong>
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 flex items-center justify-between border-t border-slate-200/80 pt-1.5">
                  <span>Source: CITYTWIN Physics Engine</span>
                  <span>{scen.timestamp || 'Saved Scenario'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXPORT HISTORY LOG */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm font-mono text-xs">
        <h3 className="font-bold uppercase text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
          <History className="w-4 h-4 text-cyan-600" />
          <span>EXPORT HISTORY LOG</span>
        </h3>

        {history.length === 0 ? (
          <p className="text-slate-400 text-center py-6 text-xs">No past exports recorded in this session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                  <th className="py-2 px-3">Filename</th>
                  <th className="py-2 px-3">Location</th>
                  <th className="py-2 px-3">Format</th>
                  <th className="py-2 px-3">Record Count</th>
                  <th className="py-2 px-3">Export Date</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.filename}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.locationName}</td>
                    <td className="py-2.5 px-3 uppercase text-cyan-700 font-bold">{item.format}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.recordCount} records</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">{item.date}</td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
