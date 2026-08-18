import { WhatIfAnalysisResult } from '../types';

const STORAGE_KEY = 'citytwin_saved_scenarios';

export function getSavedScenarios(): WhatIfAnalysisResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading saved scenarios:', err);
    return [];
  }
}

export function saveScenario(scenario: WhatIfAnalysisResult): WhatIfAnalysisResult[] {
  try {
    const current = getSavedScenarios();
    // avoid duplicates by ID
    const exists = current.some(s => s.id === scenario.id);
    const updated = exists
      ? current.map(s => (s.id === scenario.id ? scenario : s))
      : [scenario, ...current];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving scenario:', err);
    return getSavedScenarios();
  }
}

export function deleteSavedScenario(id: string): WhatIfAnalysisResult[] {
  try {
    const current = getSavedScenarios();
    const updated = current.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error deleting scenario:', err);
    return getSavedScenarios();
  }
}
