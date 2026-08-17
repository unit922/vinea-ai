
import React, { useState } from 'react';
import { StaffShift } from '../../lib/types';
import { Session } from '@supabase/supabase-js';
import { supabaseSync } from '../../services/supabaseSync';

interface SecuritySettingsProps {
  currentUserRole: StaffShift['role'];
  onUpdateRole: (role: StaffShift['role']) => void;
  authMode: 'demo' | 'secure';
  onUpdateAuthMode: (mode: 'demo' | 'secure') => void;
  onLogout: () => void;
  userSession?: Session | null;
  restaurantId?: string;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ 
  currentUserRole, 
  onUpdateRole, 
  authMode, 
  onUpdateAuthMode, 
  onLogout, 
  userSession,
  restaurantId
}) => {
  const isDemo = authMode === 'demo';
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffShift['role']>('Server');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const staffList: StaffShift[] = JSON.parse(localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('vinea_staff_list') || '[]');
  const activeNodes = staffList.filter(s => s.accessStatus === 'Active').length;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      setInviteStatus({ type: 'error', message: 'Establishment ID not found. Please complete setup.' });
      return;
    }
    if (isDemo) {
      setInviteStatus({ type: 'error', message: 'Cloud invitations are only available in Secure Mode.' });
      return;
    }

    setIsInviting(true);
    setInviteStatus(null);
    try {
      await supabaseSync.addToRoster(restaurantId, inviteEmail, inviteRole);
      
      // Fetch restaurant name to include in invitation relay
      const profile = await supabaseSync.getRestaurantProfile(restaurantId);
      const restaurantName = profile?.name || 'Vinetelligence establishment';
      
      // Dispatch Invitation Email/OTP
      await supabaseSync.sendInviteEmail(inviteEmail, restaurantName, inviteRole);

      setInviteStatus({ 
        type: 'success', 
        message: `Node Authorized: ${inviteEmail} is now cleared for signup as ${inviteRole}. A verification link has been dispatched.` 
      });
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      console.error("Vinetelligence: Invite failed", error);
      const message = error instanceof Error ? error.message : 'Failed to send invitation.';
      setInviteStatus({ type: 'error', message });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
       {/* Team Security Summary */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-white/5">
             <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-shield-halved text-7xl"></i></div>
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500 mb-4 italic">Security Summary</p>
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-4xl font-serif font-black italic">{activeNodes}</p>
                   <p className="text-[10px] text-stone-500 uppercase font-black">Authorized Nodes</p>
                </div>
                <div className="text-right">
                   <p className="text-xl font-bold text-stone-300">{staffList.length - activeNodes}</p>
                   <p className="text-[8px] text-stone-600 uppercase font-black">Revoked / Pending</p>
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col justify-between group hover:border-amber-500 transition-all cursor-pointer">
             <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 mb-2 italic">Roster Command</p>
                <p className="text-sm font-bold text-stone-800 leading-relaxed italic">"Access the central registry to assign technical roles and manage node clearances."</p>
             </div>
             <div className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase tracking-widest mt-4">
                Manage All Nodes <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
             </div>
          </div>
       </div>

       <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">My Personal Protocol</h3>
            <div className="flex gap-3">
               <button 
                  onClick={() => onUpdateAuthMode(isDemo ? 'secure' : 'demo')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isDemo ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}`}
               >
                 {!isDemo ? 'Cloud Auth Enforced' : 'Demo Mode (No Auth)'}
               </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {(['Manager', 'Sommelier', 'Mixologist', 'Server'] as const).map(role => (
              <button
                key={role}
                onClick={() => onUpdateRole(role)}
                className={`px-6 py-6 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-3 ${
                  currentUserRole === role 
                    ? 'bg-stone-900 border-stone-900 text-white shadow-xl' 
                    : 'bg-stone-50 border-stone-100 text-stone-500 hover:bg-stone-100'
                }`}
              >
                <i className={`fas ${
                  role === 'Manager' ? 'fa-user-tie' :
                  role === 'Sommelier' ? 'fa-wine-glass-alt' :
                  role === 'Mixologist' ? 'fa-cocktail' : 'fa-concierge-bell'
                } text-lg`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{role}</span>
              </button>
            ))}
          </div>
       </div>

       <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Active Session Management</h3>
          <div className="space-y-4">
             {userSession ? (
                <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                        {userSession.user.user_metadata?.full_name?.[0] || userSession.user.email?.[0].toUpperCase()}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-stone-900">{userSession.user.user_metadata?.full_name || 'Verified Operator'}</p>
                        <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest">{userSession.user.email}</p>
                        <p className="text-[8px] text-emerald-600 font-bold uppercase mt-1">Status: Logged into Cloud Silo</p>
                     </div>
                  </div>
                  <button onClick={onLogout} className="px-6 py-3 bg-white text-red-600 border border-red-100 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all">Terminate Session</button>
                </div>
             ) : (
                <div className="bg-stone-50 p-10 rounded-3xl border-2 border-dashed border-stone-200 flex flex-col items-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-400">
                      <i className="fas fa-user-slash"></i>
                   </div>
                   <div>
                      <p className="text-stone-900 font-bold">No Active Cloud Session</p>
                      <p className="text-[10px] text-stone-400 uppercase font-black">Demo Mode Only</p>
                   </div>
                   {!isDemo && (
                     <button onClick={() => window.location.reload()} className="px-6 py-2 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Sign In to Continue</button>
                   )}
                </div>
             )}

              {inviteStatus && (
                <div className={`mb-4 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  inviteStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {inviteStatus.message}
                </div>
              )}

              {showInviteForm ? (
                <form onSubmit={handleInvite} className="p-6 bg-stone-50 rounded-2xl space-y-4 border border-stone-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="staff@establishment.com"
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Role Assignment</label>
                    <select 
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as StaffShift['role'])}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5"
                    >
                      <option value="Server">Server</option>
                      <option value="Mixologist">Mixologist</option>
                      <option value="Sommelier">Sommelier</option>
                      <option value="Manager">Manager</option>
                      <option value="Investor">Investor</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="submit"
                      disabled={isInviting}
                      className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50"
                    >
                      {isInviting ? 'Sending...' : 'Send Invite'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className="px-6 py-3 bg-stone-200 text-stone-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-center py-8 border-2 border-dashed border-stone-100 rounded-2xl">
                   <button 
                    onClick={() => setShowInviteForm(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                   >
                     <i className="fas fa-plus-circle mr-2"></i> Add Managed User (Invite)
                   </button>
                </div>
              )}
          </div>
       </div>
    </div>
  );
};

export default SecuritySettings;
