
import React, { useState } from 'react';
import { Table, RestaurantProfile } from '../../lib/types';
import { supabaseSync, generateUUID } from '../../services/supabaseSync';
import { INITIAL_TABLES, INITIAL_ZONES } from '../../constants';

interface GeneralSettingsProps {
  profile: RestaurantProfile | null;
  onUpdate: (key: string, value: string | number | boolean | object | null) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ profile, onUpdate }) => {
  const [tables, setTables] = useState<Table[]>(() => {
    const savedTables = localStorage.getItem('vinetelligence_tables') || localStorage.getItem('vinea_tables');
    return savedTables ? JSON.parse(savedTables) : INITIAL_TABLES;
  });
  const [barCapacity, setBarCapacity] = useState<number>(profile?.barCapacity || 12);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    const fetchTables = async () => {
      if (profile?.id && profile.edition !== 'demo') {
        try {
          const cloudTables = await supabaseSync.pullTables(profile.id);
          if (cloudTables && cloudTables.length > 0) {
            setTables(cloudTables);
            localStorage.setItem('vinetelligence_tables', JSON.stringify(cloudTables));
            localStorage.setItem('vinea_tables', JSON.stringify(cloudTables));
          }
        } catch (e) {
          console.error("Vinetelligence: Failed to fetch cloud tables for settings", e);
        }
      }
    };
    fetchTables();
  }, [profile?.id, profile?.edition]);

  const handleUpdateTableCount = (count: number) => {
    let currentTables = [...tables];
    if (count > currentTables.length) {
      for (let i = currentTables.length; i < count; i++) {
        currentTables.push({
          id: generateUUID(),
          number: (i + 1).toString(),
          capacity: 4,
          status: 'Available',
          x: (i % 4) + 1,
          y: Math.floor(i / 4) + 1,
          zoneId: 'z2' // Default to Main Floor A
        });
      }
    } else {
      currentTables = currentTables.slice(0, count);
    }
    setTables(currentTables);
  };

  const updateIndividualCapacity = (id: string, capacity: number) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, capacity: Math.max(1, capacity) } : t));
  };

  const updateIndividualZone = (id: string, zoneId: string) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, zoneId } : t));
  };

  const handleSaveArchitecture = async () => {
    setIsSaving(true);
    localStorage.setItem('vinetelligence_tables', JSON.stringify(tables));
    localStorage.setItem('vinea_tables', JSON.stringify(tables));
    onUpdate('barCapacity', barCapacity);
    
    // Sync to Supabase if in secure mode
    const profileToSync = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
    if (profileToSync.id && profileToSync.id !== 'demo-id') {
      try {
        await supabaseSync.bulkUpdateTables(profileToSync.id, tables);
      } catch (e) {
        console.error("Vinetelligence: Failed to sync architectural changes", e);
      }
    }

    window.dispatchEvent(new Event('storage'));

    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
      {/* Subscription & Tier */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
           <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Subscription & Tier</h3>
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">Operational Plan Management</p>
           </div>
           <div className="w-12 h-12 bg-stone-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
             <i className="fas fa-credit-card"></i>
           </div>
        </div>
        
        <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-6">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Current Plan</p>
                 <p className="text-xl font-black text-stone-900 italic">
                    {profile?.edition === 'free' ? 'The Essential' : 
                     profile?.edition === 'demo' ? 'Explorer (Demo)' : 
                     profile?.edition === 'paid' ? 'The Growth' : 'The Enterprise'}
                 </p>
              </div>
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                 <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                    {profile?.subscriptionStatus === 'trial' ? 'Trial Period' : 'Active'}
                 </span>
              </div>
           </div>

           {profile?.subscriptionStatus === 'trial' && profile?.trialEndsAt && (
              <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Trial Progress</span>
                    <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest">
                       Ends {new Date(profile.trialEndsAt).toLocaleDateString()}
                    </span>
                 </div>
                 <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                       className="h-full bg-amber-500 transition-all duration-1000"
                       style={{ 
                          width: `${Math.max(0, Math.min(100, (14 - Math.ceil((new Date(profile.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) / 14 * 100))}%` 
                       }}
                    ></div>
                 </div>
                 <p className="text-[9px] text-stone-400 italic">
                    You are currently in a 14-day full-feature trial. Upgrade to remove operational limits.
                 </p>
              </div>
           )}

           <div className="pt-4 flex gap-4">
              {profile?.subscriptionStatus === 'trial' ? (
                 <button 
                    onClick={() => {
                       onUpdate('subscriptionStatus', 'active');
                       onUpdate('trialEndsAt', null);
                       // Force reload to clear state
                       setTimeout(() => window.location.reload(), 100);
                    }}
                    className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-stone-900 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                 >
                    <i className="fas fa-rocket text-amber-500"></i>
                    Pay & Continue Service
                 </button>
              ) : (
                 <button 
                    disabled
                    className="flex-1 py-4 bg-stone-200 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-3"
                 >
                    <i className="fas fa-check-circle"></i>
                    Plan is Active
                 </button>
              )}
              
              <button className="px-6 py-4 bg-white border border-stone-200 text-stone-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all">
                 View Invoices
              </button>
           </div>
        </div>
      </div>

      {/* Academy Solo Edition Toggle */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
           <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Academy Solo Edition</h3>
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">Standalone Academic Service Offering</p>
           </div>
           <div className="w-12 h-12 bg-violet-600/10 text-violet-600 rounded-2xl flex items-center justify-center shadow-sm">
             <i className="fas fa-graduation-cap text-lg"></i>
           </div>
        </div>

        <div className="bg-violet-500/5 p-6 rounded-3xl border border-violet-500/10 flex flex-col md:flex-row gap-6 items-center justify-between">
           <div className="space-y-1.5 flex-1">
              <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-toggle-on"></i> Restricted Operating View Mode
              </p>
              <h4 className="text-base font-black text-stone-900 leading-snug">Lock App to Training Modules Only</h4>
              <p className="text-xs text-stone-500 leading-relaxed max-w-xl">
                Enable this option to offer Vinetelligence as a <strong>standalone academic training tool</strong> for your staff. This locks the side navigation—hiding live inventory, customer dispatch tables, VIP reservation analytics, and financial hubs—and presents employees with an immersive, distraction-free curriculum, active slide readers, quizzes, and sommelier tests.
              </p>
           </div>
           <div className="shrink-0">
              <button 
                onClick={() => {
                   onUpdate('academyOnlyMode', !profile?.academyOnlyMode);
                   // Refresh layout
                   setTimeout(() => window.dispatchEvent(new Event('storage')), 150);
                }}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                   profile?.academyOnlyMode 
                     ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700' 
                     : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800'
                }`}
              >
                 {profile?.academyOnlyMode ? (
                   <span className="flex items-center gap-2"><i className="fas fa-lock"></i> Academy Solo Active</span>
                 ) : (
                   <span className="flex items-center gap-2"><i className="fas fa-unlock"></i> Activate Solo Mode</span>
                 )}
              </button>
           </div>
        </div>
      </div>

      {/* Establishment Identity */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Establishment Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Venue Identity</label>
            <input 
              type="text"
              defaultValue={profile?.name}
              disabled={profile?.id !== 'demo-id'}
              onBlur={(e) => onUpdate('name', e.target.value)}
              className={`w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold ${profile?.id !== 'demo-id' ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Venue Name"
            />
            {profile?.id !== 'demo-id' && (
              <p className="text-[8px] text-stone-400 mt-1 uppercase font-bold tracking-tighter">
                Registry name is locked after initial setup.
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Primary Category</label>
            <select 
              defaultValue={profile?.type}
              onChange={(e) => onUpdate('type', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none font-bold"
            >
              <option value="Restaurant">Restaurant</option>
              <option value="Bar">Bar</option>
              <option value="Wine Bar">Wine Bar</option>
              <option value="Speakeasy">Speakeasy</option>
              <option value="Cocktail Lounge">Cocktail Lounge</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-stone-50">
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Public Contact Phone</label>
            <input 
              type="text"
              defaultValue={profile?.phone}
              onBlur={(e) => onUpdate('phone', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Public Reach Email</label>
            <input 
              type="email"
              defaultValue={profile?.email}
              onBlur={(e) => onUpdate('email', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              placeholder="concierge@venue.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Physical Architecture (Address)</label>
            <input 
              type="text"
              defaultValue={profile?.address}
              onBlur={(e) => onUpdate('address', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              placeholder="123 Intelligence way, Silicon Valley, CA"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Visual Core (Logo URL)</label>
            <div className="flex gap-4 items-start">
               <div className="flex-1">
                 <input 
                   type="text"
                   defaultValue={profile?.logoUrl}
                   onBlur={(e) => onUpdate('logoUrl', e.target.value)}
                   className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                   placeholder="https://example.com/logo.png"
                 />
                 <p className="text-[8px] text-stone-400 mt-1 uppercase font-bold tracking-tighter">Transparent PNG or SVG recommended</p>
               </div>
               {profile?.logoUrl && (
                 <div className="w-16 h-16 bg-stone-900 rounded-xl flex items-center justify-center p-2 border border-white/10 relative group overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-50"></div>
                    <img src={profile.logoUrl} className="max-w-full max-h-full object-contain relative z-10" alt="Logo Preview" referrerPolicy="no-referrer" />
                 </div>
               )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Instagram Node</label>
            <input 
              type="text"
              defaultValue={profile?.instagram}
              onBlur={(e) => onUpdate('instagram', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              placeholder="@username"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Twitter/X Node</label>
            <input 
              type="text"
              defaultValue={profile?.twitter}
              onBlur={(e) => onUpdate('twitter', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              placeholder="@username"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">LinkedIn Node</label>
            <input 
              type="text"
              defaultValue={profile?.linkedin}
              onBlur={(e) => onUpdate('linkedin', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
        </div>
      </div>

      {/* Terminal Configuration (New Section) */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
           <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Terminal Configuration</h3>
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">POS Default Interface Standards</p>
           </div>
           <div className="w-12 h-12 bg-stone-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
             <i className="fas fa-desktop"></i>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-stone-50 p-6 rounded-3xl border border-stone-100">
           <div className="space-y-4">
              <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Default Grid Density</label>
              <div className="flex gap-1 p-1 bg-stone-200/50 rounded-xl w-fit">
                {(['comfortable', 'compact', 'tactical'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => onUpdate('posDensity', d)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${profile?.posDensity === d || (!profile?.posDensity && d === 'comfortable') ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-stone-400 italic">Adjusts the item node size for faster entry or visual clarity.</p>
           </div>

           <div className="space-y-4">
              <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Sidebar Orientation</label>
              <div className="flex gap-1 p-1 bg-stone-200/50 rounded-xl w-fit">
                {(['left', 'right'] as const).map(pos => (
                  <button
                    key={pos}
                    onClick={() => onUpdate('posSidebar', pos)}
                    className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${profile?.posSidebar === pos || (!profile?.posSidebar && pos === 'right') ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-stone-400 italic">Position of the ticket staging area (Left-handed vs Right-handed terminal).</p>
           </div>
        </div>
      </div>

      {/* Bar Architecture & Seating */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
           <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Bar Architecture</h3>
              <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">Main Service Counter Seating</p>
           </div>
           <div className="w-12 h-12 bg-stone-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
             <i className="fas fa-glass-martini-alt"></i>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-center bg-stone-50 p-6 rounded-3xl border border-stone-100">
           <div className="w-full md:w-72">
              <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3 ml-1">Bar Seating Capacity</label>
              <div className="flex items-center bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => setBarCapacity(Math.max(0, barCapacity - 1))} 
                  className="w-14 h-14 flex items-center justify-center hover:bg-stone-50 text-stone-400 transition-colors"
                >
                  <i className="fas fa-minus text-xs"></i>
                </button>
                <input 
                  type="number" 
                  value={barCapacity} 
                  onChange={(e) => setBarCapacity(parseInt(e.target.value) || 0)} 
                  className="flex-1 bg-transparent text-center font-black text-lg text-stone-900 outline-none" 
                />
                <button 
                  onClick={() => setBarCapacity(barCapacity + 1)} 
                  className="w-14 h-14 flex items-center justify-center hover:bg-stone-50 text-stone-400 transition-colors"
                >
                  <i className="fas fa-plus text-xs"></i>
                </button>
              </div>
           </div>
           <div className="flex-1 space-y-2">
              <p className="text-xs text-stone-600 font-bold leading-relaxed italic">
                "Define the total number of stools or seated positions available at the bar node."
              </p>
              <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest">
                This value calibrates walk-in analytics and peak-occupancy intelligence.
              </p>
           </div>
        </div>
      </div>

      {/* Floor Plan & Table Capacities */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Floor Node Inventory</h3>
              <p className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-tighter">{tables.length} Total Tables Assigned</p>
           </div>
           <div className="flex items-center bg-stone-900 rounded-xl px-4 py-2 gap-4">
              <span className="text-[10px] font-black text-stone-500 uppercase">Total Nodes</span>
              <div className="flex items-center gap-3">
                 <button onClick={() => handleUpdateTableCount(Math.max(1, tables.length - 1))} className="text-white hover:text-amber-500"><i className="fas fa-minus text-[10px]"></i></button>
                 <span className="text-amber-500 font-black text-sm w-4 text-center">{tables.length}</span>
                 <button onClick={() => handleUpdateTableCount(tables.length + 1)} className="text-white hover:text-amber-500"><i className="fas fa-plus text-[10px]"></i></button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {tables.map((table) => (
             <div key={table.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between group hover:border-amber-500/50 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center font-serif font-black text-stone-900 shadow-sm group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                      T{table.number}
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Chairs</p>
                         <p className="text-xs font-bold text-stone-900">{table.capacity}</p>
                      </div>
                      <select 
                         value={table.zoneId}
                         onChange={(e) => updateIndividualZone(table.id, e.target.value)}
                         className="bg-transparent text-[9px] font-black uppercase tracking-widest text-stone-500 outline-none cursor-pointer hover:text-amber-600 transition-colors"
                      >
                         {INITIAL_ZONES.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                         ))}
                      </select>
                   </div>
                </div>
                <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
                   <button onClick={() => updateIndividualCapacity(table.id, table.capacity - 1)} className="px-2 py-1 hover:bg-stone-50 text-stone-400"><i className="fas fa-minus text-[8px]"></i></button>
                   <span className="px-2 text-xs font-black text-stone-700">{table.capacity}</span>
                   <button onClick={() => updateIndividualCapacity(table.id, table.capacity + 1)} className="px-2 py-1 hover:bg-stone-50 text-stone-400"><i className="fas fa-plus text-[8px]"></i></button>
                </div>
             </div>
           ))}
        </div>

        <div className="pt-6 border-t border-stone-100 flex justify-end">
           <button 
             onClick={handleSaveArchitecture}
             disabled={isSaving}
             className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-stone-900 transition-all shadow-xl active:scale-95 flex items-center gap-3"
           >
             {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-draw-polygon text-amber-500"></i>}
             Commit Architectural Changes
           </button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
