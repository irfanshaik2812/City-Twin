import React, { useState } from 'react';
import { SimulationResult, ScenarioConfig } from '../../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Clock, 
  Activity, 
  Users, 
  Hospital, 
  Navigation,
  AlertTriangle,
  TrendingUp,
  Sliders
} from 'lucide-react';

interface SimulationTimelineViewProps {
  simulation: SimulationResult;
  config: ScenarioConfig;
  timeStepIndex: number;
  onSelectTimeStepIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetSimulation: () => void;
  speedMultiplier: number;
  onChangeSpeed: (speed: number) => void;
}

export const SimulationTimelineView: React.FC<SimulationTimelineViewProps> = ({
  simulation,
  config,
  timeStepIndex,
  onSelectTimeStepIndex,
  isPlaying,
  onTogglePlay,
  onResetSimulation,
  speedMultiplier,
  onChangeSpeed,
}) => {
  const steps = [
    { index: 0, label: 'T+0 MIN', timeMin: 0 },
    { index: 1, label: 'T+15 MIN', timeMin: 15 },
    { index: 2, label: 'T+30 MIN', timeMin: 30 },
    { index: 3, label: 'T+1 HR', timeMin: 60 },
    { index: 4, label: 'T+3 HR', timeMin: 180 },
    { index: 5, label: 'T+6 HR', timeMin: 360 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div>
          <h2 className="text-xl font-black font-mono tracking-wider text-cyan-300 uppercase flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>TIME-BASED SIMULATION TIMELINE</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate disaster evolution over time and track cascading impact across city infrastructure.
          </p>
        </div>
      </div>

      {/* Main Interactive Timeline Scrubber Card */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl space-y-6">
        
        {/* Playback Controls & Speed Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onTogglePlay}
              className={`px-5 py-2.5 rounded-lg text-slate-950 font-mono font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer ${
                isPlaying ? 'bg-amber-400 hover:bg-amber-300' : 'bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-400/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY SIMULATION'}</span>
            </button>

            <button
              onClick={onResetSimulation}
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET</span>
            </button>
          </div>

          {/* Speed Multiplier Buttons */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-400 uppercase">SPEED:</span>
            {[1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                  speedMultiplier === s
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-cyan-200 border border-slate-800'
                }`}
              >
                ×{s}
              </button>
            ))}
          </div>

        </div>

        {/* Timeline Scrubber Bar */}
        <div className="space-y-2">
          <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div 
              style={{ width: `${(timeStepIndex / 5) * 100}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
            />
          </div>

          {/* Step Buttons */}
          <div className="grid grid-cols-6 gap-2">
            {steps.map(step => (
              <button
                key={step.index}
                onClick={() => onSelectTimeStepIndex(step.index)}
                className={`py-3 rounded-lg border text-center transition-all cursor-pointer ${
                  timeStepIndex === step.index
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200 font-bold shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-cyan-300'
                }`}
              >
                <span className="text-xs font-mono block">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Metrics Delta Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">AFFECTED POPULATION</span>
            <span className="text-2xl font-black font-mono text-cyan-300 mt-1 block">
              {simulation.populationAffected.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              +{Math.round(simulation.populationAffected * 0.15)} in last interval
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">BLOCKED ROADS</span>
            <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
              {simulation.blockedRoadCount} SECTORS
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Traffic rerouted via Route B
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">EVACUATION PROGRESS</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {simulation.evacuationProgressPercent}%
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Shelters 01 & 04 operational
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">RESPONSE ETA</span>
            <span className="text-2xl font-black font-mono text-rose-400 mt-1 block">
              {simulation.avgResponseTimeMin} MIN
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Target optimal: &lt; 15 min
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
