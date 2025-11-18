import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { dbService } from '../services/dbService';
import { authService } from '../services/authService';
import { Save, LogOut, Activity, User, Ruler, Weight, Calendar } from 'lucide-react';

interface ProfileProps {
  user: UserProfile;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Calculate metabolic stats
  const calculateStats = () => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    bmr += profile.gender === 'male' ? 5 : -161;

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    };

    const tdee = bmr * multipliers[profile.activityLevel];
    return { bmr: Math.round(bmr), tdee: Math.round(tdee) };
  };

  const stats = calculateStats();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dbService.updateProfile(profile);
      
      // Delay slightly for UI feedback
      setTimeout(() => {
        setIsSaving(false);
        setMessage("Profile updated successfully!");
        setTimeout(() => setMessage(null), 3000);
      }, 800);
    } catch (e) {
      setIsSaving(false);
      setMessage("Failed to save profile.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 text-2xl font-bold">
                 {profile.name.charAt(0).toUpperCase()}
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
                 <p className="text-slate-500">{profile.email}</p>
               </div>
             </div>
             <button 
               onClick={() => { 
                 authService.logout(); 
                 onLogout(); 
               }}
               className="flex items-center gap-2 px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm font-medium"
             >
               <LogOut size={16} />
               Logout
             </button>
          </div>
        </div>

        <div className="p-8">
           {message && (
             <div className={`mb-6 p-3 text-sm rounded-xl border flex items-center gap-2 ${
               message.includes('Failed') 
                 ? 'bg-red-50 text-red-600 border-red-100' 
                 : 'bg-emerald-50 text-emerald-600 border-emerald-100'
             }`}>
               <Activity size={16} /> {message}
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                 <Ruler size={14} /> Height (cm)
               </label>
               <input 
                 type="number" 
                 value={profile.height}
                 onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
               />
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                 <Weight size={14} /> Weight (kg)
               </label>
               <input 
                 type="number" 
                 value={profile.weight}
                 onChange={e => setProfile({...profile, weight: Number(e.target.value)})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
               />
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                 <Calendar size={14} /> Age
               </label>
               <input 
                 type="number" 
                 value={profile.age}
                 onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
               />
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                 <User size={14} /> Gender
               </label>
               <select
                 value={profile.gender}
                 onChange={e => setProfile({...profile, gender: e.target.value as 'male' | 'female'})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
               >
                 <option value="male">Male</option>
                 <option value="female">Female</option>
               </select>
             </div>

             <div className="col-span-1 md:col-span-2 space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                 <Activity size={14} /> Activity Level
               </label>
               <select
                 value={profile.activityLevel}
                 onChange={e => setProfile({...profile, activityLevel: e.target.value as any})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
               >
                 <option value="sedentary">Sedentary (Little or no exercise)</option>
                 <option value="light">Light (Exercise 1-3 times/week)</option>
                 <option value="moderate">Moderate (Exercise 4-5 times/week)</option>
                 <option value="active">Active (Daily exercise or physical job)</option>
               </select>
             </div>
           </div>

           {/* Stats Cards */}
           <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
               <div className="text-blue-600 text-xs font-bold uppercase mb-1">BMR (Base Rate)</div>
               <div className="text-2xl font-bold text-blue-900">{stats.bmr} <span className="text-sm font-normal text-blue-600">kcal</span></div>
             </div>
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
               <div className="text-emerald-600 text-xs font-bold uppercase mb-1">TDEE (Maintenance)</div>
               <div className="text-2xl font-bold text-emerald-900">{stats.tdee} <span className="text-sm font-normal text-emerald-600">kcal</span></div>
             </div>
           </div>

           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
           >
             <Save size={20} />
             {isSaving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>
      </div>
    </div>
  );
};