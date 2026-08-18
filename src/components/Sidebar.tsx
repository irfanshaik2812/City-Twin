import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Flame, 
  AlertTriangle, 
  Compass, 
  Ambulance, 
  Building2, 
  Bot, 
  CloudRain, 
  Radio, 
  History, 
  FileText, 
  Settings,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export type TabType = 
  | 'overview'
  | 'city_twin'
  | 'scenario_simulator'
  | 'multi_disaster'
  | 'what_if_lab'
  | 'cascading_failure'
  | 'risk_map'
  | 'evacuation_planner'
  | 'emergency_resources'
  | 'healthcare_resilience'
  | 'infrastructure'
  | 'ai_command_center'
  | 'weather_traffic'
  | 'live_monitoring'
  | 'simulation_history'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cityRiskScore: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  cityRiskScore,
}) => {
  const menuSections: {
    category: string;
    items: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[];
  }[] = [
    {
      category: 'CITY DIGITAL TWIN',
      items: [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'city_twin', label: 'City Twin GIS', icon: <Map className="w-4 h-4" /> },
        { id: 'risk_map', label: 'Risk Intelligence', icon: <AlertTriangle className="w-4 h-4" /> },
      ]
    },
    {
      category: 'SIMULATE HAZARDS',
      items: [
        { id: 'scenario_simulator', label: 'Scenario Lab', icon: <Flame className="w-4 h-4" /> },
        { id: 'multi_disaster', label: 'Multi-Disaster', icon: <Layers className="w-4 h-4" />, badge: 'NEW' },
        { id: 'what_if_lab', label: 'What-If Lab', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'cascading_failure', label: 'Cascading Impact', icon: <Layers className="w-4 h-4" /> },
      ]
    },
    {
      category: 'RESPONSE & PLANNING',
      items: [
        { id: 'evacuation_planner', label: 'Evacuation Planner', icon: <Compass className="w-4 h-4" /> },
        { id: 'emergency_resources', label: 'Resource Optimizer', icon: <Ambulance className="w-4 h-4" /> },
        { id: 'healthcare_resilience', label: 'Healthcare Resilience', icon: <Building2 className="w-4 h-4" /> },
        { id: 'infrastructure', label: 'Infrastructure', icon: <Building2 className="w-4 h-4" /> },
      ]
    },
    {
      category: 'INTELLIGENCE & AI',
      items: [
        { id: 'weather_traffic', label: 'Weather & Traffic', icon: <CloudRain className="w-4 h-4" /> },
        { id: 'live_monitoring', label: 'Live Monitoring', icon: <Radio className="w-4 h-4 text-emerald-400" /> },
        { id: 'ai_command_center', label: 'AI Command Center', icon: <Bot className="w-4 h-4 text-cyan-400" />, badge: 'AI' },
      ]
    },
    {
      category: 'ANALYSIS & REPORTS',
      items: [
        { id: 'simulation_history', label: 'Simulation History', icon: <History className="w-4 h-4" /> },
        { id: 'reports', label: 'Reports Generator', icon: <FileText className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-cyan-500/20 flex flex-col justify-between select-none h-full z-20">
      
      {/* Brand & City Risk Indicator */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/40 text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black font-mono tracking-wider text-cyan-200">CITYTWIN</h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase">NOVA CITY HQ</p>
          </div>
        </div>

        {/* Live City Risk Gauge Card */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">CITY RISK INDEX</span>
            <span className={`text-lg font-black font-mono ${
              cityRiskScore > 75 ? 'text-red-400' : cityRiskScore > 50 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {cityRiskScore} / 100
            </span>
          </div>
          <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${
            cityRiskScore > 75 ? 'bg-red-950 text-red-300 border border-red-500/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
          }`}>
            {cityRiskScore > 75 ? 'CRITICAL' : cityRiskScore > 50 ? 'WARNING' : 'STABLE'}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">
              {section.category}
            </div>
            {section.items.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-cyan-950 to-slate-900 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10 font-bold' 
                      : 'text-slate-400 hover:text-cyan-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-500 text-slate-950 shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-cyan-500/20 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>SIMULATOR v3.6</span>
        <span className="text-cyan-400 font-bold">ONLINE</span>
      </div>

    </aside>
  );
};
