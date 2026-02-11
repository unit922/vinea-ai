
import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface AuthViewProps {
  onSuccess: (session: any) => void;
  onAbort: () => void;
  initialMode?: 'login' | 'signup';
}

const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onAbort, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [establishmentName, setEstablishmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const restaurant = await authService.verifyEstablishment(establishmentName);
        if (!restaurant) {
          throw new Error(`Establishment "${establishmentName}" not found in our registries. Ensure the owner has initialized the facility first.`);
        }

        const res = await authService.signUp(email, password, fullName, restaurant.id);
        if (res.session) {
          onSuccess(res.session);
        } else {
          setError("Check your inbox: A verification link has been dispatched to establish your cloud identity.");
          setMode('login');
        }
      } else {
        const res = await authService.signIn(email, password);
        if (res.session) onSuccess(res.session);
      }
    } catch (err: any) {
      setError(err.message || "Authentication synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-stone-950 flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-amber-500/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-amber-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-stone-900 w-full max-w-md rounded-[3rem] p-10 border border-white/5 shadow-2xl relative z-10 space-y-10 animate-in zoom-in-95 duration-300">
         <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-amber-500 text-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-12">
               <i className="fas fa-shield-halved text-2xl"></i>
            </div>
            <h2 className="text-3xl font-serif font-bold text-white tracking-tight">{mode === 'login' ? 'Identity Verification' : 'Enlist in Facility'}</h2>
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em]">Security Node 4.1 Active</p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`p-4 border rounded-xl text-xs text-center font-medium ${error.includes('Check your inbox') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Assigned Establishment</label>
                  <input 
                    type="text" 
                    required
                    value={establishmentName}
                    onChange={e => setEstablishmentName(e.target.value)}
                    placeholder="Exact Name of Establishment"
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-stone-700"
                  />
                  <p className="text-[8px] text-stone-600 italic px-1 uppercase tracking-tighter">Facility must be registered in the Architect cloud silo.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Operational ID (Full Name)</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Jean-Luc S."
                    className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-stone-700"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Command Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ops@vinea.ai"
                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-stone-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Secure Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-amber-500 transition-all placeholder:text-stone-700"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-amber-500 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : mode === 'login' ? 'Establish Link' : 'Register Operator'}
            </button>
         </form>

         <div className="text-center space-y-4">
            <button 
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="text-[10px] font-black text-stone-500 uppercase tracking-widest hover:text-amber-500 transition-colors"
            >
              {mode === 'login' ? "Enlisting in a new team? Sign Up" : "Registered operator? Return to Login"}
            </button>
            
            <div className="pt-6 border-t border-white/5">
              <button onClick={onAbort} className="text-[9px] font-black text-stone-700 uppercase tracking-widest hover:text-stone-500 transition-colors">
                 Cancel Link & Return
              </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuthView;
