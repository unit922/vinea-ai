import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { supabaseSync, getSupabaseConfig } from '../services/supabaseSync';

interface AuthViewProps {
  onSuccess: (session: { user: { id: string; email?: string | null; user_metadata?: { role?: string; full_name?: string; restaurant_id?: string } } }) => void;
  onAbort: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onAbort, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=150&h=150&q=80'); // Default professional avatar
  const [establishmentName, setEstablishmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConnectivityError, setHasConnectivityError] = useState(false);

  const AVATARS = [
    { id: '1', url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=150&h=150&q=80', label: 'Clinical' },
    { id: '2', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80', label: 'Tactical' },
    { id: '3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', label: 'Executive' },
    { id: '4', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80', label: 'Technical' },
    { id: '5', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', label: 'Analytical' },
  ];

  const handleResetConfig = () => {
    supabaseSync.saveSupabaseConfig('', ''); // Clear manual config
    const stored = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.supabaseUrl) delete p.supabaseUrl;
        if (p.supabaseAnonKey) delete p.supabaseAnonKey;
        localStorage.setItem('vinetelligence_profile', JSON.stringify(p));
        localStorage.setItem('vinea_profile', JSON.stringify(p));
      } catch {
        localStorage.removeItem('vinetelligence_profile');
        localStorage.removeItem('vinea_profile');
      }
    }
    window.location.reload();
  };

  useEffect(() => {
    setMode(initialMode);
    
    // Pre-fill establishment name and email if it's in localStorage (from onboarding)
    const storedProfile = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
    if (storedProfile) {
      try {
        const p = JSON.parse(storedProfile);
        if (p.allowGoogleAuth !== undefined) {
          setGoogleAuthEnabled(!!p.allowGoogleAuth);
        }
        if (p.name && p.edition !== 'demo') {
          setEstablishmentName(p.name.trim());
        }
        if (p.ownerEmail && initialMode === 'signup') {
          setEmail(p.ownerEmail);
        }
      } catch (err) {
        console.error("Vinetelligence: Profile parse failed", err);
      }
    }
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const emailLower = email.toLowerCase().trim();
      const parts = emailLower.split('@');
      if (parts.length === 2) {
        const domain = parts[1];
        if (domain.endsWith('.live') && domain !== 'vinea.live') {
          throw new Error("Access Denied: Only users with the exact @vinea.live domain are permitted developer access. Other .live extensions are strictly prohibited.");
        }
      }
      if (mode === 'otp') {
        if (!email) {
          throw new Error("Please enter your email address.");
        }
        await authService.signInWithOtp(email);
        setError("Check your inbox: A secure login link has been dispatched to establish your identity instantly without a password.");
        return;
      }

      if (mode === 'reset') {
        if (!email) {
          throw new Error("Please enter your email; a recovery path will be dispatched.");
        }
        await authService.resetPassword(email);
        setError("Password recovery link has been dispatched to your email. Check your inbox to set your new password.");
        return;
      }

      if (mode === 'signup') {
        const isVineaDev = email.toLowerCase().endsWith('@vinea.live');
        
        // If they are registering a new establishment from onboarding, they should be Owner
        // We can check if the establishmentName or ownerEmail matches what's in localStorage
        const storedProfile = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
        const p = storedProfile ? JSON.parse(storedProfile) : null;
        const isInitialOwner = p && (
          (p.name && establishmentName && p.name.trim().toLowerCase() === establishmentName.trim().toLowerCase()) ||
          (p.ownerEmail && email && p.ownerEmail.trim().toLowerCase() === email.trim().toLowerCase())
        );

        const trimmedName = establishmentName.trim();
        console.log("Vinetelligence: AuthView submitting signup", { 
          email, 
          establishmentName, 
          trimmedName,
          isInitialOwner,
          localId: p?.id
        });

        let restaurant = await authService.verifyEstablishment(trimmedName);
        console.log("Vinetelligence: AuthView verifyEstablishment result", restaurant);
        if (restaurant && restaurant.allow_google_auth !== undefined) {
          setGoogleAuthEnabled(!!restaurant.allow_google_auth);
        }

        let assignedRole = 'Server';
        if (isVineaDev) assignedRole = 'Developer';
        else if (isInitialOwner) assignedRole = 'Owner';

        // Fallback 1: Try to find establishment by user's email in roster
        if (!restaurant && !isVineaDev) {
          console.log("Vinetelligence: Establishment not found by name, trying email lookup in roster...");
          const rosterEntry = await supabaseSync.findRosterEntry(email);
          if (rosterEntry && rosterEntry.restaurants) {
            console.log("Vinetelligence: Found establishment via roster lookup", rosterEntry.restaurants);
            restaurant = rosterEntry.restaurants;
            // Also store the role from roster for immediate use
            if (rosterEntry.role) {
              assignedRole = rosterEntry.role;
            }
            setEstablishmentName(restaurant.name);
          }
        }

        // Fallback 2: If we can't find it by name but we have a local ID from onboarding, trust it
        // BUT only if it's a valid UUID (not 'demo-id')
        if (!restaurant && isInitialOwner && p?.id && p.id !== 'demo-id') {
          console.log("Vinetelligence: Establishment not found by name lookup, but using local ID from onboarding session", p.id);
          restaurant = { id: p.id, name: p.name };
        }

        if (!restaurant && !isVineaDev) {
          console.error("Vinetelligence: Establishment verification failed in AuthView", trimmedName);
          const errorMsg = p?.id === 'demo-id' 
            ? `Establishment "${trimmedName}" registration was not completed. Please return to onboarding.`
            : `Establishment "${trimmedName}" (or your email node) was not found in our registries. Ensure the owner has authorized your node in the Roster Command.`;
          throw new Error(errorMsg);
        }

        const rid = restaurant ? restaurant.id : '00000000-0000-0000-0000-000000000000'; 
        
        // Re-verify roster role if we found them via roster fallback earlier
        const finalRosterEntry = await supabaseSync.findRosterEntry(email);
        if (finalRosterEntry && finalRosterEntry.role) {
          assignedRole = finalRosterEntry.role;
        }

        const res = await authService.signUp(
          email, 
          password, 
          fullName, 
          rid, 
          assignedRole,
          avatarUrl
        );

        if (res.session) {
          await onSuccess(res.session);
        } else {
          setError("Check your inbox: A verification link has been dispatched to establish your cloud identity.");
          setMode('login');
        }
      } else {
        const res = await authService.signIn(email, password);
        if (res.session) {
          // If we have a newly registered establishment in localStorage from onboarding,
          // ensure the user is linked to it if they are logging in with an existing account.
          const storedProfile = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
          let linkedToNew = false;
          
          if (storedProfile) {
            try {
              const p = JSON.parse(storedProfile);
              if (p.id && p.id !== 'demo-id') {
                const currentRid = res.session.user.user_metadata?.restaurant_id;
                if (currentRid !== p.id) {
                   console.log("Vinetelligence: User logged in but session restaurant mismatch. Linking to newly registered [", p.name, "]");
                   try {
                     await authService.linkToEstablishment(p.id, email);
                     // Update session object before passing to onSuccess
                     res.session.user.user_metadata = {
                       ...res.session.user.user_metadata,
                       restaurant_id: p.id
                     };
                     linkedToNew = true;
                   } catch (linkErr) {
                     console.warn("Vinetelligence: Auto-linking to new establishment failed", linkErr);
                   }
                } else {
                  linkedToNew = true;
                }
              }
            } catch (pErr) {
              console.error("Vinetelligence: Profile parse error during linking", pErr);
            }
          }
          
          // Fallback/Automated check: If the user was already setup in an establishment by an admin
          // (i.e., they have a roster entry but have no restaurant_id set or need it linked),
          // search the roster and auto-link them.
          if (!linkedToNew) {
            try {
              const rosterEntry = await supabaseSync.findRosterEntry(email);
              if (rosterEntry && rosterEntry.restaurant_id) {
                const currentRid = res.session.user.user_metadata?.restaurant_id;
                if (currentRid !== rosterEntry.restaurant_id) {
                  console.log("Vinetelligence: Found authorized roster entry for user upon login. Auto-linking to establishment", rosterEntry.restaurant_id);
                  try {
                    await authService.linkToEstablishment(rosterEntry.restaurant_id, email);
                    res.session.user.user_metadata = {
                      ...res.session.user.user_metadata,
                      restaurant_id: rosterEntry.restaurant_id,
                      role: rosterEntry.role || 'Server'
                    };
                  } catch (linkErr) {
                    console.warn("Vinetelligence: Auto-linking to roster establishment failed", linkErr);
                  }
                } else if (rosterEntry.status !== 'Registered') {
                  await supabaseSync.updateRosterStatus(rosterEntry.restaurant_id, email, 'Registered');
                }
              }
            } catch (rosterErr) {
              console.error("Vinetelligence: Roster check during signIn failed", rosterErr);
            }
          }
          
          await onSuccess(res.session);
        }
      }
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : "Authentication synchronization failed.";
      
      if (message === 'USER_ALREADY_REGISTERED') {
        message = "This email is already registered in the system (possibly pre-authorized on the roster by an Administrator). Since you already exist, please log in. If you do not have a password yet, please select 'Login via One-Time Link' below to set up your password or enter instantly.";
        setMode('login');
      } else if (message.includes('Failed to fetch') || message.includes('ERR_NAME_NOT_RESOLVED') || message.includes('Connectivity Error')) {
        const config = getSupabaseConfig();
        const activeUrl = config?.url || 'Unknown Endpoint';
        message = `Connectivity Error: The Cloud Silo at [${activeUrl}] is unreachable.

This happens if:
1. The URL is incorrect (check for typos).
2. The endpoint does not use HTTPS (required for vinetelligence.live).
3. The domain 'vinetelligence.live' is not added to your Supabase 'Site URL' or 'Allowed Redirects'.

Please check your console (F12) for detailed Network logs.`;
        setHasConnectivityError(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const [showSystemSetup, setShowSystemSetup] = useState(false);
  const [setupUrl, setSetupUrl] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string, detail?: string} | null>(null);

  const testConnection = async (url: string, key: string) => {
    if (!url || !key) return;
    setTestingSupabase(true);
    setTestResult(null);
    try {
      const cleanUrl = url.trim().replace(/\/$/, "");
      
      // Perform a GET request to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn("Vinetelligence: Connection test timed out after 10s");
      }, 10000);
      
      const res = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'GET',
        headers: { 
          'apikey': key.trim(),
          'Authorization': `Bearer ${key.trim()}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // 401/400/404 are actually "Success" in terms of DNS/CORS - it means we hit the server!
      if (res.ok || res.status === 401 || res.status === 400 || res.status === 404) {
        setTestResult({ success: true, message: 'Cloud Silo Reachable!' });
      } else {
        setTestResult({ success: false, message: `Reached API but got status ${res.status}` });
      }
    } catch (err: unknown) {
      const error = err as { message?: string, name?: string };
      console.error("Vinetelligence: Connection Test Failure", error);
      
      let detail = error.message || 'Unknown Host Exception';
      
      if (error.name === 'AbortError') {
        detail = "The connection timed out (10s). The server is too slow or blocked.";
      } else if (detail.toLowerCase().includes('failed to fetch')) {
        detail = "DNS Resolution Failed. This domain [zbxbgqxuanumusgywmoq.supabase.co] does not seem to exist or is being blocked by your network/ad-blocker.";
      }
      
      setTestResult({ 
        success: false, 
        message: 'Connectivity Failure',
        detail: detail
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSystemSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupUrl && setupKey) {
      supabaseSync.saveSupabaseConfig(setupUrl, setupKey);
      setShowSystemSetup(false);
      window.location.reload(); // Reload to re-initialize Supabase client
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-stone-950 flex items-center justify-center p-6 animate-in fade-in duration-500">
      {showSystemSetup && (
        <div className="fixed inset-0 z-[400] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-stone-900 w-full max-w-md rounded-[3rem] p-10 border border-indigo-500/20 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <i className="fas fa-network-wired text-2xl"></i>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Cloud Silo Initialization</h2>
              <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Manual Environment Override</p>
            </div>

            <form onSubmit={handleSystemSetup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Supabase Project URL</label>
                <input 
                  type="text" 
                  required
                  value={setupUrl}
                  onChange={e => setSetupUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Anon API Key</label>
                <input 
                  type="password" 
                  required
                  value={setupKey}
                  onChange={e => setSetupKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  type="button"
                  disabled={testingSupabase || !setupUrl || !setupKey}
                  onClick={() => testConnection(setupUrl, setupKey)}
                  className="w-full py-4 bg-stone-800 text-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-700 transition-all border border-indigo-500/20 disabled:opacity-50"
                >
                  {testingSupabase ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-plug mr-2"></i>}
                  Test Connectivity
                </button>

                {testResult && (
                  <div className={`p-4 rounded-xl border text-[10px] space-y-2 ${testResult.success ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <div className="font-black uppercase tracking-widest flex items-center gap-2">
                       {testResult.success ? <i className="fas fa-check-circle"></i> : <i className="fas fa-times-circle"></i>}
                       {testResult.message}
                    </div>
                    {testResult.detail && (
                      <p className="text-stone-400 font-medium lowercase tracking-tight">
                        {testResult.detail}
                      </p>
                    )}
                    {!testResult.success && (
                      <div className="pt-2 border-t border-red-500/10 mt-2">
                        <p className="text-[8px] opacity-70 mb-2">Troubleshooting Steps:</p>
                        <ul className="list-disc list-inside text-[8px] opacity-70 space-y-1">
                          <li>Check for invisible spaces in the URL</li>
                          <li>Ensure the URL starts with https://</li>
                          <li>Verify project is not Paused in Supabase Dashboard</li>
                          <li>If using a Custom Domain, ensure DNS has propagated</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={testingSupabase}
                  className="w-full py-5 bg-indigo-500 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl"
                >
                  Establish Connection
                </button>
                <button 
                  type="button"
                  onClick={() => setShowSystemSetup(false)}
                  className="w-full py-4 bg-stone-800 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-700 transition-all"
                >
                  Cancel Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-indigo-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-stone-900 w-full max-w-md rounded-[3rem] p-10 border border-white/5 shadow-2xl relative z-10 space-y-10 animate-in zoom-in-95 duration-300">
         <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-indigo-500 text-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-12">
               <i className="fas fa-shield-halved text-2xl"></i>
            </div>
            <h2 className="text-3xl font-serif font-bold text-white tracking-tight">
              {mode === 'login' ? 'Identity Verification' : 
               mode === 'otp' ? 'One-Time Access Link' :
               mode === 'reset' ? 'Password Recovery' : 'Enlist in Facility'}
            </h2>
            {mode === 'signup' && establishmentName && (
              <p className="text-indigo-500/80 text-[11px] font-serif italic">Finalizing administrative credentials for {establishmentName}</p>
            )}
            <div className="flex flex-col items-center gap-1">
              <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em]">Security Node 3.1.0 Active</p>
              {(() => {
                 try {
                   const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
                   const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || 
                                  (typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) : undefined);
                   const url = envUrl || profile.supabaseUrl;
                   if (!url) return <span className="text-indigo-500 text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Local Demo Mode</span>;
                   return null;
                 } catch { return null; }
              })()}
            </div>
         </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`p-4 border rounded-xl text-xs text-center font-medium space-y-3 ${error.includes('Check your inbox') ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <p>{error}</p>
                {error.includes("Cloud Silo") && (
                  <div className="space-y-3">
                    <div className="pt-2 border-t border-red-500/20 text-[10px] opacity-70">
                      Try Demo Admin: <span className="font-mono text-white">admin@vinetelligence.live</span> / <span className="font-mono text-white">admin123</span>
                    </div>
                    {hasConnectivityError && (
                      <button 
                        type="button"
                        onClick={() => setShowSystemSetup(true)}
                        className="w-full py-3 bg-indigo-500 text-stone-900 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg"
                      >
                        Update Cloud Silo Configuration
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={handleResetConfig}
                      className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-500/30 transition-all border border-red-500/20"
                    >
                      Clear All & Reset to Default
                    </button>
                  </div>
                )}
              </div>
            )}

            {googleAuthEnabled && (
              <button 
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await authService.signInWithGoogle();
                    if (res?.session) await onSuccess(res.session);
                  } catch (err: unknown) {
                    const error = err as Error;
                    setError(error.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-4 bg-stone-950 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-stone-950 transition-all flex items-center justify-center gap-3 shadow-2xl group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <i className="fab fa-google text-lg"></i>
                <span className="relative z-10">Continue via Google Node</span>
              </button>
            )}

            {googleAuthEnabled && (
              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[8px] font-black text-stone-600 uppercase tracking-widest">OR</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Assigned Establishment</label>
                  <input 
                    type="text" 
                    required={!email.toLowerCase().endsWith('@vinea.live')}
                    value={establishmentName}
                    onChange={e => setEstablishmentName(e.target.value)}
                    placeholder="Exact Name of Establishment"
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700"
                  />
                  <p className="text-[8px] text-stone-600 italic px-1 uppercase tracking-tighter">Facility must be registered in the Architect cloud silo.</p>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Identity Synthesis (Avatar)</label>
                  <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarUrl(av.url)}
                        className={`relative group shrink-0 transition-all duration-300 ${avatarUrl === av.url ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                      >
                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${avatarUrl === av.url ? 'border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'border-transparent'}`}>
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </div>
                        <span className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-[6px] font-black uppercase tracking-tighter transition-all ${avatarUrl === av.url ? 'text-indigo-500' : 'text-transparent'}`}>
                          {av.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Operational ID (Full Name)</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Jean-Luc S."
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Command Email</label>
                {email.toLowerCase().endsWith('@vinea.live') && (
                  <span className="text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/20 animate-pulse">Developer Node</span>
                )}
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ops@vinea.live"
                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700"
              />
            </div>

            {(mode === 'login' || mode === 'signup') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Secure Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-700"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-indigo-500 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : (
                mode === 'login' ? 'Establish Link' : (
                  mode === 'otp' ? 'Send Login Link' : (
                    mode === 'reset' ? 'Send Recovery Link' : (
                      email.toLowerCase().endsWith('@vinea.live') ? 'Initialize Dev Node' : 'Register Operator'
                    )
                  )
                )
              )}
            </button>
            <div className="text-center space-y-4">
              <div className="flex flex-col gap-3">
                {mode === 'login' && (
                  <>
                    <button 
                      type="button"
                      onClick={() => { setMode('otp'); setError(null); }}
                      className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                    >
                      Login via One-Time Link (No Password)
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setMode('reset'); setError(null); }}
                      className="text-[10px] font-black text-stone-500 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                    >
                      Forgot Password / Set Password
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setMode('signup'); setError(null); }}
                      className="text-[10px] font-black text-stone-500 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                    >
                      Enlisting in a new team? Sign Up
                    </button>
                  </>
                )}
                
                {(mode === 'otp' || mode === 'reset') && (
                  <button 
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                  >
                    Return to Password Login
                  </button>
                )}

                {mode === 'signup' && (
                  <button 
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="text-[10px] font-black text-stone-500 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                  >
                    Registered operator? Return to Login
                  </button>
                )}
              </div>
              
              <div className="pt-6 border-t border-white/5 space-y-4">
                <button onClick={onAbort} className="text-[9px] font-black text-stone-700 uppercase tracking-widest hover:text-stone-500 transition-colors">
                   Cancel Link & Return
                </button>
                
                <div className="pt-2 flex flex-col items-center gap-1 opacity-30 hover:opacity-100 transition-opacity">
                  <p className="text-[7px] font-black text-stone-600 uppercase tracking-[0.3em]">Cloud Silo Node</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[8px] font-mono text-stone-500">
                      {(() => {
                        try {
                          const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
                          const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || 
                                         (typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) : undefined);
                          const url = envUrl || profile.supabaseUrl;
                          if (!url) return "Not Configured";
                          const u = new URL(url);
                          return `${u.hostname.split('.')[0]}.***.supabase.co`;
                        } catch { return "Local Demo Active"; }
                      })()}
                    </p>
                    <button 
                      onClick={() => setShowSystemSetup(true)}
                      className="text-[8px] text-indigo-500 hover:underline font-black uppercase tracking-widest"
                    >
                      [Setup]
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
  );
};

export default AuthView;
