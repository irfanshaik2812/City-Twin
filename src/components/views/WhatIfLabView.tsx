import React, { useState, useEffect } from 'react';
import { LocationData, UrbanAsset, RoadSegment, WeatherData, WhatIfAnalysisResult } from '../../types';
import { analyzeWhatIfQuery } from '../../services/whatIfEngine';
import { downloadFile, generateJSON, printPDFReport } from '../../services/exportService';
import { getSavedScenarios, saveScenario, deleteSavedScenario } from '../../services/scenarioService';
import { RealWorldMap } from '../RealWorldMap';
import {
  Sparkles,
  Search,
  MapPin,
  Play,
  Layers,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  Activity,
  GitCompare,
  RotateCcw,
  Plus,
  Trash2,
  BookmarkCheck,
  Compass
} from 'lucide-react';

interface WhatIfLabViewProps {
  location: LocationData;
  assets: UrbanAsset[];
  roads: RoadSegment[];
  weather?: WeatherData | null;
  onOpenExportView?: () => void;
  prefilledQuestion?: string;
  onNavigateTab?: (tab: any, scenarioData?: any) => void;
  onBack?: () => void;
}

export const WhatIfLabView: React.FC<WhatIfLabViewProps> = ({
  location,
  assets = [],
  roads = [],
  weather = null,
  onOpenExportView,
  prefilledQuestion = '',
  onNavigateTab,
  onBack,
}) => {
  const [question, setQuestion] = useState<string>(prefilledQuestion || '');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState<number>(0);
  const [result, setResult] = useState<WhatIfAnalysisResult | null>(null);

  // Scenario Comparison & Persistence States
  const [savedScenarios, setSavedScenarios] = useState<WhatIfAnalysisResult[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  useEffect(() => {
    setSavedScenarios(getSavedScenarios());
  }, []);

  const analysisSteps = [
    'Understanding natural language question...',
    `Finding relevant real-world locations in ${location.displayName}...`,
    'Checking available OpenStreetMap vector data...',
    'Analyzing nearby hospital and road infrastructure...',
    'Calculating emergency travel time deltas...',
    'Generating scenario response model...',
  ];

  useEffect(() => {
    if (prefilledQuestion) {
      setQuestion(prefilledQuestion);
    }
  }, [prefilledQuestion]);

  const handleRunAnalysis = async (queryToRun?: string) => {
    const q = (queryToRun || question).trim();
    if (!q) return;

    setQuestion(q);
    setIsAnalyzing(true);
    setAnalysisStepIndex(0);

    // Simulate analysis step sequence for clear feedback
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStepIndex(i);
      await new Promise(r => setTimeout(r, 260));
    }

    const res = await analyzeWhatIfQuery(q, location, assets, roads, weather);
    setResult(res);
    setIsAnalyzing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunAnalysis();
    }
  };

  const handleSaveScenario = () => {
    if (!result) return;
    const updated = saveScenario(result);
    setSavedScenarios(updated);
    setSaveToast('Scenario saved successfully! Available in Export Data.');
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleDeleteScenario = (id: string) => {
    const updated = deleteSavedScenario(id);
    setSavedScenarios(updated);
  };

  const exampleQuestions = [
    "What if the main road near " + location.displayName + " becomes flooded?",
    "What if the nearest hospital becomes inaccessible during heavy rain?",
    "What if a major bridge is closed during peak evening traffic?",
    "What if there is 200 mm of rainfall in 6 hours?",
    "What if an earthquake of magnitude 6.5 occurs near this location?",
    "What if the airport becomes cut off from the urban center?",
    "What if emergency vehicles cannot use the primary route?",
    "What if flooding cuts this neighborhood off from the rest of the city?",
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>INTERACTIVE NATURAL-LANGUAGE SCENARIO ENGINE</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              WHAT-IF SCENARIO LAB
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Ask how any hypothetical event could affect <strong className="text-slate-800">{location.name}</strong> in real time.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            {savedScenarios.length > 0 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
              >
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span>COMPARE SCENARIOS ({savedScenarios.length})</span>
              </button>
            )}

            {onOpenExportView && (
              <button
                onClick={onOpenExportView}
                className="px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-cyan-600" />
                <span>EXPORT DATA</span>
              </button>
            )}
          </div>
        </div>

        {/* Natural Language Input Area */}
        <div className="mt-6 space-y-3">
          <div className="relative rounded-2xl border-2 border-cyan-500/80 bg-slate-50/50 p-2 shadow-inner transition-all focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-500/10">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder={`Ask a What-If question about ${location.displayName}...\ne.g. What happens if the main road becomes inaccessible during heavy flooding?`}
              className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none p-3 resize-none custom-scrollbar"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 px-2">
              <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold text-[10px]">Ctrl/Cmd + Enter</kbd>
                <span>to analyze</span>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRunAnalysis(`What if the primary road near ${location.displayName} floods?`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>USE CURRENT MAP LOCATION</span>
                </button>

                <button
                  onClick={() => handleRunAnalysis()}
                  disabled={isAnalyzing || !question.trim()}
                  className={`px-5 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md cursor-pointer ${
                    isAnalyzing || !question.trim()
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>ANALYZING...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>ANALYZE SCENARIO</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* TRY ASKING Suggestions */}
          <div className="pt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
              TRY ASKING:
            </span>
            <div className="flex flex-wrap gap-2">
              {exampleQuestions.map((qText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunAnalysis(qText)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-cyan-50 hover:border-cyan-300 border border-slate-200 text-slate-700 hover:text-cyan-900 text-xs font-medium transition-all cursor-pointer text-left"
                >
                  "{qText}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analyzing Progress Feedback */}
      {isAnalyzing && (
        <div className="bg-slate-900 rounded-2xl p-6 text-white font-mono space-y-4 shadow-md border border-slate-800 animate-fade-in">
          <div className="flex items-center space-x-3 text-cyan-400">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold uppercase tracking-wider text-xs">SPATIAL SCENARIO COMPILATION IN PROGRESS</span>
          </div>

          <p className="text-sm font-semibold text-slate-200">{analysisSteps[analysisStepIndex]}</p>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{ width: `${((analysisStepIndex + 1) / analysisSteps.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!isAnalyzing && !result && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">ASK A WHAT-IF QUESTION</h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 font-medium">
              Explore how any hypothetical flood, bridge collapse, cyclone, or road obstruction would affect {location.displayName}'s emergency services, travel times, and hospital accessibility.
            </p>
          </div>
        </div>
      )}

      {/* ANALYSIS RESULT DASHBOARD */}
      {!isAnalyzing && result && (
        <div className="space-y-8 animate-fade-in">
          {/* Scenario Understanding Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md font-mono text-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>SCENARIO UNDERSTANDING</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase text-[10px]">
                  HYPOTHETICAL SIMULATION
                </span>
                {result.understanding.isCompoundScenario && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase text-[10px]">
                    COMPOUND SCENARIO
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-bold">HAZARD / EVENT</span>
                <span className="font-bold text-white text-xs">{result.understanding.event}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-bold">LOCATION</span>
                <span className="font-bold text-white text-xs">{result.understanding.location}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-bold">CONDITION</span>
                <span className="font-bold text-white text-xs">{result.understanding.timeCondition}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-bold">SEVERITY LEVEL</span>
                <span className="font-bold text-rose-400 text-xs">{result.understanding.severity}</span>
              </div>
            </div>

            {result.understanding.compoundingFactors.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                <span className="text-[10px] text-amber-400 uppercase font-bold">Compounding Factors:</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.understanding.compoundingFactors.map((cf, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 border border-amber-500/30 text-[10px]">
                      {cf}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Summary & Before vs After Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-cyan-700 block">
                  SCENARIO ANALYSIS RESULT
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  "{result.question}"
                </h3>
              </div>

              <div className="flex flex-wrap items-center space-x-2 font-mono text-xs">
                {saveToast && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center space-x-1 animate-fade-in">
                    <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                    <span>{saveToast}</span>
                  </span>
                )}

                <button
                  onClick={handleSaveScenario}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SAVE SCENARIO</span>
                </button>

                <button
                  onClick={() => {
                    if (onNavigateTab) {
                      onNavigateTab('evacuation', result);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>FIND SAFE AREAS</span>
                </button>

                <button
                  onClick={() => printPDFReport({ location, assets, roads, whatIfResult: result, savedScenarios })}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT ANALYSIS</span>
                </button>
              </div>
            </div>

            {/* Impact Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-rose-800 block">
                  PRIMARY SIMULATED IMPACT
                </span>
                <p className="text-xs text-rose-950 font-medium leading-relaxed">
                  {result.primaryImpact}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-800 block">
                  SECONDARY CONFINEMENT EFFECTS
                </span>
                <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                  {result.secondaryImpacts.map((si, idx) => (
                    <li key={idx}>{si}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* BEFORE VS AFTER COMPARISON */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 font-mono text-xs">
                <span className="font-bold text-slate-900 uppercase flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  <span>ACCESSIBILITY & TRAVEL TIME COMPARISON</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                  MODELLED SCENARIO
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">🟢 BEFORE (BASELINE OPERATIONS)</span>
                  <div className="text-2xl font-black text-slate-900">{result.beforeVsAfter.primaryRouteBaselineTime}</div>
                  <p className="text-[11px] text-slate-500 font-sans">Normal route clear & accessible.</p>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 shadow-2xs">
                  <span className="text-[10px] text-rose-800 uppercase font-bold block">🔴 AFTER (SIMULATED OBSTRUCTION)</span>
                  <div className="text-2xl font-black text-rose-900">{result.beforeVsAfter.primaryRouteSimulatedTime}</div>
                  <p className="text-[11px] text-rose-800 font-sans">{result.beforeVsAfter.routeStatusChange}</p>
                </div>
              </div>
            </div>

            {/* MAP IMPACT VISUALIZATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <span>SIMULATED SPATIAL MAP IMPACT</span>
                </h4>
                <div className="flex items-center space-x-3 text-[10px] font-mono font-bold">
                  <span className="flex items-center space-x-1 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Affected Zone</span>
                  </span>
                  <span className="flex items-center space-x-1 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Secondary Impact</span>
                  </span>
                  <span className="flex items-center space-x-1 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Alternative Bypass</span>
                  </span>
                </div>
              </div>

              <div className="h-[360px]">
                <RealWorldMap
                  location={location}
                  assets={assets}
                  roads={roads}
                />
              </div>
            </div>

            {/* AFFECTED INFRASTRUCTURE LIST */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                AFFECTED URBAN INFRASTRUCTURE
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.affectedInfrastructure.map(ai => (
                  <div key={ai.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{ai.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{ai.type} • {ai.distanceKm?.toFixed(1) || '1.2'} km away</span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold block">
                        {ai.status}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold block">
                        {ai.dataStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* POTENTIAL EXPOSURE METRICS */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2">
                POTENTIAL EXPOSURE & RESILIENCE METRICS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.potentialExposure.map((pe, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">{pe.metric}</span>
                    <span className="text-base font-black text-slate-900 block">{pe.value}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[9px] font-bold inline-block">
                      {pe.classification}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CASCADING EFFECTS CHAIN */}
            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-2 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-600" />
                <span>POSSIBLE CASCADING EFFECTS</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {result.cascadingEffects.map((ce, idx) => (
                  <div key={ce.step} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 relative">
                    <span className="text-[10px] font-bold text-cyan-700 uppercase">STEP {ce.step}</span>
                    <h5 className="font-bold text-slate-900 text-xs">{ce.label}</h5>
                    <p className="text-[10px] text-slate-500 font-sans leading-tight">{ce.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI COUNTERMEASURES & RECOMMENDATIONS */}
            <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-3">
              <h4 className="font-bold text-cyan-950 text-xs font-mono uppercase flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>AI SCENARIO ANALYST RECOMMENDATIONS</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-800">
                {result.aiRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-cyan-100 flex items-start space-x-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* YOU MAY ALSO WANT TO ASK (Follow-ups) */}
            <div className="pt-2 font-mono text-xs space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">YOU MAY ALSO WANT TO ASK:</span>
              <div className="flex flex-wrap gap-2">
                {result.suggestedFollowUps.map((fu, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRunAnalysis(fu)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-cyan-100 hover:text-cyan-900 border border-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                  >
                    "{fu}"
                  </button>
                ))}
              </div>
            </div>

            {/* DATA SOURCES & MODEL ASSUMPTIONS */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] text-slate-500">
              <div>
                <strong className="text-slate-800 uppercase block mb-1">DATA SOURCES USED</strong>
                <ul className="space-y-1 list-disc list-inside">
                  {result.dataSources.map((ds, idx) => (
                    <li key={idx}>{ds.name} ({ds.type})</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong className="text-slate-800 uppercase block mb-1">MODEL ASSUMPTIONS</strong>
                <ul className="space-y-1 list-disc list-inside">
                  {result.modelAssumptions.map((ma, idx) => (
                    <li key={idx}>{ma}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <GitCompare className="w-5 h-5 text-cyan-600" />
                <span>SAVED SCENARIOS COMPARISON</span>
              </h3>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                CLOSE
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedScenarios.map((scen, idx) => (
                <div key={scen.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <span className="text-[10px] font-bold text-cyan-700 uppercase">SCENARIO {idx + 1}</span>
                  <h4 className="font-bold text-slate-900 text-xs">"{scen.question}"</h4>
                  <div className="space-y-1 text-[11px]">
                    <div><strong>Hazard:</strong> {scen.understanding.event}</div>
                    <div><strong>Baseline Time:</strong> {scen.beforeVsAfter.primaryRouteBaselineTime}</div>
                    <div><strong>Simulated Time:</strong> {scen.beforeVsAfter.primaryRouteSimulatedTime}</div>
                    <div><strong>Primary Impact:</strong> {scen.primaryImpact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
