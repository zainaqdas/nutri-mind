import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { Activity, Flame, CheckCircle, ChevronLeft, ChevronRight, Trash2, ExternalLink, Menu, ChevronDown, ChevronUp } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { InputArea } from './components/InputArea';
import { StatsCard } from './components/StatsCard';
import { NutrientBar } from './components/NutrientBar';
import { WeightChart } from './components/WeightChart';
import { AuthScreen } from './components/AuthScreen';
import { Profile } from './components/Profile';
import { MonthlySummary } from './components/MonthlySummary';

import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { analyzeTextEntry } from './services/geminiService';

import { ViewState, DailyLog, LogType, Micros, UserProfile } from './types';
import { DEFAULT_GOALS } from './constants';

// UI Grouping for Micronutrients
const NUTRIENT_GROUPS = [
  {
    title: "General",
    items: [
      { key: 'fiber', label: 'Fiber', unit: 'g' },
      { key: 'sodium', label: 'Sodium', unit: 'mg' }
    ]
  },
  {
    title: "Vitamins",
    items: [
      { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
      { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
      { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
      { key: 'vitaminE', label: 'Vitamin E', unit: 'mg' },
      { key: 'vitaminK', label: 'Vitamin K', unit: 'mcg' },
    ]
  },
  {
    title: "B-Complex",
    items: [
      { key: 'vitaminB1', label: 'B1 (Thiamin)', unit: 'mg' },
      { key: 'vitaminB2', label: 'B2 (Riboflavin)', unit: 'mg' },
      { key: 'vitaminB3', label: 'B3 (Niacin)', unit: 'mg' },
      { key: 'vitaminB5', label: 'B5 (Pantothenic)', unit: 'mg' },
      { key: 'vitaminB6', label: 'B6 (Pyridoxine)', unit: 'mg' },
      { key: 'vitaminB7', label: 'B7 (Biotin)', unit: 'mcg' },
      { key: 'vitaminB9', label: 'B9 (Folate)', unit: 'mcg' },
      { key: 'vitaminB12', label: 'B12 (Cobalamin)', unit: 'mcg' },
    ]
  },
  {
    title: "Minerals",
    items: [
      { key: 'calcium', label: 'Calcium', unit: 'mg' },
      { key: 'iron', label: 'Iron', unit: 'mg' },
      { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
      { key: 'potassium', label: 'Potassium', unit: 'mg' },
      { key: 'zinc', label: 'Zinc', unit: 'mg' },
      { key: 'phosphorus', label: 'Phosphorus', unit: 'mg' },
      { key: 'selenium', label: 'Selenium', unit: 'mcg' },
      { key: 'copper', label: 'Copper', unit: 'mg' },
      { key: 'manganese', label: 'Manganese', unit: 'mg' },
    ]
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // State for collapsing micronutrient sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "General": true,
    "Vitamins": true,
    "B-Complex": false,
    "Minerals": false
  });

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({...prev, [title]: !prev[title]}));
  };

  // Initialize Auth and Data
  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        if (currentUser) {
          const allLogs = await dbService.getAllLogs();
          setLogs(allLogs);
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsInitializing(false);
      }
    };
    
    init();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setView('dashboard');
    setLogs([]);
  };

  const handleSend = async (text: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { results, sources } = await analyzeTextEntry(text);
      
      const newLogsToAdd: DailyLog[] = results.map((item, index) => ({
        id: `${Date.now()}-${index}`, 
        date: format(selectedDate, 'yyyy-MM-dd'),
        timestamp: Date.now(),
        type: item.type,
        description: item.item_name,
        calories: item.calories,
        macros: item.macros,
        micros: item.micros,
        sourceUrls: sources
      }));

      // Add logs sequentially to DB and update state
      let updatedLogs = logs;
      for (const log of newLogsToAdd) {
        updatedLogs = await dbService.addLog(log);
      }
      
      setLogs(updatedLogs);
    } catch (err) {
      setError("Sorry, I couldn't process that. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedLogs = await dbService.deleteLog(id);
      setLogs(updatedLogs);
    } catch (e) {
      console.error("Error deleting log:", e);
    }
  };

  const currentDayLogs = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return logs.filter(l => l.date === dateStr);
  }, [logs, selectedDate]);

  const dayStats = useMemo(() => {
    const initialMicros = { ...DEFAULT_GOALS.micros };
    // Initialize all micro keys to 0
    (Object.keys(initialMicros) as Array<keyof Micros>).forEach(key => {
      initialMicros[key] = 0;
    });

    const initialStats = {
      calories: 0,
      foodCalories: 0,
      exerciseCalories: 0,
      macros: { protein: 0, carbs: 0, fat: 0 },
      micros: initialMicros
    };

    return currentDayLogs.reduce((acc, log) => {
      const sign = log.type === LogType.EXERCISE ? -1 : 1;
      
      acc.calories += (log.calories * sign);
      if (log.type === LogType.FOOD) acc.foodCalories += log.calories;
      if (log.type === LogType.EXERCISE) acc.exerciseCalories += log.calories;
      
      acc.macros.protein += log.macros.protein;
      acc.macros.carbs += log.macros.carbs;
      acc.macros.fat += log.macros.fat;

      // Sum micronutrients
      (Object.keys(log.micros) as Array<keyof Micros>).forEach(key => {
        if (acc.micros[key] !== undefined) {
          acc.micros[key] += log.micros[key] || 0;
        }
      });

      return acc;
    }, initialStats);
  }, [currentDayLogs]);

  // Calendar Logic
  const weekStart = addDays(selectedDate, -selectedDate.getDay());
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const renderDashboard = () => (
    <div className="space-y-6 pb-32">
      {/* Calendar Strip */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center justify-center min-w-[60px] h-20 rounded-2xl transition-all ${
                  isSelected 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-medium uppercase opacity-80">{format(day, 'EEE')}</span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Calories */}
        <StatsCard title="Calories" icon={Flame}>
          <div className="flex items-end justify-between px-4 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800">{dayStats.foodCalories}</div>
              <div className="text-sm text-slate-400 font-medium mt-1">Food</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800">{dayStats.exerciseCalories}</div>
              <div className="text-sm text-slate-400 font-medium mt-1">Exercise</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-500">
                {Math.max(0, DEFAULT_GOALS.calories - dayStats.calories)}
              </div>
              <div className="text-sm text-emerald-600/60 font-medium mt-1">Remaining</div>
            </div>
          </div>
          {/* Daily Logs List */}
          <div className="border-t border-slate-100 pt-4">
             <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Today's Logs</h4>
             {currentDayLogs.length === 0 ? (
               <p className="text-sm text-slate-400 text-center py-4">No food logged yet for this day.</p>
             ) : (
               <ul className="space-y-3">
                 {currentDayLogs.map(log => (
                   <li key={log.id} className="flex items-start justify-between group">
                     <div>
                       <p className="text-sm font-medium text-slate-700">{log.description}</p>
                       <div className="flex flex-col gap-0.5">
                         <p className="text-xs text-slate-400">{log.calories} kcal | {log.type === LogType.EXERCISE ? 'Burned' : 'Consumed'}</p>
                         {log.type === LogType.FOOD && (
                           <p className="text-xs font-medium">
                             <span className="text-emerald-600">{log.macros.protein}g P</span>
                             <span className="text-slate-300 mx-1">•</span>
                             <span className="text-blue-500">{log.macros.carbs}g C</span>
                             <span className="text-slate-300 mx-1">•</span>
                             <span className="text-yellow-500">{log.macros.fat}g F</span>
                           </p>
                         )}
                       </div>
                       {log.sourceUrls && log.sourceUrls.length > 0 && (
                         <div className="flex gap-2 mt-1">
                           {log.sourceUrls.map((url, idx) => (
                             <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-500">
                               Source <ExternalLink size={8} />
                             </a>
                           ))}
                         </div>
                       )}
                     </div>
                     <button onClick={() => handleDelete(log.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                       <Trash2 size={14} />
                     </button>
                   </li>
                 ))}
               </ul>
             )}
          </div>
        </StatsCard>

        {/* Macros */}
        <StatsCard title="Macros" icon={Activity}>
          <div className="flex justify-between text-center px-2">
             <div className="flex flex-col gap-2">
                <div className="text-2xl font-bold text-slate-800">
                  {Math.round(dayStats.macros.carbs)}<span className="text-sm text-slate-400 font-normal">/{DEFAULT_GOALS.carbs}g</span>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase">Carbs</div>
                <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mx-auto">
                   <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (dayStats.macros.carbs / DEFAULT_GOALS.carbs) * 100)}%` }} />
                </div>
             </div>
             <div className="flex flex-col gap-2">
                <div className="text-2xl font-bold text-slate-800">
                  {Math.round(dayStats.macros.protein)}<span className="text-sm text-slate-400 font-normal">/{DEFAULT_GOALS.protein}g</span>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase">Protein</div>
                <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mx-auto">
                   <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (dayStats.macros.protein / DEFAULT_GOALS.protein) * 100)}%` }} />
                </div>
             </div>
             <div className="flex flex-col gap-2">
                <div className="text-2xl font-bold text-slate-800">
                  {Math.round(dayStats.macros.fat)}<span className="text-sm text-slate-400 font-normal">/{DEFAULT_GOALS.fat}g</span>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase">Fat</div>
                <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mx-auto">
                   <div className="h-full bg-yellow-400" style={{ width: `${Math.min(100, (dayStats.macros.fat / DEFAULT_GOALS.fat) * 100)}%` }} />
                </div>
             </div>
          </div>
        </StatsCard>
      </div>

      {/* Micronutrients - Categorized and Collapsible */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-500" />
            <h3 className="font-semibold text-slate-800 text-lg">Micronutrients</h3>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {NUTRIENT_GROUPS.map((group) => (
            <div key={group.title} className="bg-white">
               <button 
                 onClick={() => toggleSection(group.title)}
                 className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
               >
                 <span className="font-medium text-slate-700">{group.title}</span>
                 {expandedSections[group.title] ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
               </button>
               
               {expandedSections[group.title] && (
                 <div className="p-4 md:p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 animate-in fade-in duration-300">
                   {group.items.map((item) => (
                      <NutrientBar 
                        key={item.key}
                        label={item.label}
                        current={dayStats.micros[item.key as keyof Micros] || 0}
                        max={DEFAULT_GOALS.micros[item.key as keyof Micros] || 100}
                        unit={item.unit}
                      />
                   ))}
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;
  }

  if (!user) {
    // We still need to pass onAuthSuccess which now receives user from async
    return <AuthScreen onAuthSuccess={(u) => { setUser(u); dbService.getAllLogs().then(setLogs); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar 
        currentView={view} 
        onNavigate={setView} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
         <div className="font-bold text-emerald-600 flex items-center gap-2">
            <Flame size={20} /> NutriMind
         </div>
         <button 
           className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
           onClick={() => setIsMobileMenuOpen(true)}
         >
           <Menu size={24} />
         </button>
      </div>

      <main className="md:ml-64 p-4 md:p-10 max-w-7xl mx-auto relative">
        <header className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
               {view === 'dashboard' && 'Dashboard'}
               {view === 'weight' && 'Weight Tracker'}
               {view === 'monthly' && 'Monthly Summary'}
               {view === 'profile' && 'Profile'}
             </h1>
             <p className="text-slate-500 mt-1">
               {view === 'profile' ? 'Manage your account' : 'Welcome back, keep up the good work!'}
             </p>
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-emerald-600 font-bold">
             {user.name.charAt(0).toUpperCase()}
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {view === 'dashboard' && renderDashboard()}
        {view === 'weight' && <WeightChart />}
        {view === 'monthly' && <MonthlySummary />}
        {view === 'profile' && <Profile user={user} onLogout={handleLogout} />}
      </main>

      {view === 'dashboard' && <InputArea onSend={handleSend} isProcessing={isProcessing} />}
    </div>
  );
};

export default App;