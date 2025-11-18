import React from 'react';
import { Home, LineChart, Calendar, User, Leaf, X } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        onClose();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
        currentView === view
          ? 'bg-emerald-100 text-emerald-700 font-medium'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 
        flex flex-col p-6 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
              <Leaf size={20} fill="white" />
            </div>
            <span className="text-xl font-bold text-slate-800">NutriMind</span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Menu</div>
          <NavItem view="dashboard" icon={Home} label="Home" />
          <NavItem view="weight" icon={LineChart} label="Weight Tracker" />
          <NavItem view="monthly" icon={Calendar} label="Monthly Summary" />
          <NavItem view="profile" icon={User} label="Profile" />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl mt-auto">
          <h4 className="font-semibold text-slate-800 text-sm">Pro Tip</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Track your water intake to maintain hydration levels for better metabolism.
          </p>
        </div>
      </aside>
    </>
  );
};