
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StaffShift, Invoice, PlanTier, PaymentMethod, BillingCycle, EquipmentStatus, RestaurantProfile, SubscriptionTier } from '../lib/types';
import { INITIAL_SHIFTS, MOCK_EQUIPMENT } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { paymentService, PAYMENT_PLANS } from '../services/paymentService';
import { supabaseSync, generateUUID } from '../services/supabaseSync';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import DocumentModal from './modals/DocumentModal';

interface EstablishmentAdminProps {
  isDeveloper?: boolean;
  devToolsUnlocked?: boolean;
  restaurantProfile?: RestaurantProfile | null;
  onUpdateProfile?: (key: keyof RestaurantProfile, value: string | number | boolean | null) => void;
  onNavigateToInvestor?: () => void;
  onNavigateToPromo?: () => void;
}

const billingData = [
  { month: 'Oct', api: 120, user: 199, storage: 45 },
  { month: 'Nov', api: 140, user: 199, storage: 48 },
  { month: 'Dec', api: 210, user: 249, storage: 60 },
  { month: 'Jan', api: 190, user: 249, storage: 65 },
  { month: 'Feb', api: 240, user: 249, storage: 70 },
  { month: 'Mar', api: 280, user: 249, storage: 85 },
];

const EstablishmentAdmin: React.FC<EstablishmentAdminProps> = ({ 
  isDeveloper = false, 
  devToolsUnlocked = false, 
  restaurantProfile, 
  onUpdateProfile, 
  onNavigateToInvestor,
  onNavigateToPromo
}) => {
  const store = useVinetelligenceStore();
  const tierConfig = store.getTierConfig();

  const establishment = useMemo<RestaurantProfile>(() => {
    return restaurantProfile || { id: 'demo-id', name: 'Vinetelligence Venue', edition: 'demo', type: 'Bar', focus: 'Wine', description: '', aiPersona: '', tier: SubscriptionTier.OPERATOR };
  }, [restaurantProfile]);

  const [staffList, setStaffList] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('vinea_staff_list');
    const isExplorer = establishment.edition === 'demo';
    return saved ? JSON.parse(saved) : (isExplorer ? INITIAL_SHIFTS.map(s => ({ ...s, email: `${s.name.toLowerCase().replace(' ', '')}@venue.com`, accessStatus: 'Active' })) : []);
  });

  // Clear demo staff if we just switched to a real establishment
  useEffect(() => {
    if (establishment.edition !== 'demo' && establishment.id !== 'demo-id') {
      const saved = localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('vinea_staff_list');
      if (!saved) {
        setStaffList([]);
      }
    }
  }, [establishment.edition, establishment.id]);

  const fetchCloudRoster = useCallback(async () => {
    if (establishment.id && establishment.edition !== 'demo') {
      try {
        const roster = await supabaseSync.getStaffRoster(establishment.id);
        if (roster && roster.length > 0) {
          const mappedStaff: StaffShift[] = roster.map((r: { id: string; email: string; role: string; status: string }) => ({
            id: r.id,
            name: r.email.split('@')[0],
            email: r.email,
            role: r.role as StaffShift['role'],
            startTime: '17:00',
            endTime: '23:00',
            performanceScore: 0,
            accessStatus: r.status === 'Registered' ? 'Active' : 'Pending'
          }));
          setStaffList(mappedStaff);
        }
      } catch (e) {
        console.error("Vinetelligence: Failed to fetch cloud roster", e);
      }
    }
  }, [establishment.id, establishment.edition]);

  useEffect(() => {
    fetchCloudRoster();
  }, [fetchCloudRoster]);

  const [activeTab, setActiveTab] = useState<'roster' | 'billing' | 'facility' | 'labor' | 'system' | 'dev' | 'identity' | 'presentation'>('roster');
  const [generatedKey, setGeneratedKey] = useState<string | null>(() => localStorage.getItem('vinetelligence_investor_key') || localStorage.getItem('vinea_investor_key'));
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [showCheckoutModal, setShowCheckoutModal] = useState<PlanTier | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeDoc, setActiveDoc] = useState<{ type: 'invoice' | 'receipt', invoice: Invoice } | null>(null);

  // Facility & System State
  const [equipment, setEquipment] = useState<EquipmentStatus[]>(() => {
    const saved = localStorage.getItem('vinetelligence_equipment') || localStorage.getItem('vinea_equipment');
    return saved ? JSON.parse(saved) : MOCK_EQUIPMENT;
  });
  const [isCleaning, setIsCleaning] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Activation Flow State
  const [isActivating, setIsActivating] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [pendingPlan, setPendingPlan] = useState<PlanTier | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Administrative password-override bypass states
  const [selectedStaffForPassword, setSelectedStaffForPassword] = useState<StaffShift | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  console.log("Establishment Edition", establishment.edition);

  useEffect(() => {
    if (establishment.id && establishment.edition !== 'demo') {
      supabaseSync.pullRestaurantInvoices(establishment.id)
        .then(data => {
          if (data.length > 0) {
            setInvoices(data);
          } else {
            // Keep empty or fallback to mock for visuals? 
            // Better to show empty if cloud is primary
            setInvoices([]);
          }
        })
        .catch(e => {
          console.error("Vinetelligence: Failed to get cloud invoices", e);
          paymentService.getInvoices().then(setInvoices);
        });
    } else {
      paymentService.getInvoices()
        .then(setInvoices)
        .catch(e => console.error("Vinetelligence: Failed to get invoices", e));
    }
  }, [establishment.id, establishment.edition]);

  console.log("Invoices loaded", invoices.length);

  const handlePurge = async () => {
    setIsCleaning(true);
    setCleanFeedback(null);
    try {
      const res = await supabaseSync.cleanDemoData(establishment.id || 'demo');
      if (res && res.success) {
        // Clear local storage too
        localStorage.removeItem('vinetelligence_orders');
        localStorage.removeItem('vinetelligence_draft_orders');
        localStorage.removeItem('vinetelligence_inventory');
        localStorage.removeItem('vinetelligence_journeys');
        localStorage.removeItem('vinetelligence_transactions');
        localStorage.removeItem('vinetelligence_tables');
        localStorage.removeItem('vinetelligence_assignments');
        localStorage.removeItem('vinetelligence_staff_list');
        localStorage.removeItem('vinetelligence_equipment');
        
        localStorage.removeItem('vinea_orders');
        localStorage.removeItem('vinea_draft_orders');
        localStorage.removeItem('vinea_inventory');
        localStorage.removeItem('vinea_journeys');
        localStorage.removeItem('vinea_transactions');
        localStorage.removeItem('vinea_tables');
        localStorage.removeItem('vinea_assignments');
        localStorage.removeItem('vinea_staff_list');
        localStorage.removeItem('vinea_equipment');
        
        setStaffList(INITIAL_SHIFTS);
        setEquipment(MOCK_EQUIPMENT);
        
        window.dispatchEvent(new Event('storage'));
        setNotification({ message: "Operational purge completed successfully.", type: 'success' });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ message: res?.message || "Purge protocol rejected by cloud silo.", type: 'error' });
      }
      setCleanFeedback(res);
    } catch (e) {
      console.error("Vinetelligence: Purge failed", e);
      setCleanFeedback({ success: false, message: "Purge failed. Please check connection." });
    } finally {
      setIsCleaning(false);
      setShowPurgeConfirm(false);
    }
  };

  const profitabilityData = [
    { subject: 'Wine', A: 120, B: 110, fullMark: 150 },
    { subject: 'Spirits', A: 98, B: 130, fullMark: 150 },
    { subject: 'Cocktails', A: 86, B: 130, fullMark: 150 },
    { subject: 'Food', A: 99, B: 100, fullMark: 150 },
    { subject: 'Labor', A: 85, B: 90, fullMark: 150 },
    { subject: 'Waste', A: 65, B: 85, fullMark: 150 },
  ];
  const userLimit = tierConfig.maxUsers;

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffShift['role']>('Server');

  useEffect(() => {
    localStorage.setItem('vinetelligence_staff_list', JSON.stringify(staffList));
    localStorage.setItem('vinea_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffList.length >= userLimit) {
      setNotification({ message: `Authorization limit reached for "${establishment.edition}" tier.`, type: 'error' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    const email = inviteEmail.toLowerCase().trim();
    
    // Cloud Sync if applicable
    if (establishment.id && establishment.edition !== 'demo') {
      setIsProcessingPayment(true);
      try {
        const result = await supabaseSync.addToRoster(establishment.id, email, inviteRole);
        
        // Dispatch Invitation Email
        await supabaseSync.sendInviteEmail(email, establishment.name, inviteRole);

        const newUser: StaffShift = {
          id: result.id,
          name: email.split('@')[0],
          email: email,
          role: inviteRole,
          startTime: '17:00',
          endTime: '23:00',
          performanceScore: 0,
          accessStatus: 'Pending',
        };
        setStaffList([...staffList, newUser]);
        setInviteEmail('');
        setNotification({ message: "Node authorized and invitation relay dispatched.", type: 'success' });
      } catch (e: unknown) {
        const error = e as Error;
        console.error("Vinetelligence: Failed to add to roster", e);
        setNotification({ message: error.message || "Failed to authorize user in cloud silo.", type: 'error' });
      } finally {
        setIsProcessingPayment(false);
        setTimeout(() => setNotification(null), 5000);
      }
      return;
    }

    // Local Fallback
    const newUser: StaffShift = {
      id: generateUUID(),
      name: email.split('@')[0] || 'Unknown',
      email: email,
      role: inviteRole,
      startTime: '17:00',
      endTime: '23:00',
      performanceScore: 0,
      accessStatus: 'Pending',
    };
    setStaffList([...staffList, newUser]);
    setInviteEmail('');
  };

  const handleSetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPassword || !newStaffPassword) return;
    
    setIsSettingPassword(true);
    try {
      const resp = await fetch('/api/ops/set-staff-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedStaffForPassword.email,
          password: newStaffPassword,
          restaurantId: establishment.id,
          role: selectedStaffForPassword.role
        })
      });
      
      const rData = await resp.json();
      if (!resp.ok) {
        throw new Error(rData.error || 'Failed to establish password.');
      }
      
      setNotification({
        message: `Success: Credentials synchronized! ${selectedStaffForPassword.email} password is now set to "${newStaffPassword}". They can now log in under this establishment immediately.`,
        type: 'success'
      });
      
      setSelectedStaffForPassword(null);
      setNewStaffPassword('');
      fetchCloudRoster(); // Reload status from database
      
    } catch (err: unknown) {
      const error = err as Error;
      setNotification({ message: error.message || 'Failed to update credentials in Cloud Silo.', type: 'error' });
    } finally {
      setIsSettingPassword(false);
      setTimeout(() => setNotification(null), 10000);
    }
  };

  const handleCommitPayment = async (plan: PlanTier, method: PaymentMethod) => {
    setIsProcessingPayment(true);
    setShowCheckoutModal(null);
    
    try {
      const result = await paymentService.initiateGatewayCheckout(plan.id, method, billingCycle);
      
      if (result.success) {
        setExpectedCode(result.activationCode);
        setPendingPlan(plan);
        setSelectedMethod(method);
        setIsActivating(true);
      } else {
        setNotification({ message: "Gateway synchronization failed. Please retry.", type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (e) {
      console.error("Vinetelligence: Payment gateway error", e);
      setNotification({ message: "Network error during checkout. Please check your connection.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleVerifyActivation = () => {
    if (paymentService.verifyActivationCode(activationCode, expectedCode) && pendingPlan) {
      if (onUpdateProfile) {
        onUpdateProfile('edition', pendingPlan.id);
      } else {
        const updatedProfile = { ...establishment, edition: pendingPlan.id };
        localStorage.setItem('vinetelligence_profile', JSON.stringify(updatedProfile));
        localStorage.setItem('vinea_profile', JSON.stringify(updatedProfile));
      }
      
      const newInv: Invoice = {
        id: `INV-${Math.floor(Math.random()*9000)+1000}`,
        date: new Date().toISOString().split('T')[0],
        amount: paymentService.calculatePrice(pendingPlan.price, billingCycle),
        status: 'Paid',
        method: selectedMethod || 'Credit & Debit Card'
      };
      setInvoices(prev => [newInv, ...prev]);
      
      setIsActivating(false);
      setPendingPlan(null);
      setSelectedMethod(null);
      setActivationCode('');
      setNotification({ message: `System Protocol Elevated: ${pendingPlan.name} is now operational.`, type: 'success' });
      setTimeout(() => {
        setNotification(null);
        window.location.reload();
      }, 3000);
    } else {
      setNotification({ message: "Invalid activation node. Verification failed.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const [investorEmail, setInvestorEmail] = useState('');

  const generateInvestorKey = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'VNTL-';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    result += '-2026';
    setGeneratedKey(result);
    localStorage.setItem('vinetelligence_investor_key', result);
    localStorage.setItem('vinea_investor_key', result);

    if (investorEmail && establishment.id && establishment.edition !== 'demo') {
      setIsProcessingPayment(true);
      try {
        await supabaseSync.sendInvestorNotification(investorEmail, establishment.name, result);
        setNotification({ message: "Investor access relay dispatched.", type: 'success' });
      } catch (e) {
        console.error("Vinetelligence: Failed to send investor email", e);
      } finally {
        setIsProcessingPayment(false);
        setTimeout(() => setNotification(null), 5000);
      }
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 relative">
      {/* Notifications */}
      {notification && (
        <div className="fixed top-8 right-8 z-[1000] animate-in slide-in-from-right-8 duration-500">
          <div className={`px-8 py-5 rounded-[2rem] shadow-2xl border backdrop-blur-xl flex items-center gap-4 ${
            notification.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/50' : 
            notification.type === 'error' ? 'bg-indigo-600/90 text-white border-indigo-400/50' : 
            'bg-stone-900/90 text-white border-white/10'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/20`}>
              <i className={`fas ${notification.type === 'success' ? 'fa-check' : notification.type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-xs`}></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Universal Checkout Modal */}
      {showCheckoutModal && !isActivating && (
        <div className="fixed inset-0 z-[700] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-stone-200">
            <div className="p-10 bg-stone-900 text-white flex justify-between items-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><i className="fas fa-credit-card text-9xl"></i></div>
               <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">Payment Hub</span>
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
                     <p className="text-3xl font-black text-indigo-600">${paymentService.calculatePrice(showCheckoutModal.price, billingCycle)}</p>
                  </div>
               </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.3em] mb-4 text-center">Select Authorized Gateway</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                       { id: 'Credit & Debit Card', icon: 'fa-credit-card', color: 'text-blue-500', label: 'Debit / Credit Card' },
                       { id: 'PayPal', icon: 'fa-paypal', color: 'text-blue-400', label: 'PayPal Gateway' },
                       { id: 'Bank', icon: 'fa-building-columns', color: 'text-stone-500', label: 'Bank Transfer (SEPA/SWIFT)' },
                       { id: 'Cash', icon: 'fa-shop', color: 'text-emerald-600', label: 'Authorized Physical Node' }
                     ].map((gateway) => (
                       <button 
                         key={gateway.id}
                         onClick={() => handleCommitPayment(showCheckoutModal, gateway.id as PaymentMethod)}
                         className="p-6 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:bg-white transition-all group active:scale-95 shadow-sm"
                       >
                          <i className={`fab ${gateway.icon.includes('fa-shop') ? 'fas ' + gateway.icon : (gateway.icon.includes('fa-credit') || gateway.icon.includes('fa-building') ? 'fas ' + gateway.icon : 'fab ' + gateway.icon)} text-2xl ${gateway.color} group-hover:scale-110 transition-transform`}></i>
                          <span className="text-[9px] font-black uppercase text-stone-600 group-hover:text-stone-900 text-center leading-tight">{gateway.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] text-indigo-800 font-medium leading-relaxed italic text-center">
                    "Note: Operational Tier upgrades activate immediately without an additional trial period. The 14-day trial is reserved for initial facility setup nodes only."
                  </p>
               </div>

               <p className="text-[9px] text-stone-400 text-center italic leading-relaxed">
                  "Your payment is secured via 256-bit AES encryption. Network authorization occurs immediately upon verification."
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Activation Code Modal */}
      {isActivating && (
        <div className="fixed inset-0 z-[750] bg-stone-950/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
           <div className="bg-white w-full max-md rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 shadow-2xl border border-stone-200">
              <div className="w-20 h-20 bg-indigo-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl rotate-6">
                <i className="fas fa-key text-3xl"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black italic">Verification Protocol</h3>
                <p className="text-xs text-stone-500 leading-relaxed font-medium">
                  Payment confirmed. A unique activation node has been dispatched to your command email.
                </p>
              </div>
              
              <div className="w-full space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest ml-4">Activation Code</label>
                  <input 
                    type="text" 
                    value={activationCode}
                    onChange={e => setActivationCode(e.target.value.toUpperCase())}
                    placeholder="VNTL-XXXX-XXXX-2026"
                    className="w-full px-8 py-5 bg-stone-50 border border-stone-200 rounded-3xl text-center font-mono font-black text-stone-900 tracking-widest focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-inner"
                  />
                </div>
                
                <div className="p-4 bg-stone-900 rounded-2xl text-left border border-white/5 group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-3 opacity-10"><i className="fas fa-envelope text-2xl text-indigo-500"></i></div>
                   <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">Demo Note:</p>
                   <p className="text-[10px] text-stone-400 font-bold leading-relaxed">
                     Received code: <span className="text-white select-all cursor-pointer font-mono">{expectedCode}</span>
                   </p>
                </div>

                <button 
                  onClick={handleVerifyActivation}
                  className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
                >
                  Activate Operational Tier
                </button>
                <button 
                  onClick={() => setIsActivating(false)}
                  className="text-[9px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors"
                >
                  Cancel Activation
                </button>
              </div>
           </div>
        </div>
      )}

      {isProcessingPayment && (
        <div className="fixed inset-0 z-[800] bg-stone-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
           <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
           <h3 className="text-2xl font-serif font-black text-white italic tracking-tight">Gateway Redirect Active</h3>
           <p className="text-stone-400 mt-2 uppercase font-black text-[9px] tracking-[0.4em]">Establishing Secure Token Handshake...</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 shrink-0 gap-4">
         <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h2 
                className="text-3xl font-serif font-bold text-stone-900 tracking-tight select-none"
               >
                 {establishment.name} Admin
               </h2>
               {isDeveloper && (
                 <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${devToolsUnlocked ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                   {devToolsUnlocked ? 'Network Root Enabled' : 'Network Dev Auth'}
                 </span>
               )}
            </div>
            <p className="text-[9px] font-black uppercase text-stone-400 tracking-[0.3em]">Module 1: Facility Control Node</p>
         </div>
         <div className="flex flex-wrap gap-2 items-center">
           {onNavigateToInvestor && (
             <button 
               onClick={onNavigateToInvestor}
               className="px-6 py-2 bg-stone-900 text-white rounded-xl flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg active:scale-95"
             >
               <i className="fas fa-globe text-indigo-500"></i>
               <span className="text-[9px] font-black uppercase tracking-widest">Investor Portal</span>
             </button>
           )}
           {onNavigateToPromo && (
             <button 
               onClick={onNavigateToPromo}
               className="px-6 py-2 bg-indigo-500 text-white rounded-xl flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
             >
               <i className="fas fa-bullhorn"></i>
               <span className="text-[9px] font-black uppercase tracking-widest">Social Promo</span>
             </button>
           )}
           <div className="flex gap-1 p-1 bg-stone-100 rounded-xl shadow-inner shrink-0 overflow-x-auto max-w-full">
            <button onClick={() => setActiveTab('roster')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'roster' ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>Staff Registry</button>
            <button onClick={() => setActiveTab('identity')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'identity' ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>Identity & Contact</button>
            <button onClick={() => setActiveTab('billing')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'billing' ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>Network Billing & SaaS</button>
            <button onClick={() => setActiveTab('system')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'system' ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>System Settings</button>
            <button onClick={() => setActiveTab('presentation')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'presentation' ? 'bg-white text-stone-900 shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}>Presentation & Demos</button>
            {isDeveloper && devToolsUnlocked && (
              <>
                <button onClick={() => setActiveTab('dev')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-indigo-500/20 whitespace-nowrap ${activeTab === 'dev' ? 'bg-stone-900 text-indigo-500 shadow-lg' : 'bg-indigo-50 text-indigo-600'}`}>Developer Lab</button>
              </>
            )}
         </div>
      </div>
    </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10 min-h-0">
        {activeTab === 'identity' && (
          <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[3rem] border border-stone-200 shadow-2xl overflow-hidden p-10 space-y-12">
               <div className="space-y-4">
                  <h3 className="text-3xl font-serif font-black italic text-stone-900">Establishment Identity</h3>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Configure public-facing contact information for your promo page</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-4">Establishment Name</label>
                     <input 
                        type="text" 
                        value={establishment.name}
                        onChange={(e) => onUpdateProfile?.('name', e.target.value)}
                        className="w-full px-8 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 transition-all outline-none"
                        placeholder="Grand Cru Lounge"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-4">Public Email</label>
                     <input 
                        type="email" 
                        value={establishment.email || ''}
                        onChange={(e) => onUpdateProfile?.('email', e.target.value)}
                        className="w-full px-8 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 transition-all outline-none"
                        placeholder="hello@venue.com"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-4">Public Phone</label>
                     <input 
                        type="tel" 
                        value={establishment.phone || ''}
                        onChange={(e) => onUpdateProfile?.('phone', e.target.value)}
                        className="w-full px-8 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 transition-all outline-none"
                        placeholder="+1 (555) 000-0000"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-4">Official Website</label>
                     <input 
                        type="url" 
                        value={establishment.website || ''}
                        onChange={(e) => onUpdateProfile?.('website', e.target.value)}
                        className="w-full px-8 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/5 transition-all outline-none"
                        placeholder="https://venue.studio"
                     />
                  </div>
               </div>

               <div className="p-8 bg-stone-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                        <i className="fas fa-bullhorn text-xl"></i>
                     </div>
                     <div className="space-y-1">
                        <h4 className="text-lg font-serif font-black italic text-indigo-500">Promotion Logic</h4>
                        <p className="text-[10px] text-stone-400 font-bold leading-relaxed max-w-sm lowercase tracking-widest">Changes to these fields synchronize instantly with your Vinetelligence Social Promo page.</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/vinetelligence_logo.svg';
                        link.download = 'vinetelligence_logo.svg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setNotification({ message: "Branding Protocol: Asset Dispatched to Downloads.", type: 'success' });
                        setTimeout(() => setNotification(null), 5000);
                      }}
                      className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-download text-indigo-500"></i>
                      Logo Assets
                    </button>
                    <button onClick={onNavigateToPromo} className="px-8 py-4 bg-white/10 hover:bg-white text-white hover:text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">Preview Promo</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'labor' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 p-8 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-black italic text-stone-900">Labor Modeling</h3>
                    <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Efficiency vs Revenue Correlation</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Optimal</span>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profitabilityData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Target" dataKey="B" stroke="#7c2d12" fill="#7c2d12" fillOpacity={0.1} />
                      <Radar name="Actual" dataKey="A" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.5} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Labor %</p>
                    <p className="text-xl font-black text-stone-900 italic">22.4%</p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Rev/Hour</p>
                    <p className="text-xl font-black text-stone-900 italic">$412</p>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Burn Rate</p>
                    <p className="text-xl font-black text-emerald-600 italic">Low</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 bg-stone-900 rounded-[2.5rem] text-white space-y-6">
                  <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-brain text-xl"></i>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-serif font-black italic text-indigo-500">AI Labor Insight</h4>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-medium">
                      Current staffing levels are optimal for the predicted 18% surge in guest traffic tonight. Recommend maintaining primary assignments in Zone 2.
                    </p>
                  </div>
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Optimize Roster</button>
                </div>

                <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-200 space-y-4">
                  <h4 className="text-sm font-black text-stone-900 uppercase tracking-widest">Shift Performance</h4>
                  <div className="space-y-4">
                    {staffList.slice(0, 3).map(s => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg border border-stone-200 flex items-center justify-center text-[10px] font-black text-stone-400">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-bold text-stone-700">{s.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600">{s.performanceScore}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'facility' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {equipment.map(item => (
                <div key={item.id} className="p-8 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6 group hover:border-indigo-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                      item.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' : 
                      item.status === 'Warning' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      <i className={`fas ${
                        item.type === 'HVAC' ? 'fa-wind' : 
                        item.type === 'Refrigeration' ? 'fa-snowflake' : 
                        item.type === 'Bar' ? 'fa-beer-mug-empty' : 'fa-kitchen-set'
                      } text-xl`}></i>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Health</p>
                      <p className={`text-lg font-black italic ${
                        item.healthScore > 90 ? 'text-emerald-600' : 
                        item.healthScore > 70 ? 'text-indigo-600' : 'text-indigo-600'
                      }`}>{item.healthScore}%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-stone-900 uppercase tracking-widest truncate">{item.name}</h4>
                    <p className="text-[10px] text-stone-400 font-medium italic">Last Service: {item.lastService}</p>
                  </div>

                  <div className="pt-4 border-t border-stone-50 flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      item.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' : 
                      item.status === 'Warning' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                    }`}>{item.status}</span>
                    <button className="text-stone-400 hover:text-stone-900 transition-colors">
                      <i className="fas fa-ellipsis-vertical"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-stone-50 rounded-[3rem] border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-stone-300 shadow-inner">
                  <i className="fas fa-screwdriver-wrench text-2xl"></i>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-serif font-black italic text-stone-900">Predictive Maintenance</h4>
                  <p className="text-[10px] text-stone-500 font-medium leading-relaxed max-w-sm">AI analysis suggests servicing the Wine Cellar Cooler within the next 14 days to avoid critical failure.</p>
                </div>
              </div>
              <button className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95">Schedule Service</button>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-xl space-y-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-black italic text-stone-900 leading-none">Language & Localization</h3>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em]">Neural Link Linguistic Configuration</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'en', name: 'English', flag: '🇺🇸', desc: 'Global Standard' },
                  { id: 'es', name: 'Español', flag: '🇪🇸', desc: 'Latinoamérica & Iberia' },
                  { id: 'nl', name: 'Nederlands', flag: '🇳🇱', desc: 'Benelux Region' },
                  { id: 'pt', name: 'Português', flag: '🇵🇹', desc: 'Brasil & Portugal' }
                ].map((lang) => (
                  <button 
                    key={lang.id}
                    onClick={() => onUpdateProfile?.('language', lang.id)}
                    className={`p-6 rounded-[2rem] border-2 transition-all text-left space-y-3 ${establishment.language === lang.id ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-stone-100 bg-stone-50 hover:border-stone-200'}`}
                  >
                    <div className="text-2xl">{lang.flag}</div>
                    <div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${establishment.language === lang.id ? 'text-indigo-600' : 'text-stone-900'}`}>{lang.name}</div>
                      <div className="text-[8px] text-stone-400 font-bold tracking-tighter">{lang.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-xl space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif font-black italic text-stone-900 leading-none">Academy-Only Deployment</h3>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em]">Restrict software bundle exclusively to somatic training modules</p>
                </div>
                <button 
                  onClick={() => {
                    const nextVal = !establishment.academyOnlyMode;
                    onUpdateProfile?.('academyOnlyMode', nextVal);
                    setNotification({
                      message: nextVal 
                        ? "Academy-Only Mode Enabled: UI restricted to Somatic Training Module."
                        : "Full Stack Mode Restored: All operational modules are online.",
                      type: 'success'
                    });
                    setTimeout(() => setNotification(null), 5000);
                  }}
                  className={`px-8 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${establishment.academyOnlyMode ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                >
                  <i className={`fas ${establishment.academyOnlyMode ? 'fa-book-open' : 'fa-cubes'} mr-2`}></i>
                  {establishment.academyOnlyMode ? 'Academy-Only: Active' : 'Enable Academy-Only'}
                </button>
              </div>
              <p className="text-[10px] text-stone-500 font-bold leading-relaxed italic border-l-4 border-indigo-500/20 pl-6">
                "Ideal for culinary academies, educational institutions, or beverage partner staff training. Enabling this restricts the dashboard layout exclusively to the Scholar Node and coaching layers."
              </p>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-xl space-y-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-black italic text-stone-900 leading-none">Experience Profile</h3>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em]">Global Aesthetic & Brand Voice Selection</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => onUpdateProfile?.('aesthetic', 'elite')}
                  className={`p-8 rounded-[2.5rem] border-4 transition-all text-left space-y-6 ${establishment.aesthetic === 'elite' ? 'border-indigo-500 bg-indigo-50 shadow-xl' : 'border-stone-50 bg-white hover:border-stone-200'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${establishment.aesthetic === 'elite' ? 'bg-stone-900 text-indigo-500 border-stone-800' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                    <i className="fas fa-crown text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-black italic text-stone-900 leading-none">Elite Mode</h4>
                    <p className="text-indigo-600 text-[8px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 bg-indigo-100 rounded-full inline-block">High-Luxury Technical</p>
                  </div>
                  <p className="text-[10px] text-stone-500 font-bold leading-relaxed italic opacity-80">
                    "The canonical Vinetelligence experience. Utilizes technical lexicon (Neural Link, Yield Alpha, Scholar Node) and elevated display aesthetics."
                  </p>
                </button>

                <button 
                  onClick={() => onUpdateProfile?.('aesthetic', 'light')}
                  className={`p-8 rounded-[2.5rem] border-4 transition-all text-left space-y-6 ${establishment.aesthetic === 'light' ? 'border-indigo-500 bg-indigo-50 shadow-xl' : 'border-stone-50 bg-white hover:border-stone-200'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${establishment.aesthetic === 'light' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                    <i className="fas fa-bolt-lightning text-xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-black italic text-stone-900 leading-none">Light Mode</h4>
                    <p className="text-indigo-600 text-[8px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 bg-indigo-100 rounded-full inline-block">Approachable Utility</p>
                  </div>
                  <p className="text-[10px] text-stone-500 font-bold leading-relaxed italic opacity-80">
                    "Streamlined operational interface. Replaces technical terminology with direct labels (AI Assistant, Revenue, Training) to minimize friction for high-velocity teams."
                  </p>
                </button>
              </div>
            </div>

            {cleanFeedback && (
              <div className={`p-6 rounded-3xl text-sm font-bold animate-in fade-in slide-in-from-top-4 ${cleanFeedback.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-lg shadow-emerald-500/10' : 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-lg shadow-indigo-500/10'}`}>
                <div className="flex items-center gap-3">
                  <i className={`fas ${cleanFeedback.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                  {cleanFeedback.message}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-xl space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner shrink-0 rotate-3">
                  <i className="fas fa-broom-ball text-3xl"></i>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif font-black italic text-stone-900 leading-none">Operational Purge Protocol</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Deep Node Reset Control</p>
                </div>
              </div>
              
              <p className="text-xs text-stone-500 leading-relaxed font-bold italic border-l-4 border-indigo-500/20 pl-6">
                Initialize a deep clean of the local cache and Cloud Silo. This will permanently remove all operational demo data including orders, inventory, guest journeys, and equipment telemetry.
              </p>

              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-left space-y-3">
                <div className="flex items-center gap-3 text-indigo-700">
                  <i className="fas fa-triangle-exclamation"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Warning: Irreversible Action</span>
                </div>
                <p className="text-[10px] text-indigo-900/70 font-black uppercase leading-relaxed tracking-tighter">
                  This action cannot be undone. Ensure all critical data has been archived before executing the purge sequence.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setShowPurgeConfirm(true)}
                  disabled={isCleaning}
                  className="flex-1 py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isCleaning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-can text-indigo-500"></i>}
                  Execute Purge
                </button>
              </div>

              {showPurgeConfirm && (
                <div className="fixed inset-0 z-[700] bg-stone-950/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-md rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 shadow-2xl border border-stone-200">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                      <i className="fas fa-triangle-exclamation text-3xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif font-black italic text-stone-900">Confirm Purge?</h3>
                      <p className="text-stone-500 text-xs leading-relaxed italic">
                        This will delete all demo data from the cloud. This action is irreversible.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                      <button 
                        onClick={handlePurge}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"
                      >
                        Confirm Operational Purge
                      </button>
                      <button onClick={() => setShowPurgeConfirm(false)} className="py-2 text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden flex flex-col">
              <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-stone-50/50 gap-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Authorized Personnel</h3>
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">{staffList.length} / {userLimit} Nodes</span>
              </div>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-white border-b border-stone-100">
                    <tr className="text-[8px] font-black uppercase text-stone-400 tracking-widest">
                      <th className="px-6 py-4">Node Identity</th>
                      <th className="px-6 py-4">Silo Role</th>
                      <th className="px-6 py-4">Sync State</th>
                      <th className="px-6 py-4">Credential Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {staffList.map((s: StaffShift) => (
                      <tr key={s.id} className="hover:bg-stone-50 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-stone-900 text-indigo-500 flex items-center justify-center font-black text-[10px] shadow-sm">{s.name[0]}</div>
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
                           <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${s.accessStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                            {s.accessStatus}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedStaffForPassword(s)}
                            className="bg-stone-900 border border-stone-200 hover:bg-indigo-600 hover:border-indigo-600 text-white rounded-lg px-3 py-1.5 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <i className="fas fa-key text-[9px] text-indigo-400 group-hover:text-white transition-colors"></i> Set Password
                          </button>
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
                  <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6 italic">Authorize Node</h4>
                  <form onSubmit={handleInvite} className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[7px] font-black uppercase text-stone-500 ml-1">Secure Email Relay</label>
                        <input 
                          type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                          placeholder="ops@vinetelligence.live" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-stone-700"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[7px] font-black uppercase text-stone-500 ml-1">Silo Authorization Level</label>
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value as StaffShift['role'])} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none transition-all font-bold appearance-none">
                           <option value="Server">Floor Ops (Server)</option>
                           <option value="Sommelier">Technical Scholar (Sommelier)</option>
                           <option value="Mixologist">Chemistry Architect (Mixologist)</option>
                        </select>
                     </div>
                     <button type="submit" className="w-full py-4 bg-indigo-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 mt-2">Dispatch Activation</button>
                  </form>
               </div>

               <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                 <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest italic">Tier Calibration</h4>
                 <p className="text-xs text-stone-600 font-bold leading-relaxed italic">"Elevate your establishment node to unlock higher user limits and predictive multimodal audits."</p>
                 <button onClick={() => setShowCheckoutModal(PAYMENT_PLANS[1])} className="w-full py-4 bg-stone-50 border border-stone-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-indigo-500 transition-all active:scale-95 shadow-sm">
                   Initialize Tier Upgrade
                 </button>
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
                        className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'Annual' ? 'bg-indigo-500 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
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
                      <div key={plan.id} className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all flex flex-col justify-between h-full ${isCurrent ? 'border-indigo-500 shadow-2xl ring-4 ring-indigo-500/5' : 'border-stone-100 hover:border-stone-200 hover:shadow-xl'}`}>
                          <div>
                            <div className="flex justify-between items-start mb-6">
                               <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${plan.id === 'paid' || plan.id === 'visionary' ? 'bg-indigo-100 text-indigo-700' : plan.id === 'enterprise' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600'}`}>{isCurrent ? 'Active' : plan.id}</span>
                               <div className="text-right">
                                  <p className="text-2xl font-black font-serif text-stone-900">${displayPrice}</p>
                                  <p className="text-[8px] text-stone-400 font-black uppercase tracking-widest">per {billingCycle === 'Monthly' ? 'month' : 'year'}</p>
                               </div>
                            </div>
                            <h4 className="font-black text-sm text-stone-900 mb-4 uppercase tracking-tighter">{plan.name}</h4>
                            <div className="space-y-3 mb-10">
                               {plan.features.map((f, i) => (
                                 <div key={i} className="flex items-start gap-2.5 text-[9px] text-stone-50 font-bold leading-tight">
                                    <i className="fas fa-check text-indigo-500 mt-0.5"></i>
                                    <span className="text-stone-500">{f}</span>
                                 </div>
                               ))}
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowCheckoutModal(plan)}
                            disabled={isCurrent}
                            className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isCurrent ? 'bg-stone-50 text-stone-300 border border-stone-100' : 'bg-stone-900 text-white hover:bg-indigo-500 hover:text-white'}`}
                          >
                             {isCurrent ? 'Operational Tier Active' : `Initialize Upgrade`}
                          </button>
                       </div>
                     );
                   })}
                </div>

                {/* Billing History / Ledger */}
                <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden p-6 md:p-10 space-y-10">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                         <h3 className="text-2xl font-serif font-bold text-stone-900 italic">Network Ledger & Invoices</h3>
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] mt-1">Authorized transaction logs and document retrieval</p>
                      </div>
                   </div>
                   
                   <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[800px]">
                         <thead>
                            <tr className="text-[8px] font-black uppercase text-stone-400 tracking-[0.3em] border-b border-stone-100">
                               <th className="py-4 px-2">Invoice ID</th>
                               <th className="py-4 px-2">Date dispatched</th>
                               <th className="py-4 px-2">Yield amount</th>
                               <th className="py-4 px-2">Node status</th>
                               <th className="py-4 px-2">Method</th>
                               <th className="py-4 px-2 text-right">Documents</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-stone-50">
                            {invoices.length > 0 ? invoices.map(inv => (
                               <tr key={inv.id} className="group hover:bg-stone-50/50 transition-all">
                                  <td className="py-5 px-2 text-xs font-mono font-black text-stone-900 italic">{inv.id}</td>
                                  <td className="py-5 px-2 text-[10px] font-bold text-stone-500">{inv.date}</td>
                                  <td className="py-5 px-2 text-sm font-black text-stone-900">${inv.amount}</td>
                                  <td className="py-5 px-2">
                                     <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {inv.status}
                                     </span>
                                  </td>
                                  <td className="py-5 px-2 text-[9px] font-black text-stone-400 uppercase">{inv.method}</td>
                                  <td className="py-5 px-2 text-right">
                                     <div className="flex justify-end gap-2">
                                        <button 
                                          onClick={() => setActiveDoc({ type: 'invoice', invoice: inv })}
                                          className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all shadow-sm"
                                        >
                                           Invoice
                                        </button>
                                        <button 
                                          onClick={() => setActiveDoc({ type: 'receipt', invoice: inv })}
                                          className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-sm"
                                        >
                                           Receipt
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                            )) : (
                               <tr>
                                  <td colSpan={6} className="py-20 text-center">
                                     <p className="text-[10px] font-black uppercase text-stone-300 tracking-[0.4em]">No transaction nodes detected in history</p>
                                  </td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden p-6 md:p-10">
                   <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                      <div>
                         <h3 className="text-2xl font-serif font-bold text-stone-900 italic">Network SaaS Resource Consumption</h3>
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] mt-1">Monthly allocation telemetrics (Global Node)</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-stone-900"></div><span className="text-[9px] font-black text-stone-500 uppercase">Users</span></div>
                         <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[9px] font-black text-stone-500 uppercase">API Tokens</span></div>
                         <button className="flex items-center gap-3 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">
                            Network Stripe Portal <i className="fas fa-external-link-alt text-indigo-500"></i>
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
             </div>
             
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-indigo-500 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-500"><i className="fas fa-crown text-9xl"></i></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">SaaS Command Level</p>
                   <h4 className="text-4xl font-serif font-black italic tracking-tighter leading-none mb-8">Network Developer</h4>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'presentation' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-xl space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif font-black italic text-stone-900 leading-none">Recording Protocol</h3>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.4em]">Optimized UI for Content Creation</p>
                </div>
                <button 
                  onClick={() => onUpdateProfile?.('recordingMode', !establishment.recordingMode)}
                  className={`px-8 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${establishment.recordingMode ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                >
                  <i className={`fas ${establishment.recordingMode ? 'fa-video' : 'fa-video-slash'} mr-2`}></i>
                  {establishment.recordingMode ? 'Recording Mode: Active' : 'Enable Recording Mode'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-stone-50 border border-stone-100 space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                    <i className="fas fa-eye-slash"></i>
                  </div>
                  <h4 className="font-serif font-black italic text-stone-900">Visual Sanitization</h4>
                  <p className="text-[10px] text-stone-500 font-bold leading-relaxed italic">
                    Hides background logs, developer tags, and legal footers to keep the focus on the experience.
                  </p>
                </div>
                
                <div className="p-8 rounded-[2.5rem] bg-stone-50 border border-stone-100 space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                    <i className="fas fa-magic"></i>
                  </div>
                  <h4 className="font-serif font-black italic text-stone-900">Neural Tour (Coming Soon)</h4>
                  <p className="text-[10px] text-stone-500 font-bold leading-relaxed italic">
                    Automated walk-through script that pans through the dashboard and highlights key AI metrics.
                  </p>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-stone-50 border border-stone-100 space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                    <i className="fas fa-certificate"></i>
                  </div>
                  <h4 className="font-serif font-black italic text-stone-900">Brand Watermark</h4>
                  <p className="text-[10px] text-stone-500 font-bold leading-relaxed italic">
                    Adds a discrete Vinetelligence high-luxury watermark to the corner of the frame.
                  </p>
                </div>
              </div>

              {establishment.recordingMode && (
                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl animate-in zoom-in-95">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">
                    System Alert: Recording Mode is active. UI clutter has been minimized globally.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-stone-900 rounded-[3rem] p-10 text-white space-y-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-serif font-black italic text-indigo-500 leading-none">Marketing Intelligence</h3>
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em]">Asset Generation for Promotion</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/vinetelligence_logo.svg';
                    link.download = 'vinetelligence_logo.svg';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-8 py-5 bg-white/5 hover:bg-white text-white hover:text-stone-950 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                >
                  Download Logo Assets
                </button>
                <button 
                  onClick={onNavigateToPromo}
                  className="px-8 py-5 bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:scale-105"
                >
                  Live Social Promo Page
                </button>
                <button 
                  onClick={() => setNotification({ message: "Asset Strategy: Generating High-Res Mockups...", type: 'info' })}
                  className="px-8 py-5 bg-white/5 hover:bg-white/10 text-stone-400 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all italic"
                >
                  Device Mockups (BETA)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dev' && isDeveloper && devToolsUnlocked && (
          <div className="flex-1 flex items-start justify-center animate-in zoom-in-95 duration-500 pt-4">
             <div className="bg-stone-900 w-full max-w-5xl p-8 md:p-12 rounded-[3.5rem] border border-indigo-500/20 shadow-2xl flex flex-col lg:flex-row gap-10 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
                
                <div className="lg:w-1/2 space-y-6">
                   <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-500 flex items-center gap-3">
                         <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)]"></span>
                         Developer Intel Lab
                      </span>
                      <h3 className="text-3xl font-serif font-black italic text-white leading-none">Access Token Synthesis</h3>
                   </div>
                   
                   <p className="text-stone-400 text-xs leading-relaxed font-medium italic">
                      "Synthesize unique verification nodes for potential stakeholders. Tokens gate the Equity Intelligence Suite."
                   </p>

                   <div className="space-y-4 mt-6">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase text-stone-500 ml-2">Investor Target Email (Optional)</label>
                        <input 
                          type="email"
                          value={investorEmail}
                          onChange={(e) => setInvestorEmail(e.target.value)}
                          placeholder="stakeholder@vinetelligence.live"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-stone-700"
                        />
                      </div>

                      <button 
                        onClick={generateInvestorKey}
                        className="w-full py-4 bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:bg-indigo-400 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        <i className="fas fa-bolt-lightning text-xs"></i>
                        Synthesize Access Token
                      </button>
                   </div>
                </div>

                <div className="lg:w-1/2 bg-black/40 rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center justify-center text-center space-y-6 shadow-inner relative group min-h-[250px]">
                   {generatedKey ? (
                     <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 w-full">
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Active Investor Access Node</p>
                        <div className="p-6 bg-white/5 border-2 border-dashed border-indigo-500/30 rounded-2xl shadow-xl relative overflow-hidden">
                           <p className="text-2xl font-mono font-black text-indigo-500 tracking-[0.2em]">{generatedKey}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedKey || '');
                            setNotification({ message: "Token saved to clipboard.", type: 'success' });
                            setTimeout(() => setNotification(null), 3000);
                          }}
                          className="text-[9px] font-black uppercase tracking-widest text-white hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                        >
                           <i className="fas fa-copy text-[10px]"></i> Copy Token Node
                        </button>
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

      {selectedStaffForPassword && (
        <div className="fixed inset-0 z-[700] bg-stone-950/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 flex flex-col space-y-8 shadow-2xl border border-stone-200">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner">
              <i className="fas fa-key text-2xl"></i>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-serif font-black italic text-stone-900">Establish Operational Credentials</h3>
              <p className="text-stone-500 text-[9px] uppercase font-black tracking-wider leading-relaxed">
                Configuring credentials for: <span className="text-indigo-600 font-mono lowercase">{selectedStaffForPassword.email}</span>
              </p>
              <p className="text-stone-400 text-[11px] leading-relaxed italic max-w-xs mx-auto">
                This action establishes their authentication identity and marks them as confirmed, completely bypassing any external SMTP timeouts.
              </p>
            </div>

            <form onSubmit={handleSetStaffPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-stone-500 ml-1 font-mono">Secure Password</label>
                <input 
                  type="text" 
                  required 
                  minLength={6}
                  value={newStaffPassword} 
                  onChange={e => setNewStaffPassword(e.target.value)}
                  placeholder="Enter security password (6+ chars)" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3.5 text-xs text-stone-900 font-bold focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={isSettingPassword}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSettingPassword ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-shield-halved"></i>}
                  Authorize Operations Key
                </button>
                <button 
                  type="button" 
                  onClick={() => { setSelectedStaffForPassword(null); setNewStaffPassword(''); }} 
                  className="py-2 text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeDoc && (
        <DocumentModal 
          type={activeDoc.type} 
          invoice={activeDoc.invoice} 
          profile={establishment} 
          onClose={() => setActiveDoc(null)} 
        />
      )}
    </div>
  );
};

export default EstablishmentAdmin;
