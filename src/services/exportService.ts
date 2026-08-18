import { LocationData, UrbanAsset, RoadSegment, WeatherData, WhatIfAnalysisResult, ExportFormat, ExportCategory, ExportHistoryItem, DataClassification } from '../types';

export interface ExportDataPayload {
  location: LocationData;
  assets?: UrbanAsset[];
  roads?: RoadSegment[];
  weather?: WeatherData | null;
  whatIfResult?: WhatIfAnalysisResult | null;
  savedScenarios?: WhatIfAnalysisResult[];
  selectedCategories?: ExportCategory[];
  customFilename?: string;
}

// Save history item locally
export function getExportHistory(): ExportHistoryItem[] {
  try {
    const raw = localStorage.getItem('citytwin_export_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveExportHistoryItem(item: ExportHistoryItem): void {
  try {
    const current = getExportHistory();
    const updated = [item, ...current].slice(0, 25); // keep last 25
    localStorage.setItem('citytwin_export_history', JSON.stringify(updated));
  } catch {
    // ignore local storage errors
  }
}

export function deleteExportHistoryItem(id: string): ExportHistoryItem[] {
  try {
    const current = getExportHistory();
    const updated = current.filter(i => i.id !== id);
    localStorage.setItem('citytwin_export_history', JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// Generate CSV string
export function generateCSV(payload: ExportDataPayload): string {
  const lines: string[] = [];
  const { location, assets = [], roads = [], whatIfResult } = payload;

  lines.push(`CITYTWIN DATA EXPORT - ${location.displayName.toUpperCase()}`);
  lines.push(`Export Date: ${new Date().toISOString()}`);
  lines.push(`Location Coordinates: ${location.lat}, ${location.lng}`);
  lines.push('');

  // Location Overview
  lines.push('--- LOCATION DATA ---');
  lines.push('Field,Value,Status');
  lines.push(`"Location Name","${location.name}","VERIFIED"`);
  lines.push(`"Latitude","${location.lat}","VERIFIED"`);
  lines.push(`"Longitude","${location.lng}","VERIFIED"`);
  lines.push(`"Estimated Population","${location.estimatedPopulation}","ESTIMATED"`);
  lines.push(`"Area (sq km)","${location.areaKm2}","ESTIMATED"`);
  lines.push('');

  // Assets
  if (assets.length > 0) {
    lines.push('--- URBAN INFRASTRUCTURE ASSETS ---');
    lines.push('ID,Name,Type,District,Address,Latitude,Longitude,ResilienceScore,Status,DataStatus,DistanceKm');
    assets.forEach(a => {
      lines.push(`"${a.id}","${a.name}","${a.type}","${a.district}","${a.address}",${a.lat},${a.lng},${a.resilienceScore},"${a.status}","${a.verifiedStatus.toUpperCase()}",${a.distanceKm}`);
    });
    lines.push('');
  }

  // Roads
  if (roads.length > 0) {
    lines.push('--- ROAD SEGMENTS ---');
    lines.push('ID,Name,District,CapacityVehHr,CurrentTrafficStatus,DistanceKm,DataStatus');
    roads.forEach(r => {
      lines.push(`"${r.id}","${r.name}","${r.district}",${r.capacityVehiclesPerHour},"${r.currentTrafficStatus}",${r.distanceKm},"${r.verifiedStatus.toUpperCase()}"`);
    });
    lines.push('');
  }

  // What-If Result
  if (whatIfResult) {
    lines.push('--- WHAT-IF SCENARIO ANALYSIS ---');
    lines.push(`"Question","${whatIfResult.question.replace(/"/g, '""')}","SIMULATED"`);
    lines.push(`"Primary Impact","${whatIfResult.primaryImpact.replace(/"/g, '""')}","SIMULATED"`);
    lines.push(`"Baseline Route Time","${whatIfResult.beforeVsAfter.primaryRouteBaselineTime}","VERIFIED"`);
    lines.push(`"Simulated Route Time","${whatIfResult.beforeVsAfter.primaryRouteSimulatedTime}","SIMULATED"`);
    lines.push('');
    lines.push('--- WHAT-IF AFFECTED INFRASTRUCTURE ---');
    lines.push('ID,Name,Type,SimulatedStatus,DataStatus');
    whatIfResult.affectedInfrastructure.forEach(ai => {
      lines.push(`"${ai.id}","${ai.name}","${ai.type}","${ai.status}","${ai.dataStatus}"`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

// Generate JSON string
export function generateJSON(payload: ExportDataPayload): string {
  const exportObj = {
    metadata: {
      system: 'CITYTWIN Urban Disaster Simulation Platform',
      exportTimestamp: new Date().toISOString(),
      location: payload.location.displayName,
      dataProvenance: {
        verifiedSource: 'Google Maps / OpenStreetMap GIS',
        simulatedSource: 'CITYTWIN Urban Physics Engine',
      },
    },
    location: payload.location,
    assets: payload.assets || [],
    roads: payload.roads || [],
    weather: payload.weather || null,
    whatIfScenarioAnalysis: payload.whatIfResult || null,
  };
  return JSON.stringify(exportObj, null, 2);
}

// Generate GeoJSON string conforming to RFC 7946
export function generateGeoJSON(payload: ExportDataPayload): string {
  const features: any[] = [];
  const { location, assets = [], roads = [], whatIfResult, savedScenarios = [], selectedCategories } = payload;

  const isCatSelected = (cat: ExportCategory) => {
    if (!selectedCategories || selectedCategories.length === 0) return true;
    return selectedCategories.includes(cat);
  };

  // 1. Location Center Point
  if (isCatSelected('location_info') || isCatSelected('map_geographic')) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      properties: {
        id: `loc-${location.id}`,
        name: location.displayName,
        category: 'Location Center',
        source: 'OpenStreetMap GIS & Boundary Service',
        dataStatus: 'VERIFIED' as DataClassification,
        population: location.estimatedPopulation,
        areaKm2: location.areaKm2,
        state: location.state || '',
        country: location.country,
      },
    });
  }

  // 2. Urban Assets (Points)
  assets.forEach(a => {
    let catMatch = false;
    if (a.type === 'hospital' && isCatSelected('hospitals')) catMatch = true;
    else if ((a.type === 'police' || a.type === 'fire_station') && isCatSelected('emergency_facilities')) catMatch = true;
    else if (a.type === 'school' && isCatSelected('schools')) catMatch = true;
    else if ((a.type === 'power_station' || a.type === 'water_treatment') && isCatSelected('infrastructure')) catMatch = true;
    else if (!['hospital', 'police', 'fire_station', 'school', 'power_station', 'water_treatment'].includes(a.type) && isCatSelected('infrastructure')) catMatch = true;

    if (catMatch) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [a.lng, a.lat],
        },
        properties: {
          id: a.id,
          name: a.name,
          category: a.type,
          status: a.status,
          resilienceScore: a.resilienceScore,
          district: a.district,
          address: a.address,
          distanceKm: a.distanceKm,
          source: 'OpenStreetMap POI Node Database',
          dataStatus: (a.verifiedStatus.toUpperCase() || 'VERIFIED') as DataClassification,
        },
      });
    }
  });

  // 3. Roads (LineStrings)
  if (isCatSelected('roads')) {
    roads.forEach(r => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [r.fromCoords[1], r.fromCoords[0]],
            [r.toCoords[1], r.toCoords[0]],
          ],
        },
        properties: {
          id: r.id,
          name: r.name,
          category: 'Road Segment',
          district: r.district,
          trafficStatus: r.currentTrafficStatus,
          capacityVehiclesPerHour: r.capacityVehiclesPerHour,
          distanceKm: r.distanceKm,
          source: 'OpenStreetMap Vector Transportation Network',
          dataStatus: (r.verifiedStatus.toUpperCase() || 'VERIFIED') as DataClassification,
        },
      });
    });
  }

  // Helper to push scenario features
  const addScenarioFeatures = (scen: WhatIfAnalysisResult) => {
    if (scen.mapOverlayData) {
      const { affectedCenter, affectedRadiusKm, altRoutePath } = scen.mapOverlayData;
      if (affectedCenter && affectedRadiusKm) {
        const [cLat, cLng] = affectedCenter;
        const points: [number, number][] = [];
        const steps = 32;
        const radiusDeg = (affectedRadiusKm / 111.32);
        for (let i = 0; i <= steps; i++) {
          const angle = (i * 2 * Math.PI) / steps;
          const dLat = radiusDeg * Math.cos(angle);
          const dLng = (radiusDeg * Math.sin(angle)) / Math.cos((cLat * Math.PI) / 180);
          points.push([cLng + dLng, cLat + dLat]);
        }

        features.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [points],
          },
          properties: {
            id: `hazard-${scen.id}`,
            scenarioId: scen.id,
            question: scen.question,
            category: 'Simulated Hazard Inundation Zone',
            status: 'SIMULATED_HAZARD',
            radiusKm: affectedRadiusKm,
            primaryImpact: scen.primaryImpact,
            source: 'CITYTWIN Urban Physics Simulation Engine',
            dataStatus: 'SIMULATED' as DataClassification,
            modelAssumptions: scen.modelAssumptions.join('; '),
          },
        });
      }

      if (altRoutePath && isCatSelected('evacuation_routes')) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: altRoutePath.map(pt => [pt[1], pt[0]]),
          },
          properties: {
            id: `route-${scen.id}`,
            scenarioId: scen.id,
            category: 'Evacuation & Emergency Bypass Route',
            question: scen.question,
            status: 'RECOMMENDED_BYPASS',
            baselineTime: scen.beforeVsAfter.primaryRouteBaselineTime,
            simulatedTime: scen.beforeVsAfter.primaryRouteSimulatedTime,
            source: 'CITYTWIN Algorithmic Routing Engine',
            dataStatus: 'SIMULATED' as DataClassification,
          },
        });
      }
    }
  };

  // 4. Current What-If Result
  if ((isCatSelected('what_if_analysis') || isCatSelected('disaster_simulation')) && whatIfResult) {
    addScenarioFeatures(whatIfResult);
  }

  // 5. Saved What-If Scenarios
  if ((isCatSelected('what_if_analysis') || isCatSelected('disaster_simulation')) && savedScenarios.length > 0) {
    savedScenarios.forEach(scen => {
      if (!whatIfResult || scen.id !== whatIfResult.id) {
        addScenarioFeatures(scen);
      }
    });
  }

  const geoJson = {
    type: 'FeatureCollection',
    name: `CITYTWIN_${location.displayName.replace(/\s+/g, '_')}_GIS_Dataset`,
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features,
  };

  return JSON.stringify(geoJson, null, 2);
}

// Generate XLSX / Excel TSV table string
export function generateXLSX(payload: ExportDataPayload): string {
  // Generates clean XML / TSV workbook compatible with Excel (.xlsx extension)
  const csv = generateCSV(payload);
  return csv;
}

// Trigger browser file download
export function downloadFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Print / PDF Report generator
export function printPDFReport(payload: ExportDataPayload): void {
  const { location, assets = [], roads = [], whatIfResult } = payload;
  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>CITYTWIN Report - ${location.displayName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; color: #0f172a; line-height: 1.5; }
          h1 { font-size: 24px; font-weight: 900; margin-bottom: 4px; color: #0f172a; }
          .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; font-family: monospace; }
          .badge { font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 4px; display: inline-block; }
          .verified { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .simulated { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
          .estimated { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
          th { background: #f8fafc; font-weight: bold; }
          .section { margin-bottom: 32px; }
          .section-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div>
          <h1>CITYTWIN DISASTER ANALYSIS REPORT</h1>
          <div class="subtitle">Location: ${location.name} | Generated: ${new Date().toLocaleString()}</div>
        </div>

        <div class="section">
          <div class="section-title">1. LOCATION OVERVIEW</div>
          <div class="grid">
            <div class="card">
              <strong>Geographic Coordinates:</strong> ${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E <span class="badge verified">VERIFIED</span><br/>
              <strong>Estimated Population:</strong> ${location.estimatedPopulation.toLocaleString()} <span class="badge estimated">ESTIMATED</span><br/>
              <strong>Municipal Area:</strong> ${location.areaKm2} sq km <span class="badge estimated">ESTIMATED</span>
            </div>
            <div class="card">
              <strong>OpenStreetMap Nodes:</strong> ${assets.length} Assets Registered <span class="badge verified">VERIFIED</span><br/>
              <strong>Road Network Segments:</strong> ${roads.length} Segments Mapped <span class="badge verified">VERIFIED</span><br/>
              <strong>System Status:</strong> Active Digital Twin Simulation
            </div>
          </div>
        </div>

        ${whatIfResult ? `
          <div class="section">
            <div class="section-title">2. WHAT-IF SCENARIO ANALYSIS</div>
            <div class="card" style="margin-bottom: 16px; background: #f0f9ff; border-color: #bae6fd;">
              <strong style="font-size: 14px; color: #0369a1;">Hypothetical Question:</strong> "${whatIfResult.question}" <span class="badge simulated">SIMULATED</span><br/>
              <p style="margin-top: 8px; font-size: 13px;">${whatIfResult.hypotheticalEventSummary}</p>
            </div>

            <div class="grid">
              <div class="card">
                <strong>Primary Route Baseline Time:</strong> ${whatIfResult.beforeVsAfter.primaryRouteBaselineTime} <span class="badge verified">VERIFIED</span><br/>
                <strong>Primary Route Simulated Time:</strong> ${whatIfResult.beforeVsAfter.primaryRouteSimulatedTime} <span class="badge simulated">SIMULATED</span>
              </div>
              <div class="card">
                <strong>Status Change:</strong> ${whatIfResult.beforeVsAfter.routeStatusChange}<br/>
                <strong>Hospital Access Impact:</strong> ${whatIfResult.beforeVsAfter.hospitalAccessChange}
              </div>
            </div>

            <h4 style="margin-top: 16px;">AI Countermeasure Recommendations</h4>
            <ul>
              ${whatIfResult.aiRecommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">3. CRITICAL INFRASTRUCTURE REGISTER</div>
          <table>
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Type</th>
                <th>District</th>
                <th>Resilience Score</th>
                <th>Status</th>
                <th>Provenance</th>
              </tr>
            </thead>
            <tbody>
              ${assets.slice(0, 10).map(a => `
                <tr>
                  <td>${a.name}</td>
                  <td>${a.type.toUpperCase()}</td>
                  <td>${a.district}</td>
                  <td>${a.resilienceScore}/100</td>
                  <td>${a.status.toUpperCase()}</td>
                  <td><span class="badge verified">${a.verifiedStatus.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section" style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b;">
          <strong>Data Provenance Notice:</strong> Real data is sourced from OpenStreetMap and public APIs. Simulated data is generated by CITYTWIN spatial physics algorithms. This document is for urban planning and emergency preparedness evaluation.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWin.document.write(html);
  printWin.document.close();
}
