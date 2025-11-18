import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string) => Promise<void>;
  isProcessing: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const text = input;
    setInput(''); // Optimistic clear
    try {
      await onSend(text);
    } catch (error) {
      setInput(text); // Restore on error
    }
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent z-20">
      <div className="max-w-4xl mx-auto">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center shadow-lg rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-emerald-500/50"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What did you eat or exercise? (e.g., 'I had a grilled chicken salad and an apple')"
            className="w-full py-4 pl-6 pr-14 text-slate-700 placeholder:text-slate-400 focus:outline-none text-lg"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={`absolute right-2 p-2 rounded-xl transition-all duration-200 ${
              input.trim() && !isProcessing
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-xs text-slate-400">
            Powered by Gemini 2.5 Flash. Search Grounding enabled for accurate data.
          </p>
        </div>
      </div>
    </div>
  );
};