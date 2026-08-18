import { ScenarioConfig, UrbanAsset, RoadSegment, SimulationResult } from '../types';

export function runCitySimulation(
  config: ScenarioConfig,
  currentTimeMin?: number,
  assets: UrbanAsset[] = [],
  roads: RoadSegment[] = []
): SimulationResult {
  const timeStep = currentTimeMin !== undefined ? currentTimeMin : config.timeStepMinutes;
  const intensity = config.intensity || 5;
  const disaster = config.type;

  const safeAssets = Array.isArray(assets) ? assets : [];
  const safeRoads = Array.isArray(roads) ? roads : [];

  let blockedRoadCount = 0;
  let inaccessibleHospitalsCount = 0;

  // Time scale factor (0 to 1)
  const timeFactor = Math.min(1.0, timeStep / 180);

  // Update assets status based on distance to center and disaster intensity
  safeAssets.forEach(asset => {
    let damageChance = 0;
    if (disaster === 'flood') {
      if (asset.type === 'bridge' || asset.type === 'water_treatment') {
        damageChance = 0.85 * (intensity / 10) * Math.max(0.3, timeFactor);
      } else if (asset.distanceKm < 3.0) {
        damageChance = 0.65 * (intensity / 10) * timeFactor;
      }
    } else if (disaster === 'cyclone' || disaster === 'wildfire') {
      if (asset.distanceKm < 5.0) {
        damageChance = 0.75 * (intensity / 10) * timeFactor;
      }
    } else {
      if (asset.distanceKm < 4.0) {
        damageChance = 0.7 * (intensity / 10);
      }
    }

    if (damageChance > 0.6) {
      asset.status = 'critical';
    } else if (damageChance > 0.3) {
      asset.status = 'warning';
    } else {
      asset.status = 'operational';
    }

    if (asset.type === 'hospital' && (asset.status === 'critical' || asset.status === 'warning')) {
      inaccessibleHospitalsCount++;
    }
  });

  // Update road status
  safeRoads.forEach(road => {
    if (timeStep >= 15 && intensity >= 5 && road.distanceKm < 4.0) {
      road.currentTrafficStatus = 'blocked';
      blockedRoadCount++;
    } else if (timeStep >= 0 && intensity >= 3) {
      road.currentTrafficStatus = 'congested';
    } else {
      road.currentTrafficStatus = 'clear';
    }
  });

  // Calculate realistic population exposed based on intensity and time
  const estimatedPopulationExposed = Math.round((25000 + intensity * 18000) * (0.3 + timeFactor * 0.7));
  const avgResponseTimeMin = Math.round(12 + (blockedRoadCount * 3.5) + (inaccessibleHospitalsCount * 5) + (intensity * 1.2));
  const evacuationProgressPercent = Math.min(100, Math.round((timeStep / 360) * 85 + (100 - intensity * 5)));

  // Risk Scores
  const floodRisk = Math.min(100, Math.round(disaster === 'flood' ? intensity * 9.5 : intensity * 4));
  const infrastructureRisk = Math.min(100, Math.round(blockedRoadCount * 12 + inaccessibleHospitalsCount * 18 + intensity * 4));
  const trafficRisk = Math.min(100, Math.round(blockedRoadCount * 15 + avgResponseTimeMin * 1.2));
  const populationExposure = Math.min(100, Math.round((estimatedPopulationExposed / 250000) * 100));
  const emergencyReadiness = Math.max(20, Math.round(85 - (intensity * 4) - (blockedRoadCount * 3)));

  const overallRiskScore = Math.min(100, Math.round((floodRisk + infrastructureRisk + trafficRisk + populationExposure) / 4));
  const responseScore = Math.max(15, Math.round(100 - (overallRiskScore * 0.5) - (avgResponseTimeMin * 0.7)));

  return {
    scenarioName: config.name,
    locationName: config.locationName,
    disasterType: config.type,
    timeStepMinutes: timeStep,
    estimatedPopulationExposed,
    isPopulationEstimate: true,
    blockedRoadCount,
    inaccessibleHospitalsCount,
    avgResponseTimeMin,
    evacuationProgressPercent,
    overallRiskScore,
    breakdownRiskScores: {
      floodRisk,
      infrastructureRisk,
      trafficRisk,
      populationExposure,
      emergencyReadiness,
    },
    responseScore,
    cascadingFailures: [
      {
        id: 'c1',
        label: `${config.name} Outbreak`,
        timeTrigger: 'T+0 MIN',
        severity: 'high',
        impactDescription: `Hazard initiated near ${config.locationName} center with Intensity ${intensity}/10.`,
      },
      {
        id: 'c2',
        label: 'Arterial Road & Bridge Inundation',
        timeTrigger: 'T+15 MIN',
        severity: intensity > 6 ? 'critical' : 'medium',
        impactDescription: `${blockedRoadCount} primary transport segments obstructed. Emergency routing delayed.`,
      },
      {
        id: 'c3',
        label: 'Healthcare Access Bottleneck',
        timeTrigger: 'T+30 MIN',
        severity: 'critical',
        impactDescription: `${inaccessibleHospitalsCount} healthcare facilities affected. Patient transit time +${avgResponseTimeMin - 12} min.`,
      },
      {
        id: 'c4',
        label: 'Power Grid Load Shift',
        timeTrigger: 'T+1 HR',
        severity: 'high',
        impactDescription: 'Auxiliary substations trip under heavy emergency pumping load.',
      },
    ],
    recommendedActions: [
      {
        id: 'rec-1',
        priority: 'CRITICAL',
        title: 'Redirect Emergency Vehicles',
        description: `Bypass obstructed road segments and reroute ambulances to high-resilience medical centers.`,
        estimatedImpact: 'Reduces emergency transit delay by 14 minutes.',
      },
      {
        id: 'rec-2',
        priority: 'HIGH',
        title: 'Deploy Mobile Evacuation Units',
        description: `Pre-position rescue teams and high-capacity shelters near high-density residential sectors.`,
        estimatedImpact: 'Protects up to 18,000 citizens in high-risk zones.',
      },
      {
        id: 'rec-3',
        priority: 'MEDIUM',
        title: 'Activate Secondary Drainage Pumps',
        description: `Engage emergency auxiliary power at local water treatment facilities.`,
        estimatedImpact: 'Accelerates water recession rate by 25%.',
      },
    ],
    optimalResourceDeployments: [
      { district: `${config.locationName} Central`, ambulances: 6, fireTrucks: 4, rescueTeams: 3, recommendedShelter: 'District Apex Relief Shelter' },
      { district: `${config.locationName} North`, ambulances: 4, fireTrucks: 2, rescueTeams: 2, recommendedShelter: 'Public Gymnasium Evacuation Center' },
      { district: `${config.locationName} South`, ambulances: 3, fireTrucks: 2, rescueTeams: 1, recommendedShelter: 'Community Stadium Center' },
    ],
    evacuationPlan: [
      {
        zoneName: `${config.locationName} Low-Lying Sector A`,
        populationToEvacuate: Math.round(estimatedPopulationExposed * 0.6),
        shelterCapacityAvailable: 15000,
        primaryRouteName: 'Arterial Highway Bypass Route 1',
        secondaryRouteName: 'Ring Road Expressway Route 2',
        estimatedEvacuationTimeMin: Math.round(30 + intensity * 3),
        routeStatus: 'SAFE',
      },
      {
        zoneName: `${config.locationName} Sector B`,
        populationToEvacuate: Math.round(estimatedPopulationExposed * 0.4),
        shelterCapacityAvailable: 12000,
        primaryRouteName: 'Central Boulevard',
        secondaryRouteName: 'East Link Road',
        estimatedEvacuationTimeMin: Math.round(45 + intensity * 4),
        routeStatus: 'ALTERNATIVE',
      },
    ],
  };
}
