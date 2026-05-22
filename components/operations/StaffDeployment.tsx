import React from 'react';
import { StaffShift, StaffAssignment, FloorZone, StaffRosterItem, Table, GuestJourney } from '../../lib/types';

interface StaffDeploymentProps {
  staff: StaffShift[];
  staffRoster: StaffRosterItem[];
  assignments: StaffAssignment[];
  tables: Table[];
  journeys: GuestJourney[];
  zones: FloorZone[];
  rosterMode: 'Active' | 'Authorized';
  setRosterMode: (mode: 'Active' | 'Authorized') => void;
  isSynthesizingCoverage: boolean;
  handleSynthesizeCoverage: () => void;
  newRosterEmail: string;
  setNewRosterEmail: (email: string) => void;
  newRosterRole: StaffShift['role'];
  setNewRosterRole: (role: StaffShift['role']) => void;
  handleAddRosterItem: () => void;
  handleRemoveRosterItem: (id: string) => void;
  handleRemoveStaffProfile: (id: string) => void;
  handleUpdateStaff: (id: string, updates: Partial<StaffShift>) => void;
  handleManualAssign: (staffId: string, zoneId: string) => void;
  setAssignments: (assignments: StaffAssignment[]) => void;
  isRosterLoading: boolean;
  isReadOnly: boolean;
  isOperator?: boolean;
  currentUserId?: string;
  coverageInsight: string | null;
}

const StaffDeployment: React.FC<StaffDeploymentProps> = ({
  staff,
  staffRoster,
  assignments,
  tables,
  journeys,
  zones,
  rosterMode,
  setRosterMode,
  isSynthesizingCoverage,
  handleSynthesizeCoverage,
  newRosterEmail,
  setNewRosterEmail,
  newRosterRole,
  setNewRosterRole,
  handleAddRosterItem,
  handleRemoveRosterItem,
  handleRemoveStaffProfile,
  handleUpdateStaff,
  handleManualAssign,
  setAssignments,
  isRosterLoading,
  isReadOnly,
  isOperator,
  currentUserId,
  coverageInsight
}) => {
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        <div className="lg:w-80 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex flex-col gap-4 bg-stone-50/50">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Personnel</h3>
              <div className="flex gap-1 bg-stone-200 p-1 rounded-lg">
                <button 
                  onClick={() => setRosterMode('Active')}
                  className={`text-[8px] font-black uppercase px-2 py-1 rounded-md transition-all ${rosterMode === 'Active' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setRosterMode('Authorized')}
                  className={`text-[8px] font-black uppercase px-2 py-1 rounded-md transition-all ${rosterMode === 'Authorized' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  Roster
                </button>
              </div>
            </div>
            
            {rosterMode === 'Active' ? (
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-bold text-stone-500 italic">Registered Staff</p>
                {!isOperator && (
                  <button onClick={handleSynthesizeCoverage} disabled={isSynthesizingCoverage || isReadOnly} className="w-8 h-8 rounded-lg bg-stone-900 text-amber-500 flex items-center justify-center shadow-lg hover:bg-amber-600 hover:text-stone-900 transition-all disabled:opacity-30">
                    {isSynthesizingCoverage ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={newRosterEmail}
                    onChange={(e) => setNewRosterEmail(e.target.value)}
                    disabled={isReadOnly}
                    className="flex-1 text-[10px] p-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-50"
                  />
                  <button 
                    onClick={handleAddRosterItem}
                    disabled={isRosterLoading || !newRosterEmail || isReadOnly}
                    className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-30"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <select 
                  value={newRosterRole}
                  onChange={(e) => setNewRosterRole(e.target.value as StaffShift['role'])}
                  disabled={isReadOnly}
                  className="w-full text-[10px] p-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-50"
                >
                  <option value="Server">Server</option>
                  <option value="Sommelier">Sommelier</option>
                  <option value="Mixologist">Mixologist</option>
                  <option value="Concierge">Concierge</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {rosterMode === 'Active' ? (
              staff.map(s => {
                const currentAssign = assignments.find(a => a.staffId === s.id);
                const zone = zones.find(z => z.id === currentAssign?.zoneId);
                const isExcluded = ['owner', 'admin', 'manager', 'developer', 'investor'].includes(s.role.toLowerCase().trim());
                
                return (
                  <div key={s.id} className={`p-4 rounded-2xl border-2 transition-all group ${currentAssign ? 'bg-stone-50 border-stone-100' : 'bg-white border-stone-100 border-dashed opacity-80'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-black text-stone-900 flex items-center gap-2">
                          {s.name}
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            s.availabilityStatus === 'Available' ? 'bg-emerald-500' :
                            s.availabilityStatus === 'On Break' ? 'bg-amber-500' :
                            'bg-stone-300'
                          }`} title={s.availabilityStatus || 'Offline'}></span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-stone-900 text-amber-500">{s.role}</span>
                          {isExcluded && <span className="text-[6px] text-amber-600 font-bold uppercase tracking-tighter">Excluded</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button 
                          onClick={() => handleRemoveStaffProfile(s.id)}
                          disabled={isReadOnly}
                          className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 disabled:hidden"
                          title="Remove from Establishment"
                        >
                          <i className="fas fa-user-minus text-[10px]"></i>
                        </button>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateStaff(s.id, { performanceScore: Math.max(0, (s.performanceScore || 0) - 5) })}
                            disabled={isReadOnly}
                            className="text-stone-300 hover:text-rose-500 transition-colors disabled:opacity-30"
                          >
                            <i className="fas fa-minus-circle text-[8px]"></i>
                          </button>
                          <div className="flex flex-col items-center">
                            <p className="text-[10px] font-black text-stone-900">{Math.round(s.performanceScore || 0)}%</p>
                            <div className="w-12 h-1 bg-stone-100 rounded-full overflow-hidden mt-0.5">
                              <div className={`h-full transition-all duration-1000 ${
                                (s.performanceScore || 0) > 80 ? 'bg-emerald-500' :
                                (s.performanceScore || 0) > 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} style={{ width: `${s.performanceScore || 0}%` }}></div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleUpdateStaff(s.id, { performanceScore: Math.min(100, (s.performanceScore || 0) + 5) })}
                            disabled={isReadOnly}
                            className="text-stone-300 hover:text-emerald-500 transition-colors disabled:opacity-30"
                          >
                            <i className="fas fa-plus-circle text-[8px]"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-[8px] font-black text-stone-400 uppercase">Availability:</p>
                      <select 
                        value={s.availabilityStatus || 'Available'}
                        onChange={(e) => handleUpdateStaff(s.id, { availabilityStatus: e.target.value as StaffShift['availabilityStatus'] })}
                        disabled={isReadOnly}
                        className="text-[8px] font-black uppercase bg-stone-50 border border-stone-200 rounded px-1 py-0.5 outline-none focus:border-amber-500 disabled:opacity-50"
                      >
                        <option value="Available">Available</option>
                        <option value="On Break">On Break</option>
                        <option value="Busy">Busy</option>
                        <option value="Off Duty">Off Duty</option>
                      </select>
                    </div>
                    
                    {currentAssign ? (
                      <div className="flex justify-between items-center mt-3">
                        <span className={`text-[8px] font-black uppercase text-white px-2 py-1 rounded-lg ${zone?.color || 'bg-stone-400'}`}>
                          {zone?.name || 'Unmapped'}
                        </span>
                        <button onClick={() => {
                            if (isReadOnly) return;
                            const updated = assignments.filter(a => a.staffId !== s.id);
                            setAssignments(updated);
                        }} disabled={isReadOnly} className="w-6 h-6 rounded-lg bg-stone-100 text-stone-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center disabled:hidden"><i className="fas fa-times text-[8px]"></i></button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {zones.map(z => (
                          <button 
                            key={z.id} 
                            onClick={() => handleManualAssign(s.id, z.id)}
                            disabled={isReadOnly}
                            className="py-1.5 rounded-lg border border-stone-200 text-[7px] font-black uppercase text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-all disabled:opacity-30"
                          >
                            Assign {z.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              staffRoster.map(r => (
                <div key={r.id} className="p-4 rounded-2xl border-2 border-stone-100 bg-white group hover:border-stone-200 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-stone-900">{r.email}</p>
                      <p className="text-[8px] font-black uppercase text-stone-400 mt-0.5">{r.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[7px] font-black uppercase px-2 py-1 rounded-md ${
                        r.status === 'Registered' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {r.status}
                      </span>
                      <button 
                        onClick={() => handleRemoveRosterItem(r.id)}
                        disabled={isReadOnly}
                        className="text-stone-300 hover:text-rose-500 transition-colors disabled:hidden"
                      >
                        <i className="fas fa-trash text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Deployment Map</h3>
            <div className="flex gap-4">
              {zones.map(z => (
                <div key={z.id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${z.color}`}></div>
                  <span className="text-[8px] font-black uppercase text-stone-500">{z.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {coverageInsight && !isOperator && (
              <div className="mb-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <i className="fas fa-wand-magic-sparkles text-amber-500 text-xs"></i>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900">AI Deployment Strategy</h4>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed italic">"{coverageInsight}"</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {zones.map(zone => {
                const zoneAssignments = assignments.filter(a => a.zoneId === zone.id);
                return (
                  <div key={zone.id} className="p-6 rounded-3xl border-2 border-stone-100 bg-stone-50/30">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-900">{zone.name}</h4>
                      <span className="text-[8px] font-black uppercase text-stone-400">
                        {zone.id === 'z_concierge' ? 'Front Desk / Hub' : `${zone.tables.length} Tables`}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {zoneAssignments.length > 0 ? (
                        zoneAssignments.map(a => {
                          const s = staff.find(staff => staff.id === a.staffId);
                          const isMe = s?.id === currentUserId;
                          return (
                            <div key={a.staffId} className={`flex flex-col p-4 rounded-2xl border transition-all ${isMe ? 'bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-500/20' : 'bg-white border-stone-100 shadow-sm'}`}>
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg ${zone.color} flex items-center justify-center text-white font-black text-[10px]`}>
                                    {s?.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-stone-900 flex items-center gap-2">
                                      {s?.name}
                                      {isMe && <span className="text-[7px] bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">You</span>}
                                    </p>
                                    <p className="text-[8px] font-black uppercase text-stone-400">{s?.role}</p>
                                  </div>
                                </div>
                                <span className="text-[7px] font-black uppercase text-stone-300">{a.priority}</span>
                              </div>
                              
                              {/* Tables in this Zone */}
                              <div className="pt-3 border-t border-stone-100">
                                <p className="text-[7px] font-black uppercase text-stone-400 tracking-widest mb-2">Assigned Tables</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {zone.tables.map(tableNum => {
                                    const table = tables.find(t => t.number === tableNum);
                                    const journey = journeys.find(j => j.tableNumber === tableNum && j.status === 'Seated');
                                    return (
                                      <div key={tableNum} className="p-2 bg-stone-50 rounded-lg border border-stone-100 flex flex-col gap-1">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] font-black text-stone-900">Table {tableNum}</span>
                                          <span className={`w-1.5 h-1.5 rounded-full ${table?.status === 'Occupied' ? 'bg-emerald-500' : 'bg-stone-300'}`}></span>
                                        </div>
                                        {journey ? (
                                          <p className="text-[8px] font-bold text-amber-600 truncate italic">
                                            <i className="fas fa-user text-[6px] mr-1"></i>
                                            {journey.profile.name}
                                          </p>
                                        ) : (
                                          <p className="text-[7px] font-medium text-stone-400 uppercase tracking-tighter">Available</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50">
                          <i className="fas fa-user-slash text-stone-200 text-xl mb-3"></i>
                          <p className="text-[9px] font-black uppercase text-stone-300 tracking-widest">Unstaffed Zone</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDeployment;
