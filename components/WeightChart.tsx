import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Calendar, Weight as WeightIcon } from 'lucide-react';
import { format } from 'date-fns';
import { dbService } from '../services/dbService';
import { WeightLog } from '../types';

export const WeightChart: React.FC = () => {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await dbService.getWeightLogs();
      setLogs(data);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || !newDate) return;

    const log: WeightLog = {
      id: Date.now().toString(),
      date: newDate,
      weight: parseFloat(newWeight)
    };

    const updatedLogs = await dbService.addWeightLog(log);
    setLogs(updatedLogs);
    setNewWeight('');
  };

  const handleDelete = async (id: string) => {
    const updatedLogs = await dbService.deleteWeightLog(id);
    setLogs(updatedLogs);
  };

  const chartData = logs.map(log => ({
    date: format(new Date(log.date), 'MMM d'),
    fullDate: log.date,
    weight: log.weight
  }));

  if (isLoading) {
    return <div className="text-center p-10 text-slate-400">Loading chart data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[400px]">
        <h3 className="font-semibold text-slate-800 text-lg mb-6">Weight History</h3>
        {logs.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <p>No weight data logged yet.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 text-lg mb-4">Log Weight</h3>
          <form onSubmit={handleAddWeight} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="date" 
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Weight (kg)</label>
              <div className="relative">
                <WeightIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="e.g. 75.5"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Add Entry
            </button>
          </form>
        </div>

        {/* History List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 text-lg mb-4">Recent History</h3>
          <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {logs.length === 0 ? (
               <p className="text-slate-400 text-sm italic">Your logs will appear here.</p>
            ) : (
              [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">
                      {log.weight}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{format(new Date(log.date), 'MMMM d, yyyy')}</span>
                      <span className="text-xs text-slate-400">kg</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="text-slate-300 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};