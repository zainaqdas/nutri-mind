import React, { useMemo, useState, useEffect } from 'react';
import { format, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyLog, LogType } from '../types';
import { dbService } from '../services/dbService';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { DEFAULT_GOALS } from '../constants';

export const MonthlySummary: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await dbService.getAllLogs();
        setLogs(data);
      } catch (e) {
        console.error("Failed to load logs for summary", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);
  
  const monthlyData = useMemo(() => {
    if (isLoading) return [];
    
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayLogs = logs.filter(log => isSameDay(new Date(log.date), day));
      
      // Calculate net calories (Food - Exercise)
      const foodCalories = dayLogs
        .filter(l => l.type === LogType.FOOD)
        .reduce((sum, l) => sum + l.calories, 0);
        
      const exerciseCalories = dayLogs
        .filter(l => l.type === LogType.EXERCISE)
        .reduce((sum, l) => sum + l.calories, 0);

      return {
        date: format(day, 'd'),
        fullDate: format(day, 'MMM d, yyyy'),
        calories: foodCalories,
        burned: exerciseCalories,
        net: foodCalories - exerciseCalories
      };
    });
  }, [currentMonth, logs, isLoading]);

  const monthStats = useMemo(() => {
    const totalCalories = monthlyData.reduce((sum, d) => sum + d.calories, 0);
    const totalBurned = monthlyData.reduce((sum, d) => sum + d.burned, 0);
    const avgCalories = monthlyData.length > 0 ? Math.round(totalCalories / monthlyData.length) : 0;
    
    return { totalCalories, totalBurned, avgCalories };
  }, [monthlyData]);

  if (isLoading) {
     return <div className="p-10 text-center text-slate-400">Loading summary...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Consumed</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{monthStats.totalCalories.toLocaleString()} kcal</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase">Avg Daily Intake</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{monthStats.avgCalories.toLocaleString()} kcal</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Burned</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{monthStats.totalBurned.toLocaleString()} kcal</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[400px]">
        <div className="flex items-center gap-2 mb-6">
           <Flame size={20} className="text-emerald-500" />
           <h3 className="font-semibold text-slate-800 text-lg">Calorie Intake vs Goal</h3>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
            <YAxis tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.calories > DEFAULT_GOALS.calories ? '#f87171' : '#10b981'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center items-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Within Goal
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div> Over Goal
          </div>
        </div>
      </div>
    </div>
  );
};