
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TRAINING_MODULES, INITIAL_SHIFTS } from '../constants';
import { geminiService } from '../services/geminiService';
import CocktailSearch from './CocktailSearch';
import { StaffShift, TrainingSession } from '../types';

interface StaffTrainingProps {
  searchQuery?: string;
}

const ROLES = ['Sommelier', 'Mixologist', 'Server', 'Manager'] as const;

const StaffTraining: React.FC<StaffTrainingProps> = ({ searchQuery = '' }) => {
  const [activeTab, setActiveTab] = useState<'academy' | 'mixology' | 'signature' | 'roster'>('academy');
  const [messages, setMessages] = useState<{role: 'user' | 'vinea', text: string}[]>([
    { role: 'vinea', text: 'Hello! I am Vinea, your AI Beverage Coach. What would you like to learn today? I can help with wine pairings, cocktail recipes, or service techniques from various cultures.' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Signature Special State
  const [theme, setTheme] = useState('');
  const [isGeneratingSpecial, setIsGeneratingSpecial] = useState(false);
  const [specialResult, setSpecialResult] = useState<any>(null);

  // Team Management State
  const [staffList, setStaffList] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('vinea_staff_list');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Server' as StaffShift['role'] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vinea_staff_list', JSON.stringify(staffList));
  }, [staffList]);

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
      setMessages(prev => [...prev, { role: 'vinea', text: response || 'I missed that, could you repeat?' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'vinea', text: 'Sorry, I am having trouble connecting to my knowledge base right now.' }]);
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
    } catch (err) {
      console.error(err);
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

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;
    
    const staff: StaffShift = {
      id: Date.now().toString(),
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
    if (confirm("Permanently remove this operator from the roster?")) {
      setStaffList(prev => prev.filter(s => s.id !== id));
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

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-stone-200 overflow-x-auto whitespace-nowrap custom-scrollbar">
        <button
          onClick={() => setActiveTab('academy')}
          className={`pb-4 text-sm font-bold transition-all px-2 ${activeTab === 'academy' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
        >
          Academy & AI Coach
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
              <h3 className="text-xl font-bold font-serif mb-2">Vinea Academy</h3>
              <p className="text-stone-400 text-sm mb-6">Master global beverage traditions and technical service.</p>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl mb-6">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500 flex items-center justify-center font-bold text-lg text-amber-500">
                    33%
                </div>
                <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Progress</p>
                    <p className="text-sm font-bold">Apprentice Sommelier</p>
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
                    {m.completed && <i className="fas fa-check-circle text-green-500"></i>}
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
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 flex flex-col shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
                  <i className="fas fa-brain text-amber-400"></i>
                </div>
                <div>
                  <h3 className="font-bold text-stone-800">Vinea AI Coach</h3>
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Operational Node</th>
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
                                <p className="text-[10px] text-stone-400 font-medium">Node ID: {staff.id.slice(-4)}</p>
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
                                                 <div className="flex items-center gap-2 text-stone-400">
                                                    <i className="far fa-clock text-[10px]"></i>
                                                    <span className="text-[10px] font-bold">{module.duration}</span>
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
    </div>
  );
};

export default StaffTraining;
