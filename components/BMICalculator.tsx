import React, { useState } from 'react';

export const BMICalculator: React.FC = () => {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);
  
  let category = '';
  let color = '';
  const bmiNum = parseFloat(bmi);
  if (bmiNum < 18.5) { category = 'Underweight'; color = 'text-blue-500'; }
  else if (bmiNum < 25) { category = 'Normal weight'; color = 'text-emerald-500'; }
  else if (bmiNum < 30) { category = 'Overweight'; color = 'text-yellow-500'; }
  else { category = 'Obese'; color = 'text-red-500'; }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-10">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">BMI Calculator</h2>
      <div className="space-y-6">
         <div>
           <label className="block text-sm font-medium text-slate-600 mb-2">Height: {height} cm</label>
           <input type="range" min="100" max="220" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full accent-emerald-500" />
         </div>
         <div>
           <label className="block text-sm font-medium text-slate-600 mb-2">Weight: {weight} kg</label>
           <input type="range" min="30" max="150" value={weight} onChange={e => setWeight(parseInt(e.target.value))} className="w-full accent-emerald-500" />
         </div>
         <div className="pt-6 border-t border-slate-100 text-center">
           <div className="text-sm text-slate-500 uppercase tracking-wide font-semibold mb-1">Your BMI</div>
           <div className="text-6xl font-black text-slate-800 mb-2">{bmi}</div>
           <div className={`text-xl font-medium ${color}`}>{category}</div>
         </div>
      </div>
    </div>
  );
};