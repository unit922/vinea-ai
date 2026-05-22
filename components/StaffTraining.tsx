
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { TRAINING_MODULES, INITIAL_SHIFTS } from '../constants';
import { geminiService } from '../services/geminiService';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { getBrandedTerm } from '../utils/branding';
import CocktailSearch from './CocktailSearch';
import { VisionPitch } from './VisionPitch';
import { GuestFeedback, StaffShift } from '../lib/types';

interface StaffTrainingProps {
  searchQuery?: string;
}

const ROLES = ['Sommelier', 'Mixologist', 'Server', 'Manager'] as const;

const StaffTraining: React.FC<StaffTrainingProps> = ({ searchQuery = '' }) => {
  const [activeTab, setActiveTab] = useState<'academy' | 'mixology' | 'signature' | 'roster'>('academy');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [showVisionPitch, setShowVisionPitch] = useState(false);
  const [roiReport, setRoiReport] = useState<{
    correlationScore: number;
    topSkill: string;
    revenueImpact: string;
    improvementArea: string;
    summary: string;
  } | null>(null);
  const [isCalculatingROI, setIsCalculatingROI] = useState(false);
  const [recommendations, setRecommendations] = useState<Record<string, { moduleId: string; rationale: string }[]>>({});
  const [isRecommending, setIsRecommending] = useState<string | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'vinetelligence', text: string}[]>([
    { role: 'vinetelligence', text: 'Hello! I am Vinetelligence, your AI Beverage Coach. What would you like to learn today? I can help with wine pairings, cocktail recipes, or service techniques from various cultures.' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Signature Special State
  const [theme, setTheme] = useState('');
  const [isGeneratingSpecial, setIsGeneratingSpecial] = useState(false);
  const [specialResult, setSpecialResult] = useState<{ imageUrl: string; recipe: { name: string; story: string; ingredients: string[]; glassware: string; instructions: string[] } } | null>(null);

  // Team Management State
  const [staffList, setStaffList] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('vinea_staff_list');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Server' as StaffShift['role'] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vinetelligence_staff_list', JSON.stringify(staffList));
    localStorage.setItem('vinea_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  const store = useVinetelligenceStore();

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return TRAINING_MODULES;
    const query = searchQuery.toLowerCase();
    return TRAINING_MODULES.filter(m => 
      m.topic.toLowerCase().includes(query) || 
      m.difficulty.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);

    try {
      const response = await geminiService.getTrainingResponse(userMsg, []);
      setMessages(prev => [...prev, { role: 'vinetelligence', text: response || 'I missed that, could you repeat?' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'vinetelligence', text: 'Sorry, I am having trouble connecting to my knowledge base right now.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateSpecial = async () => {
    if (!theme.trim()) return;
    setIsGeneratingSpecial(true);
    setSpecialResult(null);
    try {
      const result = await geminiService.generateSignatureSpecial(theme);
      setSpecialResult(result);
    } catch {
      console.error("Vinetelligence: Special synthesis failed.");
    } finally {
      setIsGeneratingSpecial(false);
    }
  };

  const handleUpdateRole = (id: string, newRole: StaffShift['role']) => {
    setStaffList(prev => prev.map(staff => staff.id === id ? { ...staff, role: newRole } : staff));
  };

  const handleUpdateScore = (id: string, newScore: number) => {
    const score = Math.max(0, Math.min(100, newScore));
    setStaffList(prev => prev.map(staff => staff.id === id ? { ...staff, performanceScore: score } : staff));
  };

  const handleCalculateROI = async () => {
    setIsCalculatingROI(true);
    try {
      // Mock feedback data for demonstration if none exists
      const mockFeedback: GuestFeedback[] = [
        { id: '1', rating: 5, comment: 'Amazing wine knowledge!', sentiment: 'Positive', timestamp: new Date().toISOString(), staffId: '1' },
        { id: '2', rating: 4, comment: 'Great service, very professional.', sentiment: 'Positive', timestamp: new Date().toISOString(), staffId: '2' },
        { id: '3', rating: 2, comment: 'Staff seemed unsure about the menu.', sentiment: 'Negative', timestamp: new Date().toISOString(), staffId: '3' }
      ];
      const result = await geminiService.getAcademyROI(staffList, mockFeedback);
      setRoiReport(result);
    } catch (err) {
      console.error("Vinetelligence: ROI calculation failed", err);
    } finally {
      setIsCalculatingROI(false);
    }
  };

  const handleGetRecommendations = async (staff: StaffShift) => {
    setIsRecommending(staff.id);
    try {
      const context = "Upcoming Spring Menu change: focusing on biodynamic wines and molecular cocktails.";
      const recs = await geminiService.getTrainingRecommendations(staff, context);
      setRecommendations(prev => ({ ...prev, [staff.id]: recs }));
    } catch (err) {
      console.error("Vinetelligence: Recommendation failed", err);
    } finally {
      setIsRecommending(null);
    }
  };
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;
    
    const staff: StaffShift = {
      id: Math.random().toString(36).substring(2, 9),
      name: newStaff.name,
      role: newStaff.role,
      startTime: '17:00',
      endTime: '23:00',
      performanceScore: 80,
      accessStatus: 'Active',
      assignedModules: []
    };
    
    setStaffList(prev => [...prev, staff]);
    setNewStaff({ name: '', role: 'Server' });
    setShowAddForm(false);
  };

  const handleRemoveStaff = (id: string) => {
    setStaffToDelete(id);
  };

  const confirmRemoveStaff = () => {
    if (staffToDelete) {
      setStaffList(prev => prev.filter(s => s.id !== staffToDelete));
      setStaffToDelete(null);
    }
  };

  const toggleModuleAssignment = (staffId: string, moduleId: string) => {
    setStaffList(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const assigned = staff.assignedModules || [];
      const exists = assigned.find(m => m.moduleId === moduleId);
      
      if (exists) {
        return { ...staff, assignedModules: assigned.filter(m => m.moduleId !== moduleId) };
      } else {
        return { ...staff, assignedModules: [...assigned, { moduleId, completed: false }] };
      }
    }));
  };

  const toggleModuleCompletion = (staffId: string, moduleId: string) => {
    setStaffList(prev => prev.map(staff => {
      if (staff.id !== staffId) return staff;
      const assigned = staff.assignedModules || [];
      return {
        ...staff,
        assignedModules: assigned.map(m => 
          m.moduleId === moduleId ? { ...m, completed: !m.completed } : m
        )
      };
    }));
  };

  const isHighPriorityAssigned = (staff: StaffShift) => {
    const assignedIds = (staff.assignedModules || []).map(m => m.moduleId);
    return TRAINING_MODULES.some(m => assignedIds.includes(m.id) && m.difficulty === 'Advanced');
  };

  const globalProgress = useMemo(() => {
    const allAssigned = staffList.flatMap(s => s.assignedModules || []);
    if (allAssigned.length === 0) return 0;
    const completed = allAssigned.filter(m => m.completed).length;
    return Math.round((completed / allAssigned.length) * 100);
  }, [staffList]);

  const progressTitle = useMemo(() => {
    const isLight = store.profile?.aesthetic === 'light';
    if (globalProgress < 20) return isLight ? 'Beginner' : 'Novice Node';
    if (globalProgress < 40) return isLight ? 'Learner' : 'Apprentice Sommelier';
    if (globalProgress < 60) return isLight ? 'Intermediate' : 'Technical Specialist';
    if (globalProgress < 80) return isLight ? 'Advanced' : 'Master Operator';
    return isLight ? 'Expert' : 'Elite Intelligence';
  }, [globalProgress, store.profile?.aesthetic]);

  return (
    <div className="space-y-6">
      {activeVideo && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-black w-full max-w-5xl aspect-video rounded-[2rem] overflow-hidden shadow-2xl relative border border-white/10">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${activeVideo}?rel=0&enablejsapi=1`} 
              className="w-full h-full" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <div className="mt-4 flex justify-end">
            <a 
              href={`https://www.youtube.com/watch?v=${activeVideo}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-white text-xs flex items-center gap-1"
            >
              <i className="fas fa-external-link-alt"></i>
              Open in YouTube
            </a>
          </div>
        </div>
      )}

      {staffToDelete && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 p-10 text-center space-y-8">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <i className="fas fa-user-slash text-3xl"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-black italic text-stone-900">Revoke Authorization?</h3>
              <p className="text-stone-500 text-xs leading-relaxed italic">
                Permanently remove this operator from the roster? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStaffToDelete(null)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all">Cancel</button>
              <button onClick={confirmRemoveStaff} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-rose-700 transition-all active:scale-95">Confirm Removal</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-4 border-b border-stone-200 overflow-x-auto whitespace-nowrap custom-scrollbar">
        <button
          onClick={() => setActiveTab('academy')}
          className={`pb-4 text-sm font-bold transition-all px-2 ${activeTab === 'academy' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          {getBrandedTerm('scholar_node', store.profile || undefined)}
        </button>
        <button
          onClick={() => setActiveTab('mixology')}
          className={`pb-4 text-sm font-bold transition-all px-2 ${activeTab === 'mixology' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          Mixology Lookup
        </button>
        <button
          onClick={() => setActiveTab('signature')}
          className={`pb-4 text-sm font-bold transition-all px-2 ${activeTab === 'signature' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          Signature Lab
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-4 text-sm font-bold transition-all px-2 ${activeTab === 'roster' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          Team Roster
        </button>
      </div>

      {activeTab === 'academy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
          <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold font-serif mb-2">{getBrandedTerm('scholar_node', store.profile || undefined)}</h3>
              <p className="text-stone-400 text-sm mb-6">{store.profile?.aesthetic === 'light' ? 'Learn about drinks and service.' : 'Master global beverage traditions and technical service.'}</p>
              
              <button 
                onClick={() => setShowVisionPitch(true)}
                className="w-full mb-6 py-3 bg-amber-500 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20"
              >
                <i className="fas fa-camera"></i>
                Vinetelligence Vision Scan
              </button>

              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl mb-6">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500 flex items-center justify-center font-bold text-lg text-amber-500" style={{ borderColor: `rgba(245, 158, 11, ${globalProgress/100})` }}>
                    {globalProgress}%
                </div>
                <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Progress</p>
                    <p className="text-sm font-bold">{progressTitle}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-stone-400 px-2">Assigned Modules</h4>
              {filteredModules.length > 0 ? filteredModules.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-stone-200 hover:border-amber-500 transition-colors cursor-pointer group shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                      m.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' : 
                      m.difficulty === 'Intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {m.difficulty}
                    </span>
                    <div className="flex items-center gap-2">
                      {m.videoId && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVideo(m.videoId!);
                          }}
                          className="text-amber-500 hover:text-amber-600 transition-colors"
                        >
                          <i className="fas fa-play-circle text-lg"></i>
                        </button>
                      )}
                      {m.completed && <i className="fas fa-check-circle text-green-500"></i>}
                    </div>
                  </div>
                  <p className="font-bold text-stone-800 mb-1 group-hover:text-amber-600">{m.topic}</p>
                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1"><i className="far fa-clock"></i> {m.duration}</span>
                    <span className="flex items-center gap-1"><i className="far fa-play-circle"></i> Start</span>
                  </div>
                </div>
              )) : (
                <div className="p-4 text-center text-stone-400 text-sm italic">
                  No modules found.
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-stone-400">Academy ROI Analytics</h4>
                <button 
                  onClick={handleCalculateROI}
                  disabled={isCalculatingROI}
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1"
                >
                  {isCalculatingROI ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-chart-line"></i>}
                  Synthesize Report
                </button>
              </div>

              {roiReport ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xl">
                      {roiReport.correlationScore}%
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-500 uppercase">Sentiment Correlation</p>
                      <p className="text-xs text-stone-600">Training impact on guest satisfaction</p>
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Top Performing Skill</p>
                    <p className="text-sm font-bold text-stone-800">{roiReport.topSkill}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Revenue Impact</p>
                    <p className="text-xs text-emerald-800 leading-tight">{roiReport.revenueImpact}</p>
                  </div>
                  <p className="text-[10px] text-stone-400 italic leading-tight">"{roiReport.summary}"</p>
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-stone-100 rounded-2xl">
                  <p className="text-xs text-stone-400 italic">"Link training scores to guest reviews to prove ROI."</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 flex flex-col shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
                  <i className="fas fa-brain text-amber-400"></i>
                </div>
                <div>
                  <h3 className="font-bold text-stone-800">Vinetelligence AI Coach</h3>
                  <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Global Intelligence Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-amber-600 text-white rounded-br-none shadow-lg' 
                      : 'bg-white text-stone-800 rounded-bl-none shadow-md border border-stone-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 border border-stone-100">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-stone-100 flex gap-2 bg-stone-50/50">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about cocktails, wine, or cultural service etiquette..." 
                className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
              <button 
                type="submit"
                disabled={isThinking || !input.trim()}
                className="w-12 h-12 bg-stone-900 text-white rounded-xl hover:bg-stone-800 flex items-center justify-center disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'mixology' && <CocktailSearch />}

      {activeTab === 'signature' && (
        <div className="space-y-8 max-w-5xl mx-auto py-4">
           <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 shadow-xl space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-serif font-bold text-stone-900">Creative Signature Lab</h3>
                <p className="text-stone-500">Input a concept to generate a professional recipe and AI visual profile.</p>
              </div>

              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Vintage Tokyo Sunset, Alpine Winter Cabin, Brutalist Espresso..."
                  className="flex-1 px-8 py-5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
                <button
                  onClick={handleGenerateSpecial}
                  disabled={isGeneratingSpecial || !theme.trim()}
                  className="px-10 bg-stone-900 text-white rounded-2xl font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isGeneratingSpecial ? <i className="fas fa-magic fa-spin text-amber-500"></i> : <i className="fas fa-sparkles text-amber-500"></i>}
                  Generate Signature
                </button>
              </div>
           </div>

           {isGeneratingSpecial && (
             <div className="py-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 animate-pulse">Brewing Intelligence & Visualizing Concept...</p>
             </div>
           )}

           {specialResult && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in zoom-in-95 duration-500">
                <div className="bg-stone-900 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5 aspect-square">
                   <img 
                    src={specialResult.imageUrl} 
                    alt={specialResult.recipe.name} 
                    className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                   <div className="absolute bottom-10 left-10 right-10">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full border border-amber-500/30 backdrop-blur-md mb-4 inline-block">
                        AI Generated Visual Profile
                      </span>
                      <h4 className="text-4xl font-serif font-bold text-white leading-tight">{specialResult.recipe.name}</h4>
                   </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-xl space-y-10 overflow-y-auto custom-scrollbar">
                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">The Concept Story</h5>
                      <p className="text-base text-stone-600 italic leading-relaxed">"{specialResult.recipe.story}"</p>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Composition</h5>
                        <ul className="space-y-3">
                          {specialResult.recipe.ingredients.map((ing: string, i: number) => (
                            <li key={i} className="text-sm font-bold text-stone-800 flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Service Standards</h5>
                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                           <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Glassware Choice</p>
                           <p className="text-sm font-bold text-stone-800">{specialResult.recipe.glassware}</p>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Execution Steps</h5>
                      <div className="space-y-4">
                        {specialResult.recipe.instructions.map((step: string, i: number) => (
                          <div key={i} className="flex gap-4 group">
                             <span className="shrink-0 w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-black text-stone-500 group-hover:bg-amber-600 group-hover:text-white transition-all">
                               {i+1}
                             </span>
                             <p className="text-sm text-stone-700 font-medium leading-relaxed pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="space-y-6 pb-20">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif font-bold text-stone-900">Operator Roster</h3>
              <p className="text-stone-500 text-sm">Unified control for role assignments, performance metrics, and intelligence upskilling.</p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center gap-2 group"
            >
              <i className={`fas ${showAddForm ? 'fa-times' : 'fa-plus'} text-amber-500 transition-transform group-hover:rotate-90`}></i>
              {showAddForm ? 'Cancel' : 'Authorize New Operator'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddStaff} className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-xl animate-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Operational Identity (Name)</label>
                  <input 
                    type="text" 
                    required
                    value={newStaff.name}
                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="e.g. Elena Rossi"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Tier Assignment (Role)</label>
                  <select 
                    value={newStaff.role}
                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value as StaffShift['role'] })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-bold hover:bg-amber-500 transition-all shadow-md active:scale-95"
                >
                  Confirm Authorization
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Operator</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Tier Designation</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Performance Index</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Training Sync</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 text-right">Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {staffList.map((staff) => {
                    const assigned = staff.assignedModules || [];
                    const completedCount = assigned.filter(m => m.completed).length;
                    const totalCount = assigned.length;
                    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                    const isHighPriority = isHighPriorityAssigned(staff);

                    return (
                      <React.Fragment key={staff.id}>
                        <tr className={`group transition-all hover:bg-stone-50/80 ${expandedStaffId === staff.id ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center text-amber-500 text-sm font-black shadow-md">
                                  {staff.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isHighPriority ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 flex items-center gap-2">
                                  {staff.name}
                                  {isHighPriority && (
                                    <span className="text-[7px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200">
                                      Critical Sync
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-stone-400 font-medium">{store.profile?.aesthetic === 'light' ? 'Staff ID' : 'Node ID'}: {staff.id.slice(-4)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <select 
                              value={staff.role}
                              onChange={(e) => handleUpdateRole(staff.id, e.target.value as StaffShift['role'])}
                              className={`text-xs font-black px-4 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none transition-all cursor-pointer appearance-none min-w-[140px] ${
                                staff.role === 'Sommelier' ? 'bg-red-50 border-red-100 text-red-700' :
                                staff.role === 'Mixologist' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                staff.role === 'Manager' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                'bg-stone-100 border-stone-200 text-stone-600'
                              }`}
                            >
                              {ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <input 
                                 type="number"
                                 value={staff.performanceScore}
                                 onChange={(e) => handleUpdateScore(staff.id, parseInt(e.target.value))}
                                 className="w-16 bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs font-black text-stone-800 text-center focus:ring-2 focus:ring-amber-500 outline-none"
                               />
                               <div className="hidden xl:flex gap-0.5">
                                 {[1,2,3,4,5].map(star => (
                                   <i key={star} className={`fas fa-star text-[8px] ${star <= Math.round(staff.performanceScore / 20) ? 'text-amber-500' : 'text-stone-200'}`}></i>
                                 ))}
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="w-32">
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[9px] font-black text-stone-400 uppercase">{completedCount}/{totalCount}</span>
                                  <span className="text-[9px] font-black text-amber-600">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => setExpandedStaffId(expandedStaffId === staff.id ? null : staff.id)}
                                 className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${expandedStaffId === staff.id ? 'bg-amber-500 text-stone-950 shadow-lg' : 'bg-stone-100 text-stone-500 hover:text-stone-900'}`}
                                 title="Module Management"
                               >
                                 <i className="fas fa-layer-group text-xs"></i>
                               </button>
                               <button 
                                 onClick={() => handleRemoveStaff(staff.id)}
                                 className="w-9 h-9 rounded-xl bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                                 title="Revoke Authorization"
                               >
                                 <i className="fas fa-user-slash text-xs"></i>
                               </button>
                            </div>
                          </td>
                        </tr>
                        {expandedStaffId === staff.id && (
                          <tr>
                            <td colSpan={5} className="bg-stone-50/50 border-y border-stone-100 animate-in slide-in-from-top-2 duration-300">
                               <div className="p-8">
                                  <div className="mb-8 p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
                                     <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                           <Sparkles className="text-amber-500" size={16} />
                                           <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Predictive Roster Insights</h5>
                                        </div>
                                        <button 
                                           onClick={() => handleGetRecommendations(staff)}
                                           disabled={isRecommending === staff.id}
                                           className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-1"
                                        >
                                           {isRecommending === staff.id ? <RefreshCw size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                           Sync Recommendations
                                        </button>
                                     </div>
                                     
                                     {recommendations[staff.id] ? (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                           {recommendations[staff.id].map((rec, i) => (
                                              <div key={i} className="bg-white p-4 rounded-2xl border border-amber-200/50 shadow-sm">
                                                 <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Module {rec.moduleId}</p>
                                                 <p className="text-xs text-stone-600 leading-tight">{rec.rationale}</p>
                                              </div>
                                           ))}
                                        </div>
                                     ) : (
                                        <p className="text-xs text-stone-400 italic">"AI will suggest modules based on upcoming menu changes and seasonal trends."</p>
                                     )}
                                  </div>

                                  <div className="flex items-center gap-4 mb-6">
                                     <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 italic">Curriculum Control Panel</h5>
                                     <div className="h-[1px] flex-1 bg-stone-200"></div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {TRAINING_MODULES.map(module => {
                                       const isAssigned = !!assigned.find(m => m.moduleId === module.id);
                                       const isCompleted = !!assigned.find(m => m.moduleId === module.id)?.completed;
                                       const isAdvanced = module.difficulty === 'Advanced';

                                       return (
                                         <div key={module.id} className={`p-5 rounded-[1.5rem] border-2 transition-all relative group overflow-hidden ${
                                           isAssigned ? 'bg-white border-amber-200 shadow-md' : 'bg-transparent border-stone-200 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                                         }`}>
                                            {isAdvanced && isAssigned && (
                                              <div className="absolute top-0 right-0">
                                                 <div className="bg-red-500 text-white text-[7px] font-black uppercase px-2 py-1 transform rotate-45 translate-x-3 -translate-y-1 shadow-md">Critical</div>
                                              </div>
                                            )}
                                            <div className="flex items-start justify-between mb-4">
                                               <div className="flex items-center gap-3">
                                                  <input 
                                                    type="checkbox"
                                                    checked={isAssigned}
                                                    onChange={() => toggleModuleAssignment(staff.id, module.id)}
                                                    className="w-5 h-5 rounded-lg border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                                  />
                                                  <div>
                                                     <p className="text-sm font-bold text-stone-800 leading-tight">{module.topic}</p>
                                                     <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-1 inline-block ${
                                                       module.difficulty === 'Beginner' ? 'bg-green-50 text-green-600' :
                                                       module.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                                     }`}>
                                                       {module.difficulty}
                                                     </span>
                                                  </div>
                                               </div>
                                            </div>
                                            {isAssigned && (
                                              <div className="flex items-center justify-between mt-2 pt-4 border-t border-stone-50">
                                                 <div className="flex items-center gap-3">
                                                   <div className="flex items-center gap-2 text-stone-400">
                                                      <i className="far fa-clock text-[10px]"></i>
                                                      <span className="text-[10px] font-bold">{module.duration}</span>
                                                   </div>
                                                   {module.videoId && (
                                                     <button 
                                                       onClick={() => setActiveVideo(module.videoId!)}
                                                       className="text-amber-500 hover:text-amber-600 transition-colors"
                                                     >
                                                       <i className="fas fa-play-circle text-sm"></i>
                                                     </button>
                                                   )}
                                                 </div>
                                                 <button 
                                                   onClick={() => toggleModuleCompletion(staff.id, module.id)}
                                                   className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm ${
                                                     isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-900 text-white hover:bg-amber-500 hover:text-stone-950'
                                                   }`}
                                                 >
                                                   {isCompleted ? 'Synched' : 'Commit Sync'}
                                                 </button>
                                              </div>
                                            )}
                                         </div>
                                       );
                                     })}
                                  </div>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {staffList.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-stone-400">
                <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center mb-6">
                   <i className="fas fa-users-slash text-4xl opacity-10"></i>
                </div>
                <p className="font-serif italic text-lg">"Registry dormant. No operators identified in the local silo."</p>
                <button onClick={() => setShowAddForm(true)} className="mt-6 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-500 transition-colors">Initialize Authorization Protocol</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showVisionPitch && (
        <VisionPitch onClose={() => setShowVisionPitch(false)} />
      )}
    </div>
  );
};

export default StaffTraining;
