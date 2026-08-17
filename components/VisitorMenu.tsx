
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InventoryItem, ServiceOrder, OrderItem, Table, RestaurantProfile, AIPairingSuggestion, GuestFeedback } from '../lib/types';
import { geminiService } from '../services/geminiService';
import { generateUUID } from '../services/supabaseSync';
import { GoogleGenAI, Modality } from "@google/genai";
import { getApiKey } from '../services/geminiService';
import { db, isFirebaseConfigured } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

import { SectorInterestPoll } from './SectorInterestPoll';

interface VisitorMenuProps {
  table: Table;
  inventory: InventoryItem[];
  onPlaceOrder: (items: OrderItem[]) => void;
  activeOrders: ServiceOrder[];
  onExit: () => void;
  restaurantProfile?: RestaurantProfile | null;
}

const VisitorMenu: React.FC<VisitorMenuProps> = ({ table, inventory, onPlaceOrder, activeOrders, onExit, restaurantProfile }) => {
  const isRuthChris = useMemo(() => {
    const profile = restaurantProfile || JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
    return profile && (profile.name?.includes("Ruth's Chris") || ('isRuthChris' in profile && (profile as unknown as { isRuthChris?: boolean }).isRuthChris));
  }, [restaurantProfile]);

  const isVinea = useMemo(() => {
    const profile = restaurantProfile || JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
    return profile && (profile.name?.toLowerCase().includes("vinea") || profile.id === 'demo-id' || localStorage.getItem('platform_selected_app') === 'vinea');
  }, [restaurantProfile]);

  const getCategoryLabel = (cat: string) => {
    if (!isRuthChris) return cat;
    switch (cat) {
      case 'Dinner': return 'Steaks & Entrées';
      case 'Snack': return 'Signature Sides';
      case 'Wine': return 'Reserve Wines';
      case 'Cocktail': return 'Handcrafted Cocktails';
      default: return cat;
    }
  };

  const [view, setView] = useState<'welcome' | 'menu' | 'sommelier' | 'tab' | 'exit'>('welcome');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [showQuickModFor, setShowQuickModFor] = useState<InventoryItem | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'vinetelligence', text: string}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSettlementRequested, setIsSettlementRequested] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [pairingSuggestions, setPairingSuggestions] = useState<AIPairingSuggestion[]>([]);
  const [isLoadingPairings, setIsLoadingPairings] = useState(false);
  
  // Neuromarketing States
  const [neuromarketingEnabled, setNeuromarketingEnabled] = useState(true);
  const [hideCurrencyTrigger, setHideCurrencyTrigger] = useState(true);
  const [nestedSubtlePrice, setNestedSubtlePrice] = useState(true);
  const [sensoryDescriptions, setSensoryDescriptions] = useState(true);
  const [premiumAnchoring, setPremiumAnchoring] = useState(true);
  const [showLabsPanel, setShowLabsPanel] = useState(false);

  const enrichDescriptionWithSensoryDetails = (item: InventoryItem) => {
    if (!item.description) {
      return 'Artisanal selection curated for technical flavor profiles.';
    }

    const desc = item.description;

    if (!neuromarketingEnabled || !sensoryDescriptions) {
      return desc;
    }

    const nameLower = item.name.toLowerCase();
    const cat = item.category;

    if (cat === 'Wine') {
      if (nameLower.includes('cabernet') || nameLower.includes('oak') || nameLower.includes('red') || nameLower.includes('bordeaux')) {
        return `An incredibly structured and hand-harvested selection. Displays a velvety bouquet of sun-ripened dark currants, culinary warm spices, and a long, structured finish that lingers elegantly on the palate.`;
      }
      if (nameLower.includes('chardonnay') || nameLower.includes('white') || nameLower.includes('sauvignon') || nameLower.includes('veuve')) {
        return `Exquisitely bright and refreshing, showcasing crisp orchard apple blossoms, hand-shaven citrus zest, and a soft, mineral-kissed creamy finish.`;
      }
      return `${desc} Expressive, finely detailed, and showing stunning aromatic complexity with a silky texture and persistent finish.`;
    }

    if (cat === 'Dinner' || nameLower.includes('steak') || nameLower.includes('ribeye') || nameLower.includes('filet')) {
      return `Masterfully oak-fired and seared at 1800°F to unlock caramelized, buttery exterior textures while sealing in premium, tender juices. Finished under a sizzling crown of herb butter.`;
    }

    if (cat === 'Snack' || nameLower.includes('sides') || nameLower.includes('crab') || nameLower.includes('potato')) {
      if (nameLower.includes('crab') || nameLower.includes('cake')) {
        return `Featuring colossal lump blue crab meat, delicately bound with zero filler, pan-caramelized to a shimmering gold and kissed with a bright lemon-butter emulsion.`;
      }
      return `Crafted using sweet farm cream, hand-churned sea-salt butter, and organic chives, slow-baked until aromatic with a golden crust.`;
    }

    if (cat === 'Cocktail' || cat === 'Spirit' || nameLower.includes('shaker') || nameLower.includes('old fashioned')) {
      return `A majestic, slow-stirred legacy mix, double-strained over custom hand-cut crystal ice. Accented with cold-pressed orange oils and rare aromatic botanicals.`;
    }

    return `${desc} Finished with micro-herbs, exquisite textures, and a harmonious balance of sweet-savory notes.`;
  };
  
  // Feedback States
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackGuestName, setFeedbackGuestName] = useState(table.occupantName || '');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const categories = useMemo(() => {
    const standardCats = ['Wine', 'Beer', 'Cocktail', 'Spirit', 'Lunch', 'Dinner', 'Snack'];
    const cats = Array.from(new Set([...standardCats, ...inventory.map(i => i.category)]));
    return cats.sort();
  }, [inventory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const fetchPairings = async () => {
      if (inventory.length === 0) return;
      setIsLoadingPairings(true);
      try {
        const foodItems = inventory.filter(i => i.category === 'Lunch' || i.category === 'Dinner' || i.category === 'Snack');
        const beverageInventory = inventory.filter(i => i.category === 'Wine' || i.category === 'Beer' || i.category === 'Cocktail' || i.category === 'Spirit');
        if (foodItems.length > 0 && beverageInventory.length > 0) {
          const suggestions = await geminiService.getAIPairingSuggestions(foodItems, beverageInventory);
          setPairingSuggestions(suggestions);
        }
      } catch (e) {
        console.error("Vinetelligence: Failed to fetch pairing suggestions", e);
      } finally {
        setIsLoadingPairings(false);
      }
    };
    fetchPairings();
  }, [inventory]);

  const handlePlayAudio = async (item: InventoryItem) => {
    if (playingAudioId === item.id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(item.id);
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        console.warn("Vinetelligence: API Key missing for audio generation");
        setPlayingAudioId(null);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Describe this beverage elegantly: ${item.name}. ${item.description || 'A fine selection.'}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          audioRef.current.onended = () => setPlayingAudioId(null);
        } else {
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.play();
          audio.onended = () => setPlayingAudioId(null);
        }
      }
    } catch (error) {
      console.error("Vinetelligence: Audio generation failed", error);
      setPlayingAudioId(null);
    }
  };

  const calculateModifierPrice = (basePrice: number, modifier?: string, category?: string) => {
    if (!modifier) return basePrice;
    
    // Spirit/Mixer pricing logic
    if (category === 'Spirit' || category === 'Mixer') {
      switch (modifier) {
        case 'Double': return basePrice * 1.8;
        case 'Rocks':
        case 'On the Rocks': return basePrice + 2;
        case 'Mix':
        case 'Measurement Mix': return basePrice + 3;
        case 'Neat': return basePrice;
        case 'Shot': return basePrice * 0.6;
        default: return basePrice;
      }
    }
    
    // Cocktail/Wine/Other pricing logic
    switch (modifier) {
      case 'Rocks':
      case 'On the Rocks': return basePrice + 2;
      case 'Neat': return basePrice;
      default: return basePrice;
    }
  };

  const addToCart = (item: InventoryItem, modifier?: string) => {
    if (!modifier && (item.category === 'Spirit' || item.category === 'Mixer' || item.category === 'Cocktail')) {
      setShowQuickModFor(item);
      return;
    }

    const price = calculateModifierPrice(item.price, modifier, item.category);
    
    const newItem: OrderItem = {
      id: generateUUID(),
      name: item.name,
      quantity: 1,
      status: 'Pending',
      prepType: (item.category === 'Lunch' || item.category === 'Dinner' || item.category === 'Cocktail' || item.category === 'Snack') ? 'Complex' : (item.category === 'Mixer' ? 'Mix' : 'Pour'),
      priceAtOrder: price,
      style: item.category,
      modifier: modifier
    };

    setCartItems(prev => [...prev, newItem]);
    setShowQuickModFor(null);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => {
      const index = [...prev].reverse().findIndex(item => inventory.find(inv => inv.name === item.name)?.id === id);
      if (index === -1) return prev;
      const actualIndex = prev.length - 1 - index;
      const next = [...prev];
      next.splice(actualIndex, 1);
      return next;
    });
  };

  const cartTotal: number = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0);
  }, [cartItems]);

  const cartCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cartItems.forEach(item => {
      const invItem = inventory.find(inv => inv.name === item.name);
      if (invItem) {
        counts[invItem.id] = (counts[invItem.id] || 0) + 1;
      }
    });
    return counts;
  }, [cartItems, inventory]);

  const handleCheckout = async () => {
    if (cartItems.length === 0 || isProcessingOrder) return;
    
    // Payment is only required for Kiosk mode (if we had one) or if explicitly desired.
    // The user requested that seated guests at a table on the floor should NOT use 'pay before fire'.
    const isKiosk = table.number.toLowerCase().includes('kiosk');
    
    if (isKiosk && !paymentStep) {
      setPaymentStep(true);
      return;
    }

    setIsProcessingOrder(true);
    try {
      // Update local table occupant if not set
      const currentTables = JSON.parse(localStorage.getItem('vinetelligence_tables') || localStorage.getItem('vinea_tables') || '[]');
      const updatedTables = currentTables.map((t: Table) => 
        t.id === table.id ? { ...t, status: 'Occupied', occupantName: t.occupantName || 'Guest (Portal)' } : t
      );
      localStorage.setItem('vinetelligence_tables', JSON.stringify(updatedTables));
      localStorage.setItem('vinea_tables', JSON.stringify(updatedTables));
      
      await new Promise(r => setTimeout(r, 1200));
      
      onPlaceOrder(cartItems);
      setCartItems([]);
      setPaymentStep(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 4000);
      setView('tab');
      
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Vinetelligence: Checkout failed", e);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent, overrideMsg?: string) => {
    if (e) e.preventDefault();
    const msg = overrideMsg || chatInput;
    if (!msg.trim() || isThinking) return;
    
    if (!overrideMsg) setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsThinking(true);

    try {
      const response = await geminiService.getTrainingResponse(`As an elegant restaurant sommelier, answer this guest question: ${msg}`, []);
      setChatHistory(prev => [...prev, { role: 'vinetelligence', text: response }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'vinetelligence', text: "I apologize, my knowledge archives are temporarily unreachable. How else may I assist you?" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAskAboutItem = (itemName: string) => {
    setView('sommelier');
    handleChatSubmit(undefined, `Tell me more about the ${itemName}. What are its tasting notes and a recommended food pairing?`);
  };

  const currentTabTotal = useMemo(() => {
    return activeOrders.reduce((sum, order) => {
      return sum + order.items.reduce((iSum, i) => iSum + (i.priceAtOrder * i.quantity), 0);
    }, 0);
  }, [activeOrders]);

  if (view === 'welcome') {
    return (
      <div className={`fixed inset-0 z-[700] h-full w-full ${isVinea ? 'bg-stone-950' : 'bg-indigo-950'} flex flex-col items-center p-4 md:p-12 text-center relative overflow-y-auto custom-scrollbar font-serif`}>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-20 scale-110 fixed"></div>
         <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] fixed"></div>
         
         <div className="relative z-10 space-y-6 md:space-y-12 animate-in fade-in zoom-in duration-1000 w-full max-w-lg my-auto py-8 md:py-12">
            <div className="space-y-4">
               <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.7em] text-amber-500 block">
                 {isRuthChris ? "ESTABLISHED 1965 • NEW ORLEANS" : "ESTABLISHED 2025"}
               </span>
               <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-stone-100 tracking-tighter italic leading-none drop-shadow-2xl">
                 {restaurantProfile?.name || (isVinea ? 'Vinea Enterprise' : 'Vinetelligence')}
               </h1>
               <div className={`h-[1px] w-24 md:w-40 ${isRuthChris ? 'bg-amber-500/60' : (isVinea ? 'bg-amber-500/40' : 'bg-indigo-500/40')} mx-auto mt-4 md:mt-6`}></div>
            </div>
            
            <div className="space-y-2 md:space-y-4">
               <h2 className="text-lg md:text-3xl text-stone-200 italic font-medium">Welcome, Table {table.number}</h2>
               <p className="text-stone-300 text-[10px] md:text-sm max-w-[280px] md:max-w-md mx-auto leading-relaxed">
                 {isRuthChris 
                   ? "Savor our custom 1800°F broiled USDA Prime steaks, legendary sides, and premium wines, served sizzling hot on 500°F butter-topped plates."
                   : "Please enjoy our curated collection of technical vintages and artisanal small plates."}
               </p>
            </div>

            <div className="flex flex-col gap-3 md:gap-4">
              <button 
                onClick={() => setView('menu')}
                className={`px-8 md:px-16 py-4 md:py-7 ${isRuthChris ? 'bg-amber-500 text-[#141414] hover:bg-amber-400' : (isVinea ? 'bg-amber-500 text-stone-950 hover:bg-amber-400' : 'bg-stone-100 text-indigo-950 hover:bg-indigo-50')} rounded-full font-bold uppercase text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.5em] shadow-2xl transition-all active:scale-95`}
              >
                Enter Experience
              </button>
              {restaurantProfile?.edition === 'demo' && (
                <p className={`text-[8px] md:text-[10px] ${isRuthChris ? 'text-amber-500/80' : (isVinea ? 'text-amber-500/80' : 'text-indigo-500/60')} font-black uppercase tracking-widest`}>
                  {isRuthChris ? "Demo Mode: Ruth's Chris Steak House Benchmark" : (isVinea ? "Demo Mode: Vinea Enterprise Guest Portal" : "Demo Mode: Guest Experience")}
                </p>
              )}
            </div>

            {/* Market Intelligence Poll */}
            <div className="pt-8 md:pt-12 border-t border-white/10 hidden sm:block">
               <SectorInterestPoll />
            </div>
         </div>
      </div>
    );
  }

  if (view === 'exit') {
    const handleFeedbackSubmit = async () => {
      if (feedbackRating === 0) return;
      setIsSubmittingFeedback(true);
      try {
        const feedback: GuestFeedback = {
          id: generateUUID(),
          rating: feedbackRating,
          comment: feedbackComment,
          tags: selectedTags,
          sentiment: feedbackRating >= 4 ? 'Positive' : (feedbackRating <= 2 ? 'Negative' : 'Neutral'),
          timestamp: new Date().toISOString(),
          guestName: feedbackGuestName || 'Guest'
        };

        // Save to local storage for now (since we're not using Firestore)
        const existingFeedback = JSON.parse(localStorage.getItem('vinetelligence_feedback') || localStorage.getItem('vinea_feedback') || '[]');
        localStorage.setItem('vinetelligence_feedback', JSON.stringify([...existingFeedback, feedback]));
        localStorage.setItem('vinea_feedback', JSON.stringify([...existingFeedback, feedback]));
        
        // Write to Firestore if connected
        if (isFirebaseConfigured && db) {
          const restaurantId = restaurantProfile?.id || 'demo-id';
          try {
            await setDoc(doc(db, 'restaurants', restaurantId, 'feedback', feedback.id), feedback);
            console.log("Vinetelligence: Successfully synchronized guest feedback to Firestore.");
          } catch (fbErr) {
            console.error("Vinetelligence: Failed to sync feedback to Firestore", fbErr);
          }
        }
        
        setFeedbackSubmitted(true);
        await new Promise(r => setTimeout(r, 1500));
        onExit();
      } catch (e) {
        console.error("Vinetelligence: Failed to save feedback", e);
      } finally {
        setIsSubmittingFeedback(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[700] h-full w-full bg-stone-950 flex flex-col items-center justify-center p-4 md:p-12 text-center relative overflow-y-auto custom-scrollbar font-serif">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-10 grayscale fixed"></div>
         <div className="relative z-10 space-y-4 md:space-y-8 animate-in fade-in zoom-in duration-700 w-full max-w-lg my-auto py-8">
            {!feedbackSubmitted ? (
              <>
                <div className="w-12 h-12 md:w-20 md:h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                   <i className="fas fa-heart text-indigo-500 text-xl md:text-3xl"></i>
                </div>
                <div className="space-y-2 md:space-y-4">
                   <h2 className="text-2xl md:text-5xl font-black text-white italic tracking-tighter">Rate Your Experience</h2>
                   <p className="text-stone-400 text-[10px] md:text-sm max-w-[250px] md:max-w-xs mx-auto leading-relaxed italic">"Your insights refine our scholarship. How was your journey at {restaurantProfile?.name || 'Vinetelligence'}?"</p>
                </div>

                <div className="flex justify-center gap-3 py-2 md:py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className={`text-2xl md:text-3xl transition-all ${feedbackRating >= star ? 'text-indigo-500 scale-110' : 'text-stone-700 hover:text-stone-500'}`}
                    >
                      <i className={`fas fa-star`}></i>
                    </button>
                  ))}
                </div>

                <div className="w-full space-y-4 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Quick Impressions</p>
                    <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                       {[
                         "Exceptional Service", "Expert Guidance", "Perfect Pairing", 
                         "Hidden Gem", "Elegant Vibe", "Scholar's Choice", 
                         "Technical Mastery", "Unforgettable Pour"
                       ].map(tag => (
                         <button
                           key={tag}
                           onClick={() => {
                             setSelectedTags(prev => 
                               prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                             );
                           }}
                           className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all border ${
                             selectedTags.includes(tag)
                               ? 'bg-indigo-500 text-stone-950 border-indigo-500 shadow-lg shadow-indigo-500/20'
                               : 'bg-white/5 text-stone-400 border-white/10 hover:border-white/20'
                           }`}
                         >
                           {tag}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <input
                      type="text"
                      value={feedbackGuestName}
                      onChange={(e) => setFeedbackGuestName(e.target.value)}
                      placeholder="Your Name (Optional)"
                       className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-white text-[11px] md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-stone-600"
                    />
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Optional: Share your thoughts on the experience..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-white text-[11px] md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px] md:min-h-[100px] placeholder:text-stone-600"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 md:gap-3">
                    <button 
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackRating === 0 || isSubmittingFeedback}
                      className="w-full py-3 md:py-4 bg-indigo-500 text-stone-950 rounded-full font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] shadow-2xl hover:bg-indigo-400 transition-all active:scale-95 disabled:opacity-30"
                    >
                      {isSubmittingFeedback ? 'Transmitting...' : 'Submit Feedback'}
                    </button>
                    <button 
                      onClick={onExit}
                      className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
                    >
                      Skip & Exit
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in zoom-in duration-500">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <i className="fas fa-check text-2xl md:text-3xl"></i>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">Thank You</h2>
                  <p className="text-stone-400 text-[11px] md:text-sm italic">"Your feedback has been archived into our intelligence core."</p>
                </div>
              </div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[700] h-full w-full flex flex-col bg-stone-50 overflow-hidden font-serif relative">
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 scroll-smooth pb-40">
        {view === 'menu' && (
          <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
            {/* Hero Lifestyle Image */}
            <div className={`w-full h-32 md:h-48 rounded-2xl md:rounded-[2rem] overflow-hidden relative group shadow-2xl border ${isVinea ? 'border-amber-900/10' : 'border-indigo-900/10'}`}>
               <img 
                src="https://picsum.photos/seed/vinetelligence-hero/1200/600" 
                alt={isVinea ? "Vinea Experience" : "Vinetelligence Experience"} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
               />
              <div className={`absolute inset-0 bg-gradient-to-t ${isVinea ? 'from-stone-950/80 via-stone-950/20' : 'from-indigo-950/80 via-indigo-950/20'} to-transparent flex flex-col justify-end p-4 md:p-8`}>
                <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] ${isVinea ? 'text-amber-500' : 'text-indigo-500'} mb-1 md:mb-2`}>
                  {isVinea ? "The Vinea Enterprise Experience" : "The Vinetelligence Experience"}
                </p>
                <h2 className="text-xl md:text-3xl font-serif font-bold text-white italic tracking-tighter">Curated Intelligence.</h2>
              </div>
            </div>

            <header className="text-center space-y-1 md:space-y-2 pt-2 md:pt-6 relative">
               {restaurantProfile?.edition === 'demo' && (
                 <button 
                   onClick={onExit}
                   className="absolute top-0 right-0 px-2 py-1 md:px-3 md:py-1.5 bg-stone-900 text-white rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/10 hover:bg-stone-800 transition-all active:scale-95"
                 >
                   <i className="fas fa-arrow-left mr-1 md:mr-2"></i> Dashboard
                 </button>
               )}
               <h3 className={`${isVinea ? 'text-amber-950/40' : 'text-indigo-950/40'} font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] text-[8px] md:text-[9px]`}>Technical Selection</h3>
               <h1 className="text-2xl md:text-4xl font-black text-stone-900 tracking-tighter italic">
                 {isVinea ? "The Vinea Enterprise List" : "The Vinetelligence List"}
               </h1>
               <div className="flex justify-center gap-2 mt-1">
                 <span className={`text-[6px] md:text-[7px] font-black uppercase tracking-widest ${isVinea ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-indigo-600/60 bg-indigo-50 border border-indigo-100'} px-2 py-0.5 rounded-full`}>v2.1 Refined</span>
                 <button 
                   onClick={() => setShowLabsPanel(!showLabsPanel)}
                   className="text-[6px] md:text-[7px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                 >
                   <i className="fas fa-brain text-[7px] text-amber-500"></i>
                   <span>Cognitive Labs {neuromarketingEnabled ? 'Active' : 'Disabled'}</span>
                 </button>
               </div>
            </header>

            {/* Cognitive Menu Engineering Labs Panel */}
            {showLabsPanel && (
              <div className="bg-stone-900 text-white rounded-[2rem] p-6 md:p-8 space-y-6 shadow-2xl border border-white/5 animate-in slide-in-from-top-4 duration-500 relative z-[200]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <i className="fas fa-brain text-sm"></i>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-100">Cognitive Menu Engineering Labs</h4>
                      <p className="text-[8px] uppercase tracking-widest font-black text-amber-500">Neuromarketing Optimizations</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowLabsPanel(false)}
                    className="text-stone-400 hover:text-white transition-colors"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                </div>

                <p className="text-[10px] text-stone-300 leading-relaxed font-sans font-light">
                  Traditional menu interfaces list commodity prices prominently, activating the brain’s <span className="text-amber-400 font-bold font-mono">insular pain center</span> associated with losing capital. {isVinea ? "Vinea Labs" : "Vinetelligence Labs"} bypasses this friction by executing verified consumer search, formatting, and behavioral economics formulas. Drag toggles to see instant visual changes on the list.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 font-sans">
                  {/* Toggle 1: Neuro Optimizations Master */}
                  <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Full Optimizations</p>
                      <p className="text-[8px] text-stone-400 tracking-wider font-sans">Execute cognitive design</p>
                    </div>
                    <button 
                      onClick={() => setNeuromarketingEnabled(!neuromarketingEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${neuromarketingEnabled ? 'bg-amber-500' : 'bg-stone-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${neuromarketingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 2: Remove Currency Trigger */}
                  <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white">De-bias Currency Trigger</p>
                      <p className="text-[8px] text-stone-400 tracking-wider font-sans">Remove ($) trigger symbol</p>
                    </div>
                    <button 
                      disabled={!neuromarketingEnabled}
                      onClick={() => setHideCurrencyTrigger(!hideCurrencyTrigger)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${!neuromarketingEnabled ? 'opacity-35 cursor-not-allowed' : ''} ${hideCurrencyTrigger && neuromarketingEnabled ? 'bg-amber-500' : 'bg-stone-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${hideCurrencyTrigger && neuromarketingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 3: Nested Subtle Price */}
                  <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Nested Subtle Price</p>
                      <p className="text-[8px] text-stone-400 tracking-wider font-sans font-sans">Place price inline without lines</p>
                    </div>
                    <button 
                      disabled={!neuromarketingEnabled}
                      onClick={() => setNestedSubtlePrice(!nestedSubtlePrice)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${!neuromarketingEnabled ? 'opacity-35 cursor-not-allowed' : ''} ${nestedSubtlePrice && neuromarketingEnabled ? 'bg-amber-500' : 'bg-stone-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${nestedSubtlePrice && neuromarketingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 4: Sensory Descriptions */}
                  <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Sensory Vocabulary</p>
                      <p className="text-[8px] text-stone-400 tracking-wider font-sans">Evocative visual or taste copy</p>
                    </div>
                    <button 
                      disabled={!neuromarketingEnabled}
                      onClick={() => setSensoryDescriptions(!sensoryDescriptions)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${!neuromarketingEnabled ? 'opacity-35 cursor-not-allowed' : ''} ${sensoryDescriptions && neuromarketingEnabled ? 'bg-amber-500' : 'bg-stone-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${sensoryDescriptions && neuromarketingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Toggle 5: Premium Price Anchoring */}
                  <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Premium Price Anchoring</p>
                      <p className="text-[8px] text-stone-400 tracking-wider font-sans">Sort highest-price signature first</p>
                    </div>
                    <button 
                      disabled={!neuromarketingEnabled}
                      onClick={() => setPremiumAnchoring(!premiumAnchoring)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${!neuromarketingEnabled ? 'opacity-35 cursor-not-allowed' : ''} ${premiumAnchoring && neuromarketingEnabled ? 'bg-amber-500' : 'bg-stone-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${premiumAnchoring && neuromarketingEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="sticky top-0 z-50 bg-stone-50/90 backdrop-blur-md py-2 md:py-3 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-stone-200/50 space-y-2 md:space-y-3">
              <div className="relative group">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-[9px] md:text-[10px] group-focus-within:text-indigo-900 transition-colors"></i>
                <input 
                  type="text"
                  placeholder="Search the list..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-white border border-stone-200 rounded-xl text-[10px] md:text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-900/10 focus:border-indigo-900/30 transition-all shadow-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['All', ...categories].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 md:px-4 py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                      selectedCategory === cat 
                        ? (isRuthChris ? 'bg-amber-500 text-[#141414] border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-indigo-950 text-white border-indigo-950 shadow-lg shadow-indigo-950/20') 
                        : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {cat === 'All' ? 'All' : getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Pairing Suggestions Section */}
            {isLoadingPairings ? (
              <div className="mb-12 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-stone-100 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="w-32 h-3 bg-stone-100 rounded-full"></div>
                  <div className="w-20 h-2 bg-stone-100 rounded-full"></div>
                </div>
              </div>
            ) : pairingSuggestions.length > 0 && (
              <div className="mb-12 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                      <i className="fas fa-sparkles text-sm"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-950">Sommelier's Pairings</h3>
                      <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest italic">AI-Generated Intelligence</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-8 px-8">
                  {pairingSuggestions.map((suggestion, idx) => (
                    <div key={idx} className="min-w-[280px] md:min-w-[320px] bg-white rounded-[2rem] p-6 border border-stone-100 shadow-xl shadow-indigo-950/5 flex flex-col justify-between group hover:border-indigo-200 transition-all">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-900 px-3 py-1 rounded-full border border-indigo-100">
                            {suggestion.foodCategory} + {suggestion.beverageCategory}
                          </span>
                          <i className="fas fa-wine-glass-alt text-indigo-500/30 text-xl group-hover:scale-110 transition-transform"></i>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-stone-800 leading-tight">
                            {suggestion.foodItem}
                          </h4>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            paired with {suggestion.beveragePairing}
                          </p>
                        </div>
                        
                        <p className="text-[11px] text-stone-500 italic leading-relaxed line-clamp-3">
                          "{suggestion.rationale}"
                        </p>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-stone-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                            <i className="fas fa-lightbulb text-[8px]"></i>
                          </div>
                          <span className="text-[9px] font-bold text-stone-400 italic">Insight: {suggestion.pairingInsight}</span>
                        </div>
                        <button 
                          onClick={() => {
                            const food = inventory.find(i => i.name === suggestion.foodItem);
                            const bev = inventory.find(i => i.name === suggestion.beveragePairing);
                            if (food) addToCart(food.id);
                            if (bev) addToCart(bev.id);
                          }}
                          className="w-8 h-8 bg-indigo-950 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all active:scale-90"
                          title="Add both to cart"
                        >
                          <i className="fas fa-plus text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(selectedCategory === 'All' ? categories : [selectedCategory]).map((cat, idx) => {
              const rawItems = inventory.filter(i => 
                i.category === cat && 
                i.stock > 0 &&
                (menuSearch === '' || 
                 i.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                 i.description.toLowerCase().includes(menuSearch.toLowerCase()))
              );
              
              const items = (neuromarketingEnabled && premiumAnchoring)
                ? [...rawItems].sort((a, b) => b.price - a.price)
                : rawItems;
              
              if (items.length === 0) return null;
              return (
                <React.Fragment key={cat}>
                  {/* Lifestyle Image Interjection */}
                  {idx === 1 && selectedCategory === 'All' && (
                    <div className="w-full h-32 rounded-2xl overflow-hidden relative group mb-8 shadow-lg border border-white/10">
                      <img 
                        src="https://picsum.photos/seed/vinetelligence-interior/800/400" 
                        alt="Restaurant Interior" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 to-transparent flex items-end p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Atmospheric Excellence</p>
                      </div>
                    </div>
                  )}

                  {idx === 3 && selectedCategory === 'All' && (
                    <div className="w-full h-32 rounded-2xl overflow-hidden relative group mb-8 shadow-lg border border-white/10">
                      <img 
                        src="https://picsum.photos/seed/vinetelligence-drinks/800/400" 
                        alt="Drinks Sharing" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 to-transparent flex items-end p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">Shared Moments</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h4 className={`text-lg font-bold italic ${isRuthChris ? 'text-amber-600' : 'text-indigo-900'} whitespace-nowrap`}>
                      {getCategoryLabel(cat)}
                    </h4>
                    <div className={`h-[1px] w-full ${isRuthChris ? 'bg-amber-600/10' : 'bg-indigo-900/10'}`}></div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                    {items.map(item => (
                      <div key={item.id} className="group flex gap-3 bg-white p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                        <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 bg-stone-100 rounded-lg md:rounded-xl overflow-hidden relative border border-stone-200">
                           <img 
                             src={`https://picsum.photos/seed/${item.name.replace(/\s/g, '')}/200/200`} 
                             alt={item.name}
                             referrerPolicy="no-referrer"
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                           />
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                           <div className="space-y-0.5 md:space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[11px] md:text-[13px] font-bold text-stone-800 leading-tight">
                                 {item.name}
                                 {neuromarketingEnabled && nestedSubtlePrice && (
                                   <span className="font-sans font-light text-stone-400 text-[10px] ml-2 tracking-tight whitespace-nowrap">
                                     · {hideCurrencyTrigger ? '' : '$'}{parseInt(String(item.price), 10) || item.price}
                                   </span>
                                 )}
                               </span>
                              {(!neuromarketingEnabled || !nestedSubtlePrice) && (
                                <span className={`text-[11px] md:text-[13px] font-black shrink-0 ${isRuthChris ? 'text-amber-500' : 'text-indigo-950'}`}>
                                  {hideCurrencyTrigger && neuromarketingEnabled ? '' : '$'}{item.price}
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] md:text-[10px] text-stone-400 italic line-clamp-2 leading-tight font-medium">
                               {enrichDescriptionWithSensoryDetails(item)}
                            </p>
                          </div>
                          <div className="mt-1 md:mt-2 flex items-center justify-between">
                             <div className="flex items-center gap-1.5 md:gap-3">
                                {cartCounts[item.id] ? (
                                  <div className="inline-flex items-center gap-2 md:gap-3 bg-indigo-950 text-white rounded-full px-2 py-0.5 md:px-3 md:py-1 shadow-md">
                                    <button onClick={() => removeFromCart(item.id)} className="hover:text-indigo-500 transition-colors px-1"><i className="fas fa-minus text-[6px] md:text-[8px]"></i></button>
                                    <span className="text-[9px] md:text-[11px] font-black w-2 md:w-3 text-center">{cartCounts[item.id]}</span>
                                    <button onClick={() => addToCart(item)} className="hover:text-indigo-500 transition-colors px-1"><i className="fas fa-plus text-[6px] md:text-[8px]"></i></button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => addToCart(item)}
                                    className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-stone-600 hover:text-indigo-900 flex items-center gap-1 transition-all active:scale-95 border border-stone-200 px-2 py-0.5 md:px-4 md:py-1.5 rounded-full bg-white shadow-sm"
                                  >
                                    <i className="fas fa-plus"></i> Add
                                  </button>
                                )}
                                <button 
                                  onClick={() => handlePlayAudio(item)}
                                  className={`w-5 h-5 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all ${playingAudioId === item.id ? 'bg-indigo-500 text-indigo-950 animate-pulse' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}`}
                                >
                                  <i className={`fas ${playingAudioId === item.id ? 'fa-pause' : 'fa-volume-up'} text-[7px] md:text-[9px]`}></i>
                                </button>
                             </div>
                             <button 
                               onClick={() => handleAskAboutItem(item.name)}
                               className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-all active:scale-95"
                             >
                               <i className="fas fa-sparkles text-[8px] md:text-[10px]"></i> Insight
                             </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          </div>
        )}

        {view === 'sommelier' && (
          <div className="h-full flex flex-col p-8 md:p-12 space-y-10 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <header className="text-center space-y-2 pt-8">
               <h3 className="text-indigo-600 font-bold uppercase tracking-[0.4em] text-[10px]">Your Digital Expert</h3>
               <h1 className="text-5xl font-black text-indigo-950 italic tracking-tighter">AI Sommelier</h1>
            </header>

            <div className="flex-1 overflow-y-auto space-y-6 min-h-[400px] bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-inner border border-stone-200/50 flex flex-col">
              {chatHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-60">
                   <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-900 shadow-sm border border-indigo-200/50">
                      <i className="fas fa-brain text-4xl"></i>
                   </div>
                   <div className="space-y-2">
                      <p className="text-indigo-950 font-bold text-lg">Inquire with the expert.</p>
                      <p className="text-stone-500 italic leading-relaxed text-sm max-w-xs">Ask about tasting notes, spirit heritage, or food pairings for any item on the list.</p>
                   </div>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                     <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm ${msg.role === 'user' ? 'bg-indigo-950 text-white rounded-br-none' : 'bg-white border border-stone-100 text-stone-800 rounded-bl-none italic font-medium text-sm leading-relaxed'}`}>
                        <p>{msg.text}</p>
                     </div>
                  </div>
                ))
              )}
              {isThinking && (
                <div className="flex justify-start">
                   <div className="bg-white p-4 rounded-full border border-stone-100 flex gap-2 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-indigo-900 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-900 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-900 rounded-full animate-bounce delay-150"></div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="relative mt-auto">
               <input 
                 value={chatInput} 
                 onChange={e => setChatInput(e.target.value)}
                 placeholder="Search our technical archives..."
                 className="w-full px-10 py-6 bg-white border border-stone-200 rounded-full text-sm font-bold focus:outline-none focus:border-indigo-900 shadow-xl transition-all italic placeholder:text-stone-300"
               />
               <button type="submit" disabled={isThinking || !chatInput.trim()} className="absolute right-4 top-4 w-10 h-10 bg-indigo-950 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-30 active:scale-90 transition-transform">
                  <i className="fas fa-paper-plane text-[10px]"></i>
               </button>
            </form>
          </div>
        )}

        {view === 'tab' && (
          <div className="p-8 md:p-12 space-y-12 animate-in slide-in-from-right-4 duration-500">
             <header className="text-center space-y-2 pt-8">
                <h3 className="text-indigo-600 font-bold uppercase tracking-[0.4em] text-[10px]">Your Selection</h3>
                <h1 className="text-5xl font-black text-indigo-950 italic tracking-tighter">Current Tab</h1>
             </header>

             {orderSuccess && (
                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex items-center gap-6 animate-in zoom-in-95 duration-500 shadow-lg shadow-emerald-900/5">
                   <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      <i className="fas fa-check text-xl"></i>
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest italic">Order Received</h4>
                      <p className="text-[11px] text-emerald-700 italic font-medium leading-relaxed">"Your selections have been transmitted. Our team is preparing them for you now."</p>
                   </div>
                </div>
             )}

             <div className="bg-white border border-stone-200 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-receipt text-8xl text-indigo-950"></i></div>
                <div className="space-y-10 relative z-10">
                   <div className="flex justify-between items-end border-b-2 border-stone-50 pb-10">
                      <div>
                         <p className="text-[10px] font-black uppercase text-stone-400 mb-1 tracking-widest">Balance Due</p>
                         <p className="text-6xl font-black text-indigo-950 tracking-tighter italic">${currentTabTotal.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-stone-400 mb-1 tracking-widest">Table</p>
                         <p className="text-3xl font-black text-stone-800 italic">{table.number}</p>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <i className="fas fa-history text-indigo-900/20"></i>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Order History</h4>
                      </div>
                      
                      <div className="space-y-10">
                        {activeOrders.length === 0 ? (
                          <div className="text-center py-20 space-y-4 opacity-30">
                             <i className="fas fa-receipt text-4xl"></i>
                             <p className="text-sm italic font-medium">No rounds fired yet. Visit the menu to begin.</p>
                          </div>
                        ) : (
                          activeOrders.map((order, idx) => (
                            <div key={order.id} className="space-y-6 group">
                               <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                     <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-400 text-[9px] font-black flex items-center justify-center border border-stone-200">
                                        {activeOrders.length - idx}
                                     </span>
                                     <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest italic">
                                        Round {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                  </div>
                                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border ${
                                     order.status === 'Completed' || order.status === 'Ready' 
                                       ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                       : 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse'
                                  }`}>
                                     {order.status}
                                  </span>
                               </div>
                               <div className="space-y-4 pl-9">
                                  {order.items.map((item, i) => (
                                     <div key={i} className="flex justify-between items-baseline group/item">
                                        <div className="flex flex-col">
                                           <div className="flex items-center gap-3">
                                              <span className="text-xs font-black text-indigo-950">{item.quantity}x</span>
                                              <span className="text-sm font-bold text-stone-800 italic group-hover/item:text-indigo-900 transition-colors">{item.name}</span>
                                           </div>
                                           {item.modifier && (
                                              <span className="text-[10px] font-black uppercase text-indigo-600 ml-9 mt-0.5 tracking-widest">
                                                 [{item.modifier}]
                                              </span>
                                           )}
                                        </div>
                                        <div className="flex-1 mx-4 border-b border-dotted border-stone-200"></div>
                                        <span className="text-sm font-bold text-stone-400">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                          ))
                        )}
                      </div>
                   </div>
                </div>
             </div>

            {isSettlementRequested ? (
              <div className="p-12 bg-emerald-50 border-2 border-emerald-100 rounded-[3rem] text-center animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-900/5">
                 <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                   <i className="fas fa-check text-2xl"></i>
                 </div>
                 <h4 className="text-2xl font-black text-emerald-900 mb-2 italic tracking-tighter">Staff Notified</h4>
                 <p className="text-sm text-emerald-700 font-medium italic leading-relaxed">"A team member is on their way to assist with your final settlement. Thank you for visiting."</p>
              </div>
            ) : (
              <button 
                onClick={() => setIsSettlementRequested(true)}
                disabled={activeOrders.length === 0}
                className="w-full py-8 bg-indigo-950 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.5em] shadow-2xl shadow-indigo-950/30 active:scale-95 transition-all disabled:opacity-30 group"
              >
                <span className="group-hover:tracking-[0.7em] transition-all">Request Bill</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Modifier Overlay */}
      {showQuickModFor && (
        <div className="fixed inset-0 z-[800] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 p-8 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-serif font-bold italic text-indigo-950">{showQuickModFor.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Measurement & Mix</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Measurement</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Standard', 'Shot', 'Double'].map(mod => (
                    <button
                      key={mod}
                      onClick={() => addToCart(showQuickModFor, mod as OrderItem['modifier'])}
                      className="py-3 bg-stone-50 border border-stone-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-stone-600 hover:bg-indigo-500 hover:text-indigo-950 transition-all active:scale-95"
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Style & Mix</p>
                <div className="grid grid-cols-2 gap-2">
                  {['On the Rocks', 'Neat', 'Measurement Mix'].map(mod => (
                    <button
                      key={mod}
                      onClick={() => addToCart(showQuickModFor, mod as OrderItem['modifier'])}
                      className="py-3 bg-stone-50 border border-stone-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-stone-600 hover:bg-indigo-500 hover:text-indigo-950 transition-all active:scale-95"
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowQuickModFor(null)}
              className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat Trigger - More compact */}
      {view !== 'sommelier' && (
        <button 
          onClick={() => setView('sommelier')}
          className="fixed bottom-24 right-6 z-[150] w-12 h-12 bg-indigo-500 text-indigo-950 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all active:scale-95 group"
        >
          <i className="fas fa-brain text-lg"></i>
        </button>
      )}

      {/* Floating Order Bar - Ultra-Compact Hospitality Style */}
      {view === 'menu' && cartTotal > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-[140] animate-in slide-in-from-bottom-4">
           {!isProcessingOrder ? (
             <div className="bg-indigo-950 rounded-3xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-white/20">
                {/* Cart Preview (Small Detail) */}
                <div className="hidden sm:block p-3 px-6 bg-black/20 border-b border-white/5">
                   <div className="flex flex-wrap gap-2">
                      {cartItems.slice(0, 3).map((item) => (
                         <span key={item.id} className="text-[8px] font-black uppercase text-stone-400 bg-white/5 px-2 py-0.5 rounded-full">
                            {item.quantity}x {item.name} {item.modifier && `[${item.modifier}]`}
                         </span>
                      ))}
                      {cartItems.length > 3 && (
                         <span className="text-[8px] font-black uppercase text-indigo-500 bg-white/5 px-2 py-0.5 rounded-full">
                            +{cartItems.length - 3} more
                         </span>
                      )}
                   </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className={`w-full text-stone-100 h-10 flex justify-between items-center px-5 transition-all active:scale-[0.98] ${paymentStep ? 'bg-emerald-600 hover:bg-emerald-500' : 'hover:bg-indigo-900'}`}
                >
                   <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm ${paymentStep ? 'bg-white text-emerald-900' : 'bg-indigo-500 text-indigo-950'}`}>
                         {cartItems.length}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {paymentStep ? 'Confirm & Pay' : (table.number.toLowerCase().includes('kiosk') ? 'Review Order' : 'Fire Selections')}
                      </span>
                   </div>
                   <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold italic ${paymentStep ? 'text-white' : 'text-indigo-500'}`}>{hideCurrencyTrigger && neuromarketingEnabled ? '' : '$'}{cartTotal.toFixed(2)}</span>
                      <div className="h-3 w-[1px] bg-white/20"></div>
                      <div className="flex items-center gap-2">
                        <i className={`fas ${paymentStep ? 'fa-credit-card' : 'fa-bolt'} text-[8px] ${!paymentStep ? 'animate-pulse' : ''}`}></i>
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {paymentStep ? 'Pay Now' : (table.number.toLowerCase().includes('kiosk') ? 'Pay' : 'Transmit')}
                        </span>
                      </div>
                   </div>
                </button>
                {paymentStep && (
                  <div className="bg-black/20 p-2 text-center">
                    <button onClick={() => setPaymentStep(false)} className="text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition-colors">
                      <i className="fas fa-arrow-left mr-1"></i> Back to Review
                    </button>
                  </div>
                )}
             </div>
           ) : (
             <button 
               disabled
               className="w-full bg-indigo-950 text-stone-100 h-10 rounded-full shadow-2xl flex justify-center items-center px-5 border border-white/10 opacity-50"
             >
               <i className="fas fa-spinner fa-spin mr-3 text-indigo-500 text-xs"></i>
               <span className="text-[9px] font-black uppercase tracking-widest">Synchronizing Silo...</span>
             </button>
           )}
        </div>
       )}
       {/* Guest Bottom Navigation Bar - Streamlined */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-xl border-t border-stone-200 z-[100] px-6 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button onClick={() => setView('menu')} className={`flex flex-col items-center gap-1 transition-all relative ${view === 'menu' ? (isVinea ? 'text-amber-600' : 'text-indigo-900') : 'text-stone-300 hover:text-stone-600'}`}>
            <i className={`fas fa-wine-glass text-lg ${view === 'menu' ? 'scale-110' : ''}`}></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Menu</span>
            {cartItems.length > 0 && view !== 'menu' && (
              <span className={`absolute -top-1 -right-2 w-3.5 h-3.5 ${isVinea ? 'bg-amber-950' : 'bg-indigo-950'} text-white text-[7px] font-black rounded-full flex items-center justify-center border border-white shadow-sm`}>
                {cartItems.length}
              </span>
            )}
          </button>
         <button onClick={() => setView('sommelier')} className={`flex flex-col items-center gap-1 transition-all ${view === 'sommelier' ? (isVinea ? 'text-amber-600' : 'text-indigo-900') : 'text-stone-300 hover:text-stone-600'}`}>
            <i className={`fas fa-brain text-lg ${view === 'sommelier' ? 'scale-110' : ''}`}></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Expert</span>
         </button>
         <button onClick={() => setView('tab')} className={`flex flex-col items-center gap-1 transition-all relative ${view === 'tab' ? (isVinea ? 'text-amber-600' : 'text-indigo-900') : 'text-stone-300 hover:text-stone-600'}`}>
            <i className={`fas fa-receipt text-lg ${view === 'tab' ? 'scale-110' : ''}`}></i>
            <span className="text-[7px] font-black uppercase tracking-widest">My Tab</span>
            {activeOrders.length > 0 && <span className={`absolute -top-1 -right-2 w-3.5 h-3.5 ${isVinea ? 'bg-amber-500 text-amber-950' : 'bg-indigo-500 text-indigo-950'} text-[7px] font-black rounded-full flex items-center justify-center border border-white shadow-sm`}>{activeOrders.length}</span>}
         </button>
         <button onClick={() => setView('exit')} className={`flex flex-col items-center gap-1 text-stone-300 ${isVinea ? 'hover:text-amber-600' : 'hover:text-indigo-900'} transition-all p-2`}>
            <i className="fas fa-door-open text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Exit</span>
         </button>
      </nav>
    </div>
  );
};

export default VisitorMenu;
