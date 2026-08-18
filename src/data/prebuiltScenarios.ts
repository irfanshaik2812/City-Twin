import { ScenarioConfig } from '../types';

export interface PrebuiltScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  config: Partial<ScenarioConfig> & {
    id: string;
    name: string;
    type: ScenarioConfig['type'];
    intensity: number;
    affectedRadiusKm: number;
    timeStepMinutes: number;
    timeIndex: number;
    parameters: ScenarioConfig['parameters'];
  };
}

export const PREBUILT_SCENARIOS: PrebuiltScenario[] = [
  {
    id: 'riverside-mega-flood',
    title: '🌊 SEVERE MONSOON FLOOD',
    subtitle: 'Relentless 110mm/hr deluge and urban overflow',
    description: 'Extreme heavy rainfall causes river overflow, submerging low-lying roads, inundating hospitals, and crippling arterial transport routes.',
    icon: 'Waves',
    config: {
      id: 'scen-flood-1',
      name: 'Severe Monsoon Deluge',
      type: 'flood',
      intensity: 9,
      affectedRadiusKm: 3.5,
      parameters: {
        rainfallIntensityMm: 110,
        seaLevelRiseMeters: 1.2,
      },
      timeStepMinutes: 60,
      timeIndex: 0,
    },
  },
  {
    id: 'urban-earthquake',
    title: '🌎 URBAN EARTHQUAKE',
    subtitle: '7.2 Magnitude shallow crustal tremor',
    description: 'Shallow earthquake centered near urban core causing infrastructure stress, bridge access disruptions, and high trauma support demand.',
    icon: 'Activity',
    config: {
      id: 'scen-quake-1',
      name: 'Urban Earthquake 7.2',
      type: 'earthquake',
      intensity: 8,
      affectedRadiusKm: 5.0,
      parameters: {
        magnitudeRichter: 7.2,
      },
      timeStepMinutes: 15,
      timeIndex: 0,
    },
  },
  {
    id: 'coastal-cyclone',
    title: '🌪 CATEGORY 4 CYCLONE',
    subtitle: '210 km/h sustained winds & coastal surge',
    description: 'Severe cyclonic storm making landfall, disrupting power grids, causing wind damage, and requiring rapid coastal evacuation.',
    icon: 'Wind',
    config: {
      id: 'scen-cyclone-1',
      name: 'Category 4 Cyclone Impact',
      type: 'cyclone',
      intensity: 9,
      affectedRadiusKm: 6.0,
      parameters: {
        windSpeedKmh: 210,
        seaLevelRiseMeters: 2.5,
      },
      timeStepMinutes: 30,
      timeIndex: 0,
    },
  },
  {
    id: 'industrial-accident',
    title: '🔥 INDUSTRIAL HAZMAT ACCIDENT',
    subtitle: 'Chemical plant explosion and fire threat',
    description: 'Major industrial hazard triggering smoke plume drifting towards residential districts, demanding immediate shelter-in-place orders.',
    icon: 'Flame',
    config: {
      id: 'scen-chem-1',
      name: 'Industrial Hazmat Explosion',
      type: 'industrial_accident',
      intensity: 7,
      affectedRadiusKm: 2.5,
      parameters: {
        windSpeedKmh: 35,
        heatIndexC: 42,
      },
      timeStepMinutes: 15,
      timeIndex: 0,
    },
  },
  {
    id: 'extreme-heatwave',
    title: '☀️ EXTREME HEATWAVE',
    subtitle: '48°C extreme thermal emergency',
    description: 'Multi-day extreme heat dome stressing electrical grid transformers, surge in heat stroke emergency calls, and cooling shelter saturation.',
    icon: 'Zap',
    config: {
      id: 'scen-power-1',
      name: 'Extreme Thermal Emergency',
      type: 'extreme_heat',
      intensity: 8,
      affectedRadiusKm: 8.0,
      parameters: {
        heatIndexC: 48,
      },
      timeStepMinutes: 30,
      timeIndex: 0,
    },
  },
];
