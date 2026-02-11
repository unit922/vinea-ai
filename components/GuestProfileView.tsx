
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { GuestProfile, PersonalizationRecommendation } from '../types';

const GuestProfileView: React.FC = () => {
  const [profile, setProfile] = useState<GuestProfile>({
    name: '',
    location: '',
    favoriteBeverages: '',
    dietaryRestrictions: '',
    pastOrders: '',
    pairingStyle: 'Classic'
  });
  const [debriefNotes, setDebriefNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingNotes, setIsProcessingNotes] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonalizationRecommendation[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!profile.name) return;
    setIsGenerating(true);
    setRecommendations([]);
    try {
      const currentMenu = {
        Appetizers: ["Steak Tartare", "Burrata", "Pan-Seared Scallops"],
        Mains: ["Roasted Sea Bass", "Mushroom Risotto", "Aged Ribeye"],
        Desserts: ["Chocolate Ganache", "Crème Brûlée"]
      };
      const results = await geminiService.getMenuPersonalization(profile, currentMenu);
      setRecommendations(results);
      
      const newTags = await geminiService.analyzeGuestTags(profile, profile.favoriteBeverages);
      setTags(newTags);
    } catch (error) {
      console.error("Personalization failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProcessDebrief = async () => {
    if (!debriefNotes) return;
    setIsProcessingNotes(true);
    try {
      // Simulate AI learning from notes to update profile
      await new Promise(r => setTimeout(r, 1500));
      const updatedProfile = await geminiService.getTrainingResponse(`Update guest profile ${JSON.stringify(profile)} based on these post-service notes: ${debriefNotes}. Just summarize the changes in one sentence.`, []);
      alert(`AI System Updated: ${updatedProfile}`);
      setDebriefNotes('');
    } catch (e) { console.error(e); }
    finally { setIsProcessingNotes(false); }
  };

  const getCategoryTheme = (cat: string) => {
    if (cat === 'Appetizer') return { icon: 'fa-shrimp', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (cat === 'Main') return { icon: 'fa-bowl-food', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (cat === 'Dessert') return { icon: 'fa-cake-candles', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
    return { icon: 'fa-utensils', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pb-10">
      <div className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6 h-fit">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 border border-amber-500/20">
              <i className="fas fa-user-edit text-amber-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-800 font-serif">Guest Insight Profile</h2>
              <p className="text-xs text-stone-500 font-medium">SevenRooms-style CRM with AI Intelligence.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium" placeholder="Alexander Mercer" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Location</label>
                <input type="text" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium" placeholder="Tokyo, JP" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Favorite Beverages</label>
              <textarea value={profile.favoriteBeverages} onChange={e => setProfile({...profile, favoriteBeverages: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 h-24 resize-none transition-all font-medium leading-relaxed" placeholder="Loves peated scotch and crisp Rieslings..." />
            </div>

            <button onClick={handleGenerate} disabled={isGenerating || !profile.name} className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-3 text-sm">
              {isGenerating ? <><i className="fas fa-spinner fa-spin text-amber-500"></i> Mapping Palate...</> : <><i className="fas fa-magic text-amber-400"></i> Update CRM Profile</>}
            </button>
          </div>
        </div>

        <div className="bg-stone-100 p-8 rounded-[2rem] border border-stone-200 shadow-inner space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest flex items-center gap-2"><i className="fas fa-comment-medical"></i> Post-Service Debrief</h3>
              <span className="text-[8px] font-black bg-stone-200 text-stone-500 px-2 py-0.5 rounded">AI Sentiment Engine</span>
           </div>
           <p className="text-[10px] text-stone-400 leading-relaxed font-medium italic">Record guest feedback, preferences, or issues to automatically evolve the palate map for future visits.</p>
           <textarea 
            value={debriefNotes}
            onChange={e => setDebriefNotes(e.target.value)}
            className="w-full h-32 bg-white border border-stone-200 rounded-2xl px-5 py-4 text-sm italic focus:ring-2 focus:ring-blue-500 outline-none resize-none shadow-sm"
            placeholder="e.g. 'Guest mentioned the 2018 Cab was too heavy, preferred the lighter profile of the Pinot...'"
           />
           <button 
            onClick={handleProcessDebrief}
            disabled={isProcessingNotes || !debriefNotes}
            className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-30"
           >
              {isProcessingNotes ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-brain mr-2"></i>}
              Process Sentiment & Commit
           </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-stone-900 text-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl lg:min-h-[600px] flex flex-col relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10 relative z-10">
            <div>
              <h3 className="text-2xl font-serif font-bold flex items-center gap-3">
                <i className="fas fa-sparkles text-amber-400"></i>
                AI Guest Intelligence
              </h3>
              <p className="text-stone-500 text-xs font-medium mt-1 uppercase tracking-widest">Generative Behavioral Mapping</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 relative z-10">
             {tags.map((tag, i) => (
               <span key={i} className="px-4 py-1.5 bg-amber-500 text-stone-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-in zoom-in-50">
                 {tag}
               </span>
             ))}
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-12 overflow-y-auto pr-1 md:pr-4 flex-1 custom-scrollbar relative z-10">
              {(['Appetizer', 'Main', 'Dessert'] as const).map(cat => {
                const items = recommendations.filter(r => r.category === cat);
                if (items.length === 0) return null;
                const theme = getCategoryTheme(cat);
                return (
                  <div key={cat} className="space-y-6">
                    <h4 className="text-[11px] uppercase tracking-[0.4em] font-black text-stone-500 border-b border-white/5 pb-3 flex items-center gap-3">
                      <i className={`fas ${theme.icon} text-stone-600`}></i>
                      {cat} Selection
                    </h4>
                    {items.map((rec, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-6">
                        <div className="p-6 md:p-8">
                          <p className="text-lg font-serif font-bold text-white mb-2">{rec.dish}</p>
                          <p className="text-xs text-stone-400 italic">"{rec.rationale}"</p>
                        </div>
                        <div className="p-6 md:p-8 bg-black/20">
                          <p className="text-[9px] font-black text-amber-500 uppercase mb-2">AI Pairing</p>
                          <p className="text-xl text-amber-400 font-serif">{rec.beveragePairing}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-30">
              <i className="fas fa-id-card text-6xl mb-6"></i>
              <p className="font-serif italic">Awaiting Unified Profile Sync...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestProfileView;
