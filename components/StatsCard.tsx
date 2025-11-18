import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, icon: Icon, children, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Icon size={20} className="text-emerald-500" />
        <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );
};