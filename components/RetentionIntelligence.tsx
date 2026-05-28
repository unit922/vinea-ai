import React, { useState, useEffect } from 'react';
import { GuestFeedback, LoyaltyMember, AIInsight, RestaurantProfile } from '../lib/types';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { isValidUUID } from '../services/supabaseSync';
import { 
  Target, 
  ShieldAlert, 
  Activity,
  FileText,
  Printer,
  X,
  Zap,
  Brain,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import AHLALogo from './AHLALogo';

interface OTAReview {
  id: string;
  source: 'Google' | 'TripAdvisor' | 'Booking';
  guestName: string;
  rating: number;
  comment: string;
  timestamp: string;
  guestHistory: string;
  tone: string;
  language: string;
  generatedResponse?: string;
  status: 'Pending' | 'Approved' | 'Drafting' | 'Published';
}

export const RetentionIntelligence: React.FC = () => {
  const [feedback, setFeedback] = useState<GuestFeedback[]>([]);
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'insights' | 'ota-reviews' | 'feedback' | 'loyalty' | 'sentiment'>('insights');
  const [connectors, setConnectors] = useState({
    google: true,
    tripadvisor: true,
    booking: false,
  });
  const [otaReviews, setOtaReviews] = useState<OTAReview[]>([
    {
      id: 'ota-1',
      source: 'Google',
      guestName: 'Marcus Vance',
      rating: 5,
      comment: "The sommelier guidance was spectacular. We tried the Ardbeg tasting flight and were blown away by the peat intensity. Outstanding hospitality!",
      timestamp: '2 hours ago',
      guestHistory: 'Gold Tier member. Prefers Peated Malt & Franciacorta. Visited May 10.',
      tone: 'Sophisticated',
      language: 'English',
      status: 'Pending'
    },
    {
      id: 'ota-2',
      source: 'TripAdvisor',
      guestName: "Charlotte Dubois",
      rating: 3,
      comment: "The ambiance is breathtaking and the wine list is massive, but we had to wait almost 25 minutes for our Barolo bottle to be fetched from the cellar.",
      timestamp: '1 day ago',
      guestHistory: 'Silver Tier member. Purchased Giacomo Conterno Barolo 2018; noted cellar retrieval bottle lag of 12 minutes.',
      tone: 'Warm & Conversational',
      language: 'French',
      status: 'Pending'
    },
    {
      id: 'ota-3',
      source: 'Booking',
      guestName: "Kenji Sato",
      rating: 4,
      comment: "Exceptional modern cocktail lounge connected to the hotel lobby. Unbelievable selection of vintage Japanese whiskeys! However, they were sold out of Yamazaki 12.",
      timestamp: '3 days ago',
      guestHistory: 'First-time hotel attendee. Prefers Japanese malt blend (offered Hibiki Harmony instead).',
      tone: 'Academic Sommelier',
      language: 'German',
      status: 'Pending'
    }
  ]);
  const [isSynthesizingReview, setIsSynthesizingReview] = useState<Record<string, boolean>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentReport, setSentimentReport] = useState<string | null>(null);
  const [isPredictingChurn, setIsPredictingChurn] = useState(false);
  const [churnReport, setChurnReport] = useState<string | null>(null);

  useEffect(() => {
    const profileStr = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
    const profile: RestaurantProfile | null = profileStr ? JSON.parse(profileStr) : null;
    const isDemo = !profile || ((!profile.edition || profile.edition === 'demo') && !isValidUUID(profile.id));

    // Load real feedback from localStorage
    const storedFeedback = JSON.parse(localStorage.getItem('vinetelligence_feedback') || localStorage.getItem('vinea_feedback') || '[]');
    
    if (isDemo && storedFeedback.length === 0) {
      // Mock data for initial state if no real feedback exists
      setFeedback([
        {
          id: 'f-1',
          guestName: 'Alexander Mercer',
          rating: 5,
          comment: 'The Laphroaig 10 was perfectly served. Exceptional knowledge from the staff.',
          tags: ['Exceptional Service', 'Expert Guidance', 'Technical Mastery'],
          sentiment: 'Positive',
          timestamp: new Date().toISOString(),
          aiSummary: 'High satisfaction with beverage knowledge and service quality.'
        },
        {
          id: 'f-2',
          guestName: 'Elena Rossi',
          rating: 4,
          comment: 'Great atmosphere, but the Negroni was a bit too bitter for my taste.',
          tags: ['Elegant Vibe', 'Modern Classic'],
          sentiment: 'Neutral',
          timestamp: new Date().toISOString(),
          aiSummary: 'Positive atmosphere feedback; potential for personalized cocktail adjustments.'
        }
      ]);
    } else {
      setFeedback(storedFeedback);
    }

    if (!isDemo) return;

    setLoyaltyMembers([
      {
        id: 'l-1',
        name: 'Alexander Mercer',
        email: 'alex.m@example.com',
        points: 1250,
        tier: 'Gold',
        joinDate: '2025-01-15',
        lastVisit: new Date().toISOString(),
        preferences: ['Peated Scotch', 'Old World Reds']
      },
      {
        id: 'l-2',
        name: 'Elena Rossi',
        email: 'elena.r@example.com',
        points: 850,
        tier: 'Silver',
        joinDate: '2025-02-20',
        lastVisit: new Date().toISOString(),
        preferences: ['Negroni', 'Franciacorta']
      }
    ]);

    setInsights([
      {
        id: 'i-1',
        type: 'Retention',
        title: 'High-Value Guest Alert',
        message: 'Alexander Mercer has visited 3 times this month. Consider offering a complimentary tasting of the new Ardbeg release.',
        impactScore: 85,
        actionable: true,
        timestamp: new Date().toISOString()
      },
      {
        id: 'i-2',
        type: 'Revenue',
        title: 'Cocktail Upsell Opportunity',
        message: 'Guests who enjoy Negronis are 40% more likely to try the "Vinetelligence Signature Sbagliato". Train staff on this pairing.',
        impactScore: 72,
        actionable: true,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const handlePredictChurn = async () => {
    setIsPredictingChurn(true);
    try {
      const report = await geminiService.getChurnPrediction(feedback, loyaltyMembers);
      setChurnReport(report);
      setActiveTab('insights');
    } catch (error) {
      console.error("Vinetelligence: Churn Prediction Failed", error);
    } finally {
      setIsPredictingChurn(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    setIsAnalyzing(true);
    try {
      const report = await geminiService.getSentimentReport(feedback);
      setSentimentReport(report);
      setActiveTab('sentiment');
    } catch (error) {
      console.error("Vinetelligence: Sentiment Analysis Failed", error);
      setSentimentReport("Analysis failed. Please ensure your AI configuration is correct.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSynthesizeResponse = async (id: string) => {
    const review = otaReviews.find(r => r.id === id);
    if (!review) return;

    setIsSynthesizingReview(prev => ({ ...prev, [id]: true }));
    try {
      const response = await geminiService.getOTAReviewResponse(
        review.guestName,
        review.rating,
        review.comment,
        review.tone,
        review.language,
        review.guestHistory
      );
      setOtaReviews(prev => prev.map(r => r.id === id ? { ...r, generatedResponse: response } : r));
    } catch (error) {
      console.error("Vinetelligence: OTA Review response synthesis failed", error);
    } finally {
      setIsSynthesizingReview(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleToneChange = (id: string, tone: string) => {
    setOtaReviews(prev => prev.map(r => r.id === id ? { ...r, tone } : r));
  };

  const handleLanguageChange = (id: string, language: string) => {
    setOtaReviews(prev => prev.map(r => r.id === id ? { ...r, language } : r));
  };

  const handleUpdateGeneratedResponse = (id: string, response: string) => {
    setOtaReviews(prev => prev.map(r => r.id === id ? { ...r, generatedResponse: response } : r));
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-white overflow-hidden">
      {/* Header */}
      <div className="p-8 bg-stone-900/50 border-b border-white/5 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter">Retention Intelligence</h1>
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] mt-2">AI-Driven Guest Loyalty & Sentiment Analysis</p>
        </div>
        <div className="flex gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
          {(['insights', 'ota-reviews', 'feedback', 'loyalty', 'sentiment'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-amber-500 text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'
              }`}
            >
              {tab === 'ota-reviews' ? 'OTA Reviews' : tab}
            </button>
          ))}
        </div>
        <button 
          onClick={handleAnalyzeSentiment}
          disabled={isAnalyzing}
          className="ml-4 px-8 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-stone-800 transition-all border border-white/10 disabled:opacity-50"
        >
          {isAnalyzing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sparkles text-amber-500"></i>}
          {isAnalyzing ? 'Analyzing Sentiment...' : 'Generate AI Report'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-stone-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-black italic tracking-tight">Churn Intelligence</h3>
                        <p className="text-[10px] font-mono uppercase text-stone-500 tracking-widest">Predictive Risk Engine</p>
                      </div>
                    </div>
                    <p className="text-stone-400 text-xs leading-relaxed mb-8 italic font-medium">
                      Synthesizing guest behavior patterns, sentiment decay, and engagement deltas to identify high-risk accounts before disengagement occurs.
                    </p>
                    <button 
                      onClick={handlePredictChurn}
                      disabled={isPredictingChurn}
                      className="w-full py-4 bg-amber-500 text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                      {isPredictingChurn ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      {isPredictingChurn ? 'Synthesizing Data...' : 'Run Prediction Engine'}
                    </button>
                  </div>
                </div>

                <div className="bg-stone-900/50 rounded-[2.5rem] p-10 border border-white/5 shadow-xl">
                  <h3 className="text-xl font-serif font-black italic text-white mb-8">Retention Pulse</h3>
                  <div className="space-y-6">
                    {insights.map(insight => (
                      <div key={insight.id} className="flex items-center gap-6 p-4 bg-black/20 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                          insight.type === 'Retention' ? 'bg-blue-500' :
                          insight.type === 'Revenue' ? 'bg-emerald-500' :
                          'bg-amber-500'
                        }`}>
                          <i className={`fas ${
                            insight.type === 'Retention' ? 'fa-user-minus' :
                            insight.type === 'Revenue' ? 'fa-chart-line' :
                            'fa-bolt'
                          }`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-white group-hover:text-amber-500 transition-colors">{insight.title}</p>
                          <p className="text-[10px] text-stone-500 font-medium italic">{insight.message}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-serif font-black italic text-white">{insight.impactScore}%</p>
                          <p className="text-[8px] font-black uppercase text-stone-600 tracking-widest">Impact</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {churnReport && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-900 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col"
                >
                  {/* Report Header - Technical/Brutalist Style */}
                  <div className="bg-stone-950 p-8 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-black italic text-white tracking-tight">Intelligence Dossier: Churn Prediction</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-mono font-bold uppercase text-stone-500 tracking-widest">Ref: VINETELLIGENCE-INTEL-0301</span>
                          <span className="w-1 h-1 bg-stone-700 rounded-full"></span>
                          <span className="text-[9px] font-mono font-bold uppercase text-amber-500 tracking-widest animate-pulse">Live Synthesis Active</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => window.print()} 
                        className="p-2 text-stone-500 hover:text-white transition-colors border border-white/5 rounded hover:bg-white/5"
                        title="Export PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setChurnReport(null)} 
                        className="p-2 text-stone-500 hover:text-white transition-colors border border-white/5 rounded hover:bg-white/5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Risk Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 border-b border-white/10">
                    <div className="p-6 border-r border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">Risk Assessment</span>
                      <span className="text-2xl font-serif font-black italic text-rose-500">Elevated</span>
                    </div>
                    <div className="p-6 border-r border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">Confidence Score</span>
                      <span className="text-2xl font-serif font-black italic text-white">92.4%</span>
                    </div>
                    <div className="p-6 border-r border-white/10 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">High-Risk Nodes</span>
                      <span className="text-2xl font-serif font-black italic text-amber-500">03 Members</span>
                    </div>
                    <div className="p-6 flex flex-col gap-1">
                      <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider italic">Est. Revenue Impact</span>
                      <span className="text-2xl font-serif font-black italic text-emerald-500">-$12.4k/mo</span>
                    </div>
                  </div>

                  {/* Report Content */}
                  <div className="p-10 flex flex-col lg:flex-row gap-10">
                    {/* Left Column: AI Summary */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-6">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Executive Summary</h4>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <div className="markdown-body text-sm text-stone-300 leading-relaxed font-medium italic">
                          <Markdown>{churnReport}</Markdown>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Technical Details */}
                    <div className="w-full lg:w-80 shrink-0 space-y-8">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Neural Indicators</h4>
                        </div>
                        <div className="space-y-4">
                          {[
                            { label: 'Sentiment Decay', value: 78, color: 'bg-rose-500' },
                            { label: 'Visit Frequency', value: 45, color: 'bg-amber-500' },
                            { label: 'Engagement Delta', value: 62, color: 'bg-amber-500' },
                          ].map(indicator => (
                            <div key={indicator.label} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-stone-500 italic">
                                <span>{indicator.label}</span>
                                <span>{indicator.value}%</span>
                              </div>
                              <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${indicator.value}%` }}
                                  className={`h-full ${indicator.color}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-amber-500" />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Next Best Actions</h4>
                        </div>
                        <ul className="space-y-3">
                          {[
                            'Direct Concierge Outreach',
                            'Personalized Tasting Invite',
                            'Tier Status Re-evaluation'
                          ].map((action, i) => (
                            <li key={i} className="flex items-start gap-3 text-[11px] text-stone-400 italic leading-snug">
                              <span className="text-amber-500 font-mono mt-0.5">{i+1}.</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-stone-950/50 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[9px] font-mono font-bold uppercase text-stone-600 tracking-widest italic">Vinetelligence Intelligence Core v3.1 // Churn Analysis Module</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="text-[9px] font-mono font-bold uppercase text-stone-500 tracking-widest">Secure Node 0x82F</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'ota-reviews' && (
            <motion.div
              key="ota-reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 animate-fade-in"
            >
              {/* Marketing Headliner Banner (Crushing Hotel Speaker) */}
              <div className="bg-gradient-to-br from-amber-500/15 via-stone-900 to-stone-900/40 rounded-[2.5rem] p-10 border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-black italic tracking-tight text-white">Direct OTA Response Synthesis</h3>
                        <p className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-black">Bypassing Disconnected Manual Agencies</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="bg-stone-950/80 px-3 py-1.5 rounded-xl flex items-center border border-white/5">
                        <AHLALogo height={15} theme="light" />
                      </div>
                      <span className="bg-amber-500 text-stone-950 text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                        Defeats Outsourced Services
                      </span>
                    </div>
                  </div>
                  <p className="text-stone-300 text-xs leading-relaxed max-w-4xl italic font-medium">
                    Why hire disconnected manual outsourcers (like Hotel Speaker) that take 24–48 hours to consult stale templates and outsource to freelance copywriters? Vinetelligence connects directly to your reservation records & beverage ticket database to synthesize authentic, oenologically precise replies grounded in the guest's <strong>actual transactional Palate DNA</strong>.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="flex gap-3 items-center">
                      <div className="text-amber-500 font-serif font-bold italic text-xl">01</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">No Generic Templates</div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="text-amber-500 font-serif font-bold italic text-xl">02</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Under 10 Seconds Latency</div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="text-amber-500 font-serif font-bold italic text-xl">03</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Actual Cellar & POS Grounding</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* OTA channel connectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'google' as const, name: 'Google Business', icon: 'fa-google', description: 'Real-time API sink for restaurant reviews.', active: connectors.google },
                  { id: 'tripadvisor' as const, name: 'TripAdvisor Connect', icon: 'fa-tripadvisor', description: 'Direct webhook linkage for table & stay logs.', active: connectors.tripadvisor },
                  { id: 'booking' as const, name: 'Booking.com OTA', icon: 'fa-hotel', description: 'Full reservation mapping for in-hotel guests.', active: connectors.booking }
                ].map(conn => (
                  <div 
                    key={conn.id} 
                    className={`bg-stone-900 border rounded-[2rem] p-6 flex flex-col justify-between space-y-6 transition-all ${
                      conn.active ? 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          conn.active ? 'bg-amber-500/10 text-amber-500' : 'bg-stone-800 text-stone-500'
                        }`}>
                          <i className={`fab ${conn.icon}`}></i>
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">{conn.name}</h4>
                          <span className={`text-[8px] font-mono uppercase tracking-widest ${conn.active ? 'text-amber-500 animate-pulse font-bold' : 'text-stone-500'}`}>
                            {conn.active ? '● Connected & Active' : '○ Standby'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setConnectors(prev => ({ ...prev, [conn.id]: !prev[conn.id] }))}
                        className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          conn.active 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {conn.active ? 'Deactivate' : 'Connect API'}
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-500 italic font-medium leading-relaxed">{conn.description}</p>
                  </div>
                ))}
              </div>

              {/* Review Workspace Queue */}
              <div className="space-y-6 mt-10">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-xl font-serif font-black italic text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-500" />
                    <span>Active Review Response Workspace</span>
                  </h3>
                  <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest italic">
                    {otaReviews.filter(r => r.status !== 'Published').length} Pending Review Allies
                  </span>
                </div>

                <div className="space-y-6">
                  {otaReviews.map(review => (
                    <div key={review.id} className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                      {review.status === 'Published' && (
                        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-sm flex flex-col justify-center items-center edit-animate-pulse z-20 space-y-4">
                          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 text-2xl">
                            <i className="fas fa-check-double"></i>
                          </div>
                          <div className="text-center">
                            <h4 className="font-serif font-black italic text-lg text-white">Review Response Synchronized!</h4>
                            <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest mt-1">Published to {review.source} • Status Code 201 OK</p>
                          </div>
                          <button 
                            onClick={() => setOtaReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: 'Pending', generatedResponse: undefined } : r))}
                            className="px-6 py-2 bg-stone-900 border border-white/10 rounded-xl text-[9px] font-black tracking-widest uppercase text-stone-400 hover:text-white transition-all cursor-pointer"
                          >
                            Reset / Re-draft Review
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col lg:flex-row gap-8">
                        {/* Guest / Reviewer Identity */}
                        <div className="w-full lg:w-64 shrink-0 space-y-4">
                          <div className="p-4 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="px-2.5 py-1 bg-white/5 rounded text-[8px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
                                <i className={`fab ${review.source === 'Google' ? 'fa-google' : review.source === 'TripAdvisor' ? 'fa-tripadvisor' : 'fa-hotel'}`}></i>
                                {review.source}
                              </span>
                              <span className="text-[8px] font-mono text-stone-500 uppercase">{review.timestamp}</span>
                            </div>
                            <div>
                              <h4 className="text-base font-serif font-black italic text-white leading-tight">{review.guestName}</h4>
                              <div className="flex gap-1 text-amber-500 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <i key={i} className={`fas fa-star text-[10px] ${i < review.rating ? 'opacity-100' : 'opacity-20'}`}></i>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Palate DNA Connector Pane */}
                          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2">
                              <Brain className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              <span className="text-[8px] font-mono uppercase text-amber-500 tracking-widest font-black">Palate DNA Linkage</span>
                            </div>
                            <p className="text-[10px] text-stone-300 italic font-medium leading-relaxed">
                              "{review.guestHistory}"
                            </p>
                          </div>
                        </div>

                        {/* Review Message & Response Draft area */}
                        <div className="flex-1 space-y-6">
                          <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                            <span className="text-[8px] font-mono uppercase text-stone-500 tracking-widest block mb-2">Review Comment</span>
                            <p className="text-sm text-stone-300 italic font-medium leading-relaxed">
                              "{review.comment}"
                            </p>
                          </div>

                          {/* Selection criteria: Tone and Language */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-stone-950/40 p-4 border border-white/5 rounded-2xl">
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-stone-500 tracking-widest block">Proposed Tone</label>
                              <select 
                                value={review.tone} 
                                onChange={(e) => handleToneChange(review.id, e.target.value)}
                                className="w-full bg-stone-900 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-mono text-stone-300 focus:border-amber-500 focus:outline-none"
                              >
                                <option value="Sophisticated">Sophisticated</option>
                                <option value="Warm & Conversational">Warm & Conversational</option>
                                <option value="Short & Direct">Short & Direct</option>
                                <option value="Academic Sommelier">Academic Sommelier</option>
                              </select>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-stone-500 tracking-widest block">Language</label>
                              <select 
                                value={review.language} 
                                onChange={(e) => handleLanguageChange(review.id, e.target.value)}
                                className="w-full bg-stone-900 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-mono text-stone-300 focus:border-amber-500 focus:outline-none"
                              >
                                <option value="English">English</option>
                                <option value="French">French</option>
                                <option value="Italian">Italian</option>
                                <option value="Spanish">Spanish</option>
                                <option value="German">German</option>
                                <option value="Japanese">Japanese</option>
                              </select>
                            </div>

                            <div className="md:col-span-2 flex items-end">
                              <button 
                                onClick={() => handleSynthesizeResponse(review.id)}
                                disabled={isSynthesizingReview[review.id]}
                                className="w-full h-[32px] bg-amber-500 text-stone-950 hover:bg-amber-400 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {isSynthesizingReview[review.id] ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Synthesizing Dialect...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>{review.generatedResponse ? 'Regenerate Proposed Draft' : 'Synthesize Custom Response'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Proposed Reply Textarea */}
                          {review.generatedResponse && (
                            <div className="space-y-3 bg-stone-950 p-6 rounded-2xl border border-amber-500/15">
                              <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-widest">
                                <span className="text-amber-500 font-bold">Autogenerated Response (Dynamic Review Ally)</span>
                                <span className="text-stone-500">Live Draft</span>
                              </div>
                              <textarea 
                                value={review.generatedResponse}
                                onChange={(e) => handleUpdateGeneratedResponse(review.id, e.target.value)}
                                className="w-full min-h-[110px] bg-stone-900/80 border border-white/10 rounded-xl p-4 text-xs font-medium text-stone-200 leading-relaxed focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 custom-scrollbar resize-none font-serif italic"
                              />
                              <div className="flex justify-end gap-3 pt-2">
                                <button 
                                  onClick={() => handleUpdateGeneratedResponse(review.id, "")}
                                  className="px-4 py-2 border border-white/5 hover:border-white/10 text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                >
                                  Clear
                                </button>
                                <button 
                                  onClick={() => {
                                    setOtaReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: 'Published' } : r));
                                  }}
                                  className="px-5 py-2 bg-emerald-500 text-stone-950 hover:bg-emerald-400 font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                                >
                                  <i className="fas fa-plane"></i> Approve & Sync to OTA
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {feedback.map(f => (
                <div key={f.id} className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 flex gap-8 items-start">
                  <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
                    <span className="text-2xl font-serif italic font-black text-amber-500">{f.rating}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-serif font-black italic">{f.guestName}</h3>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        f.sentiment === 'Positive' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {f.sentiment} Sentiment
                      </span>
                    </div>
                    <p className="text-sm text-stone-300 italic leading-relaxed">"{f.comment}"</p>
                    {f.tags && f.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {f.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {f.aiSummary && (
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex gap-3 items-start">
                        <i className="fas fa-sparkles text-amber-500 text-xs mt-1"></i>
                        <p className="text-[11px] text-stone-400 leading-relaxed italic">
                          <span className="text-amber-500 font-black uppercase tracking-widest mr-2">AI Summary:</span>
                          {f.aiSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'loyalty' && (
            <motion.div
              key="loyalty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {loyaltyMembers.map(member => (
                <div key={member.id} className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-stone-950">
                        <i className="fas fa-crown text-xl"></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-serif font-black italic">{member.name}</h3>
                        <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-serif italic font-black text-amber-500">{member.points}</div>
                      <div className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Points</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest mb-1">Current Tier</p>
                      <p className="text-sm font-serif italic font-black text-white">{member.tier}</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest mb-1">Member Since</p>
                      <p className="text-sm font-serif italic font-black text-white">{member.joinDate}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[8px] font-black uppercase text-stone-500 tracking-widest">Guest Preferences</p>
                    <div className="flex flex-wrap gap-2">
                      {member.preferences.map(pref => (
                        <span key={pref} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-stone-300">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {activeTab === 'sentiment' && (
            <motion.div
              key="sentiment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {sentimentReport ? (
                <div className="bg-stone-900 border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500"></div>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-amber-500 rounded-[2rem] flex items-center justify-center text-stone-950 shadow-xl">
                      <i className="fas fa-brain text-2xl"></i>
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif font-black italic">Strategic Sentiment Analysis</h2>
                      <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Generated by Vinetelligence Intelligence Engine</p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none prose-p:text-stone-300 prose-p:leading-relaxed prose-p:italic prose-headings:font-serif prose-headings:italic prose-headings:text-amber-500">
                    <div className="markdown-body text-lg leading-relaxed">
                      <Markdown>{sentimentReport}</Markdown>
                    </div>
                  </div>
                  <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase text-stone-600 tracking-widest">Confidential Intelligence Report</p>
                    <button onClick={() => window.print()} className="text-[9px] font-black uppercase text-amber-500 hover:text-white transition-colors">
                      <i className="fas fa-print mr-2"></i> Export PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center space-y-8">
                  <div className="w-32 h-32 bg-stone-900 rounded-[3rem] flex items-center justify-center border border-white/5 animate-pulse">
                    <i className="fas fa-chart-line text-5xl text-stone-700"></i>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-black italic text-stone-500">No Report Generated</h3>
                    <p className="text-sm text-stone-600 max-w-xs italic">Click the "Generate AI Report" button above to analyze current guest sentiment.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
