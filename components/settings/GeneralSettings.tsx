
import React, { useState, useEffect } from 'react';
import { Table } from '../../types';

interface GeneralSettingsProps {
  profile: any;
  onUpdate: (key: string, value: any) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ profile, onUpdate }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [barCapacity, setBarCapacity] = useState<number>(profile?.barCapacity || 12);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedTables = localStorage.getItem('vinea_tables');
    if (savedTables) {
      setTables(JSON.parse(savedTables));
    }
  }, []);

  const handleUpdateTableCount = (count: number) => {
    let currentTables = [...tables];
    if (count > currentTables.length) {
      for (let i = currentTables.length; i < count; i++) {
        currentTables.push({
          id: `t-${Date.now()}-${i}`,
          number: (i + 1).toString(),
          capacity: 4,
          status: 'Available',
          x: (i % 4) + 1,
          y: Math.floor(i / 4) + 1
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

  const handleSaveArchitecture = () => {
    setIsSaving(true);
    localStorage.setItem('vinea_tables', JSON.stringify(tables));
    onUpdate('barCapacity', barCapacity);
    
    window.dispatchEvent(new Event('storage'));

    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
      {/* Establishment Identity */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Establishment Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Venue Identity</label>
            <input 
              type="text"
              defaultValue={profile?.name}
              onBlur={(e) => onUpdate('name', e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
              placeholder="Venue Name"
            />
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
           {tables.map((table, idx) => (
             <div key={table.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between group hover:border-amber-500/50 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center font-serif font-black text-stone-900 shadow-sm group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors">
                      T{table.number}
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Chairs</p>
                      <p className="text-sm font-bold text-stone-900">{table.capacity} Seated</p>
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

      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Operations Configuration</h3>
        <div className="space-y-4">
           <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
             <div>
                <p className="text-xs font-bold text-stone-800">Automatic Prep-List Sync</p>
                <p className="text-[10px] text-stone-400">Fire restock orders to Bar Station automatically when stock hits par.</p>
             </div>
             <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500" />
           </div>
           <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
             <div>
                <p className="text-xs font-bold text-stone-800">Guest Journey SMS Alerts</p>
                <p className="text-[10px] text-stone-400">Notify servers when high-value guests are within 1km of venue.</p>
             </div>
             <input type="checkbox" className="w-5 h-5 accent-amber-500" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
