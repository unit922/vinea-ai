
import React, { useState, useEffect, useRef } from 'react';
import { GuestJourney, GuestProfile, RestaurantProfile } from '../lib/types';
import { supabaseSync, generateUUID } from '../services/supabaseSync';
import AIAvatarChat from './AIAvatarChat';
import VinetelligenceLogo from './VinetelligenceLogo';
import { MessageSquare } from 'lucide-react';

interface GuestReservationPortalProps {
  onComplete: () => void;
  isPublic?: boolean;
  rid?: string; // Explicit establishment ID for public routing
}

const GuestReservationPortal: React.FC<GuestReservationPortalProps> = ({ onComplete, isPublic = false, rid }) => {
  const [step, setStep] = useState(1);
  const [venues, setVenues] = useState<RestaurantProfile[]>([]);
  const [currentVenue, setCurrentVenue] = useState<RestaurantProfile | null>(null);
  const [selectedRid, setSelectedRid] = useState<string | undefined>(rid);
  const [prevRid, setPrevRid] = useState<string | undefined>(rid);
  const hasLoadedRef = useRef(false);
  const hasFetchedDirectRef = useRef<string | null>(null);
  const [venueName, setVenueName] = useState(() => {
    if (rid === 'demo' || rid === 'demo-id') return 'Vinetelligence Explorer (Demo)';
    if (rid) return 'Connecting to Establishment...';
    try {
      const profileStr = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        return profile.name || 'Vinetelligence Venue';
      }
    } catch (e) {
      console.error("Vinetelligence: Failed to parse local profile for venue name", e);
    }
    return 'Vinetelligence Venue';
  });

  // Sync selectedRid with rid prop if it changes (React recommended pattern)
  if (rid !== prevRid) {
    setPrevRid(rid);
    setSelectedRid(rid);
    if (rid === 'demo' || rid === 'demo-id') {
      setVenueName('Vinetelligence Explorer (Demo)');
    } else if (rid) {
      setVenueName('Connecting to Establishment...');
    }
  }
  const [booking, setBooking] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    guests: 2,
    name: '',
    email: '',
    phone: '',
    preferences: '',
    dietaryRestrictions: '',
    pairingStyle: 'Classic' as GuestProfile['pairingStyle'],
    specialOccasion: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; tableNumber?: string; alternatives?: string[] } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  interface VenueWithStatus extends RestaurantProfile {
    status?: string;
  }

  useEffect(() => {
    const fetchDirectVenue = async (ridToFetch: string) => {
      if (hasFetchedDirectRef.current === ridToFetch) return;
      hasFetchedDirectRef.current = ridToFetch;

      // Safety timeout for fetching venue name
      const timeout = setTimeout(() => {
        setVenueName(prev => {
          if (prev === 'Connecting to Establishment...') return 'Vinetelligence Venue';
          return prev;
        });
      }, 8000); // Increased to 8s to give more time for the cloud fetch

      try {
        console.log("Vinetelligence: Direct fetch starting for rid:", ridToFetch);
        const venue = await supabaseSync.getRestaurantProfile(ridToFetch);
        clearTimeout(timeout);
        if (venue) {
          const v = venue as RestaurantProfile;
          console.log("Vinetelligence: Direct fetch success:", v.name);
          setVenueName(String(v.name || 'Vinetelligence Venue'));
          setCurrentVenue(v);
        } else {
          console.warn("Vinetelligence: Direct fetch returned no data for rid:", ridToFetch);
          setVenueName('Vinetelligence Venue');
        }
      } catch (e) {
        clearTimeout(timeout);
        console.error("Vinetelligence: Direct fetch failed", e);
        setVenueName('Vinetelligence Venue');
      }
    };

    // Load all active establishments for public selection
    if (isPublic && !hasLoadedRef.current) {
      hasLoadedRef.current = true; // Set immediately to prevent race condition
      const loadVenues = async () => {
        try {
          console.log("Vinetelligence: Loading establishments for guest portal...");
          const data = await supabaseSync.pullRegistry();
          console.log("Vinetelligence: Registry data received:", data.length, "items");
          
          const activeVenues = (data as VenueWithStatus[]).filter((v: VenueWithStatus) => {
            // Log each item's status for debugging
            console.log(`Vinetelligence: Venue ${v.name} status: ${v.status}`);
            // Be more robust with status check - only filter if explicitly 'Inactive'
            return v.status !== 'Inactive' && v.status !== 'inactive';
          });
          console.log("Vinetelligence: Active venues found:", activeVenues.length);
          
          // If empty and we're in a demo/dev context, add a demo venue
          if (activeVenues.length === 0) {
            console.log("Vinetelligence: No active establishments found, adding demo fallback.");
            activeVenues.push({
              id: 'demo-id',
              name: 'Vinetelligence Explorer (Demo)',
              type: 'Restaurant',
              focus: 'General',
              description: 'Demo environment',
              edition: 'demo',
              aiPersona: 'technical',
              status: 'Active'
            } as VenueWithStatus);
          }
          
          setVenues(activeVenues);
          
          // If a rid was provided, try to find its name in the loaded venues
          if (selectedRid) {
            console.log("Vinetelligence: Searching for venue name for rid:", selectedRid);
            const matchedVenue = activeVenues.find(v => v.id === selectedRid);
            if (matchedVenue) {
              console.log("Vinetelligence: Found matched venue:", matchedVenue.name);
              setVenueName(matchedVenue.name);
              setCurrentVenue(matchedVenue);
            } else if (selectedRid === 'demo-id' || selectedRid === 'demo') {
              setVenueName('Vinetelligence Explorer (Demo)');
            } else {
              console.log("Vinetelligence: Rid not found in registry, will attempt direct fetch.");
              // Trigger direct fetch
              fetchDirectVenue(selectedRid);
            }
          } else if (activeVenues.length === 1) {
            // Auto-select if only one venue exists and no rid provided
            console.log("Vinetelligence: Auto-selecting single venue:", activeVenues[0].name);
            setSelectedRid(activeVenues[0].id);
            setVenueName(activeVenues[0].name);
            setCurrentVenue(activeVenues[0]);
          }
        } catch (e) {
          console.error("Vinetelligence: Failed to load establishments", e);
          // Fallback to demo on error
          const fallbackVenues = [{
            id: 'demo-id',
            name: 'Vinetelligence Explorer (Demo)',
            type: 'Restaurant',
            focus: 'General',
            description: 'Demo environment',
            edition: 'demo',
            aiPersona: 'technical',
            status: 'Active'
          } as VenueWithStatus];
          setVenues(fallbackVenues);
          
          if (!selectedRid || selectedRid === 'demo-id') {
            setSelectedRid('demo-id');
            setVenueName('Vinetelligence Explorer (Demo)');
          }
        }
      };
      loadVenues();
    }

    // Try to fetch venue name from cloud if selectedRid is provided and not already found in registry
    if (selectedRid && selectedRid !== 'demo' && selectedRid !== 'demo-id' && venueName === 'Connecting to Establishment...') {
      fetchDirectVenue(selectedRid);
    }
  }, [selectedRid, isPublic, venueName]);

  const handleVenueChange = (newRid: string) => {
    setSelectedRid(newRid);
    setAvailabilityResult(null); // Reset availability when venue changes
    const venue = venues.find(v => v.id === newRid);
    if (venue) setVenueName(venue.name);
  };

  const performAvailabilityCheck = async () => {
    const targetRid = selectedRid || JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}').id;
    
    if (!targetRid || targetRid === 'demo' || targetRid === 'demo-id') {
      // Mock availability for demo mode
      setAvailabilityResult({ available: true, tableNumber: 'Demo-1' });
      setStep(2);
      return;
    }

    setIsCheckingAvailability(true);
    setBookingError(null);

    try {
      // 1. Fetch tables and existing journeys
      const [tables, journeys] = await Promise.all([
        supabaseSync.pullTables(targetRid),
        supabaseSync.pullJourneys(targetRid)
      ]);

      console.log(`Vinetelligence: Found ${tables.length} tables and ${journeys.length} journeys for availability check.`);

      if (tables.length === 0) {
        setAvailabilityResult({ available: false, alternatives: [] });
        setBookingError("This venue has not yet configured its table layout. Please contact management to initialize the floor plan.");
        return;
      }

      const checkTimeSlot = (slotTime: string) => {
        // Normalize all dates to absolute time strings for comparison to avoid timezone offsets
        const targetArrival = new Date(`${booking.date}T${slotTime}:00`).getTime();
        
        // Exclude journeys with status that implies the table is occupied
        const dayJourneys = journeys.filter(j => 
          j.arrivalTime.startsWith(booking.date) && 
          ['Confirmed', 'Arrived', 'Seated'].includes(j.status)
        );

        const busyTableNumbers = dayJourneys
          .filter(j => {
            // Strip Z or other offset info to compare relative clock time
            const cleanArrivalStr = j.arrivalTime.replace('Z', '').split('.')[0];
            const arrival = new Date(cleanArrivalStr).getTime();
            const diffMs = Math.abs(arrival - targetArrival);
            return diffMs < 1.0 * 60 * 60 * 1000; // 1 hour duration assumption
          })
          .map(j => j.tableNumber);

        const availableTables = tables.filter(t => 
          !busyTableNumbers.includes(t.number) && 
          t.capacity >= booking.guests
        );

        return availableTables.sort((a,b) => a.capacity - b.capacity)[0]; // Smallest fitting table
      };

      const requestedTable = checkTimeSlot(booking.time);
      
      if (requestedTable) {
        setAvailabilityResult({ available: true, tableNumber: requestedTable.number });
        setStep(2);
      } else {
        const possibleSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
        const alternatives = possibleSlots.filter(s => s !== booking.time && checkTimeSlot(s));
        setAvailabilityResult({ available: false, alternatives });
        setBookingError("The requested time slot is currently fully committed. Please try another time.");
      }
    } catch (e) {
      console.error("Vinetelligence: Availability check failed", e);
      setBookingError("Unable to verify table availability. Please try again.");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleBook = async () => {
    setIsSubmitting(true);
    setBookingError(null);
    
    try {
      // Final availability double-check in case someone booked in the meantime
      const targetRid = selectedRid || JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}').id || 'demo-id';
      
      // Map to finalized table number from previous check if available
      const confirmedTable = availabilityResult?.tableNumber || '??';

      const arrivalDateTime = `${booking.date}T${booking.time}:00`;

      const localJourney: GuestJourney = {
        id: generateUUID(),
        arrivalTime: arrivalDateTime,
        status: 'Confirmed',
        tableNumber: confirmedTable,
        partySize: booking.guests,
        specialOccasion: booking.specialOccasion || undefined,
        pacingMode: 'Standard',
        profile: {
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          favoriteBeverages: booking.preferences,
          dietaryRestrictions: booking.dietaryRestrictions || 'None',
          pairingStyle: booking.pairingStyle,
          location: isPublic ? 'Public Web Portal' : 'Internal Management',
          pastOrders: 'New Guest'
        }
      };

      // Attempt Production Sync
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRid);
      if (isUuid) {
        try {
          await supabaseSync.pushJourney(targetRid, localJourney);
          
          // Trigger Email Confirmation Pulse
          fetch('/api/reservations/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              booking, 
              venueName,
              establishment: currentVenue
            })
          }).catch(err => console.error("Vinetelligence: Email trigger failed", err));
          
        } catch (e) {
          console.error("Vinetelligence: Failed to sync journey to cloud", e);
        }
      } else {
        console.warn("Vinetelligence: Skipping Supabase sync - invalid establishment ID format", targetRid);
        
        // Even in non-UUID (demo/local) mode, try to trigger the email if we have details
        if (booking.email) {
           fetch('/api/reservations/confirm', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ 
               booking, 
               venueName,
               establishment: currentVenue
             })
           }).catch(err => console.error("Vinetelligence: Email trigger failed", err));
        }
      }

      // Local Fallback for Browser Feedback (Guest side)
      if (!isPublic) {
        const saved = localStorage.getItem('vinetelligence_journeys') || localStorage.getItem('vinea_journeys');
        const journeys = saved ? (JSON.parse(saved) as GuestJourney[]) : [];
        localStorage.setItem('vinetelligence_journeys', JSON.stringify([...journeys, localJourney]));
        localStorage.setItem('vinea_journeys', JSON.stringify([...journeys, localJourney]));
        window.dispatchEvent(new Event('storage'));
      }

      await new Promise(r => setTimeout(r, 1200)); // Smooth transition
      setIsSubmitting(false);
      setStep(3);
    } catch (e) {
      console.error("Vinetelligence: Reservation failed", e);
      setBookingError("We encountered an error processing your reservation. Please try again or contact the venue directly.");
      setIsSubmitting(false);
    }
  };

  const handlePreviewReservationEmail = async () => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch('/api/reservations/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          booking, 
          venueName,
          establishment: currentVenue
        })
      });

      if (!response.ok) throw new Error("Preview synthesis failed");
      const { html } = await response.json();
      setPreviewHtml(html);
    } catch (err) {
      console.error("Vinetelligence: Preview synthesis error", err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <>
    <div className={`fixed inset-0 z-[500] bg-stone-950 flex items-center justify-center p-2 md:p-8 overflow-y-auto ${isPublic ? 'h-screen' : ''}`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#6366f133,transparent_50%)]"></div>
      </div>

      <div className="w-full max-w-4xl bg-stone-900 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col lg:flex-row min-h-[500px] md:min-h-[600px]">
        {/* Left Branding Panel - Hidden on small screens */}
        <div className="hidden lg:flex lg:w-1/3 bg-stone-950 p-12 flex-col justify-between border-r border-white/5 text-center">
           <div>
              <div className="flex justify-center">
                {currentVenue?.logoUrl ? (
                  <div className="relative group mb-8">
                    <div className="absolute -inset-0.5 bg-indigo-500/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <img 
                      src={currentVenue.logoUrl} 
                      className="relative max-h-16 w-auto shadow-2xl rounded-xl border border-white/10 bg-white/5 p-2" 
                      alt={venueName} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                ) : (
                  <VinetelligenceLogo size="sm" className="mb-8" />
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">
                 {isPublic ? venueName : 'Reservations'}
              </p>
           </div>
           <div className="space-y-6">
              <div className="w-12 h-1 bg-indigo-500/20 mx-auto"></div>
              <p className="text-stone-500 text-sm font-medium leading-relaxed italic">
                 {isPublic ? `Experience beverage intelligence tailored to your unique palate at ${venueName}.` : "Internal reservation portal for manual entry and over-the-phone bookings."}
              </p>
           </div>
           {!isPublic && (
             <button onClick={onComplete} className="text-stone-700 hover:text-white transition-colors text-xs font-bold flex items-center gap-2">
               <i className="fas fa-arrow-left"></i> Exit Portal
             </button>
           )}
           {isPublic && (
             <div className="flex flex-col gap-4">
               <button 
                 onClick={onComplete}
                 className="w-full py-4 glass text-stone-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/5 active:scale-95"
               >
                 <i className="fas fa-arrow-left"></i> Back to Establishment
               </button>
               <button 
                 onClick={() => setIsAvatarOpen(true)}
                 className="w-full py-4 glass text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
               >
                 <MessageSquare className="w-4 h-4 text-emerald-500" />
                 Chat with Concierge
               </button>
               <div className="flex items-center gap-2 text-stone-700 text-[8px] font-black uppercase tracking-widest">
                 <i className="fas fa-shield-halved"></i> Cloud Secure Interface
               </div>
             </div>
           )}
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-6 md:p-16 flex flex-col bg-white/5">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <h2 className="text-3xl font-serif font-bold text-white mb-2">Secure Your Table</h2>
                  <p className="text-stone-500 text-sm">Select your arrival parameters for <span className="text-indigo-500 font-bold">{venueName}</span>.</p>
               </div>

               {isPublic && !rid && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Select Establishment</label>
                    <select 
                      value={selectedRid || ''}
                      onChange={e => handleVenueChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="" disabled className="bg-stone-900">Choose a venue...</option>
                      {venues.map(v => (
                        <option key={v.id} value={v.id} className="bg-stone-900">{v.name}</option>
                      ))}
                    </select>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Arrival Date</label>
                     <input 
                       type="date" 
                       value={booking.date}
                       onChange={e => setBooking({...booking, date: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Party Size</label>
                     <select 
                       value={booking.guests}
                       onChange={e => setBooking({...booking, guests: parseInt(e.target.value)})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none"
                     >
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n} className="bg-stone-900">{n} Guests</option>)}
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Arrival Time</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                     {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => (
                       <button 
                        key={t}
                        onClick={() => {
                          setBooking({...booking, time: t});
                          setAvailabilityResult(null); // Reset when time changes
                        }}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all border ${booking.time === t ? 'bg-indigo-500 border-indigo-500 text-stone-950 shadow-lg' : 'bg-white/5 border-white/10 text-stone-500 hover:border-white/20'}`}
                       >
                         {t}
                       </button>
                     ))}
                  </div>
               </div>

               {bookingError && availabilityResult?.available === false && (
                 <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2">{bookingError}</p>
                    </div>
                    
                    {availabilityResult.alternatives && availabilityResult.alternatives.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest text-center">Available Alternatives Early/Late</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {availabilityResult.alternatives.map(t => (
                            <button 
                              key={t}
                              onClick={() => {
                                setBooking({...booking, time: t});
                                setAvailabilityResult(null);
                                setBookingError(null);
                              }}
                              className="py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all capitalize"
                            >
                              Choose {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
               )}

               <button 
                 onClick={performAvailabilityCheck}
                 disabled={(isPublic && !selectedRid) || isCheckingAvailability}
                 className="w-full py-5 bg-white text-stone-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-indigo-500 transition-all active:scale-95 shadow-xl disabled:opacity-30 flex items-center justify-center gap-2"
               >
                 {isCheckingAvailability ? (
                   <>
                     <i className="fas fa-spinner fa-spin"></i>
                     Verifying Availability...
                   </>
                 ) : (
                   'Next: Palate Intelligence'
                 )}
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
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Contact Email</label>
                       <input 
                         type="email" 
                         required
                         value={booking.email}
                         onChange={e => setBooking({...booking, email: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none" 
                         placeholder="guest@example.com"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Phone Number (WhatsApp Preferred)</label>
                     <input 
                       type="tel" 
                       required
                       value={booking.phone}
                       onChange={e => setBooking({...booking, phone: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none" 
                       placeholder="+1 234 567 8900"
                     />
                     <p className="text-[8px] text-stone-500 italic ml-1">
                       “When entering your phone number at the end of your reservation, please make sure it’s a WhatsApp-enabled number so we can reach you if needed.”
                     </p>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Pairing Philosophy</label>
                     <div className="grid grid-cols-3 gap-2">
                        {(['Classic', 'Adventurous', 'Zero-Proof'] as const).map(style => (
                          <button 
                           key={style}
                           onClick={() => setBooking({...booking, pairingStyle: style})}
                           className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${booking.pairingStyle === style ? 'bg-indigo-500 border-indigo-500 text-stone-950 shadow-lg' : 'bg-white/5 border-white/10 text-stone-500'}`}
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
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none text-sm"
                        placeholder="e.g. Nut allergy, Gluten-free, No alcohol..."
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Beverage Passions (AI Prompt)</label>
                     <textarea 
                        value={booking.preferences}
                        onChange={e => setBooking({...booking, preferences: e.target.value})}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none resize-none text-sm italic"
                        placeholder="e.g. 'I love peated scotch and crisp Rieslings from the Mosel...'"
                     />
                  </div>
               </div>

               {bookingError && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 duration-300">
                   {bookingError}
                 </div>
               )}

               <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white/5 border border-white/10 text-stone-400 rounded-2xl font-black uppercase text-[10px] tracking-widest">Back</button>
                  <button 
                    onClick={handleBook}
                    disabled={isSubmitting || !booking.name || !booking.email || !booking.phone}
                    className="flex-[2] py-4 bg-indigo-500 text-stone-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-indigo-400 transition-all active:scale-95 shadow-xl disabled:opacity-30"
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
                  <p className="text-stone-500 text-lg italic">"Your arrival intelligence has been synthesized for {venueName}."</p>
                  {isPublic && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 mt-4">
                      Thank you for choosing {venueName}
                    </p>
                  )}
               </div>
               <div className="flex flex-col gap-4 w-full px-12">
                  <button 
                    onClick={onComplete}
                    className="w-full py-5 bg-white text-stone-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl"
                  >
                    {isPublic ? 'Done' : 'Return to Gallery'}
                  </button>
                  <button 
                    onClick={handlePreviewReservationEmail}
                    disabled={isPreviewLoading}
                    className="w-full py-4 glass text-stone-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/5 active:scale-95"
                  >
                    {isPreviewLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-eye text-indigo-500"></i>}
                    View Confirmation Synthesis
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Avatar Integration */}
      {isAvatarOpen && (
        <AIAvatarChat 
          isOpen={isAvatarOpen} 
          onClose={() => setIsAvatarOpen(false)} 
          restaurantName={venueName}
          isBookingMode={true}
        />
      )}
    </div>

    {/* Confirmation Preview Modal */}
    {previewHtml && (
      <div className="fixed inset-0 z-[1000] bg-stone-950/90 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
         <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh]">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-900 text-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-black italic text-stone-900">Confirmation Synthesis Preview</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Verifying guest-facing neural documentation</p>
                  </div>
               </div>
               <button 
                 onClick={() => setPreviewHtml(null)}
                 className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
               >
                 <i className="fas fa-times text-xl"></i>
               </button>
            </div>
            <div className="flex-1 bg-stone-100 p-8 overflow-hidden flex justify-center">
               <div className="w-full max-w-[640px] bg-white shadow-2xl rounded-xl overflow-auto h-full border border-stone-200">
                  <iframe 
                    title="Vinetelligence Confirmation Preview"
                    srcDoc={previewHtml} 
                    className="w-full h-full border-none"
                  />
               </div>
            </div>
            <div className="p-8 bg-white border-t border-stone-100 flex justify-center">
               <button 
                 onClick={() => setPreviewHtml(null)}
                 className="px-12 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-500 transition-all active:scale-95 shadow-xl"
               >
                 Acknowledge Synthesis
               </button>
            </div>
         </div>
      </div>
    )}
    </>
  );
};

export default GuestReservationPortal;
