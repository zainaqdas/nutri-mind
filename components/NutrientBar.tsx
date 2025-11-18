import React from 'react';

interface NutrientBarProps {
  label: string;
  current: number;
  max: number;
  unit: string;
}

export const NutrientBar: React.FC<NutrientBarProps> = ({ label, current, max, unit }) => {
  const percentage = Math.min(100, (current / max) * 100);
  
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-xs text-slate-400 font-medium">
          {Math.round(current)}/{max} {unit}
        </span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};