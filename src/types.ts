export type LocationMode = 'searched' | 'gps';

export type DisasterType = 
  | 'flood' 
  | 'cyclone' 
  | 'earthquake' 
  | 'wildfire' 
  | 'landslide' 
  | 'extreme_heat' 
  | 'industrial_accident' 
  | 'building_collapse';

export type AssetType = 
  | 'hospital' 
  | 'school' 
  | 'police' 
  | 'fire_station' 
  | 'shelter' 
  | 'bridge' 
  | 'power_station' 
  | 'water_treatment' 
  | 'railway_station' 
  | 'airport';

export interface LocationData {
  id: string;
  name: string; // e.g. "Chennai, Tamil Nadu, India"
  displayName: string; // "Chennai"
  state?: string;
  country: string;
  lat: number;
  lng: number;
  bbox?: [number, number, number, number];
  estimatedPopulation: number;
  areaKm2: number;
  dataVerification: {
    geographicCoordinates: 'verified' | 'estimated';
    openStreetMapNodes: 'verified' | 'estimated';
    weatherData: 'verified' | 'estimated';
    populationData: 'verified' | 'estimated';
    infrastructureData: 'verified' | 'estimated';
  };
}

export interface UrbanAsset {
  id: string;
  name: string;
  type: AssetType;
  district: string;
  address: string;
  lat: number;
  lng: number;
  resilienceScore: number; // 0 - 100
  capacity?: number;
  status: 'operational' | 'warning' | 'critical' | 'inaccessible';
  verifiedStatus: 'verified' | 'estimated' | 'unavailable';
  distanceKm: number;
  details?: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  district: string;
  fromCoords: [number, number]; // [lat, lng]
  toCoords: [number, number];   // [lat, lng]
  capacityVehiclesPerHour: number;
  currentTrafficStatus: 'clear' | 'congested' | 'blocked' | 'flooded';
  verifiedStatus: 'verified' | 'estimated';
  distanceKm: number;
}

export interface WeatherData {
  locationName: string;
  temperatureC: number;
  rainfallMmHr: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  humidityPercent: number;
  condition: string;
  stormProbabilityPercent: number;
  floodProbabilityPercent: number;
  isLiveFeed: boolean;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  type: DisasterType;
  locationName: string;
  centerLat: number;
  centerLng: number;
  intensity: number; // 1 - 10
  affectedRadiusKm: number;
  timeStepMinutes: number; // T+0, T+15, T+30, T+60, T+180, T+360
  timeIndex: number;
  parameters: {
    rainfallIntensityMm?: number;
    windSpeedKmh?: number;
    magnitudeRichter?: number;
    heatIndexC?: number;
    seaLevelRiseMeters?: number;
  };
}

export interface SimulationResult {
  scenarioName: string;
  locationName: string;
  disasterType: DisasterType;
  timeStepMinutes: number;
  estimatedPopulationExposed: number;
  isPopulationEstimate: boolean;
  blockedRoadCount: number;
  inaccessibleHospitalsCount: number;
  avgResponseTimeMin: number;
  evacuationProgressPercent: number;
  overallRiskScore: number; // 0 - 100
  breakdownRiskScores: {
    floodRisk: number;
    infrastructureRisk: number;
    trafficRisk: number;
    populationExposure: number;
    emergencyReadiness: number;
  };
  responseScore: number; // 0 - 100
  cascadingFailures: {
    id: string;
    label: string;
    timeTrigger: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impactDescription: string;
  }[];
  recommendedActions: {
    id: string;
    priority: 'HIGH' | 'CRITICAL' | 'MEDIUM';
    title: string;
    description: string;
    estimatedImpact: string;
  }[];
  optimalResourceDeployments: {
    district: string;
    ambulances: number;
    fireTrucks: number;
    rescueTeams: number;
    recommendedShelter: string;
  }[];
  evacuationPlan: {
    zoneName: string;
    populationToEvacuate: number;
    shelterCapacityAvailable: number;
    primaryRouteName: string;
    secondaryRouteName: string;
    estimatedEvacuationTimeMin: number;
    routeStatus: 'SAFE' | 'ALTERNATIVE' | 'BLOCKED';
  }[];
}

export interface EmergencyIncident {
  id: string;
  title: string;
  locationName: string;
  lat: number;
  lng: number;
  type: string;
  severity: 'minor' | 'warning' | 'critical';
  peopleAffected: number;
  status: 'active' | 'responding' | 'resolved';
  timestamp: string;
}

export type DataClassification = 'VERIFIED' | 'ESTIMATED' | 'SIMULATED' | 'UNAVAILABLE';

export interface ScenarioUnderstanding {
  event: string;
  location: string;
  affectedInfrastructure: string;
  timeCondition: string;
  severity: string;
  mode: string;
  isCompoundScenario: boolean;
  compoundingFactors: string[];
}

export interface WhatIfAnalysisResult {
  id: string;
  question: string;
  locationName: string;
  timestamp: string;
  understanding: ScenarioUnderstanding;
  hypotheticalEventSummary: string;
  primaryImpact: string;
  secondaryImpacts: string[];
  affectedInfrastructure: {
    id: string;
    name: string;
    type: string;
    status: string;
    dataStatus: DataClassification;
    distanceKm?: number;
  }[];
  alternativeRoutes: {
    id: string;
    name: string;
    from: string;
    to: string;
    baselineTimeMin: number;
    simulatedTimeMin: number;
    status: 'AVAILABLE' | 'CONGESTED' | 'BLOCKED';
    dataStatus: DataClassification;
  }[];
  potentialExposure: {
    metric: string;
    value: string | number;
    classification: DataClassification;
  }[];
  beforeVsAfter: {
    primaryRouteBaselineTime: string;
    primaryRouteSimulatedTime: string;
    routeStatusChange: string;
    hospitalAccessChange: string;
  };
  cascadingEffects: {
    step: number;
    label: string;
    description: string;
  }[];
  aiRecommendations: string[];
  suggestedFollowUps: string[];
  dataSources: { name: string; url?: string; type: string }[];
  modelAssumptions: string[];
  mapOverlayData: {
    affectedCenter?: [number, number];
    affectedRadiusKm?: number;
    secondaryZoneRadiusKm?: number;
    affectedRoadIds?: string[];
    affectedAssetIds?: string[];
    altRoutePath?: [number, number][];
  };
}

export type ExportFormat = 'csv' | 'json' | 'geojson' | 'xlsx' | 'pdf';

export type ExportCategory =
  | 'location_info'
  | 'map_geographic'
  | 'roads'
  | 'hospitals'
  | 'emergency_facilities'
  | 'schools'
  | 'infrastructure'
  | 'population_data'
  | 'weather_data'
  | 'risk_analysis'
  | 'disaster_simulation'
  | 'what_if_analysis'
  | 'evacuation_routes'
  | 'ai_insights'
  | 'data_sources';

export interface ExportHistoryItem {
  id: string;
  filename: string;
  locationName: string;
  exportType: string;
  format: ExportFormat;
  date: string;
  recordCount: number;
  datasetBreakdown: {
    real: number;
    estimated: number;
    simulated: number;
  };
}

