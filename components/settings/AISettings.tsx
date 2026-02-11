
import React from 'react';

interface AISettingsProps {
  profile: any;
  onUpdate: (key: string, value: any) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ profile, onUpdate }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-5"><i className="fas fa-brain text-8xl"></i></div>
         <div className="relative z-10 space-y-6">
            <h3 className="text-lg font-serif font-bold text-amber-500">Vinea AI Persona Tuning</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'technical', label: 'Technical Scholar', icon: 'fa-microscope', desc: 'Prioritizes precision, historical facts, and exact specs.' },
                { id: 'hospitable', label: 'Hospitality Mentor', icon: 'fa-heart', desc: 'Focuses on guest warmth, etiquette, and soft skills.' },
                { id: 'creative', label: 'Creative Visionary', icon: 'fa-palette', desc: 'Encourages bold pairings and recipe innovation.' }
              ].map(persona => (
                <button
                  key={persona.id}
                  onClick={() => onUpdate('aiPersona', persona.id)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    (profile?.aiPersona || 'technical') === persona.id 
                      ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-xl' 
                      : 'bg-white/5 border-white/10 text-stone-400 hover:bg-white/10'
                  }`}
                >
                  <i className={`fas ${persona.icon} text-lg mb-4`}></i>
                  <h4 className="font-bold text-sm mb-1">{persona.label}</h4>
                  <p className={`text-[10px] leading-tight ${ (profile?.aiPersona || 'technical') === persona.id ? 'text-stone-800' : 'text-stone-500'}`}>
                    {persona.desc}
                  </p>
                </button>
              ))}
            </div>
         </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-stone-900">Enable Gemini Pro Analysis</p>
                 <p className="text-[10px] text-stone-400">Use higher-parameter models for business strategy.</p>
              </div>
              <button className="w-10 h-6 bg-emerald-500 rounded-full relative flex items-center px-1">
                 <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
              </button>
           </div>
           <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-stone-900">Multimodal Vision Training</p>
                 <p className="text-[10px] text-stone-400">Allow AI to learn from custom venue imagery.</p>
              </div>
              <button className="w-10 h-6 bg-stone-300 rounded-full relative flex items-center px-1">
                 <div className="w-4 h-4 bg-white rounded-full"></div>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
