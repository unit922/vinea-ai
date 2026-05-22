
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, Tooltip, Cell,
  PieChart, Pie
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { getApiKey } from '../../services/geminiService';

interface Interaction {
  id: string;
  source: 'Google' | 'Instagram' | 'Phone' | 'Yelp' | 'Twitter';
  type: 'Review' | 'DM' | 'Missed Call' | 'Comment';
  guest: string;
  content: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Critical';
  status: 'Unclaimed' | 'Assigned' | 'Resolved';
  owner: string | null;
  time: string;
}

const ExperienceSentinel: React.FC = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([
    {
      id: 'INT-001',
      source: 'Google',
      type: 'Review',
      guest: 'Robert Chen',
      content: 'The wine selection was great, but we waited 20 minutes for our table even with a reservation. Nobody spoke to us.',
      sentiment: 'Negative',
      status: 'Unclaimed',
      owner: null,
      time: '14m ago'
    },
    {
      id: 'INT-002',
      source: 'Instagram',
      type: 'DM',
      guest: '@sara_wine_lover',
      content: 'Hi! Do you have a private room for a party of 12 next Friday? I sent an email 3 days ago, no reply.',
      sentiment: 'Neutral',
      status: 'Assigned',
      owner: 'AI Sommelier',
      time: '45m ago'
    },
    {
      id: 'INT-003',
      source: 'Phone',
      type: 'Missed Call',
      guest: '+1 (555) 012-3456',
      content: 'Caller hung up after 45 seconds of ringing. No voicemail left.',
      sentiment: 'Critical',
      status: 'Unclaimed',
      owner: null,
      time: '1h ago'
    },
    {
      id: 'INT-004',
      source: 'Yelp',
      type: 'Review',
      guest: 'James T.',
      content: 'ABSOLUTELY INCREDIBLE. The AI pairing logic knew I preferred volcanic soils before I even said anything. Mind blown.',
      sentiment: 'Positive',
      status: 'Resolved',
      owner: 'Manager Admin',
      time: '2h ago'
    }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [draftingInteraction, setDraftingInteraction] = useState<Interaction | null>(null);
  const [aiDraft, setAiDraft] = useState('');
  const [showAuditMetrics, setShowAuditMetrics] = useState(false);
  const [showAlignmentTool, setShowAlignmentTool] = useState(false);
  const [activeAdvisory, setActiveAdvisory] = useState(0);

  const advisories = [
    {
      title: "The Silence Gap",
      quote: "At scale, the gap that keeps widening isn't in operations. It's between what a guest experienced and what we ever found out about it.",
      detail: "Unclaimed DMs, missed calls, and unanswered reviews aren't accidents—they are protocol failures. Scaling requires moving from 'negligence' to 'ownership'.",
      catalyst: "Who owns the silence in your establishment?",
      icon: "fa-microchip"
    },
    {
      title: "The Drakensberg Lesson",
      quote: "Alignment isn't marble floors; it's the warm, unhurried welcome and a steaming mug of rooibos tea.",
      detail: "True luxury is the feeling of arrival. Ensure your 'North Star' values are visible in every small connection, not just in your marketing materials.",
      catalyst: "What is your property's 'Rooibos Tea' moment?",
      icon: "fa-mug-hot"
    },
    {
      title: "Resonance vs. Transaction",
      quote: "A response is a transaction. A resonance is an investment in the next visit.",
      detail: "Standard templates feel like automation because they are. Personalized, empathetic AI-assisted drafts bridge the human gap without sacrificing speed.",
      catalyst: "Is your brand voice a recording or a conversation?",
      icon: "fa-vial"
    }
  ];

  const handleGenerateDraft = async (interaction: Interaction) => {
    setIsGenerating(true);
    setDraftingInteraction(interaction);
    
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        setAiDraft("Intelligence requires a valid API Key to draft responses. Please update your profile settings.");
        setIsGenerating(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are the AI Experience Architect for this high-end luxury establishment.
        Draft a personalized, empathetic, and professional response to the following guest feedback.
        
        Guest Name: ${interaction.guest}
        Feedback Source: ${interaction.source}
        Feedback Type: ${interaction.type}
        Content: "${interaction.content}"
        Sentiment: ${interaction.sentiment}
        
        Guidelines:
        1. Acknowledge their specific concern (if negative/neutral).
        2. Maintain a "Premium & Sophisticated" brand voice.
        3. For negative reviews about service, invite them back for a complimentary tasting.
        4. Keep it under 60 words.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      setAiDraft(response.text || "Could not generate draft. Please try again.");
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiDraft("The Neural Response Engine is currently recalibrating. Please draft manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStage, setSyncStage] = useState('');

  const handleResolve = async (interactionId: string) => {
    setIsSyncing(true);
    
    // Neural Handshake Sequence Simulation
    const stages = [
      'Authenticating Platform API...',
      'Encrypting Payload...',
      'Transmitting Neural Response...',
      'Verifying Distribution...'
    ];

    for (const stage of stages) {
      setSyncStage(stage);
      await new Promise(r => setTimeout(r, 600));
    }

    setInteractions(prev => prev.map(i => 
      i.id === interactionId ? { ...i, status: 'Resolved', owner: 'Neural Sentinel' } : i
    ));
    
    setIsSyncing(false);
    setDraftingInteraction(null);
    setAiDraft('');
    setSyncStage('');
  };

  const stats = useMemo(() => {
    const unclaimed = interactions.filter(i => i.status === 'Unclaimed').length;
    const critical = interactions.filter(i => i.sentiment === 'Critical').length;
    return { unclaimed, critical, resolutionTime: '18m' };
  }, [interactions]);

  const sourceData = [
    { name: 'Google', value: 40, color: '#4285F4' },
    { name: 'Social', value: 35, color: '#E1306C' },
    { name: 'Voice', value: 25, color: '#34A853' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-4 md:px-0">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-black italic text-stone-900 tracking-tighter">Experience Sentinel</h2>
          <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mt-2 italic font-sans">Human-AI Resonance Guard (Module v8.0)</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <div className="flex-1 md:flex-none px-6 py-3 bg-blue-950 text-blue-400 rounded-2xl flex items-center justify-center md:justify-start gap-3 shadow-xl border border-blue-900/50">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Active Surveillance</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Neural Advisory: Discussion Catalyst */}
        {/* Neural Advisory Card with Rotation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-12 bg-stone-950 text-stone-100 p-8 md:p-12 rounded-[3.5rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden mx-4 md:mx-0"
        >
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.12),transparent_70%)]"></div>
           
           <AnimatePresence mode="wait">
             <motion.div 
               key={activeAdvisory}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.5 }}
               className="relative z-10 flex flex-col lg:flex-row items-center gap-10"
             >
                <div className="bg-blue-500/10 border border-blue-500/20 w-16 h-16 md:w-20 md:h-20 rounded-3xl shrink-0 flex items-center justify-center">
                   <i className={`fas ${advisories[activeAdvisory].icon} text-2xl md:text-3xl text-blue-400`}></i>
                </div>
                <div className="space-y-4 text-center lg:text-left flex-1">
                   <h3 className="text-xl md:text-2xl lg:text-3xl font-serif font-black italic tracking-tight leading-tight">
                      "{advisories[activeAdvisory].quote}"
                   </h3>
                   <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      <div className="flex-1">
                        <p className="text-stone-400 text-xs font-medium leading-relaxed max-w-3xl italic">
                           {advisories[activeAdvisory].detail}
                           <span className="text-blue-500 font-black uppercase tracking-widest text-[9px] block md:inline md:ml-3 mt-2 md:mt-0 underline decoration-blue-500/30 underline-offset-4">
                             Discussion Catalyst: {advisories[activeAdvisory].catalyst}
                           </span>
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0 w-full lg:w-auto">
                        <button 
                          onClick={() => setActiveAdvisory((prev) => (prev + 1) % advisories.length)}
                          className="flex-1 lg:flex-none px-4 py-4 bg-white/5 border border-white/10 text-stone-300 rounded-2xl font-black text-[10px] uppercase hover:bg-white/10 transition-all"
                          title="Next Hospitality Principle"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                        <button 
                          onClick={() => setShowAlignmentTool(true)}
                          className="flex-1 lg:flex-none px-6 py-4 bg-white/5 border border-white/10 text-stone-300 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
                        >
                          Alignment Audit
                        </button>
                        <button 
                          onClick={() => setShowAuditMetrics(true)}
                          className="flex-1 lg:flex-none px-8 py-4 bg-blue-500 text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-400 transition-all active:scale-95"
                        >
                           Engagement Velocity
                        </button>
                      </div>
                   </div>
                </div>
             </motion.div>
           </AnimatePresence>
        </motion.div>

        {/* Alignment Audit Modal */}
        <AnimatePresence>
          {showAlignmentTool && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-stone-950/90 backdrop-blur-3xl"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-stone-900 w-full max-w-5xl rounded-[3.5rem] p-8 md:p-12 border border-blue-500/30 shadow-[0_0_100px_rgba(59,130,246,0.2)] relative overflow-y-auto max-h-[90vh]"
              >
                <button 
                  onClick={() => setShowAlignmentTool(false)}
                  className="absolute top-8 right-8 text-stone-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>

                <div className="space-y-12">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <i className="fas fa-compass text-blue-400"></i>
                        </div>
                        <h4 className="text-3xl md:text-4xl font-serif font-black italic text-white tracking-tighter">Brand Integrity & Alignment</h4>
                      </div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">The Guest Perspective Analysis (Jeffrey van Staden Framework)</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div className="space-y-4">
                            <h5 className="text-[11px] font-black text-stone-400 uppercase tracking-widest">Brand Promise (The "North Star")</h5>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                               <p className="text-lg font-serif italic text-blue-100">"A sanctuary of unhurried luxury where every interaction is an authentic connection."</p>
                               <div className="flex gap-2">
                                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase rounded-lg">Sanctuary</span>
                                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase rounded-lg">Unhurried</span>
                                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase rounded-lg">Authentic</span>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h5 className="text-[11px] font-black text-stone-400 uppercase tracking-widest">The "Moments That Matter" Logic</h5>
                            <div className="space-y-4">
                               {[
                                 { icon: "fa-door-open", title: "Arrival Ritual", status: "Aligned", color: "text-emerald-400" },
                                 { icon: "fa-utensils", title: "Tableside Storytelling", status: "Gaps Found", color: "text-amber-400" },
                                 { icon: "fa-signature", title: "The Departure Wave", status: "Drifting", color: "text-rose-400" }
                               ].map((m, i) => (
                                 <div key={i} className="flex items-center gap-6 p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-400">
                                       <i className={`fas ${m.icon}`}></i>
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-xs font-black text-white uppercase">{m.title}</p>
                                       <p className="text-[9px] text-stone-500 italic">Target touchpoint audit</p>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full bg-white/5 ${m.color}`}>{m.status}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="bg-stone-950 p-8 rounded-[3rem] border border-blue-500/20 relative overflow-hidden flex flex-col justify-center text-center space-y-8">
                         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)]"></div>
                         <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">The Alignment Index</p>
                            <div className="text-7xl font-serif font-black italic text-white">84<span className="text-3xl text-stone-600">%</span></div>
                         </div>
                         <div className="space-y-4 relative z-10 px-4">
                            <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: "84%" }}
                                 className="h-full bg-blue-400"
                               />
                            </div>
                            <p className="text-[10px] text-stone-400 leading-relaxed italic">
                               "Operational Drift is detectable in the departure ritual. Guests report a 'mechanical' handover of bills that contradicts the initial 'unhurried' promise."
                            </p>
                         </div>
                         <button className="relative z-10 w-full py-4 bg-blue-500 text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-400 transition-all">
                            Dispatch Staff Re-Alignment
                         </button>
                      </div>
                   </div>

                   <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                      <h5 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                         <div className="w-4 h-px bg-blue-500"></div>
                         Jeffrey's Pro-Tip: The Drakensberg Effect
                      </h5>
                      <p className="text-xs text-stone-400 italic leading-relaxed">
                         "The best guest experiences aren’t always about luxury or grandeur—they’re about alignment. When a staff member shares a story with quiet pride instead of reciting a marketing slogan, the guest feels the brand in their bones."
                      </p>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audit Engagement Modal */}
        <AnimatePresence>
          {showAuditMetrics && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-stone-950/80 backdrop-blur-xl"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-stone-900 w-full max-w-4xl rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.3)] relative overflow-y-auto max-h-[90vh]"
              >
                <button 
                  onClick={() => setShowAuditMetrics(false)}
                  className="absolute top-8 right-8 text-stone-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>

                <div className="space-y-12">
                   <div className="space-y-4">
                      <h4 className="text-3xl font-serif font-black italic text-white tracking-tighter">Engagement Velocity Audit</h4>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">Neural Analysis of Guest Intent vs System Response</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-2">
                        <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Capture Precision</p>
                        <p className="text-4xl font-serif font-black italic text-blue-400">99.4%</p>
                        <p className="text-[9px] text-stone-400 leading-relaxed italic">The percentage of digital touchpoints successfully identified by the sentinel.</p>
                      </div>
                      <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-2">
                        <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Resonance Delay</p>
                        <p className="text-4xl font-serif font-black italic text-amber-500">2.4<span className="text-sm">s</span></p>
                        <p className="text-[9px] text-stone-400 leading-relaxed italic">Time from guest submission to AI draft generation.</p>
                      </div>
                      <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-2">
                        <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Sentiment Drift</p>
                        <p className="text-4xl font-serif font-black italic text-rose-500">-14<span className="text-sm">%</span></p>
                        <p className="text-[9px] text-stone-400 leading-relaxed italic">Reduction in critical sentiment clusters since protocol activation.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h5 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                         <div className="w-4 h-px bg-blue-500"></div>
                         Actionable Vulnerabilities
                      </h5>
                      <div className="space-y-4">
                        {[
                          { title: "Peak-Hour Latency", detail: "Resolution times spike by 240% during service transitions (7PM-8PM).", risk: "Medium" },
                          { title: "Voice-To-Text Fragmenting", detail: "Automated missed call transcription loses nuances in high-ambient noise.", risk: "Low" },
                          { title: "Identity Persistence", detail: "6% of guests are using different handles across platforms, causing duplicate nodes.", risk: "Critical" }
                        ].map((v, idx) => (
                          <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex gap-6 items-start">
                             <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${v.risk === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                             <div className="space-y-1">
                                <p className="text-xs font-black text-stone-200 uppercase">{v.title}</p>
                                <p className="text-[10px] text-stone-500 italic">{v.detail}</p>
                             </div>
                             <span className="ml-auto text-[8px] font-black uppercase text-stone-600">{v.risk} Risk</span>
                          </div>
                        ))}
                      </div>
                   </div>

                   <button 
                     onClick={() => setShowAuditMetrics(false)}
                     className="w-full py-5 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-200 transition-all"
                   >
                     Acknowledge Synthesis
                   </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Inbox */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-white rounded-[3rem] border border-stone-200 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                 <div>
                    <h4 className="text-xl font-serif font-bold text-stone-900 italic">Neural Engagement Ledger</h4>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Aggregated guest touchpoints requiring ownership</p>
                 </div>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{stats.unclaimed} Unclaimed</span>
                 </div>
              </div>
              
              <div className="divide-y divide-stone-50">
                 {interactions.map((item) => (
                   <motion.div 
                     layout
                     key={item.id} 
                     className={`p-8 hover:bg-stone-50/50 transition-all group flex gap-6 items-start ${item.status === 'Resolved' ? 'opacity-50' : ''}`}
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        item.source === 'Google' ? 'bg-blue-50 text-blue-600' :
                        item.source === 'Instagram' ? 'bg-rose-50 text-rose-600' :
                        item.source === 'Phone' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-600'
                      }`}>
                         <i className={`fas ${
                           item.source === 'Google' ? 'fa-google' :
                           item.source === 'Instagram' ? 'fa-camera-retro' :
                           item.source === 'Phone' ? 'fa-phone' : 'fa-globe'
                         }`}></i>
                      </div>

                      <div className="flex-1 space-y-3">
                         <div className="flex justify-between items-start">
                            <div>
                               <h5 className="text-sm font-black text-stone-900 uppercase tracking-tight">{item.guest}</h5>
                               <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{item.type} • {item.time}</p>
                            </div>
                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${
                               item.sentiment === 'Negative' || item.sentiment === 'Critical' ? 'bg-rose-100 text-rose-600' :
                               item.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-600'
                            }`}>
                               {item.sentiment}
                            </span>
                         </div>
                         <p className="text-xs text-stone-600 font-medium leading-relaxed italic">"{item.content}"</p>
                         
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 pt-2">
                            {item.status === 'Unclaimed' ? (
                              <div className="flex flex-wrap gap-2">
                                <button 
                                  onClick={() => setInteractions(prev => prev.map(i => i.id === item.id ? { ...i, status: 'Assigned', owner: 'Current User' } : i))}
                                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-stone-800 transition-all"
                                >
                                   Claim Ownership
                                </button>
                                <button 
                                  onClick={() => handleGenerateDraft(item)}
                                  className="px-4 py-2 bg-blue-500 text-stone-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-400 transition-all flex items-center gap-2"
                                >
                                   <i className="fas fa-sparkles text-[8px]"></i>
                                   AI Auto-Respond
                                </button>
                              </div>
                            ) : item.status === 'Assigned' ? (
                               <div className="flex items-center gap-2">
                                 <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[8px] text-stone-500">
                                    <i className="fas fa-user-check"></i>
                                 </div>
                                 <span className="text-[9px] font-black text-stone-400 uppercase">Managed by: {item.owner}</span>
                               </div>
                            ) : (
                               <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                 <i className="fas fa-circle-check text-[10px] text-emerald-500"></i>
                                 <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Synced & Distributed</span>
                                 <span className="text-[6px] font-mono text-emerald-400 opacity-60">#NV-{item.id.split('-')[1]}</span>
                               </div>
                            )}
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>

        {/* AI Draft Review Modal */}
        <AnimatePresence>
           {draftingInteraction && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-md"
             >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200"
                >
                   <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-blue-50/30">
                      <div>
                         <h4 className="text-xl font-serif font-black italic text-stone-900">AI Response Architect</h4>
                         <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Drafting response for {draftingInteraction.guest}</p>
                      </div>
                      <button 
                        onClick={() => setDraftingInteraction(null)}
                        className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-stone-400 transition-all"
                      >
                         <i className="fas fa-times"></i>
                      </button>
                   </div>
                   
                   <div className="p-8 space-y-6">
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                         <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-2">Original Feedback</p>
                         <p className="text-xs text-stone-600 italic">"{draftingInteraction.content}"</p>
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest font-sans flex items-center gap-2">
                               <i className="fas fa-pen-nib text-blue-500"></i>
                               AI Drafted Response
                            </p>
                            {isGenerating && <span className="text-[8px] font-black text-blue-500 uppercase animate-pulse">Neural engine thinking...</span>}
                         </div>
                         <textarea 
                           value={aiDraft}
                           onChange={(e) => setAiDraft(e.target.value)}
                           className="w-full h-40 p-6 bg-blue-50/20 border border-blue-500/10 rounded-3xl text-sm text-stone-800 font-medium leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                           placeholder={isGenerating ? "Synthesizing brand resonance..." : "Type response here..."}
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           onClick={() => setDraftingInteraction(null)}
                           className="py-4 bg-stone-100 text-stone-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-stone-200 transition-all"
                         >
                            Discard Draft
                         </button>
                         <button 
                           disabled={isGenerating || isSyncing || !aiDraft}
                           onClick={() => handleResolve(draftingInteraction.id)}
                           className="py-4 bg-blue-500 text-stone-950 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-400 transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1 min-h-[64px]"
                         >
                            {isSyncing ? (
                               <>
                                 <div className="flex items-center gap-2">
                                    <i className="fas fa-circle-notch animate-spin"></i>
                                    <span>Syncing Pulse</span>
                                 </div>
                                 <span className="text-[7px] opacity-60 lowercase font-mono">{syncStage}</span>
                               </>
                            ) : (
                               <>
                                 <div className="flex items-center gap-2">
                                    <i className="fas fa-paper-plane text-[8px]"></i>
                                    <span>Approve & Sync</span>
                                 </div>
                               </>
                            )}
                         </button>
                      </div>
                   </div>
                </motion.div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Analytics & Metrics */}
        <div className="lg:col-span-4 space-y-8 px-4 md:px-0">
           <div className="bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16"></div>
              <div>
                <h4 className="text-xl font-serif font-bold text-blue-400 italic">Resolution Pulse</h4>
                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Efficiency against the Experience Gap</p>
              </div>

              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-end">
                    <p className="text-4xl font-serif font-black italic">{stats.resolutionTime}</p>
                    <p className="text-[8px] font-black text-emerald-500 uppercase">Avg Response Time</p>
                 </div>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      className="h-full bg-blue-500"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-stone-500 uppercase mb-1">Missed Gap</p>
                       <p className="text-xl font-serif font-black italic text-rose-500">0.2%</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black text-stone-500 uppercase mb-1">AI Accuracy</p>
                       <p className="text-xl font-serif font-black italic text-emerald-500">98%</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-6">
              <div>
                <h4 className="text-lg font-serif font-bold text-stone-900 italic">Volume Origin</h4>
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Primary feedback entry points</p>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                 {sourceData.map(s => (
                   <div key={s.name} className="flex justify-between items-center text-[9px] font-black text-stone-500 uppercase">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                         <span>{s.name}</span>
                      </div>
                      <span>{s.value}%</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-emerald-950 text-emerald-400 p-8 rounded-[3rem] shadow-xl border border-emerald-900/50 space-y-4">
              <div className="flex gap-4 items-center">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">
                    <i className="fas fa-shield-heart"></i>
                 </div>
                 <div>
                    <h5 className="text-sm font-black uppercase tracking-tight">Reputation Guard</h5>
                    <p className="text-[8px] font-bold text-emerald-600/80 uppercase tracking-widest">Neural Protection Protocol</p>
                 </div>
              </div>
              <p className="text-[10px] italic leading-relaxed text-emerald-300/70">
                "The Experience Sentinel is successfully isolating negative sentiment clusters and drafting preemptive service recovery protocols."
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceSentinel;
