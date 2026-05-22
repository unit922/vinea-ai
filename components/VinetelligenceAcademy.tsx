
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { SubscriptionTier } from '../lib/types';
import { TRAINING_MODULES, INITIAL_SHIFTS } from '../constants';
import { geminiService } from '../services/geminiService';
import CocktailSearch from './CocktailSearch';
import CompetitorIntelligence from './CompetitorIntelligence';
import { StaffShift, Cocktail, InventoryItem, AIPairingSuggestion } from '../lib/types';

interface VinetelligenceAcademyProps {
  searchQuery?: string;
  userRole?: StaffShift['role'];
  inventory?: InventoryItem[];
  initialTab?: 'academy' | 'mixology' | 'signature' | 'roster' | 'pairing' | 'market';
  onAddToMenu?: (cocktail: Cocktail) => void;
  onRemoveFromMenu?: (cocktailId: string) => void;
}

const VinetelligenceAcademy: React.FC<VinetelligenceAcademyProps> = ({ 
  searchQuery = '', 
  userRole = 'Manager',
  inventory = [],
  initialTab,
  onAddToMenu,
  onRemoveFromMenu
}) => {
  const store = useVinetelligenceStore();
  const tier = store.restaurantProfile?.tier || SubscriptionTier.OPERATOR;
  const isOperator = tier === SubscriptionTier.OPERATOR;

  const [activeTab, setActiveTab] = useState<'academy' | 'mixology' | 'signature' | 'roster' | 'pairing' | 'market'>(initialTab || 'academy');
  const [pairingSuggestions, setPairingSuggestions] = useState<AIPairingSuggestion[]>([]);
  const [isLoadingPairings, setIsLoadingPairings] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'vinetelligence', text: string, feedback?: number}[]>([
    { role: 'vinetelligence', text: `Vinetelligence Academy operational. Caribbean-tuned nodes ready for ${userRole} level technical coaching. Inquire about tropical chemistry, Caribbean flair, or service protocols.` }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showTransparencyNotice, setShowTransparencyNotice] = useState(false);
  
  // Signature Lab State
  const [theme, setTheme] = useState('');
  const [isGeneratingSignature, setIsGeneratingSignature] = useState(false);
  const [signatureResult, setSignatureResult] = useState<{ imageUrl: string; recipe: { name: string; story: string; ingredients: string[]; glassware: string } } | null>(null);

  // Roster State
  const [staffList] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('oenovia_staff_list') || localStorage.getItem('intelligence_staff_list');
    const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('intelligence_profile') || '{}');
    return saved ? JSON.parse(saved) : (profile.edition === 'demo' ? INITIAL_SHIFTS : []);
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('vinetelligence_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    const fetchPairings = async () => {
      if (!inventory || inventory.length === 0) return;
      setIsLoadingPairings(true);
      try {
        const foodItems = inventory.filter(i => i.category === 'Lunch' || i.category === 'Dinner' || i.category === 'Snack');
        const beverageInventory = inventory.filter(i => i.category === 'Wine' || i.category === 'Beer' || i.category === 'Cocktail' || i.category === 'Spirit');
        if (foodItems.length > 0 && beverageInventory.length > 0) {
          const suggestions = await geminiService.getAIPairingSuggestions(foodItems, beverageInventory);
          setPairingSuggestions(suggestions);
        }
      } catch (e) {
        console.error("Vinetelligence: Failed to fetch pairing suggestions", e);
      } finally {
        setIsLoadingPairings(false);
      }
    };
    if (activeTab === 'pairing') {
      fetchPairings();
    }
  }, [inventory, activeTab]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isThinking) return;
    const msg = input; 
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsThinking(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'vinetelligence' ? 'intelligence' : 'user', text: m.text }));
      const response = await geminiService.getTrainingResponse(msg, history, userRole);
      setMessages(prev => [...prev, { role: 'vinetelligence', text: response }]);
    } catch {
      console.error("Vinetelligence: Academy synthesis failed.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleModuleClick = async (module: typeof TRAINING_MODULES[0]) => {
    if (isThinking) return;
    const msg = `Explain the topic: ${module.topic}. This is a ${module.difficulty} level module for ${module.category}. Provide a detailed but concise explanation as an AI coach.`;
    setMessages(prev => [...prev, { role: 'user', text: `Tell me about ${module.topic}` }]);
    setIsThinking(true);
    try {
      const history = messages.map(m => ({ role: m.role === 'vinea' ? 'intelligence' : 'user', text: m.text }));
      const response = await geminiService.getTrainingResponse(msg, history, userRole);
      setMessages(prev => [...prev, { role: 'vinea', text: response }]);
    } catch {
      console.error("Vinetelligence: Academy synthesis failed.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateSignature = async () => {
    if (!theme.trim()) return;
    setIsGeneratingSignature(true);
    try {
      const res = await geminiService.generateSignatureSpecial(theme);
      setSignatureResult(res);
    } catch {
      console.error("Vinetelligence: Signature synthesis failed.");
    } finally {
      setIsGeneratingSignature(false);
    }
  };

  const handleFeedback = (idx: number, rating: number) => {
    const newMessages = [...messages];
    newMessages[idx].feedback = rating;
    setMessages(newMessages);
    geminiService.logAIFeedback('Coach', messages[idx-1]?.text || 'N/A', messages[idx].text, rating)
      .catch(e => console.error("Vinetelligence: Failed to log AI feedback", e));
  };

  const filteredModules = useMemo(() => {
    return TRAINING_MODULES.filter(m => m.topic.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const globalProgress = useMemo(() => {
    const allAssigned = staffList.flatMap(s => s.assignedModules || []);
    if (allAssigned.length === 0) return 0;
    const completed = allAssigned.filter(m => m.completed).length;
    return Math.round((completed / allAssigned.length) * 100);
  }, [staffList]);

  const progressTitle = useMemo(() => {
    if (globalProgress < 20) return 'Novice Node';
    if (globalProgress < 40) return 'Apprentice Sommelier';
    if (globalProgress < 60) return 'Technical Specialist';
    if (globalProgress < 80) return 'Master Operator';
    return 'Elite Vinetelligence';
  }, [globalProgress]);

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden relative selection:bg-sky-500 selection:text-white">
      <div className="flex justify-between items-center border-b border-stone-200 shrink-0 pr-4 overflow-x-auto">
        <div className="flex gap-8 whitespace-nowrap px-1">
          {(['academy', 'mixology', 'signature', 'pairing', 'market', 'roster'] as const)
            .filter(t => !isOperator || (t === 'academy' || t === 'mixology'))
            .map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`pb-4 text-[10px] uppercase tracking-widest font-black transition-all px-2 ${activeTab === t ? 'text-sky-600 border-b-2 border-sky-600' : 'text-stone-400 hover:text-stone-600'}`}>
                {t.replace('-', ' ')}
              </button>
            ))}
        </div>
        <button onClick={() => setShowTransparencyNotice(true)} className="hidden sm:block text-[9px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors mr-4 mb-4">
           AI Governance Brief
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'academy' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              <div className="lg:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-2 h-full pb-10">
                 <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><i className="fas fa-graduation-cap text-6xl text-sky-500"></i></div>
                    <p className="text-[10px] font-black uppercase text-sky-500 mb-2 italic">Curriculum Control</p>
                    <h3 className="text-xl font-serif font-bold italic mb-4">Active Training Path</h3>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-sky-500">{globalProgress}%</div>
                          <div>
                             <p className="text-xs font-bold">{progressTitle}</p>
                             <p className="text-[8px] text-stone-500 uppercase font-black">Level 02 Capability</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-400 ml-4">Available Modules</h4>
                    {filteredModules.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => handleModuleClick(m)}
                        className="bg-white p-6 rounded-3xl border border-stone-100 hover:border-sky-500 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              m.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-600' : 
                              m.difficulty === 'Intermediate' ? 'bg-sky-50 text-sky-600' : 'bg-sky-900/10 text-sky-900'
                            }`}>{m.difficulty}</span>
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:text-sky-500 transition-colors">
                                  <i className="fas fa-chevron-right text-[8px]"></i>
                               </div>
                               {m.completed && <i className="fas fa-check-circle text-emerald-500 text-xs"></i>}
                            </div>
                         </div>
                         <p className="text-sm font-bold text-stone-800 leading-tight mb-2">{m.topic}</p>
                         <p className="text-[9px] text-stone-400 font-bold uppercase flex items-center gap-2"><i className="far fa-clock"></i> {m.duration}</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-stone-200 flex flex-col overflow-hidden shadow-2xl">
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-stone-50/20">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                       <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          {m.role === 'vinea' && (
                            <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20 border-2 border-white mt-1">
                               <i className="fas fa-ship text-white text-[10px]"></i>
                            </div>
                          )}
                          <div className="space-y-2">
                             <div className={`p-8 rounded-[2.5rem] shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white rounded-br-none shadow-stone-900/10' : 'bg-white text-stone-800 rounded-bl-none border border-stone-100'}`}>
                               <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                             </div>
                             {m.role === 'vinea' && i > 0 && (
                               <div className="flex gap-2 ml-4">
                                  <button onClick={() => handleFeedback(i, 1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${m.feedback === 1 ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-stone-300 hover:bg-emerald-50 hover:text-emerald-500 border border-stone-100'}`}><i className="fas fa-thumbs-up text-[10px]"></i></button>
                                  <button onClick={() => handleFeedback(i, -1)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${m.feedback === -1 ? 'bg-sky-500 text-white shadow-lg' : 'bg-white text-stone-300 hover:bg-sky-50/10 hover:text-sky-500 border border-stone-100'}`}><i className="fas fa-thumbs-down text-[10px]"></i></button>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex justify-start">
                       <div className="bg-white p-6 rounded-3xl border border-stone-100 flex gap-2 shadow-sm">
                          <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-75"></div>
                          <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-150"></div>
                       </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-8 bg-white border-t border-stone-100 flex gap-4 items-center">
                   <input 
                     value={input} 
                     onChange={e => setInput(e.target.value)} 
                     placeholder="Inquire caribbean flair or Vinetelligence protocols..." 
                     className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-[2rem] px-8 py-5 text-sm font-bold focus:border-sky-500 outline-none transition-all shadow-inner" 
                   />
                   <button 
                     type="submit" 
                     disabled={isThinking}
                     className="w-16 h-16 bg-stone-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-xl hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-30"
                   >
                     <i className="fas fa-paper-plane"></i>
                   </button>
                </form>
              </div>
           </div>
        )}

        {/* ... (rest of signature, pairing, etc) ... */}


        {activeTab === 'signature' && (
           <div className="h-full flex flex-col space-y-10 py-4 max-w-6xl mx-auto overflow-y-auto custom-scrollbar pb-20">
              <div className="bg-white p-12 rounded-[3.5rem] border border-stone-200 shadow-xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5"><i className="fas fa-flask-vial text-9xl"></i></div>
                 <div className="text-center space-y-3 relative z-10">
                    <h3 className="text-4xl font-serif font-black italic text-stone-900">Signature Concept Lab</h3>
                    <p className="text-stone-500 italic max-w-xl mx-auto font-medium">Synthesize professional beverage recipes and AI visual profiles based on conceptual themes.</p>
                 </div>
                 <div className="flex gap-4 relative z-10">
                    <input 
                      type="text" 
                      value={theme}
                      onChange={e => setTheme(e.target.value)}
                      placeholder="e.g. Kyoto Cherry Blossom, Neo-Noir Manhattan, Alpine Frost..."
                      className="flex-1 px-10 py-6 bg-stone-50 border border-stone-200 rounded-[2rem] font-bold text-lg focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-inner"
                    />
                    <button 
                      onClick={handleGenerateSignature}
                      disabled={isGeneratingSignature || !theme.trim()}
                      className="px-12 bg-stone-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                       {isGeneratingSignature ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles text-indigo-500"></i>}
                       Synthesize
                    </button>
                 </div>
              </div>

              {signatureResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in slide-in-from-bottom-10 duration-700">
                   <div className="bg-stone-900 rounded-[4rem] overflow-hidden shadow-2xl border border-white/5 relative group aspect-square">
                      <img src={signatureResult.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" alt="AI special" />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent"></div>
                       <div className="absolute bottom-12 left-12 right-12">
                         <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500 text-stone-950 px-4 py-1.5 rounded-full mb-4 inline-block shadow-xl">AI PROTOTYPE</span>
                         <h4 className="text-5xl font-serif font-black italic text-white tracking-tighter">{signatureResult.recipe?.name}</h4>
                      </div>
                   </div>
                   <div className="bg-white p-12 rounded-[4rem] border border-stone-200 shadow-xl space-y-10 overflow-y-auto custom-scrollbar">
                      <div>
                         <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mb-4 italic">Concept Narrative</h5>
                         <p className="text-lg font-serif italic text-stone-700 leading-relaxed">"{signatureResult.recipe?.story}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Composition</h5>
                            <ul className="space-y-3">
                               {signatureResult.recipe?.ingredients.map((ing: string, i: number) => (
                                 <li key={i} className="text-xs font-bold text-stone-800 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]"></div>
                                    {ing}
                                 </li>
                               ))}
                            </ul>
                         </div>
                         <div className="space-y-4">
                            <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Standards</h5>
                            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                               <p className="text-[8px] font-black uppercase text-stone-400 mb-1">Glassware</p>
                               <p className="text-xs font-bold text-stone-800">{signatureResult.recipe?.glassware}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
        )}

        {activeTab === 'pairing' && (
          <div className="h-full flex flex-col space-y-8 p-8 overflow-y-auto custom-scrollbar pb-20">
             <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif font-black italic text-stone-900 tracking-tighter">Pairing Intelligence</h2>
                <p className="text-stone-500 text-sm font-medium italic">AI-driven flavor synthesis based on current inventory and menu items.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-sparkles"></i>
                  Dynamic Synthesis
                </div>
              </div>
            </header>

            {isLoadingPairings ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40 py-20">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-stone-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Analyzing Flavor Profiles...</p>
              </div>
            ) : pairingSuggestions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-inner">
                <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center text-stone-300 border border-stone-100">
                  <i className="fas fa-wine-glass-alt text-4xl"></i>
                </div>
                <div className="space-y-2">
                  <p className="text-stone-900 font-bold text-xl">No Pairings Synthesized</p>
                  <p className="text-stone-500 italic max-w-xs mx-auto text-sm leading-relaxed">Ensure you have both food items (Lunch, Dinner, Snacks) and beverages in your inventory to generate intelligence.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pairingSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-900/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <i className="fas fa-utensils text-7xl"></i>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-stone-900 text-white px-4 py-1.5 rounded-full shadow-lg">
                          {suggestion.foodCategory}
                        </span>
                        <div className="flex items-center gap-1 text-indigo-500">
                          <i className="fas fa-star text-[8px]"></i>
                          <i className="fas fa-star text-[8px]"></i>
                          <i className="fas fa-star text-[8px]"></i>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-stone-900 leading-tight">{suggestion.foodItem}</h4>
                        <div className="flex items-center gap-3">
                          <div className="h-[1px] w-8 bg-stone-200"></div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Paired with</p>
                          <div className="h-[1px] w-8 bg-stone-200"></div>
                        </div>
                        <h5 className="text-lg font-serif font-bold italic text-stone-800">{suggestion.beveragePairing}</h5>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest italic">Category: {suggestion.beverageCategory}</p>
                      </div>

                      <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100/50">
                        <p className="text-xs text-stone-600 leading-relaxed italic font-medium">
                          "{suggestion.rationale}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-stone-50 flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                        <i className="fas fa-lightbulb text-sm"></i>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Technical Insight</p>
                        <p className="text-[10px] font-bold text-stone-800 leading-tight">{suggestion.pairingInsight}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mixology' && <CocktailSearch inventory={inventory} onAddToMenu={onAddToMenu} onRemoveFromMenu={onRemoveFromMenu} userRole={userRole} />}

        {activeTab === 'market' && <CompetitorIntelligence inventory={inventory} />}

        {activeTab === 'roster' && (
          <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-20">
             <div className="flex justify-between items-end bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm">
                <div>
                   <h3 className="text-2xl font-serif font-black italic text-stone-900">Team Roster Node</h3>
                   <p className="text-stone-500 text-sm font-medium italic mt-1">Manage node permissions and technical role authorizations.</p>
                </div>
                <button className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-3">
                   <i className="fas fa-user-plus text-indigo-500"></i> Authorize Node
                </button>
             </div>

             <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="bg-stone-50 border-b border-stone-100">
                      <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                         <th className="px-10 py-6">Node identity</th>
                         <th className="px-10 py-6">Tier (Role)</th>
                         <th className="px-10 py-6">Performance Sync</th>
                         <th className="px-10 py-6 text-right">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-50">
                      {staffList.map(staff => (
                        <tr key={staff.id} className="hover:bg-stone-50 transition-all group">
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-stone-900 text-indigo-500 flex items-center justify-center font-black text-xs shadow-sm">{staff.name.charAt(0)}</div>
                                 <div>
                                    <p className="text-sm font-bold text-stone-900">{staff.name}</p>
                                    <p className="text-[10px] text-stone-400 font-mono">NODE_UID: {staff.id.slice(0,6)}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6">
                              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                                staff.role === 'Sommelier' ? 'bg-indigo-950/10 text-indigo-900 border-indigo-100' :
                                staff.role === 'Mixologist' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                'bg-stone-100 text-stone-600 border-stone-200'
                              }`}>{staff.role}</span>
                           </td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                 <span className="text-sm font-black text-stone-800">{staff.performanceScore}%</span>
                                 <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${staff.performanceScore}%` }}></div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-6 text-right">
                              <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">SYNCED</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
          </div>
        )}
      </div>

      {showTransparencyNotice && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 space-y-6 border border-stone-200 shadow-2xl">
              <h3 className="text-2xl font-serif font-black italic text-stone-900">AI Governance Protocol</h3>
              <div className="space-y-4 text-sm text-stone-600 leading-relaxed italic font-medium">
                 <p>"Intelligence utilizes generative probabilistic mapping (Gemini 3) to synthesize beverage intelligence."</p>
                 <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-3">
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Ethical Guardrails:</p>
                    <ul className="text-[11px] space-y-2">
                       <li className="flex gap-3"><i className="fas fa-shield text-indigo-500"></i> No automated fiscal commitment without human review.</li>
                       <li className="flex gap-3"><i className="fas fa-shield text-indigo-500"></i> PII obfuscation active for all model requests.</li>
                       <li className="flex gap-3"><i className="fas fa-shield text-indigo-500"></i> Transparency scores provided for all logic nodes.</li>
                    </ul>
                 </div>
              </div>
              <button onClick={() => setShowTransparencyNotice(false)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Acknowledge</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default VinetelligenceAcademy;
