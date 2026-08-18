import React from 'react';

interface FooterProps {
  locationName?: string;
  locationMode?: 'searched' | 'gps';
}

export const Footer: React.FC<FooterProps> = ({ locationName, locationMode }) => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-6 px-6 text-center font-mono text-xs text-slate-500 space-y-1 mt-auto">
      <p className="font-bold text-slate-800 uppercase tracking-widest text-xs">
        MADE BY THE CONSORTIUM
      </p>
      {locationName && (
        <p className="text-[11px] text-slate-400">
          CITYTWIN Disaster Intelligence System • Active Location: {locationName} {locationMode === 'gps' ? '(📍 GPS)' : '(🔎 Searched)'}
        </p>
      )}
    </footer>
  );
};
