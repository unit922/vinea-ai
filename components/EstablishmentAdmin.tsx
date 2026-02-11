
import React, { useState, useEffect, useMemo } from 'react';
import { StaffShift, Invoice, PlanTier, PaymentMethod, BillingCycle } from '../types';
import { INITIAL_SHIFTS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { paymentService, PAYMENT_PLANS } from '../services/paymentService';

const billingData = [
  { month: 'Oct', api: 120, user: 199, storage: 45 },
  { month: 'Nov', api: 140, user: 199, storage: 48 },
  { month: 'Dec', api: 210, user: 249, storage: 60 },
  { month: 'Jan', api: 190, user: 249, storage: 65 },
  { month: 'Feb', api: 240, user: 249, storage: 70 },
  { month: 'Mar', api: 280, user: 249, storage: 85 },
];

const EstablishmentAdmin: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('vinea_staff_list');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS.map(s => ({ ...s, email: `${s.name.toLowerCase().replace(' ', '')}@venue.com`, accessStatus: 'Active' }));
  });

  const [activeTab, setActiveTab] = useState<'roster' | 'billing' | 'dev'>('roster');
  const [showDevLab, setShowDevLab] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(() => localStorage.getItem('vinea_investor_key'));
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [showCheckoutModal, setShowCheckoutModal] = useState<PlanTier | null>(null);

  const [establishment, setEstablishment] = useState(() => {
    const profile = localStorage.getItem('vinea_profile');
    return profile ? JSON.parse(profile) : { name: 'Vinea Venue', edition: 'paid' };
  });

  const isDemo = establishment.edition === 'demo';

  useEffect(() => {
    paymentService.getInvoices().then(setInvoices);
  }, []);

  const userLimit = useMemo(() => {
    if (establishment.edition === 'enterprise') return 999;
    if (establishment.edition === 'paid') return 10;
    return 5;
  }, [establishment.edition]);

  const currentPlan = useMemo(() => paymentService.getCurrentPlan(establishment.edition), [establishment.edition]);

  const usageData = {
    apiTokens: { current: 7850, limit: currentPlan.tokens },
    visionUnits: { current: 32, limit: currentPlan.visionAudits },
    storage: { current: 3.4, limit: 5.0 }
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffShift['role']>('Server');

  useEffect(() => {
    localStorage.setItem('vinea_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffList.length >= userLimit) {
      alert(`Authorization limit reached for "${establishment.edition}" tier.`);
      return;
    }
    const newUser: StaffShift = {
      id: `st-${Date.now()}`,
      name: inviteEmail.split('@')[0] || 'Unknown',
      email: inviteEmail,
      role: inviteRole,
      startTime: '17:00',
      endTime: '23:00',
      performanceScore: 0,
      accessStatus: 'Pending',
    };
    setStaffList([...staffList, newUser]);
    setInviteEmail('');
  };

  const handleCommitPayment = async (plan: PlanTier, method: PaymentMethod) => {
    setIsProcessingPayment(true);
    setShowCheckoutModal(null);
    
    const success = await paymentService.initiateGatewayCheckout(plan.id, method, billingCycle);
    
    if (success) {
      const updatedProfile = { ...establishment, edition: plan.id };
      setEstablishment(updatedProfile);
      localStorage.setItem('vinea_profile', JSON.stringify(updatedProfile));
      // Refresh invoices
      const newInvoices = await paymentService.getInvoices();
      setInvoices(newInvoices);
      alert(`Subscription protocol updated. ${plan.name} is now active via ${method}.`);
    }
    
    setIsProcessingPayment(false);
  };

  const generateInvestorKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'VNEA-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += '-2025';
    setGeneratedKey(result);
    localStorage.setItem('vinea_investor_key', result);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden animate-in fade-in duration-500">
      {/* Universal Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[700] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-stone-200">
            <div className="p-10 bg-stone-900 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><i className="fas fa-credit-card text-9xl"></i></div>
               <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Payment Hub</span>
                  <h3 className="text-3xl font-serif font-bold italic tracking-tight mt-2">Initialize {showCheckoutModal.name}</h3>
               </div>
               <button onClick={() => setShowCheckoutModal(null)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 active:scale-90 border border-white/5 shadow-xl"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-12 space-y-10">
               <div className="flex justify-between items-end border-b border-stone-100 pb-6">
                  <div>
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Selected Silo Capability</p>
                     <p className="text-2xl font-bold text-stone-900">{showCheckoutModal.name}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Due ({billingCycle})</p>
                     <p className="text-3xl font-black text-amber-600">${paymentService.calculatePrice(showCheckoutModal.price, billingCycle)}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] mb-4 text-center">Select Authorized Gateway</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {[
                       { id: 'Stripe', icon: 'fa-stripe', color: 'text-blue-500', label: 'Credit Card' },
                       { id: 'PayPal', icon: 'fa-paypal', color: 'text-blue-400', label: 'PayPal' },
                       { id: 'Paddle', icon: 'fa-box', color: 'text-emerald-500', label: 'Paddle' },
                       { id: 'Credit Card', icon: 'fa-credit-card', color: 'text-stone-700', label: 'Direct Card' },
                       { id: 'Bank', icon: 'fa-building-columns', color: 'text-stone-500', label: 'Bank Transfer' },
                       { id: 'Apple Pay', icon: 'fa-apple-pay', color: 'text-black', label: 'Apple Pay' }
                     ].map((gateway) => (
                       <button 
                         key={gateway.id}
                         onClick={() => handleCommitPayment(showCheckoutModal, gateway.id as PaymentMethod)}
                         className="p-6 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-amber-500 hover:bg-white transition-all group active:scale-95 shadow-sm"
                       >
                          <i className={`fab ${gateway.icon.includes('fab') ? gateway.icon : 'fas ' + gateway.icon} text-2xl ${gateway.color} group-hover:scale-110 transition-transform`}></i>
                          <span className="text-[9px] font-black uppercase text-stone-600 group-hover:text-stone-900">{gateway.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <p className="text-[9px] text-stone-400 text-center italic leading-relaxed">
                  "Your payment is secured via 256-bit AES encryption. Network authorization occurs immediately upon verification."
               </p>
            </div>
          </div>
        </div>
      )}

      {isProcessingPayment && (
        <div className="fixed inset-0 z-[800] bg-stone-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
           <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-6"></div>
           <h3 className="text-2xl font-serif font-black text-white italic tracking-tight">Gateway Redirect Active</h3>
           <p className="text-stone-400 mt-2 uppercase font-black text-[9px] tracking-[0.4em]">Establishing Secure Token Handshake...</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 shrink-0 gap-4">
         <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">{establishment.name} Admin</h2>
               {isDemo && (
                 <button 
                  onClick={() => setShowDevLab(!showDevLab)}
                  className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 hover:text-amber-500 transition-colors"
                  title="Dev Portal Hidden Access"
                 >
                   <i className="fas fa-microchip text-[9px]"></i>
                 </button>
               )}
            </div>
            <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Module 1: Facility Control Node</p>
         </div>
         <div className="flex gap-1 p-1 bg-stone-100 rounded-xl shadow-inner shrink-0 overflow-x-auto max-w-full">
            <button onClick={() => setActiveTab('roster')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'roster' ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>Staff Registry</button>
            <button onClick={() => setActiveTab('billing')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'billing' ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>Billing & SaaS</button>
            {showDevLab && (
              <button onClick={() => setActiveTab('dev')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-amber-500/20 whitespace-nowrap ${activeTab === 'dev' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'bg-amber-50 text-amber-600'}`}>Developer Lab</button>
            )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10 min-h-0">
        {activeTab === 'roster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Authorized Personnel</h3>
                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">{staffList.length} / {userLimit} Nodes</span>
              </div>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-white border-b border-stone-100">
                    <tr className="text-[8px] font-black uppercase text-stone-400 tracking-widest">
                      <th className="px-6 py-4">Node Identity</th>
                      <th className="px-6 py-4">Silo Role</th>
                      <th className="px-6 py-4">Sync State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {staffList.map(s => (
                      <tr key={s.id} className="hover:bg-stone-50 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-500 flex items-center justify-center font-black text-[10px] shadow-sm">{s.name[0]}</div>
                             <div className="truncate max-w-[200px]">
                                <p className="text-xs font-bold text-stone-800 truncate">{s.name}</p>
                                <p className="text-[8px] text-stone-400 font-mono tracking-tighter truncate">{s.email}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[8px] font-black uppercase text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">{s.role}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${s.accessStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {s.accessStatus}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-id-card-clip text-6xl"></i></div>
                  <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6 italic">Authorize Node</h4>
                  <form onSubmit={handleInvite} className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[7px] font-black uppercase text-stone-500 ml-1">Secure Email Relay</label>
                        <input 
                          type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                          placeholder="ops@vinea.ai" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-stone-700"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[7px] font-black uppercase text-stone-500 ml-1">Silo Authorization Level</label>
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all font-bold appearance-none">
                           <option value="Server">Floor Ops (Server)</option>
                           <option value="Sommelier">Technical Scholar (Sommelier)</option>
                           <option value="Mixologist">Chemistry Architect (Mixologist)</option>
                        </select>
                     </div>
                     <button type="submit" className="w-full py-4 bg-amber-500 text-stone-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl active:scale-95 mt-2">Dispatch Activation</button>
                  </form>
               </div>
               <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-center">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600 border border-amber-500/20 shrink-0">
                     <i className="fas fa-shield-halved text-xs"></i>
                  </div>
                  <p className="text-[8px] text-amber-800 font-bold leading-relaxed italic">
                     "Vinea nodes are authorized via encrypted handshake. Verification must complete within 24 hours."
                  </p>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-right-4 duration-500 items-start">
             <div className="lg:col-span-8 space-y-6">
                <div className="flex justify-center mb-6">
                   <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 shadow-inner border border-stone-200">
                      <button 
                        onClick={() => setBillingCycle('Monthly')}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'Monthly' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                         Monthly
                      </button>
                      <button 
                        onClick={() => setBillingCycle('Annual')}
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'Annual' ? 'bg-amber-500 text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                         Annual <span className="bg-stone-900/10 px-1.5 py-0.5 rounded text-[8px]">Save 20%</span>
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   {PAYMENT_PLANS.map(plan => {
                     const isCurrent = establishment.edition === plan.id;
                     const displayPrice = paymentService.calculatePrice(plan.price, billingCycle);
                     return (
                      <div key={plan.id} className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between h-full ${isCurrent ? 'border-amber-500 shadow-2xl ring-4 ring-amber-500/5' : 'border-stone-100 hover:border-stone-200 hover:shadow-xl'}`}>
                          <div>
                            <div className="flex justify-between items-start mb-6">
                               <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${plan.id === 'paid' ? 'bg-amber-100 text-amber-700' : plan.id === 'enterprise' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>{isCurrent ? 'Active' : plan.id}</span>
                               <div className="text-right">
                                  <p className="text-2xl font-black font-serif text-stone-900">${displayPrice}</p>
                                  <p className="text-[8px] text-stone-400 font-black uppercase tracking-widest">per {billingCycle === 'Monthly' ? 'month' : 'year'}</p>
                               </div>
                            </div>
                            <h4 className="font-black text-sm text-stone-900 mb-4 uppercase tracking-tighter">{plan.name}</h4>
                            <div className="space-y-3 mb-10">
                               {plan.features.map((f, i) => (
                                 <div key={i} className="flex items-start gap-2.5 text-[9px] text-stone-500 font-bold leading-tight">
                                    <i className="fas fa-check text-amber-500 mt-0.5"></i>
                                    <span>{f}</span>
                                 </div>
                               ))}
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowCheckoutModal(plan)}
                            disabled={isCurrent}
                            className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isCurrent ? 'bg-stone-50 text-stone-300 border border-stone-100' : 'bg-stone-900 text-white hover:bg-amber-500 hover:text-stone-900'}`}
                          >
                             {isCurrent ? 'Operational Tier Active' : `Initialize Upgrade`}
                          </button>
                       </div>
                     );
                   })}
                </div>

                <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden p-6 md:p-10">
                   <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                      <div>
                         <h3 className="text-2xl font-serif font-bold text-stone-900 italic">Resource Consumption</h3>
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] mt-1">Monthly allocation telemetrics</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-stone-900"></div><span className="text-[9px] font-black text-stone-500 uppercase">Users</span></div>
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[9px] font-black text-stone-500 uppercase">API Tokens</span></div>
                         <button className="flex items-center gap-3 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">
                            Stripe Portal <i className="fas fa-external-link-alt text-amber-500"></i>
                         </button>
                      </div>
                   </div>
                   <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={billingData}>
                            <defs>
                               <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                            <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                            <Area type="monotone" dataKey="api" stroke="#fbbf24" strokeWidth={4} fillOpacity={1} fill="url(#colorApi)" />
                            <Area type="monotone" dataKey="user" stroke="#0c0a09" strokeWidth={3} fillOpacity={0} />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden max-w-full">
                   <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 italic">Ledger History</h3>
                      <button className="text-[9px] font-black text-amber-600 hover:text-amber-500 flex items-center gap-2 uppercase tracking-widest transition-colors">
                         <i className="fas fa-file-invoice"></i> Export Silo Archive
                      </button>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead>
                           <tr className="text-[9px] font-black uppercase text-stone-400 border-b border-stone-50">
                              <th className="px-8 py-5">Transaction ID</th>
                              <th className="px-8 py-5">Verified Gateway</th>
                              <th className="px-8 py-5">Synthesis Amount</th>
                              <th className="px-8 py-5">Sync State</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                           {invoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-stone-50/50 group transition-all">
                                 <td className="px-8 py-6">
                                    <p className="text-xs font-bold text-stone-800">{inv.id}</p>
                                    <p className="text-[9px] text-stone-400 font-black uppercase mt-1">{inv.date}</p>
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className="text-[10px] font-black uppercase text-stone-500 flex items-center gap-3 transition-colors group-hover:text-stone-900">
                                       <i className={`fab fa-${inv.method.toLowerCase().replace(' ', '')} text-xl ${
                                          inv.method === 'Stripe' ? 'text-blue-600' : 
                                          inv.method === 'PayPal' ? 'text-blue-400' : 'text-stone-300'
                                       }`}></i> 
                                       {inv.method}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6"><span className="text-sm font-black text-stone-800">${inv.amount}</span></td>
                                 <td className="px-8 py-6">
                                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                       {inv.status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>
                </div>
             </div>
             
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-amber-500 text-stone-950 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-500"><i className="fas fa-crown text-9xl"></i></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Active Facility Tier</p>
                   <h4 className="text-4xl font-serif font-black italic tracking-tighter leading-none mb-8">The {currentPlan.name.split(' ')[1]} Edition</h4>
                   <div className="space-y-4 mb-10">
                      {[
                        { l: 'Authorization Nodes', v: currentPlan.users },
                        { l: 'Predictive Intel', v: 'Active' },
                        { l: 'Priority Support', v: 'Enabled' },
                        { l: 'Gateway Resilience', v: 'Verified' }
                      ].map((f, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-bold border-b border-stone-900/10 pb-2">
                           <span className="uppercase opacity-60 tracking-widest">{f.l}</span>
                           <span className="font-black">{f.v}</span>
                        </div>
                      ))}
                   </div>
                   <button className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-amber-900/40 hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center gap-3">
                      <i className="fas fa-credit-card text-amber-500"></i> Manage Managed Subscription
                   </button>
                </div>

                <div className="p-8 bg-stone-900 text-white rounded-[3rem] shadow-2xl space-y-6 border border-white/5">
                   <div className="flex justify-between items-center mb-2">
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic">Network Adapters</h4>
                      <i className="fas fa-link text-[10px] text-stone-600"></i>
                   </div>
                   <div className="space-y-3">
                      <button onClick={() => paymentService.simulateStripeCheckout('setup')} className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl flex items-center justify-between px-6 transition-all group shadow-inner">
                         <span className="text-[10px] font-black uppercase tracking-widest">Stripe Core</span>
                         <i className="fab fa-stripe text-3xl text-blue-400 group-hover:text-blue-300 transition-colors"></i>
                      </button>
                      <button onClick={() => paymentService.simulatePayPalConnect()} className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl flex items-center justify-between px-6 transition-all group shadow-inner">
                         <span className="text-[10px] font-black uppercase tracking-widest">PayPal Hub</span>
                         <i className="fab fa-paypal text-2xl text-blue-200 group-hover:text-white transition-colors"></i>
                      </button>
                      <button className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl flex items-center justify-between px-6 transition-all group shadow-inner">
                         <span className="text-[10px] font-black uppercase tracking-widest">Paddle Node</span>
                         <i className="fas fa-box text-xl text-emerald-400 group-hover:text-emerald-300 transition-colors"></i>
                      </button>
                      <button className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mt-4 border border-white/5">Download Revenue Synthesis</button>
                   </div>
                </div>

                <div className="p-6 bg-stone-100 border border-stone-200 rounded-[2.5rem] flex gap-5 items-center">
                   <div className="w-12 h-12 bg-white rounded-2xl border border-stone-200 flex items-center justify-center text-amber-600 shadow-md shrink-0">
                      <i className="fas fa-shield-halved text-lg"></i>
                   </div>
                   <p className="text-[9px] text-stone-500 font-bold leading-relaxed italic">
                      "Payment infrastructure is managed by Vinea Core. All transactions are logged in your facility's private silo for 7 years as per global compliance."
                   </p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'dev' && showDevLab && (
          <div className="flex-1 flex items-start justify-center animate-in zoom-in-95 duration-500 pt-4">
             <div className="bg-stone-900 w-full max-w-5xl p-8 md:p-12 rounded-[3.5rem] border border-amber-500/20 shadow-2xl flex flex-col lg:flex-row gap-10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-20"></div>
                
                <div className="lg:w-1/2 space-y-6">
                   <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-500 flex items-center gap-3">
                         <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.6)]"></span>
                         Developer Intel Lab
                      </span>
                      <h3 className="text-3xl font-serif font-black italic text-white leading-none">Access Token Synthesis</h3>
                   </div>
                   
                   <p className="text-stone-400 text-xs leading-relaxed font-medium italic">
                      "Synthesize unique verification nodes for potential stakeholders. Tokens gate the Equity Intelligence Suite."
                   </p>

                   <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3">
                         <i className="fas fa-fingerprint text-amber-500 text-[10px] mt-1"></i>
                         <p className="text-[9px] text-stone-500 uppercase font-black leading-relaxed">
                            Each token is session-locked to the current establishment silo.
                         </p>
                      </div>
                      <div className="flex items-start gap-3">
                         <i className="fas fa-shield-virus text-amber-500 text-[10px] mt-1"></i>
                         <p className="text-[9px] text-stone-500 uppercase font-black leading-relaxed">
                            Secure dispersal solely to authorized facility auditors.
                         </p>
                      </div>
                   </div>

                   <button 
                    onClick={generateInvestorKey}
                    className="w-full py-4 bg-amber-500 text-stone-900 rounded-xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
                   >
                      <i className="fas fa-bolt-lightning text-xs"></i>
                      Synthesize Access Token
                   </button>
                </div>

                <div className="lg:w-1/2 bg-black/40 rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 shadow-inner relative group min-h-[250px]">
                   <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   {generatedKey ? (
                     <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 w-full">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-500">Active Investor Access Node</p>
                        <div className="p-6 bg-white/5 border-2 border-dashed border-amber-500/30 rounded-2xl shadow-xl relative overflow-hidden">
                           <p className="text-2xl font-mono font-black text-amber-500 tracking-[0.2em]">{generatedKey}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => {navigator.clipboard.writeText(generatedKey || ''); alert("Token saved to clipboard.");}}
                            className="text-[9px] font-black uppercase tracking-widest text-white hover:text-amber-500 transition-colors flex items-center justify-center gap-2"
                          >
                             <i className="fas fa-copy text-[10px]"></i> Copy Token Node
                          </button>
                          <p className="text-[8px] text-stone-600 font-bold italic">Hand this key to potential investors for Dashboard access.</p>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4 opacity-30">
                        <div className="w-14 h-14 rounded-2xl border-4 border-dashed border-stone-700 flex items-center justify-center mx-auto">
                           <i className="fas fa-key text-xl text-stone-700"></i>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">Awaiting Synthesis Sequence</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstablishmentAdmin;
