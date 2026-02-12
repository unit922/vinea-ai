import React, { useState } from 'react';
import { GuestJourney, GuestProfile } from '../types';
import { supabaseSync } from '../services/supabaseClient';

interface GuestReservationPortalProps {
  onComplete: () => void;
  isPublic?: boolean;
}

const GuestReservationPortal: React.FC<GuestReservationPortalProps> = ({ onComplete, isPublic = false }) => {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    guests: 2,
    name: '',
    email: '',
    preferences: '',
    dietaryRestrictions: '',
    pairingStyle: 'Classic' as GuestProfile['pairingStyle'],
    specialOccasion: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBook = async () => {
    setIsSubmitting(true);
    
    const newJourneyData = {
      arrivalTime: booking.time,
      specialOccasion: booking.specialOccasion || undefined,
      profile: {
        name: booking.name,
        email: booking.email,
        favoriteBeverages: booking.preferences,
        dietaryRestrictions: booking.dietaryRestrictions || 'None',
        pairingStyle: booking.pairingStyle
      }
    };

    // Attempt Production Sync
    await supabaseSync.pushJourney(newJourneyData);

    // Local Fallback for Demo/Persistence
    const localJourney: GuestJourney = {
      id: `gj-voi-${Date.now()}`,
      arrivalTime: booking.time,
      status: 'Confirmed',
      tableNumber: '??',
      specialOccasion: booking.specialOccasion || undefined,
      profile: {
        name: booking.name,
        favoriteBeverages: booking.preferences,
        dietaryRestrictions: booking.dietaryRestrictions || 'None',
        pairingStyle: booking.pairingStyle,
        location: isPublic ? 'Public Web Portal' : 'Internal Management',
        pastOrders: 'New Guest'
      }
    };

    const saved = localStorage.getItem('vinea_journeys');
    const journeys = saved ? (JSON.parse(saved) as GuestJourney[]) : [];
    localStorage.setItem('vinea_journeys', JSON.stringify([...journeys, localJourney]));
    
    window.dispatchEvent(new Event('storage'));

    await new Promise(r => setTimeout(r, 800)); // Smooth transition
    setIsSubmitting(false);
    setStep(3);
  };

  return (
    <div className={`fixed inset-0 z-[500] bg-stone-950 flex items-center justify-center p-4 md:p-8 overflow-y-auto ${isPublic ? 'h-screen' : ''}`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#fbbf2433,transparent_50%)]"></div>
      </div>

      <div className="w-full max-w-4xl bg-stone-900 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row min-h-[600px]">
        {/* Left Branding Panel */}
        <div className="md:w-1/3 bg-stone-950 p-12 flex flex-col justify-between border-r border-white/5">
           <div>
              <h1 className="text-3xl font-serif font-bold text-white tracking-tighter mb-2 italic uppercase">Vinea</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Reservations</p>
           </div>
           <div className="space-y-6">
              <div className="w-12 h-1 bg-amber-500/20"></div>
              <p className="text-stone-500 text-sm font-medium leading-relaxed italic">
                "Experience beverage intelligence tailored to your unique palate. Secure your table at the intersection of tradition and AI."
              </p>
           </div>
           {!isPublic && (
             <button onClick={onComplete} className="text-stone-700 hover:text-white transition-colors text-xs font-bold flex items-center gap-2">
               <i className="fas fa-arrow-left"></i> Exit Portal
             </button>
           )}
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-8 md:p-16 flex flex-col bg-white/5">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-2">Secure Your Table</h2>
                  <p className="text-stone-500 text-sm">Select your arrival intelligence parameters.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Arrival Date</label>
                     <input 
                       type="date" 
                       value={booking.date}
                       onChange={e => setBooking({...booking, date: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Party Size</label>
                     <select 
                       value={booking.guests}
                       onChange={e => setBooking({...booking, guests: parseInt(e.target.value)})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none appearance-none"
                     >
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-stone-900">{n} Guests</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Arrival Time</label>
                  <div className="grid grid-cols-4 gap-2">
                     {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                       <button 
                        key={t}
                        onClick={() => setBooking({...booking, time: t})}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all border ${booking.time === t ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-lg' : 'bg-white/5 border-white/10 text-stone-500 hover:border-white/20'}`}
                       >
                         {t}
                       </button>
                     ))}
                  </div>
               </div>

               <button 
                 onClick={() => setStep(2)}
                 className="w-full py-5 bg-white text-stone-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-amber-500 transition-all active:scale-95 shadow-xl"
               >
                 Next: Palate Intelligence
               </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-2">Refine Your Journey</h2>
                  <p className="text-stone-500 text-sm">Tell our AI Sommelier about your preferences.</p>
               </div>

               <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Full Name</label>
                       <input 
                         type="text" 
                         required
                         value={booking.name}
                         onChange={e => setBooking({...booking, name: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none" 
                         placeholder="e.g. Elena Rossi"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Pairing Philosophy</label>
                     <div className="grid grid-cols-3 gap-2">
                        {(['Classic', 'Adventurous', 'Zero-Proof'] as const).map(style => (
                          <button 
                           key={style}
                           onClick={() => setBooking({...booking, pairingStyle: style})}
                           className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${booking.pairingStyle === style ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-lg' : 'bg-white/5 border-white/10 text-stone-500'}`}
                          >
                            {style}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Dietary Restrictions</label>
                     <input 
                        type="text"
                        value={booking.dietaryRestrictions}
                        onChange={e => setBooking({...booking, dietaryRestrictions: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none text-sm"
                        placeholder="e.g. Nut allergy, Gluten-free, No alcohol..."
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Beverage Passions (AI Prompt)</label>
                     <textarea 
                        value={booking.preferences}
                        onChange={e => setBooking({...booking, preferences: e.target.value})}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none resize-none text-sm italic"
                        placeholder="e.g. 'I love peated scotch and crisp Rieslings from the Mosel...'"
                     />
                  </div>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white/5 border border-white/10 text-stone-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Back</button>
                  <button 
                    onClick={handleBook}
                    disabled={isSubmitting || !booking.name || !booking.email}
                    className="flex-[2] py-4 bg-amber-500 text-stone-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-amber-400 transition-all active:scale-95 shadow-xl disabled:opacity-30"
                  >
                    {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Finalize Reservation'}
                  </button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
               <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-500 text-4xl shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <i className="fas fa-check"></i>
               </div>
               <div className="space-y-2">
                  <h2 className="text-4xl font-serif font-bold text-white">Journey Confirmed</h2>
                  <p className="text-stone-500 text-lg italic">"Your arrival intelligence has been synthesized."</p>
               </div>
               <button 
                 onClick={onComplete}
                 className="px-12 py-5 bg-white text-stone-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-amber-500 transition-all active:scale-95 shadow-2xl"
               >
                 {isPublic ? 'Visit Venue Website' : 'Return to Gallery'}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestReservationPortal;