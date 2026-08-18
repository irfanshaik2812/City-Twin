import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Search, 
  Radio, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Home,
  Bot,
  Zap
} from 'lucide-react';
import { ScenarioConfig } from '../types';

interface NavbarProps {
  activeScenario?: ScenarioConfig | null;
  timeStepMinutes: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetSimulation: () => void;
  onOpenAskCity: () => void;
  onReturnLanding: () => void;
  cityStatus: 'STABLE' | 'WARNING' | 'CRITICAL';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScenario,
  timeStepMinutes,
  isPlaying,
  onTogglePlay,
  onResetSimulation,
  onOpenAskCity,
  onReturnLanding,
  cityStatus,
}) => {
  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-md border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between z-30 select-none">
      
      {/* Left: Active Scenario & City Status */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onReturnLanding}
          className="p-1.5 rounded-md bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 transition-colors"
          title="Return to Landing Page"
        >
          <Home className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        {/* City Status Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase text-slate-400">CITY STATUS:</span>
          <div className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center space-x-1.5 ${
            cityStatus === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-500/50 animate-pulse' :
            cityStatus === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
            'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              cityStatus === 'CRITICAL' ? 'bg-red-500' : cityStatus === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            <span>{cityStatus}</span>
          </div>
        </div>

        {/* Active Scenario Title */}
        {activeScenario && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-md bg-slate-900 border border-cyan-500/30 text-xs font-mono text-cyan-200">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">{activeScenario.name}</span>
          </div>
        )}
      </div>

      {/* Middle: Simulation Timeline Scrubber Status */}
      <div className="flex items-center space-x-3 bg-slate-900 px-4 py-1.5 rounded-lg border border-cyan-500/30 shadow-inner">
        <Clock className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-mono font-bold text-cyan-300">
          TIMELINE: T+{timeStepMinutes} MIN
        </span>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={onTogglePlay}
          className={`p-1 rounded text-slate-950 font-bold transition-all ${
            isPlaying ? 'bg-amber-400 hover:bg-amber-300' : 'bg-cyan-400 hover:bg-cyan-300'
          }`}
          title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
        </button>

        <button
          onClick={onResetSimulation}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Reset Timeline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Ask The City Natural Language Trigger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenAskCity}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950 to-slate-900 hover:from-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center space-x-2 shadow-lg shadow-cyan-500/10 cursor-pointer"
        >
          <Bot className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span className="hidden sm:inline">ASK THE CITY (AI)</span>
        </button>
      </div>

    </header>
  );
};
