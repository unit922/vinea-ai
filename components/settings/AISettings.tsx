
import React, { useState } from 'react';
import { RestaurantProfile } from '../../lib/types';
import { ConversationalFlowConfigurator } from './ConversationalFlowConfigurator';

interface AISettingsProps {
  profile: RestaurantProfile | null;
  onUpdate: (key: string, value: string | number | boolean | object | null) => void;
}

const AISettings: React.FC<AISettingsProps> = ({ profile, onUpdate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'persona' | 'infrastructure' | 'vision' | 'flow'>('persona');

  // Trait calculation for visual feedback
  const traitIntensity = (profile?.aiTraits?.technical || 50) + (profile?.aiTraits?.creative || 50);

  const handleTraitChange = (trait: string, value: number) => {
    const traits = { ...(profile?.aiTraits || { technical: 50, creative: 50, verbosity: 50 }), [trait]: value };
    onUpdate('aiTraits', traits);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      {/* Sub-Navigation */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl w-fit shadow-inner shrink-0 border border-stone-200/40">
        {[
          { id: 'persona', label: 'Persona Engine', icon: 'fa-brain' },
          { id: 'flow', label: 'Flow Configurator', icon: 'fa-diagram-project' },
          { id: 'infrastructure', label: 'Infrastructure', icon: 'fa-microchip' },
          { id: 'vision', label: 'Vision & Audio', icon: 'fa-eye' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as 'persona' | 'infrastructure' | 'vision' | 'flow')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <i className={`fas ${tab.icon} mr-2`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'persona' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform duration-[10s] ease-linear">
               <i className="fas fa-atom text-[12rem]"></i>
             </div>
             
             <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                   <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-2 block italic">Somatic Neural Tuning</span>
                      <h3 className="text-3xl font-serif font-black italic tracking-tighter">Persona Calibration</h3>
                   </div>
                   
                   <div className="space-y-10">
                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase text-stone-500 tracking-widest">
                            <span>Technical Rigor</span>
                            <span className="text-amber-500">{profile?.aiTraits?.technical || 50}%</span>
                         </div>
                         <input 
                            type="range" min="0" max="100" 
                            value={profile?.aiTraits?.technical || 50} 
                            onChange={(e) => handleTraitChange('technical', parseInt(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                         />
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase text-stone-500 tracking-widest">
                            <span>Creative Variance</span>
                            <span className="text-amber-500">{profile?.aiTraits?.creative || 50}%</span>
                         </div>
                         <input 
                            type="range" min="0" max="100" 
                            value={profile?.aiTraits?.creative || 50} 
                            onChange={(e) => handleTraitChange('creative', parseInt(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                         />
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase text-stone-500 tracking-widest">
                            <span>Verbosity Buffer</span>
                            <span className="text-amber-500">{profile?.aiTraits?.verbosity || 50}%</span>
                         </div>
                         <input 
                            type="range" min="0" max="100" 
                            value={profile?.aiTraits?.verbosity || 50} 
                            onChange={(e) => handleTraitChange('verbosity', parseInt(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                         />
                      </div>
                   </div>
                </div>

                <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-[4rem] border border-white/5 backdrop-blur-md">
                   <div className="relative w-48 h-48 mb-8">
                      <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-pulse"></div>
                      <div className="absolute inset-4 border-2 border-amber-500/40 rounded-full animate-spin duration-[5s]"></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                         <i className="fas fa-brain text-4xl text-amber-500"></i>
                         <p className="text-[8px] font-black uppercase tracking-[0.4em] text-amber-500">Resonance</p>
                         <p className="text-2xl font-serif font-black italic">{Math.floor(traitIntensity / 2)}</p>
                      </div>
                   </div>
                   <p className="text-xs text-stone-400 font-medium italic text-center leading-relaxed">
                     "Adjusting traits dynamically updates the somatic response pattern for staff coaching and guest interactions."
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm space-y-8">
             <div className="flex justify-between items-center">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 italic">Knowledge Base (Ground Truth)</h3>
                   <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">Immutable Venue Directives</p>
                </div>
                <i className="fas fa-book-bookmark text-stone-200 text-2xl"></i>
             </div>
             
             <div className="space-y-4">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Somatic Instructions (Custom System Prompt)</label>
                <textarea 
                  className="w-full h-48 bg-stone-50 border-2 border-stone-100 rounded-[2rem] px-8 py-8 text-sm italic font-medium focus:ring-4 focus:ring-amber-500/5 outline-none transition-all placeholder:text-stone-300 leading-relaxed shadow-inner"
                  defaultValue={profile?.somaticInstructions}
                  onBlur={(e) => onUpdate('somaticInstructions', e.target.value)}
                  placeholder="e.g. 'Never suggest heavy reds for patio service. Always prioritize Zero-Proof alternatives in pairings for guests under 25...'"
                />
                <p className="text-[9px] text-stone-400 font-bold italic leading-relaxed px-2">
                  * Directives entered here act as 'Ground Truth' for the AI and cannot be overridden by model inference.
                </p>
             </div>
          </div>
        </div>
      )}

      {activeSubTab === 'infrastructure' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm space-y-10">
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 italic">Model Routing Matrix</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">Assign silicon capability to operational tasks</p>
                 </div>
                 <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">Low Latency Routing Active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { task: 'Staff Coaching', default: 'Gemini 3 Flash', desc: 'Rapid technical Q&A response time.' },
                   { task: 'Fiscal Auditing', default: 'Gemini 3 Pro', desc: 'Deep reasoning for P&L synthesis.' },
                   { task: 'Inventory Vision', default: 'Gemini 2.5 Flash', desc: 'Optimized for visual label parsing.' },
                   { task: 'Guest Concierge', default: 'Gemini 3 Flash', desc: 'Warm, personable service dialogue.' }
                 ].map((route, i) => (
                   <div key={i} className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 flex items-center justify-between group hover:border-amber-500/30 transition-all">
                      <div className="min-w-0 pr-4">
                         <p className="text-xs font-black text-stone-900 mb-1 uppercase tracking-tighter">{route.task}</p>
                         <p className="text-[10px] text-stone-400 font-medium italic truncate">{route.desc}</p>
                      </div>
                      <select className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500 appearance-none min-w-[140px]">
                         <option>Gemini 3 Flash</option>
                         <option>Gemini 3 Pro</option>
                         <option>Gemini 2.5 Flash</option>
                      </select>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 italic">Neural Connectivity</h3>
                 <i className="fas fa-key text-stone-200 text-xl"></i>
              </div>
              <div className="space-y-4">
                 <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Gemini API Key (Manual Override)</label>
                 <div className="relative group/key">
                   <input 
                     type="password" 
                     className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl px-6 py-4 text-sm font-mono focus:ring-4 focus:ring-amber-500/5 outline-none transition-all placeholder:text-stone-300"
                     value={profile?.geminiApiKey || ''}
                     onChange={(e) => onUpdate('geminiApiKey', e.target.value)}
                     placeholder="Enter your Google AI Studio API Key..."
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover/key:opacity-100 transition-opacity">
                     <span className="text-[8px] font-black uppercase text-stone-400 bg-white px-2 py-1 rounded border border-stone-100 shadow-sm">Encrypted at Rest</span>
                   </div>
                 </div>
                 <p className="text-[9px] text-stone-400 font-bold italic leading-relaxed px-2">
                   * Required for Live Coaching and Vision features in production environments (Vercel/Netlify). Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">AI Studio</a>.
                 </p>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 italic">Security & Self-Correction</h3>
                 <i className="fas fa-user-shield text-stone-200 text-xl"></i>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { id: 'pii', label: 'PII Scrubbing', desc: 'Anonymize guest names in AI calls.' },
                   { id: 'eval', label: 'Correction Loops', desc: 'AI reviews its own logic before firing.' },
                   { id: 'search', label: 'Google Grounding', desc: 'Verify vintages via live web search.' },
                   { id: 'google_auth', label: 'Google Identity', desc: 'Enable Google Login node for staff.' }
                 ].map(toggle => (
                    <div key={toggle.id} className="p-6 bg-stone-50 border border-stone-100 rounded-[2rem] space-y-4">
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black uppercase text-stone-900 tracking-widest">{toggle.label}</p>
                          <label className="intelligence-switch">
                            <input 
                              type="checkbox" 
                              checked={toggle.id === 'google_auth' ? !!profile?.allowGoogleAuth : (toggle.id === 'pii' || toggle.id === 'search')} 
                              onChange={() => {
                                if (toggle.id === 'google_auth') {
                                  onUpdate('allowGoogleAuth', !profile?.allowGoogleAuth);
                                }
                              }}
                            />
                            <span className="intelligence-slider"></span>
                          </label>
                       </div>
                       <p className="text-[10px] text-stone-500 leading-relaxed italic">{toggle.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'vision' && (
        <div className="space-y-8 animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-sm space-y-10">
              <div className="flex justify-between items-center">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-stone-950 italic">Multimodal Vision Thresholds</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">Calibrate inventory camera sensitivity</p>
                 </div>
                 <i className="fas fa-eye text-stone-200 text-2xl"></i>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase text-stone-500 tracking-widest">
                          <span>Recognition Confidence</span>
                          <span className="text-amber-600">85%</span>
                       </div>
                       <input type="range" min="50" max="99" defaultValue="85" className="w-full accent-stone-900 h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer" />
                       <p className="text-[9px] text-stone-400 italic">"Higher values reduce false-positive label identifications but require better lighting."</p>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase text-stone-500 tracking-widest">
                          <span>Fill-Level Tolerance</span>
                          <span className="text-amber-600">±5%</span>
                       </div>
                       <input type="range" min="1" max="20" defaultValue="5" className="w-full accent-stone-900 h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer" />
                       <p className="text-[9px] text-stone-400 italic">"Margin of error allowed when AI estimates liquid volume in open bottles."</p>
                    </div>
                 </div>
                 <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Vision Audit Features</h4>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-700">Auto-Detect Brand Labels</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500" />
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-700">Audit Proof Log (Save Frames)</span>
                          <input type="checkbox" className="w-4 h-4 accent-amber-500" />
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-700">Identify Shelf Aging / Dust</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                <i className="fas fa-microphone-lines text-[10rem]"></i>
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                 <div className="flex-1 space-y-8">
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-2 block italic">Audio Intelligence</span>
                       <h3 className="text-2xl font-serif font-black italic tracking-tighter">Live Coaching Voice Gain</h3>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase text-stone-500 tracking-widest">
                          <span>Noise Cancellation Sensitivity</span>
                          <span className="text-amber-500">High (72%)</span>
                       </div>
                       <input type="range" min="0" max="100" defaultValue="72" className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <p className="text-xs text-stone-400 italic leading-relaxed">
                      "Calibrate for high-decibel service rounds. AI will prioritize staff vocal frequencies over background venue ambiance."
                    </p>
                 </div>
                 <div className="w-full md:w-64 aspect-video bg-white/5 rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden group/wave">
                    <div className="flex gap-1.5 items-end h-16">
                       {[0.2, 0.4, 0.9, 0.6, 0.8, 0.3, 0.5, 0.7].map((h, i) => (
                         <div key={i} className="w-2 bg-amber-500 rounded-full animate-pulse" style={{ height: `${h * 100}%`, animationDelay: `${i * 100}ms` }}></div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === 'flow' && (
        <ConversationalFlowConfigurator />
      )}
    </div>
  );
};

export default AISettings;
